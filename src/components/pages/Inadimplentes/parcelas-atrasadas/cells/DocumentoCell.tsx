// src/components/parcelas-atrasadas/cells/DocumentoCell.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import { usePDFViewer } from "@/components/pages/Inadimplentes/parcelas-atrasadas/pdf-viewer/usePDFViewer";

interface DocumentoCellProps {
  numeroDocumento: string;
  tipoDocumento?: string;
  companyCode: string;
  chaveNFe: string;
  filial: string;
  transportadora?: string;
}

export function DocumentoCell({ 
  numeroDocumento, 
  tipoDocumento, 
  companyCode, 
  chaveNFe,
  filial,
  transportadora
}: DocumentoCellProps) {
  const hasDownloadAccess = !!(numeroDocumento && companyCode && chaveNFe);
  const { openViewer } = usePDFViewer();

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasDownloadAccess) return;
    
    openViewer({
      companyCode,
      chaveNFe,
      notaId: numeroDocumento,
      filial,
      transportadora,
      enabled: true,
    });
  };

  return (
    <div className="flex justify-center items-center gap-2 py-2">
      <Badge
        variant="outline"
        className="text-md font-mono bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 py-1"
      >
        {tipoDocumento || "DOC"}
      </Badge>
      <span className="font-medium text-md text-gray-900 dark:text-gray-100">
        {numeroDocumento}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleView}
            variant="default"
            disabled={!hasDownloadAccess}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors p-0 ${
              !hasDownloadAccess
                ? "bg-red-500 text-primary-foreground opacity-50 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasDownloadAccess ? "Visualizar documento" : "Documento não disponível!"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}