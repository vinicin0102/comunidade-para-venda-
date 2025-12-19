import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, MessageSquare, LogOut, Home, Gift, BookOpen, Trophy, Settings, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIsSupport } from '@/hooks/useSupport';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { SupportChat } from '@/components/support/SupportChat';
import { UserManagement } from '@/components/support/UserManagement';
import { RewardManagement } from '@/components/support/RewardManagement';
import { RewardEditManagement } from '@/components/support/RewardEditManagement';
import { ContentManagement } from '@/components/support/ContentManagement';
import { BadgeManagement } from '@/components/support/BadgeManagement';
import { ThemeSettings } from '@/components/support/ThemeSettings';
import { NotificationManagement } from '@/components/support/NotificationManagement';
import { useSupportSettings, useUpdateSupportSetting } from '@/hooks/useSupportSettings';
import { useAppName } from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isSupport = useIsSupport();
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState('chat');

  // Apenas admin@gmail.com pode acessar o painel admin (aba Usuários)
  // Suporte normal pode acessar Chat e Resgates
  const canAccessAdminPanel = isAdmin;

  if (!isSupport) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-white text-center">Acesso negado. Apenas suporte pode acessar esta área.</p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      window.location.replace('/support/login');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);

      // Mesmo com erro, limpar tudo e forçar navegação
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/support/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-white">Painel de Suporte</h1>
              <p className="text-xs text-gray-400"><AppNameDisplay /></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={cn(
            "bg-[#1a1a1a] border border-[#2a2a2a] w-full grid",
            canAccessAdminPanel ? "grid-cols-8" : "grid-cols-7"
          )}>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary text-xs">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-primary text-xs">
              <Gift className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Resgates</span>
            </TabsTrigger>
            <TabsTrigger value="rewards-edit" className="data-[state=active]:bg-primary text-xs">
              <Gift className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Prêmios</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-primary text-xs">
              <Trophy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Conquistas</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary text-xs">
              <BookOpen className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary text-xs">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary text-xs">
              <Bell className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            {canAccessAdminPanel && (
              <TabsTrigger value="users" className="data-[state=active]:bg-primary text-xs">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <SupportChat />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <RewardManagement />
          </TabsContent>

          <TabsContent value="rewards-edit" className="space-y-4">
            <RewardEditManagement />
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <BadgeManagement />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SupportSettingsPanel />
            <ThemeSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationManagement />
          </TabsContent>

          {canAccessAdminPanel && (
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function AppNameDisplay() {
  const appName = useAppName();
  return <>{appName}</>;
}

function SupportSettingsPanel() {
  const { data: settings, isLoading } = useSupportSettings();
  const updateSetting = useUpdateSupportSetting();

  const autoReplyEnabled = settings?.auto_reply_enabled === 'true';
  const autoReplyMessage = settings?.auto_reply_message || 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏';
  const [messageText, setMessageText] = useState(autoReplyMessage);

  // Atualizar o texto quando as configurações carregarem
  useEffect(() => {
    if (settings?.auto_reply_message) {
      setMessageText(settings.auto_reply_message);
    }
  }, [settings]);

  const handleToggleAutoReply = () => {
    updateSetting.mutate({
      key: 'auto_reply_enabled',
      value: autoReplyEnabled ? 'false' : 'true'
    });
  };

  const handleSaveMessage = () => {
    updateSetting.mutate({
      key: 'auto_reply_message',
      value: messageText.trim() || 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏'
    });
  };

  if (isLoading) {
    return (
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-gray-400">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Suporte
        </CardTitle>
        <CardDescription>
          Gerencie as configurações de atendimento automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="auto-reply" className="text-white font-medium">
              Mensagem Automática
            </Label>
            <p className="text-sm text-gray-400">
              Envia resposta automática quando aluno envia mensagem
            </p>
          </div>
          <Switch
            id="auto-reply"
            checked={autoReplyEnabled}
            onCheckedChange={handleToggleAutoReply}
            disabled={updateSetting.isPending}
          />
        </div>

        <div className="p-4 bg-[#2a2a2a]/50 rounded-lg">
          <p className="text-xs text-gray-500">
            Status atual: {autoReplyEnabled ? (
              <span className="text-green-500 font-medium">ATIVADA</span>
            ) : (
              <span className="text-red-500 font-medium">DESATIVADA</span>
            )}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="auto-reply-message" className="text-white font-medium">
              Conteúdo da Mensagem Automática
            </Label>
            <p className="text-sm text-gray-400 mb-2">
              Esta mensagem será enviada automaticamente quando um aluno enviar uma mensagem
            </p>
            <Textarea
              id="auto-reply-message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[120px] bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 resize-y"
              placeholder="Digite a mensagem automática..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageText.length}/500 caracteres
            </p>
          </div>
          <Button
            onClick={handleSaveMessage}
            disabled={updateSetting.isPending || messageText.trim() === autoReplyMessage}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Salvar Mensagem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

