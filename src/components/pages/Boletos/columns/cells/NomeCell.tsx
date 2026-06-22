import { NomeCellProps } from "@/components/pages/Boletos/columns/types";

export const NomeCell: React.FC<NomeCellProps> = ({
  nome,
  maxMobileLength = 15,
  className = "",
}) => {
  const truncatedName =
    nome.length > maxMobileLength
      ? nome.slice(0, maxMobileLength) + "..."
      : nome;

  return (
    <div
      className={`whitespace-nowrap overflow-hidden text-ellipsis flex w-56 dark:text-gray-200 ${className}`}
      title={nome}
    >
      <span className="hidden sm:inline">{nome}</span>
      <span className="sm:hidden">{truncatedName}</span>
    </div>
  );
};

export const createNomeCell = (row: any) => (
  <NomeCell nome={row.getValue("nomePN")} />
);