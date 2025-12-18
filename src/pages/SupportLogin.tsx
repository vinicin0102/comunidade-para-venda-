import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Lock, Mail } from 'lucide-react';

export default function SupportLogin() {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Verificar role se já estiver logado
  useEffect(() => {
    if (user && !checkingRole) {
      setCheckingRole(true);
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar role:', error);
        toast.error('Erro ao verificar permissões. Tente novamente.');
        return;
      }

      if (profile?.role === 'support' || profile?.role === 'admin') {
        navigate('/support/dashboard');
      } else {
        toast.error('Acesso negado. Esta área é apenas para suporte.');
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro ao verificar role:', err);
      toast.error('Erro ao verificar permissões.');
    } finally {
      setCheckingRole(false);
    }
  };

  // Mostrar loading enquanto verifica
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-primary rounded-2xl p-4 mb-4 animate-pulse inline-block">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: signInError } = await signIn(formData.email, formData.password);
      if (signInError) {
        console.error('Erro no login:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (signInError.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login');
        } else {
          toast.error(`Erro: ${signInError.message}`);
        }
        setLoading(false);
        return;
      }

      // Aguardar um pouco para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar se o usuário é suporte
      const { data: { user: loggedUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error('Erro ao obter usuário:', getUserError);
        toast.error('Erro ao verificar autenticação');
        setLoading(false);
        return;
      }

      if (!loggedUser) {
        toast.error('Usuário não encontrado');
        setLoading(false);
        return;
      }

      // Aguardar um pouco para garantir que o perfil está disponível
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar role no perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('user_id', loggedUser.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        console.error('Detalhes do erro:', JSON.stringify(profileError, null, 2));
        toast.error(`Erro ao verificar permissões: ${profileError.message}`);
        setLoading(false);
        return;
      }

      console.log('Perfil encontrado:', profile);
      console.log('Role do usuário:', profile?.role);
      console.log('User ID:', loggedUser.id);

      if (!profile) {
        toast.error('Perfil não encontrado. Execute o script SQL para criar o perfil.');
        setLoading(false);
        return;
      }

      if (profile?.role === 'support' || profile?.role === 'admin') {
        toast.success('Bem-vindo ao painel de suporte!');
        navigate('/support/dashboard');
      } else {
        toast.error(`Acesso negado. Role atual: ${profile?.role || 'não definido'}. Esta área é apenas para suporte.`);
        console.error('Role incorreto. Role atual:', profile?.role);
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro geral:', err);
      toast.error(`Erro: ${err?.message || 'Ocorreu um erro. Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary rounded-2xl p-4 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white">Nutra</span>
            <span className="text-primary"> Elite</span>
          </h1>
          <p className="text-gray-400">
            Área de Suporte
          </p>
        </div>

        <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-display text-center text-white">
              Login de Suporte
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Acesso restrito para equipe de suporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="suporte@nutraelite.com"
                    className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                Voltar para o app
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

