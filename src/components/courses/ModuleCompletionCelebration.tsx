import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ModuleCompletionCelebrationProps {
  moduleTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ModuleCompletionCelebration({ 
  moduleTitle, 
  isOpen, 
  onClose 
}: ModuleCompletionCelebrationProps) {
  useEffect(() => {
    if (isOpen) {
      // Disparar confete
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/20 via-background to-background border-primary/30">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {/* Ícone de troféu animado */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary to-orange-600 rounded-full p-6 animate-bounce">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Parabéns! 🎉
            </h2>
            <p className="text-lg text-muted-foreground">
              Você completou o módulo
            </p>
            <p className="text-xl font-semibold text-primary">
              {moduleTitle}
            </p>
          </div>

          {/* Mensagem motivacional */}
          <div className="bg-card/50 rounded-xl p-4 border border-primary/20 w-full">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>
                Continue assim! Você está no caminho certo para dominar todo o conteúdo.
              </span>
            </div>
          </div>

          {/* Botão */}
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-semibold"
            size="lg"
          >
            Continuar Aprendendo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

