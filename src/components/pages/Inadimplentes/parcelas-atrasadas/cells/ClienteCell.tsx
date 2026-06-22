// src/components/parcelas-atrasadas/cells/ClienteCell.tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { truncateText } from "@/components/pages/Inadimplentes/utils/formatters";

interface ClienteCellProps {
  nome: string;
}

export function ClienteCell({ nome }: ClienteCellProps) {
  const displayText = truncateText(nome, 15);
  
  return (
    <div className="flex items-center justify-center py-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-md bg-blue-50 dark:bg-blue-900/20 dark:text-blue-200 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 cursor-default">
              {displayText}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span>{nome}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}