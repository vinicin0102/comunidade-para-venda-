import { useState, useEffect, useRef } from 'react';
import { HelpCircle, Send, ChevronDown, ChevronUp, MessageSquare, ArrowLeft, User, Image as ImageIcon, Mic, Trash2 } from 'lucide-react';
import { AudioPlayer } from '@/components/chat/AudioPlayer';
import { uploadImage } from '@/lib/upload';
import { uploadAudio } from '@/lib/audioUpload';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsSupport, useDeleteSupportMessage } from '@/hooks/useSupport';
import { getAutoReplyMessage } from '@/hooks/useSupportSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const faqs = [
  {
    question: 'Como ganho pontos na comunidade?',
    answer: 'Você ganha pontos ao criar publicações (+5 pontos), receber curtidas (+1 ponto) e participar do chat (+1 ponto por mensagem). Quanto mais você interage, mais pontos acumula!'
  },
  {
    question: 'O que são as conquistas/badges?',
    answer: 'Conquistas são selos especiais que você ganha ao atingir determinada quantidade de pontos. Cada badge representa um nível de engajamento na comunidade.'
  },
  {
    question: 'Como funciona o ranking?',
    answer: 'O ranking é baseado na quantidade total de pontos que você acumulou. Todos os membros da comunidade competem no mesmo ranking global.'
  },
  {
    question: 'Posso editar meu perfil?',
    answer: 'Sim! Clique no seu avatar no canto superior direito e selecione "Meu Perfil" para acessar as configurações do seu perfil.'
  },
  {
    question: 'Como faço para entrar em contato com o suporte?',
    answer: 'Você pode usar o formulário abaixo para enviar uma mensagem diretamente para nossa equipe de suporte. Responderemos o mais breve possível!'
  }
];

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
  audio_url?: string | null;
  audio_duration?: number | null;
  image_url?: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

