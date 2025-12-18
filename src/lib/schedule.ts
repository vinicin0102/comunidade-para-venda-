/**
 * Utilitários para verificação de horário de funcionamento
 * Feed e Chat funcionam das 9h às 21h (horário de Brasília)
 */

/**
 * Verifica se está dentro do horário de funcionamento (9h - 21h, horário de Brasília)
 * @returns true se está dentro do horário permitido, false caso contrário
 */
export function isWithinOperatingHours(): boolean {
  // Criar data no fuso horário de Brasília
  const brasiliaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const currentHour = brasiliaTime.getHours();
  
  // Horário de funcionamento: 9h às 21h (9 AM a 9 PM)
  return currentHour >= 9 && currentHour < 21;
}

/**
 * Obtém o horário atual em Brasília formatado
 * @returns String com o horário formatado (ex: "14:30")
 */
export function getBrasiliaTime(): string {
  const brasiliaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hours = brasiliaTime.getHours().toString().padStart(2, '0');
  const minutes = brasiliaTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Obtém mensagem de erro para quando está fora do horário de funcionamento
 * @returns String com a mensagem de erro
 */
export function getOperatingHoursMessage(): string {
  const currentTime = getBrasiliaTime();
  return `O feed e o chat estão disponíveis apenas das 9h às 21h (horário de Brasília). Horário atual: ${currentTime}. Tente novamente durante o horário de funcionamento.`;
}

/**
 * Obtém as horas de funcionamento formatadas
 * @returns String com as horas de funcionamento
 */
export function getOperatingHours(): string {
  return '9h às 21h (horário de Brasília)';
}

