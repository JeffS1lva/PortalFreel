import { formatCNPJ } from "@/utils/boletos/formatters";
import { CNPJCellProps } from "@/components/pages/Boletos/columns/types";

export const CNPJCell: React.FC<CNPJCellProps> = ({
  cnpj,
  className = "",
}) => {
  return (
    <span className={`dark:text-gray-200 ${className}`}>
      {formatCNPJ(cnpj)}
    </span>
  );
};

export const createCNPJCell = (row: any) => (
  <CNPJCell cnpj={row.getValue("cnpj")} />
);