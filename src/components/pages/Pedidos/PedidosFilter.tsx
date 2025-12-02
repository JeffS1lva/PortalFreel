// PedidosFilter.tsx
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
import { CalendarIcon, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { format } from "date-fns";
import { CustomCalendar } from "./CustomCalendar";
import { useState } from "react";

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
  // Estados para popovers
  const [isFromPopoverOpen, setIsFromPopoverOpen] = React.useState(false);
  const [isToPopoverOpen, setIsToPopoverOpen] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    activeDateRange.start
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    activeDateRange.end
  );
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Atualizar datas locais quando o período ativo muda
  React.useEffect(() => {
    setDateFrom(activeDateRange.start);
    setDateTo(activeDateRange.end);
  }, [activeDateRange]);

  // Função para lidar com a mudança da data inicial
  const handleFromDateChange = (date: Date | undefined) => {
    setDateFrom(date);
    setIsFromPopoverOpen(false);
  };

  // Função para lidar com a mudança da data final
  const handleToDateChange = (date: Date | undefined) => {
    setDateTo(date);
    setIsToPopoverOpen(false);
  };

  // Aplicar filtro de data personalizado
  const handleApplyDateFilter = () => {
    if (dateFrom && dateTo) {
      // Formatando as datas no formato YYYY-MM-DD esperado pela função filterFn
      const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        // Adicionar zero à esquerda se mês/dia for menor que 10
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Configurando o intervalo de datas formatado corretamente
      const formattedDateRange = {
        start: formatDateToString(dateFrom),
        end: formatDateToString(dateTo),
      };

      // Definindo o intervalo de datas ativo para o componente
      setActiveDateRange({
        start: dateFrom,
        end: dateTo,
      });

      // Chamada com as datas formatadas como strings
      fetchPedidosWithDateRange(dateFrom, dateTo, formattedDateRange);
    }
  };

  // Resetar os campos de busca
  const handleReset = () => {
    setSearchValue("");
    // Reaplica o filtro de período atual - padrão para "hoje"
    applyPeriodFilter("hoje");
  };

  // Placeholder dinâmico para o campo de busca
  const getPlaceholder = () => {
    switch (searchType) {
      case "numeroPedido":
        return "Buscar por número do pedido...";
      case "pedidosCompra":
        return "Buscar por número do Pedido de Compra...";
      case "statusDoPedido":
        return "Buscar por status do pedido...";
      case "notaFiscal":
        return "Buscar por nota fiscal...";
      case "dataLancamentoPedido":
        return "Selecione o período de lançamento...";
      case "dataParaEntrega":
        return "Selecione o período de entrega...";
      default:
        return "Buscar...";
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca principal - Sempre visível */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
        {/* Input de busca ou Date Pickers */}
        <div className="flex-1">
          {searchType !== "dataLancamentoPedido" &&
          searchType !== "dataParaEntrega" ? (
            <Input
              placeholder={getPlaceholder()}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover
                open={isFromPopoverOpen}
                onOpenChange={setIsFromPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateFrom
                        ? format(dateFrom, "dd/MM/yyyy")
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
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
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

        {/* Controles do lado direito - Visíveis apenas em telas grandes */}
        <div className="hidden lg:flex gap-2">
          {/* Seletor de tipo de busca */}
          <Select
            value={searchType}
            onValueChange={(value) => {
              setSearchType(value as SearchType);
              setSearchValue("");
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de busca" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tipo de Busca</SelectLabel>
                <SelectItem value="numeroPedido">Número do Pedido</SelectItem>
                <SelectItem value="pedidosCompra">Pedidos de Compra</SelectItem>
                <SelectItem value="statusDoPedido">Status do Pedido</SelectItem>
                <SelectItem value="notaFiscal">Nota Fiscal</SelectItem>
                <SelectItem value="dataLancamentoPedido">
                  Data de Lançamento
                </SelectItem>
                <SelectItem value="dataParaEntrega">Data de Entrega</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Seletor de período */}
          <Select
            value={currentPeriodFilter}
            onValueChange={(value) => applyPeriodFilter(value as PeriodFilter)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Período Recente</SelectLabel>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="ultimos3Dias">Últimos 3 Dias</SelectItem>
                <SelectItem value="ultimos7Dias">Últimos 7 Dias</SelectItem>
                <SelectItem value="ultimos15Dias">Últimos 15 Dias</SelectItem>
                <SelectItem value="ultimos45Dias">Últimos 45 Dias</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Botão de limpar filtros */}
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-shrink-0"
          >
            Limpar
          </Button>
        </div>

        {/* Botões de ação mobile */}
        <div className="flex gap-2 sm:flex-shrink-0 lg:hidden">
          {searchType === "dataLancamentoPedido" ||
          searchType === "dataParaEntrega" ? (
            <Button
              onClick={handleApplyDateFilter}
              disabled={!dateFrom || !dateTo}
              className="flex-1 sm:flex-none"
            >
              Filtrar
            </Button>
          ) : (
            <Button
              onClick={() => {
                /* Aplicar filtro de texto */
              }}
              disabled={!searchValue}
              className="flex-1 sm:flex-none"
            >
              Filtrar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 sm:flex-none"
          >
            <span className="sm:inline">Limpar</span>
          </Button>
        </div>
      </div>

      {/* Filtros avançados colapsáveis - Apenas mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Filtros Avançados
            </span>
          </div>
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isFiltersExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo dos filtros avançados - Apenas mobile */}
      <div
        className={`lg:hidden space-y-4 ${!isFiltersExpanded ? "hidden" : ""}`}
      >
        <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          {/* Seção de Seletores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seletor de tipo de busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de busca
              </label>
              <Select
                value={searchType}
                onValueChange={(value) => {
                  setSearchType(value as SearchType);
                  setSearchValue("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de busca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tipo de Busca</SelectLabel>
                    <SelectItem value="numeroPedido">
                      Número do Pedido
                    </SelectItem>
                    <SelectItem value="statusDoPedido">
                      Status do Pedido
                    </SelectItem>
                    <SelectItem value="notaFiscal">Nota Fiscal</SelectItem>
                    <SelectItem value="dataLancamentoPedido">
                      Data de Lançamento
                    </SelectItem>
                    <SelectItem value="dataParaEntrega">
                      Data de Entrega
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de período */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Período
              </label>
              <Select
                value={currentPeriodFilter}
                onValueChange={(value) =>
                  applyPeriodFilter(value as PeriodFilter)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Período Recente</SelectLabel>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="ontem">Ontem</SelectItem>
                    <SelectItem value="ultimos3Dias">Últimos 3 Dias</SelectItem>
                    <SelectItem value="ultimos7Dias">Últimos 7 Dias</SelectItem>
                    <SelectItem value="ultimos15Dias">
                      Últimos 15 Dias
                    </SelectItem>
                    <SelectItem value="ultimos45Dias">
                      Últimos 45 Dias
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
