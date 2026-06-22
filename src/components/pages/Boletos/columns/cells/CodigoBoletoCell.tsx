import { BoletoButton } from "@/components/pages/Boletos/BoletosBotttom/BoletoButton";
import { CodigoBoletoCellProps } from "@/components/pages/Boletos/columns/types";

export const CodigoBoletoCell: React.FC<CodigoBoletoCellProps> = ({
  codigoBoleto,
  parcelaId,
  dataVencimento,
  status,
}) => {
  return (
    <div className="flex items-center gap-1">
      <span className="block text-center font-medium min-w-[50px]">
        {codigoBoleto ? String(codigoBoleto) : "-"}
      </span>
      <div className="flex gap-1">
        <BoletoButton
          boletoId={codigoBoleto}
          parcelaId={parcelaId}
          dataVencimento={dataVencimento}
          status={status}
        />
      </div>
    </div>
  );
};

// Factory para tanstack table
export const createCodigoBoletoCell = (row: any) => (
  <CodigoBoletoCell
    codigoBoleto={row.getValue("codigoBoleto")}
    parcelaId={row.original.id}
    dataVencimento={row.getValue("dataVencimento")}
    status={row.getValue("status")}
  />
);