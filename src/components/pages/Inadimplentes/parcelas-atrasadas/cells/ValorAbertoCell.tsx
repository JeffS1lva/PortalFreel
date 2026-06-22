// src/components/parcelas-atrasadas/cells/ValorAbertoCell.tsx
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/components/pages/Inadimplentes/utils/formatters";

interface ValorAbertoCellProps {
  valor: number;
}

export function ValorAbertoCell({ valor }: ValorAbertoCellProps) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center space-x-2">
        <DollarSign className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-700 shadow-sm">
          {formatCurrency(valor)}
        </span>
      </div>
    </div>
  );
}