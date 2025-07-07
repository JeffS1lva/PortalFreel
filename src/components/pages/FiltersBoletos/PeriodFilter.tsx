import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseDate } from "@/utils/boletos/formatters";

// Opções de período
const PERIOD_DATA = [
  { value: "1", label: "Último dia" },
  { value: "3", label: "Últimos 3 dias" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "60", label: "Últimos 60 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Último ano" },
  { value: "all", label: "Todos os períodos" },
];


// Função para verificar se um boleto está atrasado
export const isBoletoOverdue = (
  dataPagamento: string | Date | null | undefined,
  dataVencimento: string
): boolean => {
  // Se já foi pago, não está atrasado
  if (dataPagamento) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = parseDate(dataVencimento);

  // Está atrasado se vencimento passou e não foi pago
  return vencimento < hoje;
};

// Função para verificar se um boleto está pago
export const isBoletoPaid = (
  status: string,
  dataPagamento: string | Date | null | undefined
): boolean => {
  const statusLower = status?.toLowerCase() || "";

  // Se tem data de pagamento, está pago
  if (dataPagamento) return true;

  // Verifica também pelos status específicos (caso não tenha dataPagamento)
  return ["baixado", "pago", "baixa em cartório"].includes(statusLower);
};

// Função para verificar se um boleto está pendente
export const isBoletoPending = (
  status: string,
  dataPagamento: string | Date | null | undefined,
  dataVencimento: string
): boolean => {
  const statusLower = status?.toLowerCase() || "";

  // Se já foi pago ou está atrasado, não está pendente
  if (dataPagamento || isBoletoOverdue(dataPagamento, dataVencimento)) {
    return false;
  }

  // Verifica pelos status específicos de pendente
  return ["gerado", "rejeitado", "confirmado", "remessa", "pendente"].includes(statusLower);
};

// Função principal para filtrar boletos por status
export const filterBoletosByStatus = (
  boletos: any[],
  statusFilter: string
): any[] => {
  if (statusFilter === "all") {
    return boletos;
  }

  return boletos.filter((boleto) => {
    switch (statusFilter) {
      case "overdue":
        return isBoletoOverdue(boleto.dataPagamento, boleto.dataVencimento);

      case "paid":
        return isBoletoPaid(boleto.status, boleto.dataPagamento);

      case "pending":
        return isBoletoPending(boleto.status, boleto.dataPagamento, boleto.dataVencimento);

      default:
        return true;
    }
  });
};

interface PeriodFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  recordCount?: number;
  showRecordCount?: boolean;
  className?: string;
  selectClassName?: string;
  countClassName?: string;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = "",
  selectClassName = "w-[200px]",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>

      <Select value={selectedPeriod} onValueChange={onPeriodChange}>

        <SelectTrigger className={selectClassName}>
          <SelectValue placeholder="Selecione Periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Período por</SelectLabel>
            {PERIOD_DATA.map((option) => (
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