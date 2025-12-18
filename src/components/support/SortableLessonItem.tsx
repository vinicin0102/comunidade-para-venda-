import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/hooks/useCourses';

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLessonItem({
  lesson,
  index,
  onEdit,
  onDelete,
}: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-background rounded cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Lesson Thumbnail */}
        <div className="w-14 h-9 rounded overflow-hidden shrink-0 bg-background relative">
          {lesson.cover_url ? (
            <img src={lesson.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs text-muted-foreground shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{lesson.title}</p>
          <p className="text-xs text-muted-foreground">
            {lesson.duration_minutes || 0} min
            {!lesson.is_published && ' • Rascunho'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive/80"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

