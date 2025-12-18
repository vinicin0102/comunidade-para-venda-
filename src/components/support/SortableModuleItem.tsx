import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Lock, Image as ImageIcon } from 'lucide-react';
import { Module } from '@/hooks/useCourses';
import { cn } from '@/lib/utils';

interface SortableModuleItemProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableModuleItem({
  module,
  isExpanded,
  onToggle,
  onAddLesson,
  onEdit,
  onDelete,
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn(
        "bg-card border-border overflow-hidden",
        module.is_locked && "border-destructive/30",
        isDragging && "shadow-lg"
      )}>
        <CardHeader className="p-3">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={onToggle}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {/* Module Thumbnail */}
            <div className={cn(
              "w-16 h-10 rounded overflow-hidden shrink-0 bg-muted",
              module.is_locked && "grayscale"
            )}>
              {module.cover_url ? (
                <img src={module.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-foreground truncate">
                  {module.title}
                </CardTitle>
                {module.is_locked && (
                  <span className="flex items-center gap-1 text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3" />
                    Bloqueado
                  </span>
                )}
                {!module.is_published && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">
                    Rascunho
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {module.lessons?.length || 0} aula(s) • Ordem: {module.order_index}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onAddLesson}
                title="Adicionar aula"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                title="Editar módulo"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive/80"
                onClick={onDelete}
                title="Excluir módulo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

