import React from "react";
import { StatusBadge } from "@/components/pages/Boletos/BoletosBotttom/StatusBadge";

interface StatusCellProps {
  status: string;
  dataVencimento: string;
  dataPagamento: string;
}

export const StatusCell: React.FC<StatusCellProps> = ({
  status,
  dataVencimento,
  dataPagamento,
}) => {
  return (
    <StatusBadge
      status={status}
      dataPagamento={dataPagamento}
      dataVencimento={dataVencimento}
    />
  );
};

export const createStatusCell = (row: any) => (
  <StatusCell
    status={row.getValue("status")}
    dataVencimento={row.getValue("dataVencimento")}
    dataPagamento={row.getValue("dataPagamento")}
  />
);