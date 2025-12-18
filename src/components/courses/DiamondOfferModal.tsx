import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Gem, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DiamondOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const basicFeatures = [
  { text: 'Acesso ao Feed', included: true },
  { text: 'Suporte via chat', included: true },
  { text: 'Resgatar Prêmios', included: true },
  { text: 'Módulos bloqueados', included: false },
  { text: 'Chat da Comunidade', included: false },
  { text: 'IAs de Copy e Criativo', included: false },
  { text: 'Converter saques em pontos', included: false },
];

const diamondFeatures = [
  { text: 'Tudo do plano básico', included: true },
  { text: 'Mentoria Avançada', included: true, highlight: true },
  { text: 'Todos os módulos desbloqueados', included: true },
  { text: 'Chat da Comunidade', included: true },
  { text: 'IAs de Copy e Criativo', included: true },
  { text: 'Converter saques em pontos', included: true },
];

export function DiamondOfferModal({ open, onOpenChange }: DiamondOfferModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/upgrade');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-white">
            🔥 Oferta Especial para Você!
          </DialogTitle>
        </DialogHeader>

        {/* Oferta Principal */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-xl p-6 text-center mb-6">
          <p className="text-cyan-400 text-sm font-medium mb-2">MENTORIA AVANÇADA</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-gray-400 line-through text-2xl">R$997</span>
            <span className="text-4xl font-bold text-white">R$497</span>
          </div>
          <p className="text-green-400 text-sm mt-2">
            ✨ Economize R$500!
          </p>
        </div>

        {/* Comparação de Planos */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Plano Básico */}
          <div className="bg-[#2a2a2a] rounded-xl p-4">
            <div className="text-center mb-4">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Plano Atual</span>
              <h3 className="text-lg font-bold text-white mt-1">🔓 Básico</h3>
              <p className="text-gray-400 text-sm">Grátis</p>
            </div>
            <ul className="space-y-2">
              {basicFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plano Diamond */}
          <div className="bg-gradient-to-b from-cyan-500/20 to-blue-500/10 border-2 border-cyan-500/50 rounded-xl p-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMENDADO
              </span>
            </div>
            <div className="text-center mb-4 mt-2">
              <span className="text-cyan-400 text-xs uppercase tracking-wider">Upgrade</span>
              <h3 className="text-lg font-bold text-white mt-1 flex items-center justify-center gap-2">
                <Gem className="h-5 w-5 text-cyan-400" />
                Diamond
              </h3>
              <p className="text-cyan-400 text-sm font-semibold">R$497</p>
            </div>
            <ul className="space-y-2">
              {diamondFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className={`h-4 w-4 flex-shrink-0 ${feature.highlight ? 'text-cyan-400' : 'text-green-500'}`} />
                  <span className={feature.highlight ? 'text-cyan-400 font-semibold' : 'text-gray-300'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-6 text-lg"
          >
            <Gem className="mr-2 h-5 w-5" />
            Quero ser Diamond por R$497
          </Button>
          <p className="text-center text-gray-400 text-xs">
            Pagamento único • Acesso vitalício
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