export default function Support() {
  const { user } = useAuth();
  const isSupport = useIsSupport();
  const deleteSupportMessage = useDeleteSupportMessage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  
  // Estados para visualização de suporte
  const [conversations, setConversations] = useState<{ userId: string; username: string; avatar: string | null; lastMessage: string; lastMessageTime: string; unread: number }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{ username: string; avatar_url: string | null; full_name: string | null } | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // Carregar conversas para suporte e configurar realtime
  useEffect(() => {
    if (isSupport) {
      loadConversations();
      
      // Subscribe para atualizações em tempo real das conversas
      const conversationsChannel = supabase
        .channel('support-conversations')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'support_chat' },
          (payload) => {
            console.log('Nova mensagem no suporte:', payload);
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [isSupport]);

  // Carregar mensagens quando selecionar um usuário (suporte) ou quando for aluno
  useEffect(() => {
    if (isSupport && selectedUserId) {
      loadMessages(selectedUserId);
      
      // Subscribe para atualizações em tempo real das mensagens específicas
      const messagesChannel = supabase
        .channel(`support-messages-${selectedUserId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'support_chat', 
            filter: `user_id=eq.${selectedUserId}` 
          },
          (payload) => {
            console.log('Nova mensagem do usuário:', payload);
            loadMessages(selectedUserId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    } else if (!isSupport && user) {
      // Aluno: carregar suas próprias mensagens
      loadUserMessages();
      
      // Subscribe para atualizações em tempo real (aluno)
      const userMessagesChannel = supabase
        .channel(`user-support-messages-${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'support_chat', 
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            console.log('Nova mensagem para o aluno:', payload);
            loadUserMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(userMessagesChannel);
      };
    }
  }, [isSupport, selectedUserId, user]);

  // Carregar mensagens do aluno
  const loadUserMessages = async () => {
    if (!user) return;
    
    setLoadingMessages(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('support_chat')
        .select('id, user_id, message, created_at, is_from_support, image_url, audio_url, audio_duration, support_user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Carregar perfis para mensagens
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          if (msg.is_from_support && msg.support_user_id) {
            // Buscar perfil do suporte
            const { data: supportProfile } = await supabase
              .from('profiles')
              .select('username, avatar_url, full_name')
              .eq('user_id', msg.support_user_id)
              .single();
            return { ...msg, profiles: supportProfile || { username: 'Suporte', avatar_url: null, full_name: 'Equipe de Suporte' } };
          } else {
            // Buscar perfil do aluno
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('username, avatar_url, full_name')
              .eq('user_id', msg.user_id)
              .single();
            return { ...msg, profiles: userProfile || null };
          }
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data: allMessages, error } = await supabase
        .from('support_chat')
        .select('user_id, message, created_at, is_from_support')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuário e pegar última mensagem de cada
      const userMap = new Map<string, { message: string; time: string; unread: number }>();
      
      allMessages?.forEach((msg: any) => {
        if (!msg.is_from_support) {
          if (!userMap.has(msg.user_id)) {
            userMap.set(msg.user_id, {
              message: msg.message,
              time: msg.created_at,
              unread: 0
            });
          }
        }
      });

      const userIds = Array.from(userMap.keys());
      if (userIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, full_name')
        .in('user_id', userIds);

      const conversationsList = userIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const msgData = userMap.get(userId)!;
        return {
          userId,
          username: profile?.username || 'Usuário',
          avatar: profile?.avatar_url || null,
          lastMessage: msgData.message.substring(0, 50) + (msgData.message.length > 50 ? '...' : ''),
          lastMessageTime: msgData.time,
          unread: msgData.unread
        };
      });

      setConversations(conversationsList.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    setLoadingMessages(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('support_chat')
        .select('id, user_id, message, created_at, is_from_support, image_url, audio_url, audio_duration, support_user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Carregar perfis para cada mensagem
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          if (msg.is_from_support) {
            return { ...msg, profiles: null };
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, full_name')
            .eq('user_id', msg.user_id)
            .single();
          return { ...msg, profiles: profile || null };
        })
      );

      setMessages(messagesWithProfiles);

      // Carregar perfil do usuário selecionado
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, full_name')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setSelectedUserProfile(profile);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedUserId || !replyMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('support_chat')
        .insert({
          user_id: selectedUserId,
          support_user_id: user.id,
          message: replyMessage,
          is_from_support: true,
        });

      if (error) throw error;

      setReplyMessage('');
      loadMessages(selectedUserId);
      loadConversations();
      toast.success('Resposta enviada!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar resposta');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
        
        // Calcular duração
        const audioDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        
        try {
          if (!user) {
            toast.error('Você precisa estar logado');
            return;
          }

          toast.info('Enviando áudio...');
          
          // Fazer upload do áudio para o Storage
          const audioUrl = await uploadAudio(audioBlob, user.id);
          
          // Salvar mensagem com URL do áudio no message (formato especial para identificar)
          // Formato: 🎤AUDIO:URL|DURATION
          const audioMessage = `🎤AUDIO:${audioUrl}|${audioDuration}`;
          
          if (isSupport && selectedUserId) {
            // Suporte enviando para aluno
            const { error } = await supabase
              .from('support_chat')
              .insert({
                user_id: selectedUserId,
                support_user_id: user.id,
                is_from_support: true,
                message: audioMessage,
              });
            
            if (error) {
              console.error('Erro SQL:', error);
              throw error;
            }
            loadMessages(selectedUserId);
            loadConversations();
            toast.success('Áudio enviado!');
          } else if (!isSupport) {
            // Aluno enviando para suporte
            const { error } = await supabase
              .from('support_chat')
              .insert({
                user_id: user.id,
                is_from_support: false,
                message: audioMessage,
              });
            
            if (error) {
              console.error('Erro SQL:', error);
              throw error;
            }
            
            // Verificar se a mensagem automática está ativada (controlada pelo admin no painel)
            let autoReplyEnabled = true; // Padrão: ativado
            try {
              const { data, error } = await supabase
                .from('support_settings')
                .select('value')
                .eq('key', 'auto_reply_enabled')
                .single();

              if (!error && data) {
                autoReplyEnabled = data.value === 'true';
              }
            } catch (error) {
              console.error('Erro ao verificar configuração de mensagem automática:', error);
              // Em caso de erro, usar padrão (ativado)
            }
            
            console.log('🔍 Verificando mensagem automática (áudio):', { autoReplyEnabled });
            
            // Enviar mensagem automática apenas se estiver ativada
            if (autoReplyEnabled) {
              console.log('✅ Enviando mensagem automática (ativada)');
              setTimeout(async () => {
                try {
                  const autoMessage = await getAutoReplyMessage();
                  const { error: autoMessageError } = await supabase
                    .from('support_chat')
                    .insert({
                      user_id: user.id,
                      message: autoMessage,
                      is_from_support: true,
                      support_user_id: null, // Mensagem automática
                    });

                  if (autoMessageError) {
                    console.error('Erro ao enviar mensagem automática:', autoMessageError);
                  }
                } catch (error) {
                  console.error('Erro ao enviar mensagem automática:', error);
                }
              }, 1000);
            }
            
            loadUserMessages();
            toast.success('Áudio enviado!');
          }
        } catch (error: any) {
          console.error('Erro ao enviar áudio:', error);
          toast.error(`Erro: ${error?.message || 'Tente novamente'}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Gravando áudio... Clique novamente para parar');
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setLoading(true);
    try {
      const messageText = formData.subject.trim() 
        ? `[${formData.subject}] ${formData.message}`
        : formData.message;

      const { error } = await supabase
        .from('support_chat')
        .insert({
          user_id: user.id,
          message: messageText,
          is_from_support: false,
        });

      if (error) throw error;

      // Verificar se a mensagem automática está ativada (controlada pelo admin no painel)
      let autoReplyEnabled = true; // Padrão: ativado
      try {
        const { data, error } = await supabase
          .from('support_settings')
          .select('value')
          .eq('key', 'auto_reply_enabled')
          .single();

        if (!error && data) {
          autoReplyEnabled = data.value === 'true';
        }
      } catch (error) {
        console.error('Erro ao verificar configuração de mensagem automática:', error);
        // Em caso de erro, usar padrão (ativado)
      }
      
      console.log('🔍 Verificando mensagem automática:', { autoReplyEnabled });
      
      // Enviar mensagem automática apenas se estiver ativada
      if (autoReplyEnabled) {
        console.log('✅ Enviando mensagem automática (ativada)');
        setTimeout(async () => {
          try {
            const autoMessage = await getAutoReplyMessage();
            const { error: autoMessageError } = await supabase
              .from('support_chat')
              .insert({
                user_id: user.id,
                message: autoMessage,
                is_from_support: true,
                support_user_id: null, // Mensagem automática
              });

            if (autoMessageError) {
              console.error('Erro ao enviar mensagem automática:', autoMessageError);
            }
          } catch (error) {
            console.error('Erro ao enviar mensagem automática:', error);
          }
        }, 1000);
      }

      toast.success('Mensagem enviada com sucesso!');
      setFormData({ subject: '', message: '' });
      
      // Recarregar mensagens para mostrar a nova
      if (!isSupport) {
        loadUserMessages();
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  // Se for suporte, mostrar interface de atendimento
  if (isSupport) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto space-y-6 px-4 pb-20">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold text-white mb-2">Central de Atendimento</h1>
            <p className="text-gray-400">Gerencie as solicitações dos alunos</p>
          </div>

          {!selectedUserId ? (
            // Lista de conversas
            <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-white">Solicitações de Suporte</CardTitle>
                <CardDescription className="text-gray-400">
                  {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length > 0 ? (
                  <div className="divide-y divide-[#2a2a2a]">
                    {conversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => setSelectedUserId(conv.userId)}
                        className="w-full p-4 hover:bg-[#2a2a2a] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={conv.avatar || ''} 
                              className="object-cover object-center"
                            />
                            <AvatarFallback className="bg-primary text-white">
                              {conv.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{conv.username}</p>
                            <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          {conv.unread > 0 && (
                            <Badge className="bg-primary">{conv.unread}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">Nenhuma solicitação no momento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Visualização de conversa
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserProfile(null);
                  setMessages([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para lista
              </Button>

              <Card className="border border-[#2a2a2a] bg-[#1a1a1a] rounded-lg sm:rounded-xl">
                <CardHeader className="border-b border-[#2a2a2a] px-3 sm:px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage 
                        src={selectedUserProfile?.avatar_url || ''} 
                        className="object-cover object-center"
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {selectedUserProfile?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white">
                        {selectedUserProfile?.full_name || selectedUserProfile?.username || 'Usuário'}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        @{selectedUserProfile?.username || 'usuario'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100vh-20rem)] p-0" style={{ touchAction: 'manipulation' }}>
                  <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3 sm:px-4 sm:pt-4 sm:pb-4 space-y-2 sm:space-y-3" style={{ touchAction: 'manipulation' }}>
                    {loadingMessages ? (
                      <div className="text-center text-gray-400 py-8">Carregando mensagens...</div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-2 group',
                            msg.is_from_support && 'flex-row-reverse'
                          )}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage 
                              src={msg.profiles?.avatar_url || ''} 
                              className="object-cover object-center"
                            />
                            <AvatarFallback className="text-xs bg-primary text-white">
                              {msg.is_from_support ? 'S' : (msg.profiles?.username?.charAt(0).toUpperCase() || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-1 max-w-[75%] sm:max-w-[70%]">
                            <div
                              className={cn(
                                'rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2 relative',
                                msg.is_from_support
                                  ? 'bg-primary text-white rounded-tr-sm'
                                  : 'bg-[#2a2a2a] text-white rounded-tl-sm'
                              )}
                            >
                              {isSupport && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity",
                                    msg.is_from_support 
                                      ? "text-white hover:bg-white/20" 
                                      : "text-gray-400 hover:bg-[#3a3a3a]"
                                  )}
                                  onClick={async () => {
                                    if (confirm('Tem certeza que deseja deletar esta mensagem?')) {
                                      try {
                                        await deleteSupportMessage.mutateAsync(msg.id);
                                        toast.success('Mensagem deletada');
                                        // Recarregar mensagens para atualizar a interface
                                        if (selectedUserId) {
                                          await loadMessages(selectedUserId);
                                        }
                                        // Também recarregar conversas
                                        await loadConversations();
                                      } catch (error: any) {
                                        toast.error(error?.message || 'Erro ao deletar mensagem');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            {!msg.is_from_support && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.profiles?.username || 'Usuário'}
                              </p>
                            )}
                            {msg.image_url ? (
                              <div className="space-y-2">
                                <p className="text-sm">{msg.message}</p>
                                <img 
                                  src={msg.image_url} 
                                  alt="Imagem enviada" 
                                  className="max-w-full rounded-lg max-h-64 object-cover"
                                />
                              </div>
                            ) : msg.message?.startsWith('🎤AUDIO:') ? (
                              (() => {
                                // Extrair URL e duração do formato: 🎤AUDIO:URL|DURATION
                                const match = msg.message.match(/🎤AUDIO:(.+?)\|(\d+)/);
                                if (match) {
                                  const [, audioUrl, duration] = match;
                                  return (
                                    <AudioPlayer 
                                      audioUrl={audioUrl} 
                                      duration={parseInt(duration) || undefined}
                                      isOwn={msg.is_from_support}
                                    />
                                  );
                                }
                                return <p className="text-sm whitespace-pre-wrap">{msg.message}</p>;
                              })()
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            )}
                            </div>
                            <p className={cn(
                              'text-[10px] mt-1 px-1',
                              msg.is_from_support ? 'text-white/70 text-right' : 'text-gray-400'
                            )}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        Nenhuma mensagem ainda
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-[#2a2a2a] p-2.5 sm:p-4 flex-shrink-0 bg-[#1a1a1a] relative z-20">
                    <div className="flex gap-1.5 sm:gap-2 items-end">
                      <div className="flex gap-1 flex-shrink-0 relative z-30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('📷 Botão de imagem clicado (suporte)');
                            if (imageInputRef.current) {
                              imageInputRef.current.click();
                            } else {
                              console.error('❌ imageInputRef.current é null');
                              toast.error('Erro: input de imagem não encontrado');
                            }
                          }}
                          className="flex items-center justify-center text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] active:bg-[#4a4a4a] h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 border border-[#3a3a3a] hover:border-[#4a4a4a] rounded-lg transition-all shadow-lg cursor-pointer"
                          title="Enviar imagem"
                          aria-label="Enviar imagem"
                          style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                        >
                          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleAudioClick}
                          className={cn(
                            "!h-10 !w-10 sm:!h-11 sm:!w-11 flex-shrink-0",
                            isRecording 
                              ? "!text-red-500 hover:!text-red-600 animate-pulse" 
                              : "!text-gray-300 hover:!text-white hover:!bg-[#2a2a2a]"
                          )}
                          title="Enviar áudio"
                          aria-label="Enviar áudio"
                        >
                          <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Digite sua resposta..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-1 !bg-[#2a2a2a] !border-[#3a3a3a] !text-white placeholder:!text-gray-500 min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim()}
                        className="bg-primary hover:bg-primary/90 h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                        size="icon"
                      >
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        console.log('📷 Input de imagem alterado (suporte)');
                        const file = e.target.files?.[0];
                        if (file && user && selectedUserId) {
                          try {
                            // Validar arquivo
                            if (!file.type.startsWith('image/')) {
                              toast.error('Por favor, selecione uma imagem válida');
                              return;
                            }

                            toast.info('Enviando imagem...');
                            
                            // Upload da imagem
                            let imageUrl: string;
                            try {
                              imageUrl = await uploadImage(file, 'posts', user.id);
                              console.log('✅ Imagem enviada com sucesso:', imageUrl);
                            } catch (uploadError: any) {
                              console.error('❌ Erro no upload:', uploadError);
                              const errorMsg = uploadError?.message || 'Erro desconhecido no upload';
                              
                              if (errorMsg.includes('Bucket not found') || errorMsg.includes('não configurado')) {
                                toast.error('Bucket de imagens não configurado. Configure o bucket "images" no Supabase Storage.');
                              } else if (errorMsg.includes('permission') || errorMsg.includes('policy')) {
                                toast.error('Erro de permissão. Verifique as políticas do Storage no Supabase.');
                              } else {
                                toast.error(`Erro ao fazer upload: ${errorMsg}`);
                              }
                              return;
                            }
                            
                            // Enviar mensagem com imagem
                            const { error, data } = await supabase
                              .from('support_chat')
                              .insert({
                                user_id: selectedUserId,
                                support_user_id: user.id,
                                message: '📷 Imagem',
                                image_url: imageUrl,
                                is_from_support: true,
                              })
                              .select();
                            
                            if (error) {
                              console.error('❌ Erro ao inserir mensagem:', error);
                              
                              // Mensagens de erro mais específicas
                              if (error.message?.includes('column') && error.message?.includes('image_url')) {
                                toast.error('Coluna image_url não existe. Execute ADICIONAR-COLUNA-IMAGE-URL-SUPPORT.sql no Supabase.');
                              } else if (error.message?.includes('permission') || error.message?.includes('policy') || error.code === '42501') {
                                toast.error('Erro de permissão. Verifique as políticas RLS da tabela support_chat.');
                              } else {
                                toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
                              }
                              return;
                            }
                            
                            console.log('✅ Mensagem com imagem inserida:', data);
                            
                            loadMessages(selectedUserId);
                            loadConversations();
                            toast.success('Imagem enviada!');
                            
                            // Limpar input
                            if (imageInputRef.current) {
                              imageInputRef.current.value = '';
                            }
                          } catch (error: any) {
                            console.error('❌ Erro geral ao enviar imagem:', error);
                            toast.error(`Erro ao enviar imagem: ${error?.message || 'Erro desconhecido'}`);
                          }
                        }
                      }}
                    />
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.info('Envio de áudio em desenvolvimento');
                          // TODO: Implementar upload de áudio
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Interface para alunos - Chat com suporte
  return (
    <MainLayout>
      <div 
        className="fixed inset-x-0 top-0 bg-[#0a0a0a]" 
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
                Chat Suporte
              </Badge>
            </div>
            <CardContent className="flex flex-col flex-1 p-0 min-h-0" style={{ touchAction: 'manipulation', overflow: 'hidden' }}>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3 sm:px-4 sm:pt-4 sm:pb-4 space-y-2 sm:space-y-3 min-h-0" style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' }}>
              {loadingMessages ? (
                <div className="text-center text-gray-400 py-8">Carregando mensagens...</div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2',
                      msg.is_from_support && 'flex-row-reverse'
                    )}
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarImage 
                        src={msg.profiles?.avatar_url || ''} 
                        className="object-cover object-center"
                      />
                      <AvatarFallback className={cn(
                        'text-[10px] sm:text-xs',
                        msg.is_from_support 
                          ? 'bg-primary text-white' 
                          : 'bg-[#2a2a2a] text-white'
                      )}>
                        {msg.is_from_support 
                          ? 'S' 
                          : (msg.profiles?.username?.charAt(0).toUpperCase() || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[80%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2',
                        msg.is_from_support
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-[#2a2a2a] text-white rounded-tl-sm'
                      )}
                    >
                      {msg.is_from_support ? (
                        <p className="text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1 opacity-70">
                          Suporte
                        </p>
                      ) : (
                        <p className="text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1 opacity-70">
                          Você
                        </p>
                      )}
                      {msg.image_url ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          <p className="text-xs sm:text-sm">{msg.message}</p>
                          <img 
                            src={msg.image_url} 
                            alt="Imagem enviada" 
                            className="max-w-full rounded-lg max-h-48 sm:max-h-64 object-cover"
                          />
                        </div>
                      ) : msg.message?.startsWith('🎤AUDIO:') ? (
                        (() => {
                          // Extrair URL e duração do formato: 🎤AUDIO:URL|DURATION
                          const match = msg.message.match(/🎤AUDIO:(.+?)\|(\d+)/);
                          if (match) {
                            const [, audioUrl, duration] = match;
                            return (
                              <AudioPlayer 
                                audioUrl={audioUrl} 
                                duration={parseInt(duration) || undefined}
                                isOwn={!msg.is_from_support}
                              />
                            );
                          }
                          return <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.message}</p>;
                        })()
                      ) : (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.message}</p>
                      )}
                      <p className={cn(
                        'text-[9px] sm:text-[10px] mt-0.5 sm:mt-1',
                        msg.is_from_support ? 'text-white/70' : 'text-gray-400'
                      )}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm mt-2">Envie uma mensagem para começar a conversa</p>
                </div>
              )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulário de envio */}
              <div className="border-t border-[#2a2a2a] p-3 sm:p-3 flex-shrink-0 bg-[#1a1a1a] relative z-20">
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                <div className="flex gap-1.5 sm:gap-2 items-end">
                  <div className="flex gap-1 flex-shrink-0 relative z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('📷 Botão de imagem clicado (usuário)');
                        if (imageInputRef.current) {
                          imageInputRef.current.click();
                        } else {
                          console.error('❌ imageInputRef.current é null');
                          toast.error('Erro: input de imagem não encontrado');
                        }
                      }}
                      className="flex items-center justify-center text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] active:bg-[#4a4a4a] h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 border border-[#3a3a3a] hover:border-[#4a4a4a] rounded-lg transition-all shadow-lg cursor-pointer"
                      title="Enviar imagem"
                      aria-label="Enviar imagem"
                      style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                    >
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleAudioClick}
                      className={cn(
                        "!h-10 !w-10 sm:!h-11 sm:!w-11 flex-shrink-0",
                        isRecording 
                          ? "!text-red-500 hover:!text-red-600 animate-pulse" 
                          : "!text-gray-300 hover:!text-white hover:!bg-[#2a2a2a]"
                      )}
                      title="Enviar áudio"
                      aria-label="Enviar áudio"
                    >
                      <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="flex-1 !bg-[#2a2a2a] !border-[#3a3a3a] !text-white placeholder:!text-gray-500 min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={loading || !formData.message.trim()}
                    className="bg-primary hover:bg-primary/90 h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                    size="icon"
                  >
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    console.log('📷 Input de imagem alterado (usuário)');
                    const file = e.target.files?.[0];
                    if (file && user) {
                      try {
                        // Validar arquivo
                        if (!file.type.startsWith('image/')) {
                          toast.error('Por favor, selecione uma imagem válida');
                          return;
                        }

                        toast.info('Enviando imagem...');
                        
                        // Upload da imagem
                        let imageUrl: string;
                        try {
                          imageUrl = await uploadImage(file, 'posts', user.id);
                          console.log('✅ Imagem enviada com sucesso:', imageUrl);
                        } catch (uploadError: any) {
                          console.error('❌ Erro no upload:', uploadError);
                          const errorMsg = uploadError?.message || 'Erro desconhecido no upload';
                          
                          if (errorMsg.includes('Bucket not found') || errorMsg.includes('não configurado')) {
                            toast.error('Bucket de imagens não configurado. Configure o bucket "images" no Supabase Storage.');
                          } else if (errorMsg.includes('permission') || errorMsg.includes('policy')) {
                            toast.error('Erro de permissão. Verifique as políticas do Storage no Supabase.');
                          } else {
                            toast.error(`Erro ao fazer upload: ${errorMsg}`);
                          }
                          return;
                        }
                        
                        // Enviar mensagem com imagem
                        const { error, data } = await supabase
                          .from('support_chat')
                          .insert({
                            user_id: user.id,
                            message: '📷 Imagem',
                            image_url: imageUrl,
                            is_from_support: false,
                          })
                          .select();
                        
                        if (error) {
                          console.error('❌ Erro ao inserir mensagem:', error);
                          
                          // Mensagens de erro mais específicas
                          if (error.message?.includes('column') && error.message?.includes('image_url')) {
                            toast.error('Coluna image_url não existe. Execute ADICIONAR-COLUNA-IMAGE-URL-SUPPORT.sql no Supabase.');
                          } else if (error.message?.includes('permission') || error.message?.includes('policy') || error.code === '42501') {
                            toast.error('Erro de permissão. Verifique as políticas RLS da tabela support_chat.');
                          } else {
                            toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
                          }
                          return;
                        }
                        
                        console.log('✅ Mensagem com imagem inserida:', data);
                        
                        loadUserMessages();
                        toast.success('Imagem enviada!');
                        
                        // Limpar input
                        if (imageInputRef.current) {
                          imageInputRef.current.value = '';
                        }
                      } catch (error: any) {
                        console.error('❌ Erro geral ao enviar imagem:', error);
                        toast.error(`Erro ao enviar imagem: ${error?.message || 'Erro desconhecido'}`);
                      }
                    }
                  }}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.info('Envio de áudio em desenvolvimento');
                      // TODO: Implementar upload de áudio
                    }
                  }}
                />
              </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
