import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, File, Paperclip, Bot, BotOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { uploadImage } from '@/lib/upload';
import { uploadPDF } from '@/lib/upload';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportChatMessage {
  id: string;
  user_id: string;
  support_user_id: string | null;
  message: string;
  is_from_support: boolean;
  created_at: string;
  image_url?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export function SupportChat() {
  const { user } = useAuth();
  const { data: supportProfile } = useProfile();
  const [conversations, setConversations] = useState<{ userId: string; username: string; avatar: string | null; lastMessage: string; unread: number }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar configuração do banco de dados
  useEffect(() => {
    const loadAutoReplySetting = async () => {
      try {
        const { data, error } = await supabase
          .from('support_settings')
          .select('value')
          .eq('key', 'auto_reply_enabled')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Erro ao carregar configuração:', error);
          // Se a tabela não existir ou não houver registro, usar padrão
          setAutoReplyEnabled(true);
        } else if (data) {
          setAutoReplyEnabled(data.value === 'true');
        } else {
          // Se não houver registro, usar padrão
          setAutoReplyEnabled(true);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        // Em caso de erro, usar padrão
        setAutoReplyEnabled(true);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadAutoReplySetting();
  }, []);

  useEffect(() => {
    loadConversations();
    
    // Subscribe para atualizar lista de conversas em tempo real
    const conversationsChannel = supabase
      .channel(`support-conversations-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat',
        },
        (payload) => {
          console.log('📨 Nova mensagem na lista de conversas:', payload);
          // Atualizar lista de conversas quando houver nova mensagem
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de conversas:', status);
      });

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId, true);
      const unsubscribe = subscribeToMessages(selectedUserId);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setMessages([]);
    }
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      // Buscar mensagens do support_chat
      const { data: messagesData, error: messagesError } = await (supabase.from('support_chat') as any)
        .select('user_id, message, created_at')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Pegar IDs únicos de usuários
      const userIds = [...new Set(messagesData?.map((m: any) => m.user_id) || [])];
      
      if (userIds.length === 0) {
        setConversations([]);
        return;
      }

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds as string[]);

      if (profilesError) throw profilesError;

      // Criar mapa de perfis
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Agrupar por usuário
      const grouped = new Map<string, { userId: string; username: string; avatar: string | null; lastMessage: string; unread: number }>();
      
      messagesData?.forEach((msg: any) => {
        const userId = msg.user_id;
        if (!grouped.has(userId)) {
          const profile = profileMap.get(userId);
          grouped.set(userId, {
            userId,
            username: profile?.username || 'Usuário',
            avatar: profile?.avatar_url || null,
            lastMessage: msg.message,
            unread: 0
          });
        }
      });

      setConversations(Array.from(grouped.values()));
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (userId: string, showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const { data: messagesData, error: messagesError } = await (supabase.from('support_chat') as any)
        .select('id, user_id, message, created_at, is_from_support, image_url, audio_url, audio_duration, support_user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Buscar perfis dos usuários
      const userIds = [...new Set(messagesData?.map((m: any) => m.is_from_support ? m.support_user_id : m.user_id).filter(Boolean) || [])] as string[];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const messagesWithProfiles = messagesData?.map((msg: any) => ({
          ...msg,
          profiles: profileMap.get(msg.is_from_support ? msg.support_user_id : msg.user_id) || null
        })) || [];

        setMessages(messagesWithProfiles);
      } else {
        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const subscribeToMessages = (userId: string) => {
    console.log('🔔 Subscribing to messages for user:', userId);
    const channel = supabase
      .channel(`support-chat-${userId}-${Date.now()}`) // Adicionar timestamp para evitar conflitos
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 Nova mensagem recebida (realtime):', payload);
          // Recarregar mensagens sem mostrar loading
          loadMessages(userId, false);
          // Também atualizar lista de conversas
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa para user:', userId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription para user:', userId);
        }
      });

    return () => {
      console.log('🔕 Unsubscribing from messages for user:', userId);
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Limpar imediatamente para melhor UX
    setLoading(true);
    try {
      const { error } = await (supabase.from('support_chat') as any)
        .insert({
          user_id: selectedUserId,
          support_user_id: user.id,
          message: messageToSend,
          is_from_support: true,
        });

      if (error) throw error;

      // Não precisa recarregar manualmente, o realtime vai atualizar automaticamente
      // O realtime subscription vai detectar a nova mensagem e atualizar automaticamente
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Lista de conversas */}
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Conversas</CardTitle>
            <button
              onClick={async () => {
                const newValue = !autoReplyEnabled;
                
                try {
                  // Primeiro, tentar atualizar se existir
                  const { data: existing, error: selectError } = await supabase
                    .from('support_settings')
                    .select('id')
                    .eq('key', 'auto_reply_enabled')
                    .maybeSingle();

                  let error;
                  
                  if (existing && !selectError) {
                    // Atualizar registro existente
                    const { error: updateError } = await supabase
                      .from('support_settings')
                      .update({ value: String(newValue) })
                      .eq('key', 'auto_reply_enabled');
                    error = updateError;
                  } else {
                    // Inserir novo registro (ou atualizar se já existir)
                    const { error: upsertError } = await supabase
                      .from('support_settings')
                      .upsert({
                        key: 'auto_reply_enabled',
                        value: String(newValue),
                        description: 'Controla se a mensagem automática de suporte está ativada'
                      }, {
                        onConflict: 'key'
                      });
                    error = upsertError;
                  }

                  if (error) {
                    console.error('Erro ao salvar configuração:', error);
                    throw error;
                  }

                  // Só atualizar o estado se salvou com sucesso
                  setAutoReplyEnabled(newValue);
                  
                  console.log('🔄 Mensagem automática alterada:', { newValue, saved: String(newValue) });
                  toast.success(
                    newValue 
                      ? 'Mensagem automática ativada' 
                      : 'Mensagem automática desativada'
                  );
                } catch (error: any) {
                  console.error('Erro ao salvar configuração:', error);
                  toast.error(`Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}`);
                  // Não reverter o estado, deixar o usuário tentar novamente
                }
              }}
              disabled={loadingSettings}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                ${autoReplyEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/50 hover:bg-gray-500/30'
                }
              `}
              title={autoReplyEnabled ? 'Desativar mensagem automática' : 'Ativar mensagem automática'}
            >
              {autoReplyEnabled ? (
                <>
                  <Bot className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Auto</span>
                </>
              ) : (
                <>
                  <BotOff className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Manual</span>
                </>
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#2a2a2a] max-h-[calc(100vh-300px)] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUserId(conv.userId)}
                  className={`
                    w-full p-4 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors text-left
                    ${selectedUserId === conv.userId ? 'bg-[#2a2a2a]' : ''}
                  `}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.avatar || ''} />
                    <AvatarFallback className="bg-primary text-white">
                      {conv.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{conv.username}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Área de mensagens */}
      <div className="lg:col-span-2">
        {selectedUserId ? (
          <Card className="border border-[#2a2a2a] bg-[#1a1a1a] h-full flex flex-col">
            <CardHeader className="border-b border-[#2a2a2a]">
              <CardTitle className="text-white">
                {conversations.find(c => c.userId === selectedUserId)?.username || 'Usuário'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.is_from_support ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.is_from_support && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {msg.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${msg.is_from_support ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.is_from_support
                            ? 'bg-primary text-white'
                            : 'bg-[#2a2a2a] text-white'
                        }`}
                      >
                        {msg.image_url ? (
                          <div className="space-y-2">
                            <p className="text-sm">{msg.message}</p>
                            <img 
                              src={msg.image_url} 
                              alt="Imagem enviada" 
                              className="max-w-full rounded-lg max-h-64 object-cover"
                            />
                          </div>
                        ) : msg.message?.startsWith('📎ARQUIVO:') ? (
                          <div className="space-y-2">
                            <p className="text-sm">{msg.message}</p>
                            {(() => {
                              const match = msg.message.match(/📎ARQUIVO:(.+?)\|(.+)/);
                              if (match) {
                                const [, fileUrl, fileName] = match;
                                return (
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm underline hover:opacity-80"
                                  >
                                    <File className="h-4 w-4" />
                                    {fileName}
                                  </a>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm">{msg.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {msg.is_from_support && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={supportProfile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {supportProfile?.username?.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem */}
              <form onSubmit={handleSendMessage} className="border-t border-[#2a2a2a] p-4">
                <div className="flex gap-2 items-end">
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] active:bg-[#4a4a4a] h-10 w-10 flex-shrink-0 border border-[#3a3a3a] hover:border-[#4a4a4a] rounded-lg transition-all shadow-lg cursor-pointer"
                      title="Enviar imagem"
                      aria-label="Enviar imagem"
                    >
                      <ImageIcon className="h-5 w-5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] active:bg-[#4a4a4a] h-10 w-10 flex-shrink-0 border border-[#3a3a3a] hover:border-[#4a4a4a] rounded-lg transition-all shadow-lg cursor-pointer"
                      title="Enviar arquivo"
                      aria-label="Enviar arquivo"
                    >
                      <Paperclip className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </div>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                  />
                  <Button type="submit" disabled={loading || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && user && selectedUserId) {
                      try {
                        if (!file.type.startsWith('image/')) {
                          toast.error('Por favor, selecione uma imagem válida');
                          return;
                        }

                        setUploadingImage(true);
                        toast.info('Enviando imagem...');
                        
                        const imageUrl = await uploadImage(file, 'posts', user.id);
                        console.log('✅ Imagem enviada com sucesso:', imageUrl);
                        
                        const { error } = await (supabase.from('support_chat') as any)
                          .insert({
                            user_id: selectedUserId,
                            support_user_id: user.id,
                            message: '📷 Imagem',
                            image_url: imageUrl,
                            is_from_support: true,
                          });
                        
                        if (error) throw error;
                        
                        // Não precisa recarregar manualmente, o realtime vai atualizar automaticamente
                        toast.success('Imagem enviada!');
                        setTimeout(() => {
                          loadMessages(selectedUserId, false);
                          loadConversations();
                        }, 500);
                        
                        if (imageInputRef.current) {
                          imageInputRef.current.value = '';
                        }
                      } catch (error: any) {
                        console.error('❌ Erro ao enviar imagem:', error);
                        toast.error(`Erro ao enviar imagem: ${error?.message || 'Erro desconhecido'}`);
                      } finally {
                        setUploadingImage(false);
                      }
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && user && selectedUserId) {
                      try {
                        setUploadingFile(true);
                        toast.info('Enviando arquivo...');
                        
                        let fileUrl: string;
                        if (file.type === 'application/pdf') {
                          fileUrl = await uploadPDF(file, 'pdfs', user.id);
                        } else {
                          // Para outros tipos de arquivo, usar upload genérico
                          const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
                          const filePath = `files/${fileName}`;
                          
                          const { error: uploadError } = await supabase.storage
                            .from('documents')
                            .upload(filePath, file, {
                              cacheControl: '3600',
                              upsert: false,
                              contentType: file.type,
                            });
                          
                          if (uploadError) {
                            // Tentar com bucket images como fallback
                            const { error: fallbackError } = await supabase.storage
                              .from('images')
                              .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: false,
                                contentType: file.type,
                              });
                            
                            if (fallbackError) throw fallbackError;
                            
                            const { data } = supabase.storage
                              .from('images')
                              .getPublicUrl(filePath);
                            
                            fileUrl = data.publicUrl;
                          } else {
                            const { data } = supabase.storage
                              .from('documents')
                              .getPublicUrl(filePath);
                            
                            fileUrl = data.publicUrl;
                          }
                        }
                        
                        console.log('✅ Arquivo enviado com sucesso:', fileUrl);
                        
                        const { error } = await (supabase.from('support_chat') as any)
                          .insert({
                            user_id: selectedUserId,
                            support_user_id: user.id,
                            message: `📎ARQUIVO:${fileUrl}|${file.name}`,
                            is_from_support: true,
                          });
                        
                        if (error) throw error;
                        
                        // Não precisa recarregar manualmente, o realtime vai atualizar automaticamente
                        toast.success('Arquivo enviado!');
                        setTimeout(() => {
                          loadMessages(selectedUserId, false);
                          loadConversations();
                        }, 500);
                        
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      } catch (error: any) {
                        console.error('❌ Erro ao enviar arquivo:', error);
                        toast.error(`Erro ao enviar arquivo: ${error?.message || 'Erro desconhecido'}`);
                      } finally {
                        setUploadingFile(false);
                      }
                    }
                  }}
                />
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-[#2a2a2a] bg-[#1a1a1a] h-full flex items-center justify-center">
            <CardContent>
              <p className="text-gray-400 text-center">Selecione uma conversa para começar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
