import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDate } from "@/utils/boletos/formatters";

// Interface para ParcelaAtrasada
interface ParcelaAtrasada {
  pedidosCompra: string;
  codigoVendedor: number;
  tipoDocumento: string;
  idDocumento: string;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  codigoParceiroNegocio: string;
  nomeParceiroNegocio: string;
  valorTotal: number;
  saldoDevido: number;
  diasAtraso: number;
  chaveNFe: string;
  filial: string;
  internalCode: number;
  idRegistro: number;
}

// Opções de período por dias de atraso
const DELAY_PERIOD_OPTIONS = [
  { value: "all", label: "Todos os períodos" },
  { value: "1-30", label: "1 a 30 dias" },
  { value: "31-60", label: "31 a 60 dias" },
  { value: "61-90", label: "61 a 90 dias" },
  { value: "90+", label: "Mais de 90 dias" },
];

// Função para calcular dias de atraso
export const calcularDiasAtraso = (dataVencimento: string): number => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = parseDate(dataVencimento);

    // Verificar se a data é válida
    if (isNaN(vencimento.getTime())) {
      console.warn(`Data de vencimento inválida: ${dataVencimento}`);
      return 0;
    }

    // Normalizar a data de vencimento para meia-noite
    vencimento.setHours(0, 0, 0, 0);

    // Se não venceu ainda, não há atraso
    if (vencimento >= hoje) return 0;

    // Calcula diferença em dias
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error(
      `Erro ao calcular dias de atraso para ${dataVencimento}:`,
      error
    );
    return 0;
  }
};



// Função para verificar se atende ao filtro de dias de atraso
export const atendeFiltroDiasAtraso = (
  item: ParcelaAtrasada,
  filtro: string
): boolean => {
  

  if (filtro === "all") return true;

  // Verificar se o item tem a propriedade diasAtraso
  if (!item || typeof item.diasAtraso !== "number") {
    console.warn("Item sem dias de atraso válido:", item);
    return false;
  }

  const diasAtraso = item.diasAtraso;

  switch (filtro) {
    case "1-30":
      return diasAtraso >= 1 && diasAtraso <= 30;
    case "31-60":
      return diasAtraso >= 31 && diasAtraso <= 60;
    case "61-90":
      return diasAtraso >= 61 && diasAtraso <= 90;
    case "90+":
      return diasAtraso > 90;
    default:
      console.warn(`Filtro desconhecido: ${filtro}`);
      return true;
  }
};

// Função principal para filtrar parcelas por dias de atraso
export const filterParcelasByDelayPeriod = (
  parcelas: ParcelaAtrasada[],
  delayFilter: string
): ParcelaAtrasada[] => {
  

  if (!Array.isArray(parcelas)) {
    console.warn("Parcelas não é um array:", parcelas);
    return [];
  }

  if (delayFilter === "all") {
    return parcelas;
  }

  const parcelasFiltradas = parcelas.filter((parcela) => {
    try {
      // Garantir que diasAtraso está calculado
      if (typeof parcela.diasAtraso !== "number") {
        parcela.diasAtraso = calcularDiasAtraso(parcela.dataVencimento);
      }

      const atende = atendeFiltroDiasAtraso(parcela, delayFilter);
      if (atende) {
        
      }
      return atende;
    } catch (error) {
      return false;
    }
  });

  
  return parcelasFiltradas;
};

interface DelayPeriodFilterProps {
  selectedDelayPeriod: string;
  onDelayPeriodChange: (period: string) => void;
  recordCount?: number;
  showRecordCount?: boolean;
  className?: string;
  selectClassName?: string;
  countClassName?: string;
}

export const DelayPeriodFilter: React.FC<DelayPeriodFilterProps> = ({
  selectedDelayPeriod,
  onDelayPeriodChange,
  className = "",
  selectClassName = "w-[200px]",
}) => {
  const handleValueChange = (value: string) => {
    onDelayPeriodChange(value);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedDelayPeriod} onValueChange={handleValueChange}>
        <SelectTrigger className={selectClassName}>
          <SelectValue placeholder="Selecione Dias de Atraso" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Dias de Atraso</SelectLabel>
            {DELAY_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

// Hook personalizado para usar o filtro de dias de atraso
export const useDelayPeriodFilter = (
  parcelas: ParcelaAtrasada[],
  initialFilter: string = "all"
) => {
  const [selectedDelayPeriod, setSelectedDelayPeriod] =
    React.useState(initialFilter);

  // Garantir que todas as parcelas tenham diasAtraso calculado
  const parcelasComDiasAtraso = React.useMemo(() => {
    if (!Array.isArray(parcelas)) return [];

    return parcelas.map((parcela) => ({
      ...parcela,
      diasAtraso:
        typeof parcela.diasAtraso === "number"
          ? parcela.diasAtraso
          : calcularDiasAtraso(parcela.dataVencimento),
    }));
  }, [parcelas]);

  const filteredParcelas = React.useMemo(() => {
    const resultado = filterParcelasByDelayPeriod(
      parcelasComDiasAtraso,
      selectedDelayPeriod
    );
    return resultado;
  }, [parcelasComDiasAtraso, selectedDelayPeriod]);

  return {
    selectedDelayPeriod,
    setSelectedDelayPeriod,
    filteredParcelas,
    recordCount: filteredParcelas.length,
  };
};
