import { useState } from 'react';
import { Zap, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { useIsSupport } from '@/hooks/useSupport';
import { useNavigate } from 'react-router-dom';

interface CopyAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopyAIDialog({ open, onOpenChange }: CopyAIDialogProps) {
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [copied, setCopied] = useState(false);
  const hasDiamondAccess = useHasDiamondAccess();
  const isSupport = useIsSupport();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error('Por favor, informe o nome do produto');
      return;
    }

    // Verificar acesso Diamond (suporte sempre tem acesso)
    if (!isSupport && !hasDiamondAccess) {
      toast.error('🔒 IA de Copy - Recurso Premium', {
        description: 'Assine o plano Diamond para usar as IAs!',
        action: {
          label: 'Assinar Diamond',
          onClick: () => {
            onOpenChange(false);
            navigate('/upgrade');
          }
        },
        duration: 5000,
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCopy('');
    
    // Simular geração de copy (aqui você pode integrar com uma API de IA real)
    setTimeout(() => {
      const audienceText = targetAudience ? ` para ${targetAudience}` : '';
      
      const copy = `🔥 ATENÇÃO${audienceText}! 🔥

Você está cansado de tentar sem resultados? Chegou a hora de conhecer ${productName}!

✨ O QUE TORNA ${productName.toUpperCase()} ESPECIAL?

${productName} foi desenvolvido especialmente${audienceText} que buscam resultados reais e duradouros.

💪 BENEFÍCIOS COMPROVADOS:
• Resultados visíveis em poucos dias
• Fórmula exclusiva e natural
• Aprovado por milhares de clientes satisfeitos
• Garantia de satisfação ou seu dinheiro de volta

🎯 POR QUE ESCOLHER ${productName.toUpperCase()}?

Diferente de outros produtos no mercado, ${productName} oferece uma solução completa e eficaz. Nossa fórmula foi testada e aprovada, garantindo que você alcance seus objetivos.

⚡ OFERTA ESPECIAL - POR TEMPO LIMITADO!

Aproveite agora nosso desconto exclusivo e transforme sua vida!

👉 Não perca essa oportunidade única!

🛡️ GARANTIA TOTAL: Se não ficar satisfeito, devolvemos 100% do seu dinheiro!

#${productName.replace(/\s+/g, '')} #Transformação #Resultados`;

      setGeneratedCopy(copy);
      setIsGenerating(false);
      toast.success('Copy gerada com sucesso!');
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCopy);
      setCopied(true);
      toast.success('Copy copiada para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar copy');
    }
  };

  const handleReset = () => {
    setProductName('');
    setTargetAudience('');
    setGeneratedCopy('');
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-4 bg-[#1a1a1a] border-[#2a2a2a] text-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Tag IA de Copy no topo */}
          <div className="flex justify-center -mt-2">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D97706] to-[#92400E] shadow-lg">
              <Zap className="h-4 w-4 text-white fill-white" />
              <span className="text-white font-semibold text-sm">IA de Copy</span>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <DialogHeader className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Gerador de Copy Inteligente
            </h2>
            <p className="text-gray-400 text-base">
              Crie copies persuasivas para seus anúncios em segundos
            </p>
          </DialogHeader>

          {/* Card do Formulário */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-6">
            {/* Campo Nome do Produto */}
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-white">
                Nome do Produto *
              </Label>
              <Input
                id="product-name"
                placeholder="Ex: Cápsula Detox Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-primary"
              />
            </div>

            {/* Campo Público-alvo */}
            <div className="space-y-2">
              <Label htmlFor="target-audience" className="text-white">
                Público-alvo <span className="text-gray-400">(opcional)</span>
              </Label>
              <Input
                id="target-audience"
                placeholder="Ex: Mulheres 30-50 anos"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-primary"
              />
            </div>

            {/* Botão Gerar Copy Completa */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productName.trim()}
              className="w-full h-12 rounded-lg bg-gradient-to-r from-[#D97706] to-[#92400E] hover:from-[#D97706]/90 hover:to-[#92400E]/90 text-white font-semibold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-5 w-5 mr-2 fill-white" />
              {isGenerating ? 'Gerando Copy...' : 'Gerar Copy Completa'}
            </Button>
          </div>

          {/* Resultado da Copy Gerada */}
          {generatedCopy && (
            <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Copy Gerada</h3>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Copy
                    </>
                  )}
                </Button>
              </div>
              
              <Textarea
                value={generatedCopy}
                readOnly
                className="min-h-[400px] bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono text-sm resize-none"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                >
                  Gerar Nova Copy
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
