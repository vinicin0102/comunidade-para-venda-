import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadPDF } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PDFUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  className?: string;
}

export function PDFUpload({
  currentUrl,
  onUpload,
  onRemove,
  className
}: PDFUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('PDF muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadPDF(file, 'pdfs', user.id);
      onUpload(url);
      toast.success('PDF enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error?.message || 'Erro ao enviar PDF');
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
      {currentUrl ? (
        <div className="border border-border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 rounded-lg p-2">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">PDF anexado</p>
                <p className="text-xs text-muted-foreground">Material da aula disponível</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.open(currentUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Ver PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Trocar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onRemove}
                disabled={isUploading}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all",
            isDragging 
              ? "border-primary bg-primary/10" 
              : "border-border hover:border-primary/50",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm">Enviando PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-10 h-10" />
                <div className="text-center">
                  <span className="text-sm font-medium block">Clique ou arraste um PDF</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Tamanho máximo: 10MB
                  </span>
                </div>
              </>
            )}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

