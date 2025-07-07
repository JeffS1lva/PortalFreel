import { formatDatePtBr } from "@/utils/boletos/formatters";

interface PaymentDateProps {
  status: string;
  dataPagamento?: string | Date | null;
}

export const PaymentDate = ({ status, dataPagamento }: PaymentDateProps) => {
  const statusLower = status?.toLowerCase() || "";
 
  if (["baixado", "pago"].includes(statusLower)) {
    return dataPagamento ? (
      <span >{formatDatePtBr(dataPagamento)}</span>
    ) : (
      <span>Pago</span>
    );
  } else if (["gerado", "confirmado", "remessa"].includes(statusLower)) {
    return <span className="text-zinc-400">Aguardando pagamento</span>;
  } else if (statusLower === "pendente") {
    return <span>Aguardando pagamento</span>;
  } else if (statusLower === "atrasado") {
    return <span>Em atraso</span>;
  } else {
    return <span className="text-zinc-400">Aguardando pagamento</span>;
  }
};