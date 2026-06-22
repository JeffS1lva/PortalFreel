import { Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useXmlDownload } from "./hooks/useXmlDownload";
import { useDanfeViewer } from "./hooks/useDanfeViewer";

interface NotaFiscalCellProps {
  notaFiscal: string;
  companyCode: string;
  chaveNFe: string;
  statusNotaFiscal?: string;
  filial: string; // ✅ ADICIONAR
  transportadora?: string; // ✅ ADICIONAR (opcional)
}

export const NotaFiscalCell = ({
  notaFiscal,
  companyCode,
  chaveNFe,
  statusNotaFiscal,
  filial,
  transportadora,
}: NotaFiscalCellProps) => {
  const isNotaCancelled =
    statusNotaFiscal === "Cancelada" || statusNotaFiscal === "Cancelado";
  const hasDownloadAccess =
    notaFiscal && companyCode && chaveNFe && !isNotaCancelled;

  const { handleDownload } = useXmlDownload({
    companyCode,
    chaveNFe,
    notaFiscal: notaFiscal || "",
    enabled: !!hasDownloadAccess,
  });

  const { handleView } = useDanfeViewer({
    companyCode: companyCode, // Código da empresa (pode ser diferente da filial)
    chaveNFe: chaveNFe,
    notaFiscal: notaFiscal,
    enabled: !!notaFiscal && !!chaveNFe,
    filial: filial, // ✅ AQUI! Passando a filial corretamente
    transportadora: transportadora, // Opcional
  });

  const textClass = isNotaCancelled
    ? "block text-center font-medium min-w-[50px] text-red-500"
    : "block text-center font-medium min-w-[50px]";

  const buttonClass = (disabled: boolean) => {
    let baseClass =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-8 w-8 p-0 ";

    if (isNotaCancelled) {
      return baseClass + "bg-red-500 hover:bg-red-600 text-white";
    }
    if (disabled) {
      return (
        baseClass +
        "bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
      );
    }
    return (
      baseClass +
      "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
    );
  };

  const danfeTooltip = isNotaCancelled
    ? "DANFE cancelada"
    : hasDownloadAccess
      ? "Visualizar DANFE"
      : "DANFE não disponível";
  const xmlTooltip = isNotaCancelled
    ? "XML cancelado"
    : hasDownloadAccess
      ? "Baixar XML"
      : "XML não disponível";

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={textClass}
            data-status={isNotaCancelled ? "cancelada" : ""}
          >
            {notaFiscal ? notaFiscal.toString() : "-"}
          </span>
        </TooltipTrigger>
        {isNotaCancelled && (
          <TooltipContent className="bg-white text-red-800 border border-red-200 shadow-md px-3 py-1.5 rounded-md text-sm">
            <p>Nota fiscal cancelada</p>
          </TooltipContent>
        )}
      </Tooltip>

      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleView}
              disabled={!hasDownloadAccess}
              className={buttonClass(!hasDownloadAccess)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar DANFE</span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            className={
              isNotaCancelled
                ? "bg-white text-red-800 border border-red-200"
                : ""
            }
          >
            <p>{danfeTooltip}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDownload}
              disabled={!hasDownloadAccess}
              className={buttonClass(!hasDownloadAccess)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                />
              </svg>
              <span className="sr-only">Download XML</span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            className={
              isNotaCancelled
                ? "bg-white text-red-800 border border-red-200"
                : ""
            }
          >
            <p>{xmlTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
