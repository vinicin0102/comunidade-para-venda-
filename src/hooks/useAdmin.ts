import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

const ADMIN_EMAIL = 'admin@gmail.com';

export function useIsAdmin() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  
  // Se for admin@gmail.com, sempre retorna true
  if (user?.email === ADMIN_EMAIL) {
    return true;
  }
  
  // Se o perfil ainda está carregando, retorna false temporariamente
  if (isLoading || !profile) {
    return false;
  }
  
  // Verificar se o perfil tem role admin
  const profileData = profile as { role?: string } | undefined;
  return profileData?.role === 'admin';
}

