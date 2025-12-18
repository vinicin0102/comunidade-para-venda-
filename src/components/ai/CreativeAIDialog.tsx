import { useState } from 'react';
import { Zap, Copy, Check, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHasDiamondAccess } from '@/hooks/useSubscription';
import { useIsSupport } from '@/hooks/useSupport';
import { useNavigate } from 'react-router-dom';

interface CreativeAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Platform = 'instagram' | 'facebook' | 'tiktok';
type ContentType = 'promocional' | 'educativo' | 'depoimento' | 'comparativo' | 'lançamento';
type Tone = 'energético' | 'profissional' | 'casual' | 'motivacional' | 'empático';
type Duration = 'curto' | 'medio' | 'longo';

interface Answers {
  productName: string;
  platform: Platform;
  contentType: ContentType;
  targetAudience: string;
  mainObjective: string;
  tone: Tone;
  duration: Duration;
  mainBenefits: string;
  callToAction: string;
}

const QUESTIONS = [
  {
    id: 'productName',
    question: 'Qual é o nome do produto ou serviço?',
    placeholder: 'Ex: Cápsula Detox Pro',
    type: 'text' as const,
  },
  {
    id: 'platform',
    question: 'Para qual plataforma você vai criar o conteúdo?',
    type: 'select' as const,
    options: [
      { value: 'instagram', label: 'Instagram' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'tiktok', label: 'TikTok' },
    ],
  },
  {
    id: 'contentType',
    question: 'Qual tipo de conteúdo você quer criar?',
    type: 'select' as const,
    options: [
      { value: 'promocional', label: 'Promocional (vender produto)' },
      { value: 'educativo', label: 'Educativo (ensinar algo)' },
      { value: 'depoimento', label: 'Depoimento (testemunho real)' },
      { value: 'comparativo', label: 'Comparativo (antes vs depois)' },
      { value: 'lançamento', label: 'Lançamento (novo produto)' },
    ],
  },
  {
    id: 'targetAudience',
    question: 'Quem é o seu público-alvo?',
    placeholder: 'Ex: Mulheres de 25-40 anos interessadas em saúde',
    type: 'text' as const,
  },
  {
    id: 'mainObjective',
    question: 'Qual é o objetivo principal do vídeo?',
    placeholder: 'Ex: Gerar vendas, aumentar engajamento, educar sobre o produto',
    type: 'textarea' as const,
  },
  {
    id: 'tone',
    question: 'Qual tom de voz você quer usar?',
    type: 'select' as const,
    options: [
      { value: 'energético', label: 'Energético (animado, empolgado)' },
      { value: 'profissional', label: 'Profissional (sério, confiável)' },
      { value: 'casual', label: 'Casual (descontraído, amigável)' },
      { value: 'motivacional', label: 'Motivacional (inspirador, transformador)' },
      { value: 'empático', label: 'Empático (compreensivo, acolhedor)' },
    ],
  },
  {
    id: 'duration',
    question: 'Qual a duração desejada do vídeo?',
    type: 'select' as const,
    options: [
      { value: 'curto', label: 'Curto (15-30 segundos)' },
      { value: 'medio', label: 'Médio (30-60 segundos)' },
      { value: 'longo', label: 'Longo (60-90 segundos)' },
    ],
  },
  {
    id: 'mainBenefits',
    question: 'Quais são os principais benefícios do produto?',
    placeholder: 'Ex: Resultados rápidos, fórmula natural, garantia de satisfação',
    type: 'textarea' as const,
  },
  {
    id: 'callToAction',
    question: 'Qual é a chamada para ação (CTA) desejada?',
    placeholder: 'Ex: Link na bio, Compre agora, Saiba mais',
    type: 'text' as const,
  },
];

