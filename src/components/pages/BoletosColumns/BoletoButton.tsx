import { useCallback } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBoletoViewer } from "@/components/pages/BoletosColumns/BoletoViewer";
import { useParcelaData } from "@/hooks/useParcelaData";
import { parseDate } from "@/utils/boletos/formatters";

interface BoletoButtonProps {
  boletoId: string | number | null | undefined;
  parcelaId: string | number | null | undefined;
  dataVencimento?: string | Date | null;
  status?: string;
}

export function BoletoButton({
  boletoId,
  parcelaId,
  dataVencimento,
  status,
}: BoletoButtonProps) {
  const { showBoletoViewer } = useBoletoViewer();

  // Usar o hook customizado para gerenciar dados da parcela
  const { parcelaData, loading } = useParcelaData(
    parcelaId,
    boletoId,
    // Passar dados iniciais se disponíveis
    (dataVencimento !== null && dataVencimento !== undefined) || status
      ? {
        dataVencimento: dataVencimento === null ? undefined : dataVencimento,
        statusPagamento: status,
      }
      : null
  );

  // Determinar se o boleto está vencido
  const getVencimentoInfo = useCallback(() => {
    let vencimento: Date;
    let isExpired: boolean = false;

    try {
      const dataParaVerificar = parcelaData?.dataVencimento || dataVencimento;

      if (dataParaVerificar instanceof Date) {
        vencimento = dataParaVerificar;
      } else if (typeof dataParaVerificar === "string" && dataParaVerificar) {
        try {
          vencimento = parseDate(dataParaVerificar as any);
        } catch {
          vencimento = new Date(dataParaVerificar);
        }
      } else {
        vencimento = new Date(0);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      isExpired = vencimento < today;
    } catch (error) {
      isExpired = true;
    }

    return isExpired;
  }, [parcelaData, dataVencimento]);

  // DEBUG: Log dos status recebidos
  console.log('Status recebido:', status);
  console.log('ParcelaData status:', parcelaData?.statusPagamento);
  
  const statusAtual = (parcelaData?.statusPagamento || status || "").toLowerCase().trim();
  console.log('Status atual processado:', statusAtual);

  // Verificar status de pagamento
  const isPaid = ["baixado", "pago", "quitado", "liquidado"].some(s => {
    const includes = statusAtual.includes(s);
    console.log(`Verificando se "${statusAtual}" inclui "${s}" (isPaid):`, includes);
    return includes;
  });

  // Verificar status cancelado
  const isCancelled = ["cancelado", "cancelada"].some(s => {
    const includes = statusAtual.includes(s);
    console.log(`Verificando se "${statusAtual}" inclui "${s}" (isCancelled):`, includes);
    return includes;
  });

  // Verificar status pendente - VERSÃO CORRIGIDA COM DEBUG
  const statusValidos = ["gerado", "rejeitado", "confirmado", "remessa", "pendente"];
  const isPending = statusValidos.some(s => {
    const includes = statusAtual.includes(s);
    console.log(`Verificando se "${statusAtual}" inclui "${s}" (isPending):`, includes);
    return includes;
  });

  console.log('isPending final:', isPending);

  const hasId = parcelaId !== null && parcelaId !== undefined;
  const hasCodigoBoleto = boletoId !== null && boletoId !== undefined && boletoId !== "";

  const isExpired = getVencimentoInfo();
  
  // Boleto disponível apenas se tiver IDs, não estiver vencido, não estiver pago, não estiver cancelado
  // E deve ter status pendente ou similar para estar disponível
  const boletoAvailable = hasId && hasCodigoBoleto && !isExpired && !isPaid && !isCancelled && isPending;

  // DEBUG: Log das condições finais
  console.log('Condições do boletoAvailable:');
  console.log('- hasId:', hasId);
  console.log('- hasCodigoBoleto:', hasCodigoBoleto);  
  console.log('- !isExpired:', !isExpired);
  console.log('- !isPaid:', !isPaid);
  console.log('- !isCancelled:', !isCancelled);
  console.log('- isPending:', isPending);
  console.log('- boletoAvailable:', boletoAvailable);

  // Definir tooltip específico para cada situação
  const getTooltipText = () => {
    if (loading) {
      return "Carregando...";
    }

    if (isCancelled) {
      return "Este boleto foi cancelado e, por isso, não está disponível para visualização.";
    }

    if (isPaid) {
      return "Não é possível visualizar este boleto pois já está pago";
    }

    if (!hasId || !hasCodigoBoleto) {
      return "Boleto não disponível";
    }

    if (isExpired) {
      return "Boleto vencido - não pode ser visualizado";
    }

    if (!isPending) {
      return `Boleto não está em status válido para visualização (Status atual: ${statusAtual})`;
    }

    return "Visualizar boleto para pagamento";
  };

  const handleVisualizarBoleto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Não executar ação se não estiver disponível ou carregando
    if (!boletoAvailable || loading) {
      return;
    }

    if (
      boletoId !== undefined &&
      boletoId !== null &&
      parcelaId !== undefined &&
      parcelaId !== null
    ) {
      showBoletoViewer(
        String(boletoId),
        String(parcelaId),
        parcelaData || {
          dataVencimento: dataVencimento,
          statusPagamento: status,
        }
      );
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="bottomPassword"
            size="icon"
            className={`h-8 w-8 ${isCancelled
                ? "bg-red-600 hover:bg-red-800 text-white cursor-not-allowed opacity-80"
                : !boletoAvailable
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } ${loading ? "animate-pulse" : ""}`}
            onClick={handleVisualizarBoleto}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {loading
                ? "Carregando dados do boleto..."
                : !boletoAvailable
                  ? isCancelled
                    ? "Boleto indisponível: foi cancelado"
                    : isPaid
                      ? "Boleto indisponível: já está pago"
                      : !isPending
                        ? "Boleto indisponível: status inválido"
                        : "Boleto indisponível"
                  : "Visualizar boleto para pagamento"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}