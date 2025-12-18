import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, LogOut, Save, FolderOpen, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImage, deleteImage } from '@/lib/upload';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const hasDiamondAccess = useHasDiamondAccess();
  const fileInputRef = useRef<HTMLInputElement>(null); // Para galeria
  const cameraInputRef = useRef<HTMLInputElement>(null); // Para câmera
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
  });
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Tamanho máximo: 5MB');
        return;
      }

      try {
        // Processar imagem para preview (formato quadrado)
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height, 512);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              const sourceSize = Math.min(img.width, img.height);
              const sourceX = (img.width - sourceSize) / 2;
              const sourceY = (img.height - sourceSize) / 2;
              
              ctx.drawImage(
                img,
                sourceX, sourceY, sourceSize, sourceSize,
                0, 0, size, size
              );
              
              // Criar preview processado
              canvas.toBlob((blob) => {
                if (blob) {
                  const previewUrl = URL.createObjectURL(blob);
                  setAvatarPreview(previewUrl);
                }
              }, 'image/jpeg', 0.95);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
        setSelectedAvatar(file);
        setHasChanges(true);
      } catch (error) {
        toast.error('Erro ao processar imagem');
      }
    }
  };

  const handleRemoveAvatar = () => {
    // Limpar preview anterior se for um blob URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    
    setSelectedAvatar(null);
    setAvatarPreview(formData.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    setHasChanges(true);
  };

  const handleFileButtonClick = () => {
    // Abrir galeria (sem capture)
    fileInputRef.current?.click();
  };

  const handleCameraButtonClick = () => {
    // Abrir câmera (com capture)
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error('O nome de usuário é obrigatório');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      let avatarUrl = formData.avatar_url;

      // Fazer upload do avatar se houver novo arquivo
      if (selectedAvatar) {
        setIsUploadingAvatar(true);
        
        // Deletar avatar antigo se existir
        if (formData.avatar_url) {
          await deleteImage(formData.avatar_url);
        }

        // Fazer upload do novo avatar
        avatarUrl = await uploadImage(selectedAvatar, 'avatars', user.id);
        setIsUploadingAvatar(false);
      }

      await updateProfile.mutateAsync({
        username: formData.username,
        full_name: formData.full_name || null,
        bio: formData.bio || null,
        avatar_url: avatarUrl || null,
      });
      
      setSelectedAvatar(null);
      // Limpar preview blob URL se existir
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(avatarUrl || null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      toast.success('Perfil atualizado!');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar perfil');
      setIsUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔄 Iniciando logout...');
      
      // Fazer logout do Supabase
      await signOut();
      
      console.log('✅ Logout concluído, redirecionando...');
      
      // Limpar localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Aguardar um pouco para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Forçar navegação completa
      window.location.replace('/auth');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      
      // Mesmo com erro, limpar tudo e forçar navegação
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="gradient-primary h-24" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col items-center -mt-12">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage 
                    src={avatarPreview || formData.avatar_url || profile?.avatar_url || ''} 
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                    {(formData.username || profile?.username)?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 rounded-full bg-secondary p-2 text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      disabled={isUploadingAvatar}
                      title="Escolher foto"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <DropdownMenuItem
                      onClick={handleFileButtonClick}
                      className="text-white cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Escolher da Galeria
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCameraButtonClick}
                      className="text-white cursor-pointer"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tirar Foto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Input para galeria (sem capture) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                {/* Input para câmera (com capture) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <h2 className="font-display text-xl font-bold mt-4">
                {formData.username || profile?.username || 'Usuário'}
              </h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-display font-bold text-primary">
                  {profile?.points || 0}
                </span>
                <span className="text-sm text-muted-foreground">pontos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Editar Perfil
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  placeholder="Seu nome de usuário"
                  value={formData.username || profile?.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={formData.full_name || profile?.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileButtonClick}
                    className="flex-1"
                    disabled={isUploadingAvatar}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Escolher da Galeria
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraButtonClick}
                    className="flex-1"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Tirar Foto
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedAvatar && (
                  <p className="text-xs text-muted-foreground">
                    Nova foto selecionada: {selectedAvatar.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  className="resize-none"
                  value={formData.bio || profile?.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfile.isPending || isUploadingAvatar || !hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                {isUploadingAvatar ? 'Enviando foto...' : updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
