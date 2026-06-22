// src/components/pedidos/columns/DataCell.tsx
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

interface DataCellProps {
  dateValue: unknown;
  variant?: "compact" | "default";
}

export function DataCell({ dateValue, variant = "default" }: DataCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const date = useMemo(() => {
    if (!dateValue) return null;

    let parsed: Date;

    try {
      if (typeof dateValue === "string") {
        parsed = parseISO(dateValue);        // Melhor parsing para strings ISO
      } else {
        parsed = new Date(dateValue as any);
      }

      if (isNaN(parsed.getTime())) return null;

      // Garante que pegamos apenas a data (sem hora) no fuso local do Brasil
      return startOfDay(parsed);
    } catch {
      return null;
    }
  }, [dateValue]);

  if (!date) {
    return <span className="text-slate-400 italic">—</span>;
  }

  const now = startOfDay(new Date()); // também normaliza o "hoje"
  
  const isToday = date.getTime() === now.getTime();
  const isPast = date < now && !isToday;
  const isFuture = date > now;

  // Formatações pré-computadas
  const day = date.getDate();
  const monthShort = format(date, "MMM", { locale: ptBR }).toUpperCase();
  const year = date.getFullYear();
  const weekdayShort = format(date, "EEE", { locale: ptBR }).replace(".", "");

  // Versão compacta (ideal para tabelas)
  if (variant === "compact") {
    return (
      <div
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
          transition-colors
          ${isToday ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : ""}
          ${isPast  ? "text-slate-500 dark:text-slate-400" : ""}
          ${isFuture ? "text-emerald-700 dark:text-emerald-400" : ""}
        `}
      >
        <span className="font-bold tabular-nums">{day.toString().padStart(2, "0")}</span>
        <span className="text-slate-400 dark:text-slate-500">/</span>
        <span className="font-medium">{monthShort}</span>
        {isToday && (
          <span className="ml-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">HOJE</span>
        )}
      </div>
    );
  }

  // Versão default (mais informativa)
  return (
    <div
      className={`
        group relative inline-flex flex-col items-start min-w-[110px] max-w-[160px]
        px-3 py-2 rounded-lg border border-transparent
        transition-all duration-200
        hover:border-slate-200 dark:hover:border-slate-700
        hover:bg-slate-50/70 dark:hover:bg-slate-800/40
        hover:shadow-sm
        ${isHovered ? "scale-[1.02]" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Linha superior – dia + badge */}
      <div className="flex items-center gap-2">
        <span
          className={`
            text-2xl font-bold tabular-nums leading-none
            ${isToday ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"}
          `}
        >
          {day.toString().padStart(2, "0")}
        </span>

        <div className="flex flex-col text-[11px] leading-tight">
          <span className="font-medium text-slate-500 dark:text-slate-400">{monthShort}</span>
          <span className="text-slate-400 dark:text-slate-500">{year}</span>
        </div>

        {/* Badge de status temporal */}
        <div
          className={`
            ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded
            ${isToday
              ? "bg-amber-500/20 text-amber-700 dark:bg-amber-600/30 dark:text-amber-300"
              : isPast
              ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}
          `}
        >
          {isToday ? "HOJE" : isPast ? "PASSADO" : "FUTURO"}
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
          ${isToday ? "bg-amber-500" : isPast ? "bg-slate-400" : "bg-emerald-500"}
          ${isHovered ? "opacity-90" : "opacity-60"}
        `}
      />
    </div>
  );
}

// Função auxiliar de filtro (atualizada para maior consistência)
export function dateRangeFilter(
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

  if (from && date < startOfDay(from)) return false;
  if (to && date > startOfDay(to)) return false;

  return true;
}