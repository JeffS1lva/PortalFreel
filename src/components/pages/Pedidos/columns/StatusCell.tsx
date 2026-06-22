// src/components/pedidos/columns/StatusCell.tsx
import { useMemo } from "react";
import { getStatusConfig } from "@/utils/Pedidos/statusConfig";
import { cn } from "@/lib/utils"; // se você usa class-variance-authority ou similar

interface StatusCellProps {
  status: string;
  size?: "sm" | "md"; // permite controlar tamanho se quiser
}

export const StatusCell = ({ status, size = "md" }: StatusCellProps) => {
  const config = useMemo(() => getStatusConfig(status), [status]);

  // Cores baseadas no tema (light/dark compatível)
  const statusStyles = {
    Aberto:    "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/40",
    Fechado:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/40",
    Cancelado: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/40",
    Liberado:  "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/40",
    "Picking eft.": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200/70 dark:border-violet-800/40",
    Indisponível: "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-300/70 dark:border-slate-700/50",
  };

  const baseStyle = statusStyles[status as keyof typeof statusStyles] || 
    "bg-gray-200 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300 border-gray-300/70 dark:border-gray-700/50";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200",
        "border shadow-sm hover:shadow",
        "group relative overflow-hidden",
        sizeClasses,
        baseStyle
      )}
      title={status} 
    >
      {/* Ícone com leve escala no hover */}
      <span className="transition-transform duration-200 group-hover:scale-110">
        {config.icon}
      </span>

      {/* Texto principal */}
      <span className="font-medium tracking-tight">
        {config.text || status}
      </span>

      {/* Efeito de brilho sutil no hover (opcional, mas dá um toque moderno) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
    </div>
  );
};