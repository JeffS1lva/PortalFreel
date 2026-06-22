// src/components/boletos/columns/VencimentoCell.tsx
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

interface VencimentoCellProps {
  data: string;
  className?: string;
  variant?: "compact" | "default";
}

export const VencimentoCell: React.FC<VencimentoCellProps> = ({
  data,
  className = "",
  variant = "default",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const date = useMemo(() => {
    if (!data) return null;

    try {
      let parsed: Date;

      if (typeof data === "string") {
        parsed = parseISO(data);        // Parsing robusto para strings ISO vindas da API
      } else {
        parsed = new Date(data);
      }

      if (isNaN(parsed.getTime())) return null;

      // Normaliza para o início do dia no fuso horário local (evita deslocamento de 1 dia)
      return startOfDay(parsed);
    } catch {
      return null;
    }
  }, [data]);

  if (!date) {
    return <span className="text-slate-400 italic">—</span>;
  }

  // Normaliza "hoje" para comparação consistente
  const now = startOfDay(new Date());

  const isToday = date.getTime() === now.getTime();
  const isPast = date < now && !isToday;
  const isFuture = date > now;

  // Formatações pré-computadas
  const day = date.getDate();
  const monthShort = format(date, "MMM", { locale: ptBR }).toUpperCase();
  const year = date.getFullYear();
  const weekdayShort = format(date, "EEE", { locale: ptBR }).replace(".", "");

  // Versão compacta (ideal para tabelas densas)
  if (variant === "compact") {
    return (
      <div
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
          transition-colors
          ${isToday ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : ""}
          ${isPast ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : ""}
          ${isFuture ? "text-slate-600 dark:text-slate-400" : ""}
        `}
      >
        <span className="font-bold tabular-nums">{day.toString().padStart(2, "0")}</span>
        <span className="text-slate-400 dark:text-slate-500">/</span>
        <span className="font-medium">{monthShort}</span>
        {isToday && (
          <span className="ml-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">HOJE</span>
        )}
        {isPast && !isToday && (
          <span className="ml-1 text-[10px] font-semibold text-red-600 dark:text-red-400">ATRASADO</span>
        )}
      </div>
    );
  }

  // Versão default (mais informativa para vencimentos)
  return (
    <div
      className={`
        group relative inline-flex flex-col items-start min-w-[120px] max-w-[160px]
        px-3 py-2 rounded-lg border border-transparent
        transition-all duration-200
        hover:border-slate-200 dark:hover:border-slate-700
        hover:bg-slate-50/70 dark:hover:bg-slate-800/40
        hover:shadow-sm
        ${isHovered ? "scale-[1.02]" : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Linha superior – dia + badge */}
      <div className="flex items-center gap-2">
        <span
          className={`
            text-2xl font-bold tabular-nums leading-none
            ${isToday ? "text-amber-600 dark:text-amber-400" : ""}
            ${isPast ? "text-red-600 dark:text-red-400" : ""}
            ${isFuture ? "text-slate-800 dark:text-slate-100" : ""}
          `}
        >
          {day.toString().padStart(2, "0")}
        </span>

        <div className="flex flex-col text-[11px] leading-tight">
          <span className="font-medium text-slate-500 dark:text-slate-400">{monthShort}</span>
          <span className="text-slate-400 dark:text-slate-500">{year}</span>
        </div>

        {/* Badge de status de vencimento */}
        <div
          className={`
            ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded
            ${isToday
              ? "bg-amber-500/20 text-amber-700 dark:bg-amber-600/30 dark:text-amber-300"
              : isPast
              ? "bg-red-500/20 text-red-700 dark:bg-red-600/30 dark:text-red-300"
              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}
          `}
        >
          {isToday ? "VENCE HOJE" : isPast ? "ATRASADO" : "EM DIA"}
        </div>
      </div>

      {/* Linha inferior */}
      <div
        className={`
          text-[11px] text-slate-500 dark:text-slate-400 mt-1 transition-opacity
          ${isHovered ? "opacity-100" : "opacity-70 md:opacity-100"}
        `}
      >
        {weekdayShort} • {format(date, "dd/MM/yyyy")}
      </div>

      {/* Indicador lateral sutil */}
      <div
        className={`
          absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all
          ${isToday ? "bg-amber-500" : isPast ? "bg-red-500" : "bg-emerald-500"}
          ${isHovered ? "opacity-90" : "opacity-60"}
        `}
      />
    </div>
  );
};

// Factory function para uso em tabelas TanStack
export const createVencimentoCell = (row: any, variant: "compact" | "default" = "default") => (
  <VencimentoCell 
    data={row.getValue("dataVencimento")} 
    variant={variant}
  />
);

// Filtro de range de datas (atualizado com a mesma lógica de data)
export function vencimentoDateRangeFilter(
  row: any,
  columnId: string,
  filterValue: { from?: Date; to?: Date }
) {
  const value = row.getValue(columnId);
  if (!value || !filterValue) return true;

  let date: Date;
  try {
    if (typeof value === "string") {
      date = startOfDay(parseISO(value));
    } else {
      date = startOfDay(new Date(value));
    }

    if (isNaN(date.getTime())) return false;
  } catch {
    return false;
  }

  const { from, to } = filterValue;

  // Normaliza os filtros também para comparação consistente
  if (from && date < startOfDay(from)) return false;
  if (to && date > startOfDay(to)) return false;

  return true;
}