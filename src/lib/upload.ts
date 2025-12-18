import { supabase } from '@/integrations/supabase/client';
import { processAvatarImage, processPostImage, processCoverImage } from './imageProcessing';

export type UploadFolder = 'avatars' | 'posts' | 'modules' | 'lessons' | 'banners' | 'pdfs' | 'rewards' | 'courses';

/**
 * Upload de imagem para o Supabase Storage
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
  userId: string
): Promise<string> {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem');
    }

    // Validar tamanho apenas para avatares (posts não têm limite)
    if (folder === 'avatars') {
      const maxSize = 5 * 1024 * 1024; // 5MB para avatares
      if (file.size > maxSize) {
        throw new Error('Imagem muito grande. Tamanho máximo: 5MB');
      }
    }

    // Processar imagem antes do upload
    console.log('🖼️ Processando imagem:', { folder, fileName: file.name, fileSize: file.size, fileType: file.type });
    
    let processedFile: File;
    try {
      if (folder === 'avatars') {
        // Processar avatar: formato quadrado, 512x512, alta qualidade
        processedFile = await processAvatarImage(file);
      } else if (folder === 'modules' || folder === 'lessons' || folder === 'banners' || folder === 'courses') {
        // Processar capa: 16:9, max 1920x1080
        processedFile = await processCoverImage(file);
      } else {
        // Processar post: manter proporção, redimensionar se necessário
        processedFile = await processPostImage(file);
      }
      console.log('✅ Imagem processada:', { processedSize: processedFile.size });
    } catch (processError: any) {
      console.error('❌ Erro ao processar imagem:', processError);
      throw new Error(`Erro ao processar imagem: ${processError.message || 'Erro desconhecido'}`);
    }

    // Gerar nome único para o arquivo (sempre JPG após processamento)
    const fileName = `${userId}-${Date.now()}.jpg`;
    const filePath = `${folder}/${fileName}`;

    // Tentar fazer upload diretamente - se falhar, verificamos o erro
    // Isso evita problemas de permissão ao listar buckets
    console.log('📤 Tentando fazer upload diretamente no bucket "images"...', { folder, filePath, fileSize: processedFile.size });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      console.error('Detalhes completos do erro:', JSON.stringify(uploadError, null, 2));
      
      // Se falhar, tentar verificar o bucket para dar uma mensagem melhor
      if (uploadError.message?.includes('Bucket not found') || 
          uploadError.message?.includes('not found') ||
          uploadError.message?.includes('does not exist')) {
        
        // Tentar listar buckets para ver o que existe
        console.log('🔍 Tentando listar buckets para diagnóstico...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (!listError && buckets) {
          console.log('📋 Buckets disponíveis:', buckets.map(b => `"${b.name}" (público: ${b.public})`).join(', '));
          
          const imagesBucket = buckets.find(b => b.name === 'images');
          if (!imagesBucket) {
            throw new Error(`Bucket "images" não encontrado. Buckets disponíveis: ${buckets.map(b => b.name).join(', ')}. Crie o bucket "images" no Supabase: Storage → New bucket → Nome: images → Marque Public → Create`);
          } else if (!imagesBucket.public) {
            throw new Error('Bucket "images" existe mas não está público. Vá em Storage → images → Settings → Marque "Public bucket" → Salve');
          }
        }
        
        throw new Error('Bucket "images" não encontrado ou não configurado. Verifique no Supabase Dashboard: Storage → Certifique-se de que o bucket "images" existe e está público.');
      }
      
      // Verificar se é erro de permissão
      if (uploadError.message?.includes('permission') || 
          uploadError.message?.includes('policy') ||
          uploadError.message?.includes('denied') ||
          uploadError.message?.includes('Forbidden')) {
        throw new Error('Erro de permissão. Execute configurar-storage.sql no Supabase para configurar as políticas.');
      }
      
      // Verificar se é erro de arquivo duplicado
      if (uploadError.message?.includes('duplicate') || 
          uploadError.message?.includes('already exists')) {
        // Tentar novamente com timestamp diferente
        const newFileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const newFilePath = `${folder}/${newFileName}`;
        
        console.log('🔄 Tentando upload com novo nome:', newFilePath);
        
        const { error: retryError } = await supabase.storage
          .from('images')
          .upload(newFilePath, processedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });
        
        if (retryError) {
          throw new Error(`Erro ao fazer upload: ${retryError.message}`);
        }
        
        // Obter URL pública do novo arquivo
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(newFilePath);
        
        console.log('✅ Upload concluído com novo nome:', data.publicUrl);
        return data.publicUrl;
      }
      
      throw new Error(`Erro ao fazer upload: ${uploadError.message || 'Erro desconhecido'}`);
    }
    
    console.log('✅ Upload concluído:', uploadData);

    // Obter URL pública
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

/**
 * Upload de PDF para o Supabase Storage
 */
export async function uploadPDF(
  file: File,
  folder: 'pdfs',
  userId: string
): Promise<string> {
  try {
    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      throw new Error('Arquivo deve ser um PDF');
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('PDF muito grande. Tamanho máximo: 10MB');
    }

    // Gerar nome único para o arquivo
    const fileName = `${userId}-${Date.now()}.pdf`;
    const filePath = `${folder}/${fileName}`;

    // Tentar primeiro com bucket "documents" (recomendado)
    // Se não existir, tentar com "images"
    let bucketName = 'documents';
    let uploadError = null;
    let uploadResult = null;

    // Tentar upload no bucket "documents"
    uploadResult = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    uploadError = uploadResult.error;

    // Se o bucket "documents" não existir, tentar "images"
    if (uploadError && (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found'))) {
      bucketName = 'images';
      uploadResult = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });
      
      uploadError = uploadResult.error;
    }

    if (uploadError) {
      if (uploadError.message?.includes('mime type') || uploadError.message?.includes('not supported')) {
        throw new Error('O bucket não está configurado para aceitar PDFs. Execute o script configurar-storage-pdf.sql e configure o bucket no Supabase Dashboard.');
      }
      throw uploadError;
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Erro ao fazer upload do PDF:', error);
    throw error;
  }
}

/**
 * Deletar imagem do Supabase Storage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    if (!url) return;

    // Extrair o caminho do arquivo da URL
    // Formatos possíveis:
    // https://[project].supabase.co/storage/v1/object/public/images/posts/file.jpg
    // https://[project].supabase.co/storage/v1/object/sign/images/posts/file.jpg
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
          console.warn('Não foi possível extrair o caminho da URL:', url);
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
      console.error('Erro ao deletar imagem do storage:', error);
    } else {
      console.log('Imagem deletada com sucesso:', filePath);
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
  }
}

