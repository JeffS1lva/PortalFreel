import React, { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotaFiscalCellProps } from "@/components/pages/Boletos/columns/types";
import { useDanfe } from "@/components/pages/Boletos/columns/cells/NotaFiscalCell/hooks/useDanfe";
import { DanfeButton } from "./components/DanfeButton";
import {
  DanfeLoadingModal,
  DanfeErrorModal,
  DanfePDFViewer,
} from "./components/DanfeModals";

export const NotaFiscalCell: React.FC<NotaFiscalCellProps> = ({
  numNF,
  notaFiscal,
  companyCode,
  chaveNFe,
  status,
}) => {
  const notaId = (notaFiscal || numNF || "").toString();

  const { isLoading, error, pdfUrl, fetchDanfe, clearError, clearPdf } =
    useDanfe({
      notaId,
    });

  const { isCancelled, hasDANFEData, tooltipText, textClass } = useMemo(() => {
    const isCancelled = ["cancelado", "cancelada"].some((s) =>
      status.toLowerCase().includes(s)
    );

    const hasDANFEData = Boolean(
      (notaFiscal || numNF) &&
        companyCode?.trim() &&
        chaveNFe?.trim()
    );

    const getTooltip = () => {
      if (isCancelled)
        return "Esta nota fiscal está indisponível, por isso, não está disponível para visualização.";
      if (!hasDANFEData) return "DANFE não disponível para boletos";
      return "Visualizar DANFE";
    };

    const textClass = isCancelled
      ? "text-center font-medium min-w-[50px] text-red-500 line-through"
      : "text-center font-medium min-w-[50px] dark:text-gray-200";

    return { isCancelled, hasDANFEData, tooltipText: getTooltip(), textClass };
  }, [status, notaFiscal, numNF, companyCode, chaveNFe]);

  const handleViewDanfe = () => {
    if (isCancelled || !hasDANFEData) return;
    fetchDanfe(companyCode, chaveNFe);
  };

  return (
    <div className="flex items-center justify-start gap-2 min-h-[2rem]">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={textClass}>{numNF ? numNF.toString() : "-"}</span>
        </TooltipTrigger>
        {isCancelled && (
          <TooltipContent className="bg-white text-red-800 border border-red-200 shadow-md px-3 py-1.5 rounded-md text-sm">
            <p>Nota fiscal indisponível.</p>
          </TooltipContent>
        )}
      </Tooltip>

      {numNF && (
        <>
          <DanfeButton
            isDisabled={isCancelled || !hasDANFEData}
            isCancelled={isCancelled}
            tooltipText={tooltipText}
            onClick={handleViewDanfe}
          />
          {isLoading && <DanfeLoadingModal notaId={notaId} />}
          {error && <DanfeErrorModal message={error} onClose={clearError} />}
          {pdfUrl && (
            <DanfePDFViewer fileUrl={pdfUrl} notaId={notaId} onClose={clearPdf} />
          )}
        </>
      )}
    </div>
  );
};

// Factory para tanstack table
export const createNotaFiscalCell = (row: any) => (
  <NotaFiscalCell
    numNF={row.getValue("numNF")}
    notaFiscal={row.original.notaFiscal}
    companyCode={row.original.filial || ""}
    chaveNFe={row.original.chaveNFe || ""}
    status={row.original.status || row.original.statusNotaFiscal || ""}
  />
);