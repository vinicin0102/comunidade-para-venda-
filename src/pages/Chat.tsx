import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Mic, Square, X, RotateCcw, Check, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatMessages, useSendMessage } from '@/hooks/useChat';
import { useDeleteChatMessage, useIsSupport } from '@/hooks/useSupport';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AudioPlayer } from '@/components/chat/AudioPlayer';
import { isWithinOperatingHours, getOperatingHoursMessage } from '@/lib/schedule';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { uploadAudio } from '@/lib/audioUpload';

interface AudioPreview {
  blob: Blob;
  url: string;
  duration: number;
}

export default function Chat() {
  const { user } = useAuth();
  const { data: messages, isLoading } = useChatMessages();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteChatMessage();
  const isSupport = useIsSupport();
  const hasDiamondAccess = useHasDiamondAccess();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [viewportHeight, setViewportHeight] = useState(
    window.visualViewport?.height || window.innerHeight
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);
  
  // Preview de áudio
  const [audioPreview, setAudioPreview] = useState<AudioPreview | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync(messageId);
      toast.success('Mensagem removida');
    } catch (error) {
      toast.error('Erro ao remover mensagem');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio preview URL on unmount
  useEffect(() => {
    return () => {
      if (audioPreview?.url) {
        URL.revokeObjectURL(audioPreview.url);
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Detectar mudanças na altura do viewport quando o teclado aparece/desaparece
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      handleResize();
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Prevenir scroll da página quando o teclado abrir
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Verificar horário de funcionamento (9h - 21h, horário de Brasília)
      if (!isWithinOperatingHours()) {
        toast.error(getOperatingHoursMessage(), {
          duration: 6000
        });
        return;
      }
      
      // Limpar preview anterior se existir
      if (audioPreview?.url) {
        URL.revokeObjectURL(audioPreview.url);
        setAudioPreview(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
        
        // Se foi cancelado, não fazer nada
        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        
        // Criar URL para preview
        const previewUrl = URL.createObjectURL(audioBlob);
        
        setAudioPreview({
          blob: audioBlob,
          url: previewUrl,
          duration: audioDuration
        });
      };

      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      
      // Iniciar timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info('Gravando áudio...');
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      // Parar o stream manualmente
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    setRecordingTime(0);
    toast.info('Gravação cancelada');
  };

  const discardAudio = () => {
    if (audioPreview?.url) {
      URL.revokeObjectURL(audioPreview.url);
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setAudioPreview(null);
    setIsPlayingPreview(false);
    toast.info('Áudio descartado');
  };

  const rerecordAudio = () => {
    discardAudio();
    startRecording();
  };

  const togglePreviewPlayback = () => {
    if (!audioPreview) return;

    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(audioPreview.url);
        previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      }
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const confirmSendAudio = async () => {
    if (!audioPreview || !user) return;

    // Verificar horário de funcionamento (9h - 21h, horário de Brasília)
    if (!isWithinOperatingHours()) {
      toast.error(getOperatingHoursMessage(), {
        duration: 6000
      });
      return;
    }

    setIsSendingAudio(true);
    
    try {
      // Fazer upload do áudio para o Storage
      const audioUrl = await uploadAudio(audioPreview.blob, user.id);
      
      // Salvar mensagem com URL do áudio
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content: `🎤AUDIO:${audioUrl}|${audioPreview.duration}`,
        });
      
      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }
      
      // Limpar preview
      if (audioPreview.url) {
        URL.revokeObjectURL(audioPreview.url);
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setAudioPreview(null);
      setIsPlayingPreview(false);
      
      toast.success('Áudio enviado!');
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      toast.error(`Erro: ${error?.message || 'Tente novamente'}`);
    } finally {
      setIsSendingAudio(false);
    }
  };

  const checkDiamondAccess = () => {
    if (isSupport) return true;
    
    if (!hasDiamondAccess) {
      toast.error('Recurso exclusivo para assinantes Diamond', {
        description: 'Faça upgrade para enviar mensagens no chat!',
        action: {
          label: 'Assinar Diamond',
          onClick: () => navigate('/upgrade')
        },
        duration: 5000,
      });
      return false;
    }
    return true;
  };

  const handleAudioClick = () => {
    if (!checkDiamondAccess()) return;
    startRecording();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar horário de funcionamento (9h - 21h, horário de Brasília)
    if (!isWithinOperatingHours()) {
      toast.error(getOperatingHoursMessage(), {
        duration: 6000
      });
      return;
    }
    
    if (!newMessage.trim()) return;

    if (!checkDiamondAccess()) return;

    try {
      await sendMessage.mutateAsync(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Renderizar controles de gravação
  const renderRecordingControls = () => (
    <div className="border-t border-[#2a2a2a] p-3 sm:p-3 flex gap-2 items-center flex-shrink-0 bg-[#1a1a1a]">
      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center gap-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Gravando</span>
          <span className="text-sm">{formatTime(recordingTime)}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={cancelRecording}
        className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        onClick={stopRecording}
        className="h-9 w-9 bg-green-600 hover:bg-green-700"
      >
        <Square className="h-4 w-4 fill-current" />
      </Button>
    </div>
  );

  // Renderizar preview de áudio
  const renderAudioPreview = () => (
    <div className="border-t border-[#2a2a2a] p-3 sm:p-3 flex flex-col gap-2 flex-shrink-0 bg-[#1a1a1a]">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePreviewPlayback}
          className="h-9 w-9 text-primary hover:text-primary/80"
        >
          {isPlayingPreview ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
          </div>
          <span className="text-xs text-gray-400">{formatTime(audioPreview?.duration || 0)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={discardAudio}
          className="flex-1 h-8 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Descartar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={rerecordAudio}
          className="flex-1 h-8 text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Regravar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={confirmSendAudio}
          disabled={isSendingAudio}
          className="flex-1 h-8"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {isSendingAudio ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );

  // Renderizar formulário padrão
  const renderDefaultForm = () => (
    <form 
      onSubmit={handleSubmit} 
      className="border-t border-[#2a2a2a] p-3 sm:p-3 flex gap-1.5 sm:gap-2 items-center flex-shrink-0 bg-[#1a1a1a]"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleAudioClick}
        className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 text-gray-400 hover:text-white"
      >
        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      <Input
        placeholder="Digite sua mensagem..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        className="flex-1 !bg-[#2a2a2a] !border-[#3a3a3a] !text-white placeholder:!text-gray-500 text-sm sm:text-base h-8 sm:h-9"
        onFocus={(e) => {
          if (window.visualViewport) {
            setViewportHeight(window.visualViewport.height);
          }
          setTimeout(() => {
            if (window.visualViewport) {
              setViewportHeight(window.visualViewport.height);
            }
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 300);
        }}
      />
      <Button 
        type="submit" 
        disabled={sendMessage.isPending || !newMessage.trim()}
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
      >
        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    </form>
  );

  return (
    <MainLayout>
      <div 
        className="fixed inset-0 top-0 bg-[#0a0a0a]" 
        style={{ 
          touchAction: 'manipulation', 
          backgroundColor: '#0a0a0a',
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          overflow: 'hidden',
          paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
          paddingTop: 'max(0px, env(safe-area-inset-top, 0px))'
        }}
      >
        <div className="max-w-2xl mx-auto h-full flex flex-col px-0 sm:px-4" style={{ touchAction: 'manipulation', overflow: 'hidden' }}>
          <Card className="flex-1 flex flex-col border border-[#2a2a2a] border-t-2 bg-[#1a1a1a] min-h-0 rounded-lg sm:rounded-xl my-1 sm:my-0" style={{ touchAction: 'manipulation', overflow: 'hidden' }}>
          <div className="border-b border-[#2a2a2a] px-3 py-2 flex items-center justify-center flex-shrink-0">
            <Badge className="bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5 rounded-full">
              Chat Comunidade
            </Badge>
          </div>
          <CardContent className="flex flex-col flex-1 p-0 min-h-0" style={{ touchAction: 'manipulation', overflow: 'hidden' }}>
            <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3 sm:px-4 sm:pt-4 sm:pb-4 space-y-2 sm:space-y-3 min-h-0" style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' }}>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={cn('flex gap-2', i % 2 === 0 && 'flex-row-reverse')}>
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <Skeleton className="h-16 w-3/4 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => {
                    const isOwn = message.user_id === user?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-2 animate-fade-in',
                          isOwn && 'flex-row-reverse'
                        )}
                      >
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage 
                            src={message.profiles?.avatar_url || ''} 
                            className="object-cover object-center"
                          />
                          <AvatarFallback className="text-[10px] sm:text-xs gradient-primary text-primary-foreground">
                            {message.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'max-w-[80%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2 relative group',
                            isOwn 
                              ? 'gradient-primary text-primary-foreground rounded-tr-sm' 
                              : 'bg-[#2a2a2a] text-white rounded-tl-sm'
                          )}
                        >
                          {(isSupport || isOwn) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white"
                                >
                                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    Remover mensagem
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    Tem certeza que deseja remover esta mensagem?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-[#2a2a2a] text-white border-[#3a3a3a]">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(message.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {!isOwn && (
                            <p className="text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1 opacity-70">
                              {message.profiles?.username || 'Usuário'}
                            </p>
                          )}
                          {message.content.startsWith('🎤AUDIO:') ? (
                            (() => {
                              const match = message.content.match(/🎤AUDIO:(.+?)\|(\d+)/);
                              if (match) {
                                const [, audioUrl, duration] = match;
                                return (
                                  <AudioPlayer 
                                    audioUrl={audioUrl} 
                                    duration={parseInt(duration) || undefined}
                                    isOwn={isOwn}
                                  />
                                );
                              }
                              return <p className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>;
                            })()
                          ) : (
                            <p className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                          )}
                          <p className={cn(
                            'text-[9px] sm:text-[10px] mt-0.5 sm:mt-1',
                            isOwn ? 'text-primary-foreground/70' : 'text-gray-400'
                          )}>
                            {formatDistanceToNow(new Date(message.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="gradient-primary rounded-2xl p-4 mb-4">
                    <span className="text-4xl">👋</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">
                    Bem-vindo ao chat!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Seja o primeiro a enviar uma mensagem
                  </p>
                </div>
              )}
            </div>

            {isRecording ? renderRecordingControls() : audioPreview ? renderAudioPreview() : renderDefaultForm()}
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  );
}