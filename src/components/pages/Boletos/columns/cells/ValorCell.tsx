import React from "react";
import { formatCurrency } from "@/utils/boletos/formatters";

interface ValorCellProps {
  valor: number;
  className?: string;
}

export const ValorCell: React.FC<ValorCellProps> = ({
  valor,
  className = "",
}) => {
  return (
    <span className={`dark:text-gray-200 ${className}`}>
      {formatCurrency(valor)}
    </span>
  );
};

export const createValorCell = (row: any) => (
  <ValorCell valor={row.getValue("valorParcela")} />
);