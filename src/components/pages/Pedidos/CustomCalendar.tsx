// CustomCalendar.tsx
"use client";

import * as React from "react";
import { format, addMonths, addYears, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomCalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  initialFocus: boolean;
}

export const CustomCalendar = ({
  selected,
  onSelect,
}: CustomCalendarProps) => {
  const [viewDate, setViewDate] = React.useState<Date>(selected || new Date());

  // Atualiza a visualização inicial quando o componente monta
  React.useEffect(() => {
    if (selected) {
      setViewDate(selected);
    }
  }, []);

  // Navegar para o mês anterior
  const previousMonth = () => {
    setViewDate((prevDate) => addMonths(prevDate, -1));
  };

  // Navegar para o próximo mês
  const nextMonth = () => {
    setViewDate((prevDate) => addMonths(prevDate, 1));
  };

  // Navegar para o ano anterior
  const previousYear = () => {
    setViewDate((prevDate) => addYears(prevDate, -1));
  };

  // Navegar para o próximo ano
  const nextYear = () => {
    setViewDate((prevDate) => addYears(prevDate, 1));
  };

  // Gerar dias do mês atual
  const getDaysInMonth = (date: Date) => {
    const year = getYear(date);
    const month = getMonth(date);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Preencher dias vazios do início do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Preencher os dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(viewDate);
  const currentYear = getYear(viewDate);
  const monthName = format(viewDate, "MMMM", { locale: ptBR });

  // Verificar se uma data está selecionada
  const isSelected = (date: Date) => {
    if (!selected) return false;
    return date.toDateString() === selected.toDateString();
  };

  // Verificar se uma data é hoje
  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousYear}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center font-medium">
          <span className="capitalize">{monthName}</span> {currentYear}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextYear}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
          <div key={i} className="font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="text-center p-1">
            {day ? (
              <button
                type="button"
                onClick={() => onSelect(day)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${isSelected(day) ? "bg-primary text-primary-foreground" : ""}
                  ${
                    isToday(day) && !isSelected(day)
                      ? "border border-primary"
                      : ""
                  }
                  hover:bg-muted transition-colors
                `}
              >
                {day.getDate()}
              </button>
            ) : (
              <div className="w-8 h-8"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};