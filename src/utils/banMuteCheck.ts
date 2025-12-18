import { Profile } from '@/hooks/useProfile';

/**
 * Verifica se o usuário está banido
 */
export function isUserBanned(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  
  // Se não está banido, retorna false
  if (!profile.is_banned) return false;
  
  // Se está banido mas não tem data de expiração, está banido permanentemente
  if (!profile.banned_until) return true;
  
  // Verifica se o ban ainda não expirou
  const bannedUntil = new Date(profile.banned_until);
  const now = new Date();
  
  // Se a data de expiração já passou, não está mais banido
  if (bannedUntil < now) return false;
  
  // Caso contrário, está banido
  return true;
}

/**
 * Verifica se o usuário está mutado
 */
export function isUserMuted(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  
  // Se não está mutado, retorna false
  if (!profile.is_muted) return false;
  
  // Se está mutado mas não tem data de expiração, está mutado permanentemente
  if (!profile.mute_until) return true;
  
  // Verifica se o mute ainda não expirou
  const muteUntil = new Date(profile.mute_until);
  const now = new Date();
  
  // Se a data de expiração já passou, não está mais mutado
  if (muteUntil < now) return false;
  
  // Caso contrário, está mutado
  return true;
}

/**
 * Retorna a mensagem de ban
 */
export function getBanMessage(profile: Profile | null | undefined): string | null {
  if (!isUserBanned(profile)) return null;
  
  if (!profile?.banned_until) {
    return 'Sua conta foi banida permanentemente.';
  }
  
  const bannedUntil = new Date(profile.banned_until);
  const now = new Date();
  const daysLeft = Math.ceil((bannedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return `Sua conta foi banida. Você poderá acessar novamente em ${daysLeft} dia(s) (${bannedUntil.toLocaleDateString('pt-BR')}).`;
}

/**
 * Retorna a mensagem de mute
 */
export function getMuteMessage(profile: Profile | null | undefined): string | null {
  if (!isUserMuted(profile)) return null;
  
  if (!profile?.mute_until) {
    return 'Você está mutado permanentemente. Você não pode postar, comentar ou enviar mensagens no chat.';
  }
  
  const muteUntil = new Date(profile.mute_until);
  const now = new Date();
  const daysLeft = Math.ceil((muteUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return `Você está mutado por mais ${daysLeft} dia(s) (até ${muteUntil.toLocaleDateString('pt-BR')}). Você não pode postar, comentar ou enviar mensagens no chat.`;
}

