import { useState } from 'react';
import { useBadges } from '@/hooks/useRanking';
import { useCreateBadge, useUpdateBadge, useDeleteBadge } from '@/hooks/useBadgesManagement';
import { Badge as BadgeType } from '@/hooks/useRanking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function BadgeForm({ 
  badge, 
  onSubmit, 
  onCancel 
}: { 
  badge?: BadgeType; 
  onSubmit: (data: Partial<BadgeType>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(badge?.name || '');
  const [description, setDescription] = useState(badge?.description || '');
  const [icon, setIcon] = useState(badge?.icon || '🏆');
  const [pointsRequired, setPointsRequired] = useState(badge?.points_required || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      name, 
      description: description || null, 
      icon,
      points_required: pointsRequired
    });
  };

  const commonIcons = ['🏆', '⭐', '🔥', '💪', '👑', '🌱', '🎯', '✨', '💎', '🚀', '🎖️', '🏅'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="name">Nome da Conquista *</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Iniciante, Ativo, Lenda..."
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descreva o que esta conquista representa..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="icon">Ícone/Emoji *</Label>
        <div className="space-y-2">
          <Input
            id="icon"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="🏆"
            required
            maxLength={2}
          />
          <div className="flex flex-wrap gap-2">
            {commonIcons.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={cn(
                  "text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110",
                  icon === emoji 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Digite um emoji ou clique em um dos ícones acima
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="points">Pontos Necessários *</Label>
        <Input
          id="points"
          type="number"
          value={pointsRequired}
          onChange={e => setPointsRequired(parseInt(e.target.value) || 0)}
          min={0}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Quantidade de pontos que o usuário precisa ter para conquistar este badge
        </p>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {badge ? 'Atualizar' : 'Criar'} Conquista
        </Button>
      </div>
    </form>
  );
}

export function BadgeManagement() {
  const { data: badges, isLoading } = useBadges();
  const createBadge = useCreateBadge();
  const updateBadge = useUpdateBadge();
  const deleteBadge = useDeleteBadge();

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);

  const handleCreateBadge = (data: Partial<BadgeType>) => {
    createBadge.mutate(data as any, {
      onSuccess: () => {
        setBadgeDialogOpen(false);
        setEditingBadge(null);
      }
    });
  };

  const handleUpdateBadge = (data: Partial<BadgeType>) => {
    if (!editingBadge) return;
    updateBadge.mutate({ id: editingBadge.id, ...data }, {
      onSuccess: () => {
        setBadgeDialogOpen(false);
        setEditingBadge(null);
      }
    });
  };

  const handleDeleteBadge = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conquista? Todos os usuários que a possuem perderão este badge.')) {
      deleteBadge.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gerenciar Conquistas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as conquistas que os usuários podem ganhar ao acumular pontos
          </p>
        </div>
        <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              onClick={() => setEditingBadge(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conquista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBadge ? 'Editar Conquista' : 'Nova Conquista'}</DialogTitle>
            </DialogHeader>
            <BadgeForm
              badge={editingBadge || undefined}
              onSubmit={editingBadge ? handleUpdateBadge : handleCreateBadge}
              onCancel={() => {
                setBadgeDialogOpen(false);
                setEditingBadge(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Badges List */}
      {!badges || badges.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma conquista criada ainda</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Crie sua primeira conquista para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => {
            return (
              <Card key={badge.id} className="bg-card border-border">
                <CardHeader className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-muted text-2xl">
                      {badge.icon || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-foreground truncate">
                        {badge.name}
                      </CardTitle>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {badge.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Pontos:</span>
                        <span className="text-sm font-semibold text-primary">
                          {badge.points_required}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingBadge(badge);
                          setBadgeDialogOpen(true);
                        }}
                        title="Editar conquista"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/80"
                        onClick={() => handleDeleteBadge(badge.id)}
                        title="Excluir conquista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50 border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">ℹ️ Como funciona</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Os usuários ganham pontos ao interagir na comunidade (publicações, curtidas, etc.)</li>
            <li>• Quando um usuário atinge a quantidade de pontos necessária, ele automaticamente ganha a conquista</li>
            <li>• As conquistas são ordenadas por pontos necessários (menor para maior)</li>
            <li>• Você pode editar ou excluir conquistas a qualquer momento</li>
            <li>• Ao excluir uma conquista, todos os usuários que a possuem perderão o badge</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

