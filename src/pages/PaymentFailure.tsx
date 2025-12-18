import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RefreshCcw, HelpCircle } from 'lucide-react';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 pb-20 pt-12">
        <Card className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 p-8 text-center">
            <div className="inline-flex items-center justify-center bg-red-500 rounded-full p-4 mb-4">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Pagamento Não Aprovado
            </h1>
            <p className="text-gray-300">
              Não foi possível processar seu pagamento
            </p>
          </div>

          <CardContent className="p-8 space-y-6 text-center">
            <div className="space-y-3">
              <p className="text-gray-400">
                Infelizmente, não conseguimos completar sua assinatura. Isso pode ter acontecido por diversos motivos:
              </p>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-6 text-left space-y-3">
              <h3 className="text-white font-semibold mb-3">Possíveis causas:</h3>
              <div className="grid gap-2 text-gray-400 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>Dados do cartão incorretos ou inválidos</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>Limite insuficiente no cartão</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>Cartão bloqueado ou vencido</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>Problemas na conexão durante o pagamento</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span>Operadora do cartão rejeitou a transação</span>
                </div>
              </div>
            </div>

            {paymentId && (
              <div className="text-xs text-gray-500 bg-[#2a2a2a] rounded p-3">
                ID da Tentativa: {paymentId}
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-400 text-sm">
              <p className="font-semibold mb-1">💡 Dica:</p>
              <p>Verifique seus dados de pagamento e tente novamente. Se o problema persistir, entre em contato com sua operadora de cartão ou nosso suporte.</p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/upgrade')}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <RefreshCcw className="h-5 w-5 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate('/support')}
                variant="outline"
                className="w-full border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Falar com Suporte
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
              >
                <Home className="h-5 w-5 mr-2" />
                Voltar ao Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


