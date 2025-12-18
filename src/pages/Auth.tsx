import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Calendar, CreditCard, Phone } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
  });

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        // Telefone fixo: (00) 0000-0000
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        // Celular: (00) 00000-0000
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }
    return value;
  };

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          // Verificar se é usuário de suporte ou se está banido
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser) {
            // Sincronizar email no perfil se necessário
            await supabase
              .from('profiles')
              .update({ email: loggedUser.email })
              .eq('user_id', loggedUser.id)
              .is('email', null);
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, is_banned, banned_until')
              .eq('user_id', loggedUser.id)
              .single();

            // Verificar se está banido
            if (profile?.is_banned) {
              const bannedUntil = profile.banned_until ? new Date(profile.banned_until) : null;
              const now = new Date();
              
              // Se tem data de expiração e já passou, não está mais banido
              if (bannedUntil && bannedUntil < now) {
                // Atualizar status no banco (será feito automaticamente pelo trigger, mas garantimos aqui)
                await supabase
                  .from('profiles')
                  .update({ is_banned: false, banned_until: null })
                  .eq('user_id', loggedUser.id);
                
                // Continuar login normalmente
                if (profile?.role === 'support' || profile?.role === 'admin') {
                  toast.success('Bem-vindo ao painel de suporte!');
                  navigate('/support/dashboard');
                } else {
                  toast.success('Bem-vindo de volta!');
                  navigate('/');
                }
              } else {
                // Está banido - fazer logout e mostrar mensagem
                await supabase.auth.signOut();
                const daysLeft = bannedUntil 
                  ? Math.ceil((bannedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                toast.error(
                  bannedUntil 
                    ? `Sua conta foi banida. Você poderá acessar novamente em ${daysLeft} dia(s).`
                    : 'Sua conta foi banida permanentemente.'
                );
                return;
              }
            } else if (profile?.role === 'support' || profile?.role === 'admin') {
              toast.success('Bem-vindo ao painel de suporte!');
              navigate('/support/dashboard');
            } else {
              toast.success('Bem-vindo de volta!');
              navigate('/');
            }
          } else {
            navigate('/');
          }
        }
      } else {
        // Validações para cadastro
        if (!formData.username.trim()) {
          toast.error('Por favor, insira um nome de usuário');
          setLoading(false);
          return;
        }
        if (!formData.fullName.trim()) {
          toast.error('Por favor, insira seu nome completo');
          setLoading(false);
          return;
        }
        if (!formData.cpf.trim()) {
          toast.error('Por favor, insira seu CPF');
          setLoading(false);
          return;
        }
        if (!validateCPF(formData.cpf)) {
          toast.error('CPF inválido. Por favor, verifique o número');
          setLoading(false);
          return;
        }
        if (!formData.dataNascimento) {
          toast.error('Por favor, insira sua data de nascimento');
          setLoading(false);
          return;
        }
        if (!formData.telefone.trim()) {
          toast.error('Por favor, insira seu telefone');
          setLoading(false);
          return;
        }
        // Validar idade mínima (18 anos)
        const dataNasc = new Date(formData.dataNascimento);
        const hoje = new Date();
        const idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mes = hoje.getMonth() - dataNasc.getMonth();
        if (idade < 18 || (idade === 18 && mes < 0) || (idade === 18 && mes === 0 && hoje.getDate() < dataNasc.getDate())) {
          toast.error('Você deve ter pelo menos 18 anos para se cadastrar');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          fullName: formData.fullName,
          cpf: formData.cpf,
          dataNascimento: formData.dataNascimento,
          telefone: formData.telefone,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Conta criada com sucesso!');
          navigate('/');
        }
      }
    } catch (err) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Logo da comunidade - ícone de tribo/comunidade
  const CommunityLogo = () => (
    <div className="relative">
      <div className="bg-primary rounded-full p-3 shadow-glow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-8 w-8 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ícone de pessoas/comunidade */}
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="16" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M21 21v-2a4 4 0 0 0-4-4h-2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {/* Decoração - pequenos pontos representando energia/nutrição */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <CommunityLogo />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="text-white">Nutra</span>
            <span className="text-primary"> Elite</span>
          </h1>
        </div>

        <Card className="border border-[#2a2a2a] bg-[#1a1a1a] shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-display text-center text-white">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              {isLogin 
                ? 'Entre para acessar a comunidade'
                : 'Junte-se à tribo e alcance seus objetivos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Nome de usuário</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="seunome"
                        className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-white">CPF</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                        value={formData.cpf}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          setFormData({ ...formData, cpf: formatted });
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento" className="text-white">Data de nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="dataNascimento"
                        type="date"
                        className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-white">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefone"
                        type="text"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                        value={formData.telefone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setFormData({ ...formData, telefone: formatted });
                        }}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                {isLogin 
                  ? 'Não tem conta? Cadastre-se'
                  : 'Já tem conta? Entre'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
