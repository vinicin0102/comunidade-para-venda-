import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateReward, useUpdateReward, useDeleteReward } from '@/hooks/useRewardsManagement';
import { Reward } from '@/hooks/useRewards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Gift, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CoverUpload } from '@/components/courses/CoverUpload';

function RewardForm({ 
  reward, 
  onSubmit, 
  onCancel 
}: { 
  reward?: Reward; 
  onSubmit: (data: Partial<Reward>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(reward?.name || '');
  const [description, setDescription] = useState(reward?.description || '');
  const [imageUrl, setImageUrl] = useState(reward?.image_url || '');
  const [pointsRequired, setPointsRequired] = useState(reward?.points_required || 0);
  const [stock, setStock] = useState<number | null>(reward?.stock ?? null);
  const [isActive, setIsActive] = useState(reward?.is_active !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      name, 
      description: description || null, 
      image_url: imageUrl || null,
      points_required: pointsRequired,
      // stock: stock ?? null, // Temporariamente desabilitado até a migração ser executada
      is_active: isActive
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label>Imagem do Prêmio</Label>
        <CoverUpload
          currentUrl={imageUrl}
          onUpload={(url) => setImageUrl(url)}
          onRemove={() => setImageUrl('')}
          folder="rewards"
          aspectRatio="16:9"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Recomendado: 800x600px ou proporção 4:3
        </p>
      </div>
      <div>
        <Label htmlFor="name">Nome do Prêmio *</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Pix Misterioso, Viagem Tudo Pago, iPhone Novo..."
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descreva o prêmio e seus detalhes..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
            Quantidade de pontos que o usuário precisa ter para resgatar
          </p>
        </div>
        <div>
          <Label htmlFor="stock">Estoque (Opcional)</Label>
          <Input
            id="stock"
            type="number"
            value={stock ?? ''}
            onChange={e => setStock(e.target.value ? parseInt(e.target.value) : null)}
            min={0}
            placeholder="Ilimitado"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Deixe vazio para estoque ilimitado
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Label htmlFor="active" className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Prêmio Ativo
        </Label>
        <Switch
          id="active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
      {!isActive && (
        <p className="text-xs text-muted-foreground bg-yellow-500/10 p-2 rounded">
          Prêmios inativos não aparecem para os usuários
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {reward ? 'Atualizar' : 'Criar'} Prêmio
        </Button>
      </div>
    </form>
  );
}

export function RewardEditManagement() {
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Buscar todos os prêmios (incluindo inativos) para gerenciamento
  const { data: allRewards, isLoading } = useQuery({
    queryKey: ['all_rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) throw error;
      
      return data.map((reward: any) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        image_url: reward.image_url || null,
        points_required: reward.points_required || reward.points_cost || 0,
        points_cost: reward.points_required || reward.points_cost || 0,
        stock: reward.stock !== undefined ? reward.stock : null, // Seguro mesmo se coluna não existir
        is_active: reward.is_active !== false,
        created_at: reward.created_at,
      })) as Reward[];
    },
  });

  const handleCreateReward = (data: Partial<Reward>) => {
    // Remover points_cost e outros campos que não existem no banco
    const { points_cost, ...cleanData } = data as any;
    
    createReward.mutate(cleanData as any, {
      onSuccess: () => {
        setRewardDialogOpen(false);
        setEditingReward(null);
      }
    });
  };

  const handleUpdateReward = (data: Partial<Reward>) => {
    if (!editingReward) return;
    
    // Remover points_cost e outros campos que não existem no banco
    const { points_cost, ...cleanData } = data as any;
    
    updateReward.mutate({ id: editingReward.id, ...cleanData }, {
      onSuccess: () => {
        setRewardDialogOpen(false);
        setEditingReward(null);
      }
    });
  };

  const handleDeleteReward = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este prêmio? Esta ação não pode ser desfeita.')) {
      deleteReward.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full bg-muted" />
        ))}
      </div>
    );
  }

  const displayRewards = allRewards || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gerenciar Prêmios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os prêmios que os usuários podem resgatar com pontos
          </p>
        </div>
        <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              onClick={() => setEditingReward(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Prêmio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReward ? 'Editar Prêmio' : 'Novo Prêmio'}</DialogTitle>
            </DialogHeader>
            <RewardForm
              reward={editingReward || undefined}
              onSubmit={editingReward ? handleUpdateReward : handleCreateReward}
              onCancel={() => {
                setRewardDialogOpen(false);
                setEditingReward(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rewards List */}
      {!displayRewards || displayRewards.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum prêmio criado ainda</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Crie seu primeiro prêmio para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRewards.map(reward => {
            return (
              <Card 
                key={reward.id} 
                className={cn(
                  "bg-card border-border overflow-hidden",
                  !reward.is_active && "opacity-60 border-dashed"
                )}
              >
                <div className="relative">
                  {reward.image_url ? (
                    <img 
                      src={reward.image_url} 
                      alt={reward.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {!reward.is_active && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded">
                      Inativo
                    </div>
                  )}
                </div>
                <CardHeader className="p-4">
                  <div className="space-y-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {reward.name}
                    </CardTitle>
                    {reward.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Pontos:</span>
                          <span className="text-sm font-semibold text-primary">
                            {reward.points_required}
                          </span>
                        </div>
                        {reward.stock !== null && reward.stock !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Estoque:</span>
                            <span className="text-sm font-semibold">
                              {reward.stock}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingReward(reward);
                            setRewardDialogOpen(true);
                          }}
                          title="Editar prêmio"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => handleDeleteReward(reward.id)}
                          title="Excluir prêmio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
            <li>• Os usuários podem resgatar prêmios se tiverem pontos suficientes</li>
            <li>• Quando um usuário resgata, o pedido fica pendente para avaliação</li>
            <li>• Você pode aprovar, entregar ou cancelar resgates na aba "Resgates"</li>
            <li>• Prêmios inativos não aparecem para os usuários</li>
            <li>• Estoque ilimitado significa que não há limite de resgates</li>
            <li>• Ao excluir um prêmio, apenas resgates já entregues ou cancelados são removidos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

