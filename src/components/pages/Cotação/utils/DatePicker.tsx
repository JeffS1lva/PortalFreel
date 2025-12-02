"use client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
  required = false,
  id,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "h-14 w-full justify-start text-left font-normal border-2 transition-all text-lg",
            !date && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          aria-required={required}
          
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onDateChange} initialFocus locale={ptBR} />
      </PopoverContent>
    </Popover>
  )
}

export function DatePickerLancamento({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
  disabled = true,
  required = false,
  id,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "h-14 w-full justify-start text-left font-normal border-2 transition-all text-lg",
            !date && "text-muted-foreground",
            disabled
              ? "bg-primary/5 border-gray-200 text-zinc-900 cursor-not-allowed opacity-70 hover:bg-gray-100"
              : "hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]",
            className,
          )}
          disabled={disabled}
          aria-required={required}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      {!disabled && (
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}

