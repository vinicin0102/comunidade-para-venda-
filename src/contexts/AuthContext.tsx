import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  cpf: string;
  dataNascimento: string; // formato YYYY-MM-DD
  telefone: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Timeout de segurança: libera após 5 segundos
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout - liberando interface');
        setLoading(false);
      }
    }, 5000);

    try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
          if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
            clearTimeout(timeoutId);
          }
      }
    );

      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (mounted) {
            if (error) {
              console.error('Erro ao obter sessão:', error);
            }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
            clearTimeout(timeoutId);
          }
        })
        .catch((error) => {
          console.error('Erro ao obter sessão:', error);
          if (mounted) {
            setLoading(false);
            clearTimeout(timeoutId);
          }
    });

      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Erro ao inicializar auth:', error);
      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }
  }, []);

  const signUp = async (data: SignUpData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Limpar CPF (remover pontos, traços e espaços)
    const cpfLimpo = data.cpf.replace(/[.\-\s]/g, '');
    
    // Limpar telefone (remover parênteses, traços e espaços)
    const telefoneLimpo = data.telefone.replace(/[()\-\s]/g, '');
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: data.username,
          full_name: data.fullName,
          cpf: cpfLimpo,
          data_nascimento: data.dataNascimento,
          telefone: telefoneLimpo,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🔄 Fazendo logout...');
      
      // Limpar estado local PRIMEIRO (antes do signOut do Supabase)
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Depois fazer signOut do Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      
      console.log('✅ Logout concluído');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
