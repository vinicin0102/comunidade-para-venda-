import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CoverUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  folder: 'modules' | 'lessons' | 'banners' | 'rewards' | 'courses';
  aspectRatio?: '16:9' | '1:1';
  className?: string;
}

export function CoverUpload({
  currentUrl,
  onUpload,
  onRemove,
  folder,
  aspectRatio = '16:9',
  className
}: CoverUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Iniciando upload de capa:', { folder, fileName: file.name, fileSize: file.size });
      const url = await uploadImage(file, folder, user.id);
      console.log('✅ Upload concluído, URL:', url);
      onUpload(url);
      toast.success('Capa enviada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      
      if (errorMessage.includes('Bucket not found') || 
          errorMessage.includes('não configurado') ||
          errorMessage.includes('não encontrado') ||
          errorMessage.includes('404')) {
        toast.error('Bucket "images" não configurado. PASSO 1: Vá em Supabase → Storage → New bucket → Nome: images → Marque Public → Create. PASSO 2: Execute configurar-storage.sql no SQL Editor.', {
          duration: 10000,
        });
      } else if (errorMessage.includes('permission') || 
                 errorMessage.includes('policy') ||
                 errorMessage.includes('403') ||
                 errorMessage.includes('denied')) {
        toast.error('Erro de permissão. Execute configurar-storage.sql no Supabase para configurar as políticas.');
      } else if (errorMessage.includes('muito grande')) {
        toast.error(errorMessage);
      } else if (errorMessage.includes('processar')) {
        toast.error(errorMessage);
      } else {
        toast.error(`Erro ao enviar imagem: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg overflow-hidden transition-all",
          aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square',
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Trocar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onRemove}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Enviando...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Clique ou arraste uma imagem</span>
                <span className="text-xs text-muted-foreground">
                  {aspectRatio === '16:9' ? '1920x1080' : '512x512'} recomendado
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
