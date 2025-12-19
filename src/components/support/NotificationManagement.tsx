import { useState, useEffect } from 'react';
import { Bell, Send, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ONESIGNAL_APP_ID = '3260a824-ee35-4a20-bb87-d14e7ba0cd1b';

interface MotivationalMessage {
    id: string;
    title: string;
    body: string;
}

// Default messages
const DEFAULT_MESSAGES: MotivationalMessage[] = [
    { id: '1', title: "Você está no caminho certo! 🚀", body: "Continue focado, cada passo conta!" },
    { id: '2', title: "Hora de brilhar! ✨", body: "Sua dedicação vai te levar longe!" },
    { id: '3', title: "Não desista! 💪", body: "Os melhores resultados vêm com persistência." },
    { id: '4', title: "Você é incrível! 🌟", body: "Acredite no seu potencial ilimitado!" },
    { id: '5', title: "Foco total! 🎯", body: "Mantenha os olhos no objetivo!" },
];

export function NotificationManagement() {
    const { toast } = useToast();
    const [messages, setMessages] = useState<MotivationalMessage[]>(DEFAULT_MESSAGES);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load messages from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('motivational_messages');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading messages:', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Save messages to localStorage
    const saveMessages = (newMessages: MotivationalMessage[]) => {
        setMessages(newMessages);
        localStorage.setItem('motivational_messages', JSON.stringify(newMessages));
    };

    const addMessage = () => {
        if (!newTitle.trim() || !newBody.trim()) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha o título e a mensagem",
                variant: "destructive"
            });
            return;
        }

        const newMessage: MotivationalMessage = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            body: newBody.trim()
        };

        saveMessages([...messages, newMessage]);
        setNewTitle('');
        setNewBody('');

        toast({
            title: "Mensagem adicionada!",
            description: "A nova mensagem motivacional foi salva."
        });
    };

    const removeMessage = (id: string) => {
        if (messages.length <= 1) {
            toast({
                title: "Não é possível remover",
                description: "Você precisa ter pelo menos uma mensagem.",
                variant: "destructive"
            });
            return;
        }
        saveMessages(messages.filter(m => m.id !== id));
        toast({
            title: "Mensagem removida",
            description: "A mensagem foi excluída."
        });
    };

    const sendPushNotification = async () => {
        if (!pushTitle.trim() || !pushBody.trim()) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha o título e a mensagem para enviar",
                variant: "destructive"
            });
            return;
        }

        setIsSending(true);

        try {
            // Note: OneSignal requires a REST API key for server-side sending
            // For now, we'll show a message about using the OneSignal dashboard
            // In production, this would call a backend endpoint

            toast({
                title: "Notificação configurada!",
                description: "Para enviar notificações push, acesse o painel do OneSignal e use os dados abaixo.",
            });

            // Log the notification data for manual sending
            console.log('Push Notification Data:', {
                app_id: ONESIGNAL_APP_ID,
                headings: { en: pushTitle },
                contents: { en: pushBody },
                included_segments: ['All']
            });

        } catch (error) {
            console.error('Error sending notification:', error);
            toast({
                title: "Erro ao enviar",
                description: "Não foi possível enviar a notificação. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    const sendRandomPush = async () => {
        if (messages.length === 0) return;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setPushTitle(randomMessage.title);
        setPushBody(randomMessage.body);

        toast({
            title: "Mensagem selecionada!",
            description: "Uma mensagem aleatória foi carregada. Clique em 'Enviar' para disparar."
        });
    };

    if (isLoading) {
        return (
            <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
                <CardContent className="pt-6 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Send Push Notification */}
            <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Enviar Notificação Push
                    </CardTitle>
                    <CardDescription>
                        Envie uma notificação para todos os usuários que ativaram as notificações
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="push-title" className="text-white">Título</Label>
                        <Input
                            id="push-title"
                            value={pushTitle}
                            onChange={(e) => setPushTitle(e.target.value)}
                            placeholder="Ex: Novidade na comunidade! 🎉"
                            className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                            maxLength={100}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="push-body" className="text-white">Mensagem</Label>
                        <Textarea
                            id="push-body"
                            value={pushBody}
                            onChange={(e) => setPushBody(e.target.value)}
                            placeholder="Ex: Confira as novas aulas disponíveis!"
                            className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[80px]"
                            maxLength={200}
                        />
                        <p className="text-xs text-gray-500">{pushBody.length}/200 caracteres</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={sendRandomPush}
                            variant="outline"
                            className="flex-1 border-primary text-primary hover:bg-primary/10"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Mensagem Aleatória
                        </Button>
                        <Button
                            onClick={sendPushNotification}
                            disabled={isSending || !pushTitle.trim() || !pushBody.trim()}
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Enviar
                        </Button>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-400">
                            💡 <strong>Dica:</strong> Para enviar notificações em massa, acesse o painel do OneSignal em{' '}
                            <a
                                href="https://dashboard.onesignal.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-300"
                            >
                                dashboard.onesignal.com
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Manage Motivational Messages */}
            <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Mensagens Motivacionais
                    </CardTitle>
                    <CardDescription>
                        Gerencie as mensagens que aparecem quando os usuários clicam em "Receber Motivação"
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Add new message */}
                    <div className="p-4 bg-[#2a2a2a] rounded-lg space-y-3">
                        <h4 className="text-white font-medium text-sm">Adicionar Nova Mensagem</h4>
                        <div className="space-y-2">
                            <Input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Título (ex: Você consegue! 🏆)"
                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                maxLength={50}
                            />
                            <Input
                                value={newBody}
                                onChange={(e) => setNewBody(e.target.value)}
                                placeholder="Mensagem (ex: Campeões nunca desistem!)"
                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                maxLength={100}
                            />
                            <Button
                                onClick={addMessage}
                                disabled={!newTitle.trim() || !newBody.trim()}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Mensagem
                            </Button>
                        </div>
                    </div>

                    {/* List of messages */}
                    <div className="space-y-2">
                        <h4 className="text-white font-medium text-sm">
                            Mensagens Cadastradas ({messages.length})
                        </h4>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="flex items-start justify-between p-3 bg-[#2a2a2a] rounded-lg group hover:bg-[#333]"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate">{msg.title}</p>
                                        <p className="text-gray-400 text-xs truncate">{msg.body}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMessage(msg.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
