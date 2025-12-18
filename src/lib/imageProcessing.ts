/**
 * Processamento de imagens para melhor qualidade e formato
 */

/**
 * Redimensiona e comprime uma imagem para avatar
 * Garante formato quadrado e qualidade otimizada
 */
export async function processAvatarImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Tamanho máximo para avatar (512x512)
        const maxSize = 512;
        const minSize = Math.min(img.width, img.height);
        const size = Math.min(maxSize, minSize);
        
        // Criar canvas quadrado
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        // Calcular posição para centralizar e cortar (crop central)
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;
        
        // Desenhar imagem no canvas (crop central e redimensionar)
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize, // Source (crop central)
          0, 0, size, size // Destination (redimensionar)
        );
        
        // Converter para blob com qualidade otimizada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao processar imagem'));
              return;
            }
            
            // Criar novo File com nome otimizado
            const processedFile = new File(
              [blob],
              `avatar-${Date.now()}.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            
            resolve(processedFile);
          },
          'image/jpeg', // Sempre salvar como JPEG para melhor compressão
          0.92 // Qualidade alta (0.92 = 92%)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Processa imagem para posts (mantém proporção, redimensiona se necessário)
 */
export async function processPostImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular novo tamanho mantendo proporção
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Criar canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao processar imagem'));
              return;
            }
            
            const processedFile = new File(
              [blob],
              `post-${Date.now()}.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            
            resolve(processedFile);
          },
          'image/jpeg',
          0.85 // Qualidade média-alta para posts
        );
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Processa imagem para capas de módulos e aulas (16:9, max 1920x1080)
 */
export async function processCoverImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        // Calcular novo tamanho mantendo proporção
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Criar canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade otimizada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao processar imagem'));
              return;
            }
            
            const processedFile = new File(
              [blob],
              `cover-${Date.now()}.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            
            resolve(processedFile);
          },
          'image/jpeg',
          0.88 // Qualidade alta para capas
        );
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

