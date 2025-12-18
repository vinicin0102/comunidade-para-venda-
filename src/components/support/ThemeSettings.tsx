import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Type, Save } from 'lucide-react';
import { useAppTheme, useUpdateAppTheme } from '@/hooks/useAppTheme';

export function ThemeSettings() {
  const { data: theme, isLoading } = useAppTheme();
  const updateTheme = useUpdateAppTheme();
  
  const [primaryHue, setPrimaryHue] = useState(25);
  const [primarySaturation, setPrimarySaturation] = useState(95);
  const [primaryLightness, setPrimaryLightness] = useState(53);
  const [appName, setAppName] = useState('Sociedade Nutra');
  const [communityName, setCommunityName] = useState('Comunidade dos Sócios');
  
  // Atualizar estados quando o tema carregar
  useEffect(() => {
    if (theme) {
      setPrimaryHue(theme.primaryHue);
      setPrimarySaturation(theme.primarySaturation);
      setPrimaryLightness(theme.primaryLightness);
      setAppName(theme.appName);
      setCommunityName(theme.communityName);
    }
  }, [theme]);
  
  const handleSave = () => {
    updateTheme.mutate({
      primaryHue,
      primarySaturation,
      primaryLightness,
      appName: appName.trim() || 'Sociedade Nutra',
      communityName: communityName.trim() || 'Comunidade dos Sócios'
    });
  };
  
  // Calcular cor de preview
  const previewColor = `hsl(${primaryHue} ${primarySaturation}% ${primaryLightness}%)`;
  
  if (isLoading) {
    return (
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-gray-400">Carregando configurações de tema...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paleta de Cores
          </CardTitle>
          <CardDescription>
            Personalize as cores principais do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview da cor */}
          <div className="p-4 bg-[#2a2a2a] rounded-lg">
            <Label className="text-white mb-2 block">Preview da Cor Primária</Label>
            <div 
              className="w-full h-16 rounded-lg border-2 border-[#3a3a3a]"
              style={{ backgroundColor: previewColor }}
            />
            <p className="text-xs text-gray-400 mt-2">
              HSL: {primaryHue}° {primarySaturation}% {primaryLightness}%
            </p>
          </div>
          
          {/* Controles de cor */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="hue" className="text-white">
                Matiz (Hue): {primaryHue}°
              </Label>
              <Input
                id="hue"
                type="range"
                min="0"
                max="360"
                value={primaryHue}
                onChange={(e) => setPrimaryHue(parseInt(e.target.value))}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0°</span>
                <span>180°</span>
                <span>360°</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="saturation" className="text-white">
                Saturação: {primarySaturation}%
              </Label>
              <Input
                id="saturation"
                type="range"
                min="0"
                max="100"
                value={primarySaturation}
                onChange={(e) => setPrimarySaturation(parseInt(e.target.value))}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="lightness" className="text-white">
                Luminosidade: {primaryLightness}%
              </Label>
              <Input
                id="lightness"
                type="range"
                min="0"
                max="100"
                value={primaryLightness}
                onChange={(e) => setPrimaryLightness(parseInt(e.target.value))}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          {/* Valores numéricos para edição direta */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hue-input" className="text-white text-sm">Matiz</Label>
              <Input
                id="hue-input"
                type="number"
                min="0"
                max="360"
                value={primaryHue}
                onChange={(e) => setPrimaryHue(Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="saturation-input" className="text-white text-sm">Saturação</Label>
              <Input
                id="saturation-input"
                type="number"
                min="0"
                max="100"
                value={primarySaturation}
                onChange={(e) => setPrimarySaturation(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lightness-input" className="text-white text-sm">Luminosidade</Label>
              <Input
                id="lightness-input"
                type="number"
                min="0"
                max="100"
                value={primaryLightness}
                onChange={(e) => setPrimaryLightness(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-[#2a2a2a] bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Type className="h-5 w-5" />
            Nomes do Aplicativo
          </CardTitle>
          <CardDescription>
            Altere os nomes que aparecem no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="app-name" className="text-white">
              Nome do App
            </Label>
            <Input
              id="app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Ex: Sociedade Nutra"
              className="mt-2"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">
              Este nome aparecerá em todo o aplicativo
            </p>
          </div>
          <div>
            <Label htmlFor="community-name" className="text-white">
              Nome da Comunidade
            </Label>
            <Input
              id="community-name"
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="Ex: Comunidade dos Sócios"
              className="mt-2"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">
              Este nome aparecerá no header da aplicação
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateTheme.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateTheme.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
      
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-400">
          ⚠️ <strong>Atenção:</strong> As alterações serão aplicadas após salvar e a página será recarregada automaticamente.
        </p>
      </div>
    </div>
  );
}

