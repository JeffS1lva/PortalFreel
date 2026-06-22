// src/components/parcelas-atrasadas/cells/DataCell.tsx
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

interface DataCellProps {
  dateValue: string | Date | null | undefined;
  type?: "emissao" | "vencimento";
}

export function DataCell({ dateValue, type = "emissao" }: DataCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const date = useMemo(() => {
    if (!dateValue) return null;

    try {
      let parsed: Date;

      if (dateValue instanceof Date) {
        parsed = dateValue;
      } else if (typeof dateValue === "string") {
        parsed = parseISO(dateValue);        // Parsing correto para strings ISO
      } else {
        parsed = new Date(dateValue);
      }

      if (isNaN(parsed.getTime())) return null;

      // Normaliza para o início do dia no fuso horário local do Brasil
      return startOfDay(parsed);
    } catch {
      return null;
    }
  }, [dateValue]);

  if (!date) {
    return <span className="text-slate-400 italic">Data inválida</span>;
  }

  // Normaliza "hoje" para comparação consistente
  const now = startOfDay(new Date());

  const isToday = date.getTime() === now.getTime();
  const isPast = date < now && !isToday;

  // Formatações
  const day = date.getDate();
  const monthShort = format(date, "MMM", { locale: ptBR }).toUpperCase();
  const year = date.getFullYear();
  const weekdayShort = format(date, "EEE", { locale: ptBR }).replace(".", "");
  const fullDate = format(date, "dd/MM/yyyy");

  // Cores baseadas no tipo e status
  const getStatusConfig = () => {
    if (type === "vencimento") {
      if (isPast) {
        return {
          dayColor: "text-red-600 dark:text-red-400",
          badgeBg: "bg-red-500/20",
          badgeText: "text-red-700 dark:text-red-300",
          badgeLabel: "ATRASADO",
          sideColor: "bg-red-500",
          hoverBg: "hover:bg-red-50/70 dark:hover:bg-red-900/20",
          hoverBorder: "hover:border-red-200 dark:hover:border-red-800",
        };
      }
      if (isToday) {
        return {
          dayColor: "text-amber-600 dark:text-amber-400",
          badgeBg: "bg-amber-500/20",
          badgeText: "text-amber-700 dark:text-amber-300",
          badgeLabel: "HOJE",
          sideColor: "bg-amber-500",
          hoverBg: "hover:bg-amber-50/70 dark:hover:bg-amber-900/20",
          hoverBorder: "hover:border-amber-200 dark:hover:border-amber-800",
        };
      }
      return {
        dayColor: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-500/20",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        badgeLabel: "FUTURO",
        sideColor: "bg-emerald-500",
        hoverBg: "hover:bg-emerald-50/70 dark:hover:bg-emerald-900/20",
        hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-800",
      };
    }
    
    // Emissão - tons de azul/cinza
    return {
      dayColor: "text-slate-700 dark:text-slate-200",
      badgeBg: "bg-blue-500/10",
      badgeText: "text-blue-600 dark:text-blue-400",
      badgeLabel: "EMITIDO",
      sideColor: "bg-blue-500",
      hoverBg: "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
      hoverBorder: "hover:border-slate-200 dark:hover:border-slate-700",
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center justify-center py-2">
      <div
        className={`
          group relative inline-flex flex-col items-start min-w-[140px] max-w-[180px]
          px-3 py-2.5 rounded-lg border border-transparent
          transition-all duration-200 cursor-default
          ${config.hoverBg}
          ${config.hoverBorder}
          hover:shadow-sm
          ${isHovered ? "scale-[1.02]" : ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Linha superior – dia + mês/ano + badge */}
        <div className="flex items-center gap-2 w-full">
          <span
            className={`
              text-2xl font-bold tabular-nums leading-none
              ${config.dayColor}
            `}
          >
            {day.toString().padStart(2, "0")}
          </span>

          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
              {monthShort}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">
              {year}
            </span>
          </div>

          {/* Badge de status */}
          <div
            className={`
              ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider
              ${config.badgeBg} ${config.badgeText}
              border border-current border-opacity-20
            `}
          >
            {config.badgeLabel}
          </div>
        </div>

        {/* Linha inferior - dia da semana e data completa */}
        <div
          className={`
            flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5
            transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-70"}
          `}
        >
          <span className="capitalize font-medium">{weekdayShort}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="tabular-nums">{fullDate}</span>
        </div>

        {/* Indicador lateral sutil */}
        <div
          className={`
            absolute left-0 top-2 bottom-2 w-1 rounded-full transition-all duration-300
            ${config.sideColor}
            ${isHovered ? "opacity-100 scale-y-100" : "opacity-60 scale-y-75"}
          `}
        />

        {/* Efeito de brilho sutil no hover */}
        <div
          className={`
            absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
          `}
        />
      </div>
    </div>
  );
}

// Filtro de data atualizado com a mesma regra
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
    } else if (value instanceof Date) {
      date = startOfDay(value);
    } else {
      date = startOfDay(new Date(value));
    }

    if (isNaN(date.getTime())) return false;
  } catch {
    return false;
  }

  const { from, to } = filterValue;

  // Normaliza os valores do filtro também
  if (from && date < startOfDay(from)) return false;
  if (to && date > startOfDay(to)) return false;

  return true;
}