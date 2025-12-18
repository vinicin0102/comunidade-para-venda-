import { useState } from 'react';
import { FileText, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CopyAIDialog } from '@/components/ai/CopyAIDialog';
import { CreativeAIDialog } from '@/components/ai/CreativeAIDialog';
import { toast } from 'sonner';

// Ícone de IA (Sparkles)
const AIIcon = ({ className }: { className?: string }) => (
  <Sparkles className={className} />
);

interface AIButtonProps {
  onCopyAI?: () => void;
  onCreativeAI?: () => void;
}

export function AIButton({ onCopyAI, onCreativeAI }: AIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopyAIOpen, setIsCopyAIOpen] = useState(false);
  const [isCreativeAIOpen, setIsCreativeAIOpen] = useState(false);

  const handleCopyAI = () => {
    setIsOpen(false);
    setIsCopyAIOpen(true);
    if (onCopyAI) {
      onCopyAI();
    }
  };

  const handleCreativeAI = () => {
    setIsOpen(false);
    setIsCreativeAIOpen(true);
    if (onCreativeAI) {
      onCreativeAI();
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="relative flex items-center justify-center">
                <AIIcon className="h-7 w-7 text-white fill-white" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48 mb-3">
            <DropdownMenuItem
              onClick={handleCopyAI}
              className="cursor-pointer focus:bg-primary/10"
            >
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>IA de Copy</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCreativeAI}
              className="cursor-pointer focus:bg-primary/10"
            >
              <Palette className="mr-2 h-4 w-4 text-primary" />
              <span>IA de Criativo</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CopyAIDialog open={isCopyAIOpen} onOpenChange={setIsCopyAIOpen} />
      <CreativeAIDialog open={isCreativeAIOpen} onOpenChange={setIsCreativeAIOpen} />
    </>
  );
}

