import { supabase } from '@/integrations/supabase/client';

/**
 * Upload de áudio para o Supabase Storage
 */
export async function uploadAudio(
  audioBlob: Blob,
  userId: string
): Promise<string> {
  // Gerar nome único para o arquivo
  const fileName = `${userId}-${Date.now()}.webm`;
  const filePath = `audios/${fileName}`;

  // Fazer upload diretamente
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, audioBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'audio/webm',
    });

  if (uploadError) {
    console.error('Erro no upload de áudio:', uploadError);
    throw new Error(`Erro ao enviar áudio: ${uploadError.message}`);
  }

  // Obter URL pública
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Deletar áudio do Supabase Storage
 */
export async function deleteAudio(url: string): Promise<void> {
  try {
    if (!url) return;

    // Extrair o caminho do arquivo da URL
    let filePath = '';

    // Tentar extrair do formato public
    const publicMatch = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
    if (publicMatch) {
      filePath = publicMatch[1];
    } else {
      // Tentar extrair do formato sign
      const signMatch = url.match(/\/storage\/v1\/object\/sign\/images\/(.+?)(\?|$)/);
      if (signMatch) {
        filePath = signMatch[1];
      } else {
        // Tentar extrair diretamente após /images/
        const directMatch = url.match(/\/images\/(.+?)(\?|$)/);
        if (directMatch) {
          filePath = directMatch[1];
        } else {
          console.warn('Não foi possível extrair o caminho da URL do áudio:', url);
          return;
        }
      }
    }

    if (!filePath) {
      console.warn('Caminho do arquivo vazio para URL:', url);
      return;
    }

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar áudio do storage:', error);
    } else {
      console.log('Áudio deletado com sucesso:', filePath);
    }
  } catch (error) {
    console.error('Erro ao deletar áudio:', error);
  }
}