export function CreativeAIDialog({ open, onOpenChange }: CreativeAIDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [copied, setCopied] = useState(false);
  const hasDiamondAccess = useHasDiamondAccess();
  const isSupport = useIsSupport();
  const navigate = useNavigate();

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof Answers];
    
    if (!currentAnswer || (typeof currentAnswer === 'string' && !currentAnswer.trim())) {
      toast.error('Por favor, responda a pergunta antes de continuar');
      return;
    }

    if (isLastStep) {
      handleGenerate();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    // Verificar acesso Diamond (suporte sempre tem acesso)
    if (!isSupport && !hasDiamondAccess) {
      toast.error('🔒 IA de Criativo - Recurso Premium', {
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
    setGeneratedScript('');
    
    // Simular geração de script baseado nas respostas
    setTimeout(() => {
      const script = generateScriptFromAnswers(answers as Answers);
      setGeneratedScript(script);
      setIsGenerating(false);
      toast.success('Script gerado com sucesso!');
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success('Script copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar script');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setGeneratedScript('');
    setCopied(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      handleReset();
    }
    onOpenChange(open);
  };

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id as keyof Answers] || '';

    if (currentQuestion.type === 'text') {
      return (
        <Input
          value={currentAnswer as string}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder={currentQuestion.placeholder}
          className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-primary h-12 text-base"
          autoFocus
        />
      );
    }

    if (currentQuestion.type === 'textarea') {
      return (
        <Textarea
          value={currentAnswer as string}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder={currentQuestion.placeholder}
          className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-primary min-h-[120px] text-base resize-none"
          autoFocus
        />
      );
    }

    if (currentQuestion.type === 'select') {
      return (
        <div className="space-y-2">
          {currentQuestion.options?.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              onClick={() => handleAnswerChange(option.value)}
              className={cn(
                'w-full justify-start h-auto py-4 px-4 rounded-lg text-left',
                currentAnswer === option.value
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-[#1a1a1a] text-white border border-[#3a3a3a] hover:bg-[#2a2a2a]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {currentAnswer === option.value && (
                  <Check className="h-5 w-5" />
                )}
              </div>
            </Button>
          ))}
        </div>
      );
    }

    return null;
  };

  // Se já gerou o script, mostrar resultado
  if (generatedScript) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl w-full mx-4 bg-[#1a1a1a] border-[#2a2a2a] text-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Tag IA de Criativo no topo */}
            <div className="flex justify-center -mt-2">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFD23F] shadow-lg">
                <Zap className="h-4 w-4 text-white fill-white" />
                <span className="text-white font-semibold text-sm">IA de Criativo</span>
              </div>
            </div>

            <DialogHeader className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">
                Script Gerado com Sucesso! 🎉
              </h2>
              <p className="text-gray-400 text-base">
                Seu roteiro completo está pronto
              </p>
            </DialogHeader>

            <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Script para {answers.platform === 'instagram' ? 'Instagram' : answers.platform === 'facebook' ? 'Facebook' : 'TikTok'}
                </h3>
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
                      Copiar Script
                    </>
                  )}
                </Button>
              </div>
              
              <Textarea
                value={generatedScript}
                readOnly
                className="min-h-[500px] bg-[#1a1a1a] border-[#3a3a3a] text-white font-mono text-sm resize-none"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                >
                  Gerar Novo Script
                </Button>
                <Button
                  onClick={() => handleClose(false)}
                  className="flex-1 bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFD23F] hover:from-[#FF6B35]/90 hover:via-[#FF8C42]/90 hover:to-[#FFD23F]/90"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full mx-4 bg-[#1a1a1a] border-[#2a2a2a] text-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Tag IA de Criativo no topo */}
          <div className="flex justify-center -mt-2">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFD23F] shadow-lg">
              <Zap className="h-4 w-4 text-white fill-white" />
              <span className="text-white font-semibold text-sm">IA de Criativo</span>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <DialogHeader className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Vamos criar seu script! 🎬
            </h2>
            <p className="text-gray-400 text-base">
              Responda algumas perguntas e eu vou gerar o roteiro perfeito para você
            </p>
          </DialogHeader>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Pergunta {currentStep + 1} de {QUESTIONS.length}
              </span>
              <span className="text-primary font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFD23F] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Card da Pergunta */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-white text-lg font-semibold">
                {currentQuestion.question}
              </Label>
              {renderQuestionInput()}
            </div>

            {/* Botões de Navegação */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isGenerating || !answers[currentQuestion.id as keyof Answers]}
                className={cn(
                  'flex-1 h-12 rounded-lg bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFD23F] hover:from-[#FF6B35]/90 hover:via-[#FF8C42]/90 hover:to-[#FFD23F]/90 text-white font-semibold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                  isFirstStep && 'flex-1'
                )}
              >
                {isGenerating ? (
                  <>
                    <Zap className="h-5 w-5 mr-2 fill-white animate-pulse" />
                    Gerando...
                  </>
                ) : isLastStep ? (
                  <>
                    <Zap className="h-5 w-5 mr-2 fill-white" />
                    Gerar Script
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Função para gerar script baseado nas respostas
function generateScriptFromAnswers(answers: Answers): string {
  const {
    productName,
    platform,
    contentType,
    targetAudience,
    mainObjective,
    tone,
    duration,
    mainBenefits,
    callToAction,
  } = answers;

  const durationMap = {
    curto: '15-30 segundos',
    medio: '30-60 segundos',
    longo: '60-90 segundos',
  };

  const toneMap = {
    energético: 'energético e empolgado',
    profissional: 'profissional e confiável',
    casual: 'casual e descontraído',
    motivacional: 'motivacional e inspirador',
    empático: 'empático e acolhedor',
  };

  let script = `🎬 ROTEIRO DE VÍDEO PARA ${platform.toUpperCase()} - ${productName.toUpperCase()}
Duração: ${durationMap[duration]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMAÇÕES DO BRIEFING:
• Produto: ${productName}
• Tipo de Conteúdo: ${contentType}
• Público-Alvo: ${targetAudience}
• Objetivo: ${mainObjective}
• Tom: ${toneMap[tone]}
• Benefícios: ${mainBenefits}
• CTA: ${callToAction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (platform === 'instagram') {
    script += generateInstagramScript(answers, durationMap[duration]);
  } else if (platform === 'facebook') {
    script += generateFacebookScript(answers, durationMap[duration]);
  } else {
    script += generateTikTokScript(answers, durationMap[duration]);
  }

  return script;
}

function generateInstagramScript(answers: Answers, duration: string): string {
  const { productName, contentType, tone, mainBenefits, callToAction } = answers;
  
  let hook = '';
  if (tone === 'energético') {
    hook = `"Você está DESPERDIÇANDO seu dinheiro com produtos que não funcionam?"`;
  } else if (tone === 'empático') {
    hook = `"Eu sei como é frustrante tentar algo e não ver resultado..."`;
  } else {
    hook = `"Você precisa conhecer ${productName}!"`;
  }

  return `📱 CENA 1 - GANCHO (0-3s)
[CLOSE no rosto, olhar direto para câmera]
${hook}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CENA 2 - PROBLEMA/SITUAÇÃO (3-10s)
[Mostra contexto relacionado ao produto]
"Eu também já passei por isso... Mas tudo mudou quando descobri ${productName}!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ CENA 3 - APRESENTAÇÃO (10-25s)
[Mostra o produto com entusiasmo]
"${productName} é diferente porque:

${mainBenefits.split(',').map(b => `✅ ${b.trim()}`).join('\n')}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💪 CENA 4 - PROVA SOCIAL/BENEFÍCIOS (25-45s)
[Mostra o produto em uso ou resultados]
"Milhares de pessoas já transformaram suas vidas com ${productName}!"

[Mostra resultados, before/after ou depoimentos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 CENA 5 - CALL TO ACTION (45-60s)
[Olha para câmera, energia alta]
"E o melhor? Tem uma OFERTA ESPECIAL hoje!"

[Texto na tela: "${callToAction.toUpperCase()}"]
"${callToAction} AGORA e garante o seu!"

[Mostra satisfação/felicidade]
"Você merece os melhores resultados! 💪"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 DICAS DE GRAVAÇÃO:
• Use luz natural ou ring light
• Grave na vertical (9:16)
• Seja autêntico e ${tone}
• Mostre o produto claramente
• Use música trending do Instagram

🎵 SUGESTÃO DE MÚSICA:
Sons trending de motivação/transformação

#${productName.replace(/\s+/g, '')} #Transformação #Resultados`;
}

function generateFacebookScript(answers: Answers, duration: string): string {
  const { productName, contentType, mainBenefits, callToAction } = answers;
  
  return `📱 ABERTURA (0-5s)
[Texto na tela: "ATENÇÃO!"]
[Pessoa aparece animada]
"Você precisa ver isso antes que acabe!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ PROBLEMA (5-20s)
[Tom mais sério, conectando com a dor]
"Quantas vezes você já tentou resolver isso e não conseguiu?"

[Mostra situações do dia a dia]
"Eu sei como é frustrante gastar dinheiro e não ver resultado..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 APRESENTAÇÃO (20-40s)
[Mostra o produto com destaque]
"Foi por isso que eu comecei a usar ${productName}!"

[Depoimento pessoal]
"E olha, eu estava MUITO cético no começo..."

[Mostra resultados]
"Mas em poucas semanas, tudo mudou!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ BENEFÍCIOS (40-60s)
[Lista os benefícios com entusiasmo]
"${productName} funciona porque:

${mainBenefits.split(',').map(b => `✅ ${b.trim()}`).join('\n')}"

[Mostra prova social - fotos de clientes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎁 OFERTA (60-75s)
[Cria urgência]
"E hoje tem uma OFERTA ESPECIAL!"

[Texto na tela: "DESCONTO EXCLUSIVO"]
"Mas é só por tempo limitado..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 CALL TO ACTION (75-90s)
[Olha direto para câmera]
"${callToAction} aqui embaixo"

[Aponta para baixo]
"Garante o seu ${productName} com desconto!"

[Sorri e acena]
"Você não vai se arrepender! 😊"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 DICAS PARA FACEBOOK:
• Grave em HD (mínimo 720p)
• Use legendas (muitos assistem sem som)
• Primeiros 3 segundos são CRUCIAIS
• Formato quadrado (1:1) ou vertical (4:5)
• Adicione CTA no primeiro comentário

#${productName.replace(/\s+/g, '')} #FacebookAds #Transformação`;
}

function generateTikTokScript(answers: Answers, duration: string): string {
  const { productName, tone, mainBenefits, callToAction } = answers;
  
  let hook = '';
  if (tone === 'energético') {
    hook = `"PARA DE ROLAR! 🛑"`;
  } else {
    hook = `"Você está fazendo TUDO ERRADO! ❌"`;
  }
  
  return `⚡ HOOK - PRIMEIRO SEGUNDO (0-1s)
[JUMP CUT agressivo, olhar direto]
${hook}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PROBLEMA RÁPIDO (1-5s)
[Transição rápida, energia alta]
"Se você ainda não conhece ${productName}..."

[Texto na tela: "VOCÊ ESTÁ PERDENDO"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💥 TRANSFORMAÇÃO (5-15s)
[Mostra o produto de forma criativa]
"Olha só o que acontece quando você usa!"

[Before/After rápido com transição]
[Texto: "ANTES ➡️ DEPOIS"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ PROVA SOCIAL (15-25s)
[Mostra depoimentos ou resultados]
"Mais de milhares de pessoas já transformaram suas vidas!"

[Texto na tela: "RESULTADOS REAIS"]

${mainBenefits.split(',').slice(0, 3).map(b => `✅ ${b.trim()}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 CTA FINAL (25-30s)
[Olha para câmera, aponta]
"${callToAction}! CORRE! ⚡"

[Texto grande na tela: "${callToAction.toUpperCase()}"]
[Emoji de fogo e seta para baixo]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 FORMATO TIKTOK:
• Vertical 9:16 (OBRIGATÓRIO)
• Cortes rápidos a cada 2-3 segundos
• Texto grande e legível
• Transições dinâmicas
• Música trending (ESSENCIAL)

🎵 MÚSICA:
Use sons trending do momento
Busque: "trending sounds" no TikTok

⚡ EFEITOS:
• Zoom in/out rápido
• Green screen
• Transições de corte
• Text to speech (opcional)

📱 HASHTAGS:
#${productName.replace(/\s+/g, '')} #FYP #Viral #Transformação #Resultado #TikTokBrasil

💡 DICA PRO:
Poste entre 18h-22h para maior alcance!`;
}
