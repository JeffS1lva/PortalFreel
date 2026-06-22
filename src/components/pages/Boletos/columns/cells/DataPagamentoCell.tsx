import React from "react";
import { PaymentDate } from "@/components/pages/Boletos/BoletosBotttom/PaymentDate";

interface DataPagamentoCellProps {
  status: string;
  dataPagamento: string;
}

export const DataPagamentoCell: React.FC<DataPagamentoCellProps> = ({
  status,
  dataPagamento,
}) => {
  return <PaymentDate status={status} dataPagamento={dataPagamento} />;
};

export const createDataPagamentoCell = (row: any) => (
  <DataPagamentoCell
    status={row.getValue("status")}
    dataPagamento={row.getValue("dataPagamento")}
  />
);