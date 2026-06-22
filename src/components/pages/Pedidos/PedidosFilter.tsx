"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Search,
  CalendarRange,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CustomCalendar } from "./CustomCalendar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Tipos
type SearchType =
  | "numeroPedido"
  | "statusDoPedido"
  | "notaFiscal"
  | "dataLancamentoPedido"
  | "dataParaEntrega"
  | "pedidosCompra";

type PeriodFilter =
  | "ontem"
  | "hoje"
  | "ultimos3Dias"
  | "ultimos7Dias"
  | "ultimos15Dias"
  | "ultimos45Dias";

interface PedidosFilterProps {
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  currentPeriodFilter: PeriodFilter;
  applyPeriodFilter: (filter: PeriodFilter) => void;
  activeDateRange: {
    start: Date | undefined;
    end: Date | undefined;
  };
  setActiveDateRange: (range: {
    start: Date | undefined;
    end: Date | undefined;
  }) => void;
  fetchPedidosWithDateRange: (
    startDate: Date,
    endDate: Date,
    formattedRange?: {
      start: string;
      end: string;
    }
  ) => Promise<void>;
}

const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje", icon: Clock },
  { value: "ontem", label: "Ontem", icon: Clock },
  { value: "ultimos3Dias", label: "Últimos 3 Dias", icon: CalendarRange },
  { value: "ultimos7Dias", label: "Últimos 7 Dias", icon: CalendarRange },
  { value: "ultimos15Dias", label: "Últimos 15 Dias", icon: CalendarRange },
  { value: "ultimos45Dias", label: "Últimos 45 Dias", icon: CalendarRange },
] as const;

const SEARCH_TYPE_OPTIONS = [
  { value: "numeroPedido", label: "Número do Pedido", placeholder: "Digite o número do pedido..." },
  { value: "pedidosCompra", label: "Pedidos de Compra", placeholder: "Digite o número do pedido de compra..." },
  { value: "statusDoPedido", label: "Status do Pedido", placeholder: "Digite o status do pedido..." },
  { value: "notaFiscal", label: "Nota Fiscal", placeholder: "Digite o número da nota fiscal..." },
  { value: "dataLancamentoPedido", label: "Data de Lançamento", placeholder: "Selecione o período de lançamento..." },
  { value: "dataParaEntrega", label: "Data de Entrega", placeholder: "Selecione o período de entrega..." },
] as const;

export const PedidosFilter = ({
  searchType,
  setSearchType,
  searchValue,
  setSearchValue,
  currentPeriodFilter,
  applyPeriodFilter,
  activeDateRange,
  setActiveDateRange,
  fetchPedidosWithDateRange,
}: PedidosFilterProps) => {
  const [isFromPopoverOpen, setIsFromPopoverOpen] = React.useState(false);
  const [isToPopoverOpen, setIsToPopoverOpen] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    activeDateRange.start
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    activeDateRange.end
  );
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setDateFrom(activeDateRange.start);
    setDateTo(activeDateRange.end);
  }, [activeDateRange]);

  const handleFromDateChange = (date: Date | undefined) => {
    setDateFrom(date);
    setIsFromPopoverOpen(false);
  };

  const handleToDateChange = (date: Date | undefined) => {
    setDateTo(date);
    setIsToPopoverOpen(false);
  };

  const handleApplyDateFilter = () => {
    if (dateFrom && dateTo) {
      const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const formattedDateRange = {
        start: formatDateToString(dateFrom),
        end: formatDateToString(dateTo),
      };

      setActiveDateRange({
        start: dateFrom,
        end: dateTo,
      });

      fetchPedidosWithDateRange(dateFrom, dateTo, formattedDateRange);
    }
  };

  const handleReset = () => {
    setSearchValue("");
    applyPeriodFilter("hoje");
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const currentSearchOption = SEARCH_TYPE_OPTIONS.find(
    (opt) => opt.value === searchType
  );

  const isDateSearch =
    searchType === "dataLancamentoPedido" || searchType === "dataParaEntrega";

  const hasActiveFilters = searchValue || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Barra de busca principal - Design moderno */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Container de busca com design melhorado */}
        <div className="flex-1">
          {!isDateSearch ? (
            <div className="relative group">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                isSearchFocused ? "text-primary" : "text-muted-foreground"
              )} />
              <Input
                placeholder={currentSearchOption?.placeholder || "Buscar..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  "pl-9 pr-9 transition-all duration-200",
                  isSearchFocused && "ring-2 ring-primary/20 border-primary"
                )}
              />
              {searchValue && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover
                open={isFromPopoverOpen}
                onOpenChange={setIsFromPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal transition-all duration-200",
                      dateFrom && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateFrom
                        ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR })
                        : "Data inicial"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CustomCalendar
                    selected={dateFrom}
                    onSelect={handleFromDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isToPopoverOpen} onOpenChange={setIsToPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal transition-all duration-200",
                      dateTo && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateTo
                        ? format(dateTo, "dd/MM/yyyy", { locale: ptBR })
                        : "Data final"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CustomCalendar
                    selected={dateTo}
                    onSelect={handleToDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Botões de ação com design moderno - Desktop */}
        <div className="hidden lg:flex gap-2">
          <Select
            value={searchType}
            onValueChange={(value) => {
              setSearchType(value as SearchType);
              setSearchValue("");
            }}
          >
            <SelectTrigger className="w-[180px] transition-all duration-200 hover:bg-muted/50">
              <SelectValue placeholder="Tipo de busca" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tipo de Busca</SelectLabel>
                {SEARCH_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={currentPeriodFilter}
            onValueChange={(value) => applyPeriodFilter(value as PeriodFilter)}
          >
            <SelectTrigger className="w-[160px] transition-all duration-200 hover:bg-muted/50">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Período Recente</SelectLabel>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="gap-2 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Botões de ação mobile */}
        <div className="flex gap-2 lg:hidden">
          {isDateSearch ? (
            <Button
              onClick={handleApplyDateFilter}
              disabled={!dateFrom || !dateTo}
              className="flex-1"
            >
              Aplicar Filtro
            </Button>
          ) : (
            <Button
              onClick={() => {}}
              disabled={!searchValue}
              className="flex-1"
            >
              Buscar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Limpar
          </Button>
        </div>

        {/* Botão de filtros avançados mobile */}
        <Button
          variant="outline"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="lg:hidden gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
          {isFiltersExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filtros avançados expansíveis - Mobile com design melhorado */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isFiltersExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-4 pt-4">
          {/* Seletor de tipo de busca */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tipo de busca
            </label>
            <Select
              value={searchType}
              onValueChange={(value) => {
                setSearchType(value as SearchType);
                setSearchValue("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de busca" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tipo de Busca</SelectLabel>
                  {SEARCH_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de período */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={currentPeriodFilter === option.value ? "default" : "outline"}
                  onClick={() => applyPeriodFilter(option.value as PeriodFilter)}
                  className="justify-start"
                  size="sm"
                >
                  <option.icon className="mr-2 h-3 w-3" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};