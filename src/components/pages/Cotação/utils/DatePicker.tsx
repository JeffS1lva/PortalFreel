"use client"

import { format, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

// DatePicker padrão (sempre habilitado para seleção)
export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
  required = false,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate)
    setOpen(false) // Fecha automaticamente após selecionar
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-required={required}
          className={cn(
            "h-14 w-full justify-start text-left font-normal border-2 transition-all text-lg",
            !date && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-70",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-6 w-6" />
          {date ? (
            format(date, "PPP", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => isBefore(d, startOfDay(new Date()))} // Bloqueia datas passadas
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}

// DatePickerLancamento (pode estar desabilitado por fora, ex: até preencher outro campo)
export function DatePickerLancamento({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
  disabled = true, // por padrão vem desabilitado (você controla isso de fora)
  required = false,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate)
    setOpen(false) // Fecha ao selecionar
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-required={required}
          className={cn(
            "h-14 w-full justify-start text-left font-normal border-2 transition-all text-lg",
            !date && "text-muted-foreground",
            disabled
              ? "bg-primary/5 border-gray-200 text-zinc-900 cursor-not-allowed opacity-70 hover:bg-gray-100"
              : "hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-6 w-6" />
          {date ? (
            format(date, "PPP", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      {/* Só mostra o calendário se não estiver desabilitado */}
      {!disabled && (
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(d) => isBefore(d, startOfDay(new Date()))}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}