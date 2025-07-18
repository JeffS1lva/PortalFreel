import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Table } from "@tanstack/react-table";
import { Parcela } from "@/types/parcela";
import { PeriodFilter } from "./PeriodFilter";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface BoletoFilterProps {
  allParcelas: Parcela[];
  setParcelas: React.Dispatch<React.SetStateAction<Parcela[]>>;
  table: Table<Parcela>;
  onSearch: (value: string, type: FilterType) => void;
  // Props para o PeriodFilter
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  recordCount: number;
}

type FilterType =
  | "codigoBoleto"
  | "nomePN"
  | "cnpj"
  | "numNF"
  | "pedidosCompra"
  | "dataVencimento";

export function BoletoFilter({
  allParcelas,
  setParcelas,
  table,
  onSearch,
  selectedPeriod,
  onPeriodChange,
  recordCount,
}: BoletoFilterProps) {
  const [filterType, setFilterType] =
    React.useState<FilterType>("codigoBoleto");
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState<DateRange>({
    start: null,
    end: null,
  });
  const [isFromPopoverOpen, setIsFromPopoverOpen] = React.useState(false);
  const [isToPopoverOpen, setIsToPopoverOpen] = React.useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = React.useState(false);
  const [isNewSearch, setIsNewSearch] = React.useState(false);

  const applyFilters = React.useCallback(() => {
    let filteredData = [...allParcelas];

    if (filterType === "dataVencimento") {
      if (dateRange.start && dateRange.end) {
        filteredData = filteredData.filter((item) => {
          if (!item.dataVencimento) return false;
          const datePart = item.dataVencimento.split("T")[0];
          const [year, month, day] = datePart.split("-").map(Number);
          const itemDate = new Date(Date.UTC(year, month - 1, day));

          return itemDate >= dateRange.start! && itemDate <= dateRange.end!;
        });
      }
    } else if (searchValue) {
      const value = searchValue.toLowerCase();
      switch (filterType) {
        case "codigoBoleto":
          const numericValue = value.replace(/\D/g, "");
          filteredData = filteredData.filter((item) =>
            item.codigoBoleto.toString().includes(numericValue)
          );
          break;
        case "nomePN":
          filteredData = filteredData.filter((item) =>
            item.nomePN?.toLowerCase().includes(value)
          );
          break;
        case "cnpj":
          const cnpjSearch = value.replace(/[^\d]/g, "");
          filteredData = filteredData.filter((item) =>
            item.cnpj?.replace(/[^\d]/g, "").includes(cnpjSearch)
          );
          break;
        case "numNF":
          filteredData = filteredData.filter((item) =>
            item.numNF?.toLowerCase().includes(value)
          );
          break;
        case "pedidosCompra":
          filteredData = filteredData.filter((item) =>
            item.pedidosCompra?.toLowerCase().includes(value)
          );
          break;
      }
    }

    setParcelas(filteredData);

    if (isNewSearch) {
      table.setPageIndex(0);
    }
  }, [
    allParcelas,
    filterType,
    searchValue,
    dateRange,
    setParcelas,
    table,
    isNewSearch,
  ]);

  const resetFilters = () => {
    setSearchValue("");
    setFilterType("codigoBoleto");
    setDateRange({ start: null, end: null });
    setIsNewSearch(true);
    setParcelas(allParcelas);
    table.setPageIndex(0);
  };

  const handleSearch = React.useCallback(() => {
    setIsNewSearch(true);
    applyFilters();
    setIsNewSearch(false);
  }, [searchValue, filterType, onSearch, applyFilters]);

  const handleApplyDateFilter = () => {
    if (dateRange.start && dateRange.end) {
      setIsNewSearch(true);
      applyFilters();
      setIsNewSearch(false);
    }
  };

  const handleFromDateChange = (date: Date | undefined) => {
    setDateRange((prev) => ({ ...prev, start: date || null }));
    setIsFromPopoverOpen(false);
  };

  const handleToDateChange = (date: Date | undefined) => {
    setDateRange((prev) => ({ ...prev, end: date || null }));
    setIsToPopoverOpen(false);
  };

  // Automatic search on input change
  React.useEffect(() => {
    if (filterType !== "dataVencimento") {
      const delayDebounce = setTimeout(() => {
        handleSearch();
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchValue, filterType, handleSearch]);

  // Efeito para aplicar filtros quando o período de data mudar
  React.useEffect(() => {
    if (filterType === "dataVencimento" && dateRange.start && dateRange.end) {
      applyFilters();
    }
  }, [dateRange, filterType, applyFilters]);

  const getPlaceholder = () => {
    switch (filterType) {
      case "codigoBoleto":
        return "Buscar por código do boleto...";
      case "nomePN":
        return "Buscar por nome do cliente...";
      case "cnpj":
        return "Buscar por CNPJ...";
      case "numNF":
        return "Buscar por número da NF...";
      case "pedidosCompra":
        return "Buscar por pedidos de compra...";
      case "dataVencimento":
        return "Selecione um período de vencimento";
      default:
        return "Pesquisar...";
    }
  };

  const formatDateSafely = (date: Date | null): string => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca principal - Sempre visível */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
        {/* Input de busca ou Date Pickers */}
        <div className="flex-1">
          {filterType !== "dataVencimento" ? (
            <div className="relative">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={getPlaceholder()}
                className="pl-8 w-full"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateRange.start
                        ? formatDateSafely(dateRange.start)
                        : "Data inicial"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.start || undefined}
                    onSelect={handleFromDateChange}
                    locale={ptBR}
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
                      {dateRange.end
                        ? formatDateSafely(dateRange.end)
                        : "Data final"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateRange.end || undefined}
                    onSelect={handleToDateChange}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Controles do lado direito - Visíveis apenas em telas grandes */}
        <div className="hidden lg:flex gap-2">
          {/* Select do tipo de filtro */}
          <Select
            value={filterType}
            onValueChange={(value: FilterType) => {
              setFilterType(value);
              setSearchValue("");
              setIsNewSearch(true);
              if (value === "dataVencimento") {
                setIsFromPopoverOpen(true);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filtrar por</SelectLabel>
                <SelectItem value="codigoBoleto">Código</SelectItem>
                <SelectItem value="pedidosCompra">Pedidos de Compra</SelectItem>
                <SelectItem value="nomePN">Nome</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="numNF">NF</SelectItem>
                <SelectItem value="dataVencimento">Vencimento</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* PeriodFilter */}
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={onPeriodChange}
            recordCount={recordCount}
            showRecordCount={true}
            className="w-[200px]"
            selectedStatus={""}
            onStatusChange={() => {}}
          />

          {/* Botão de limpar filtros */}
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-shrink-0"
          >
            Limpar
          </Button>
        </div>

        {/* Botões de ação mobile */}
        <div className="flex gap-2 sm:flex-shrink-0 lg:hidden">
          {filterType === "dataVencimento" ? (
            <Button
              onClick={handleApplyDateFilter}
              disabled={!dateRange.start || !dateRange.end}
              className="flex-1 sm:flex-none"
            >
              Filtrar
            </Button>
          ) : (
            <Button
              onClick={handleSearch}
              disabled={!searchValue}
              className="flex-1 sm:flex-none"
            >
              Filtrar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={resetFilters}
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
      <div className={`lg:hidden space-y-4 ${!isFiltersExpanded ? "hidden" : ""}`}>
        <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          {/* Seção de Seletores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seletor de tipo de filtro */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de filtro
              </label>
              <Select
                value={filterType}
                onValueChange={(value: FilterType) => {
                  setFilterType(value);
                  setSearchValue("");
                  setIsNewSearch(true);
                  if (value === "dataVencimento") {
                    setIsFromPopoverOpen(true);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Filtrar por</SelectLabel>
                    <SelectItem value="codigoBoleto">Código</SelectItem>
                    <SelectItem value="nomePN">Nome</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="numNF">NF</SelectItem>
                    <SelectItem value="pedidosCompra">Pedidos</SelectItem>
                    <SelectItem value="dataVencimento">Vencimento</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* PeriodFilter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Período
              </label>
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={onPeriodChange}
                recordCount={recordCount}
                showRecordCount={true}
                className="w-full"
                selectedStatus={""}
                onStatusChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Indicadores de filtros ativos */}
        {(searchValue ||
          dateRange.start ||
          dateRange.end ||
          filterType !== "codigoBoleto" ||
          selectedPeriod !== "all") && (
          <div className="flex flex-wrap gap-2 pb-3">
            {searchValue && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {searchValue}
                <button
                  onClick={() => setSearchValue("")}
                  className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {dateRange.start && dateRange.end && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {formatDateSafely(dateRange.start)} -{" "}
                {formatDateSafely(dateRange.end)}
                <button
                  onClick={() => {
                    setDateRange({ start: null, end: null });
                  }}
                  className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterType !== "codigoBoleto" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {filterType === "pedidosCompra" ? "Pedidos" : filterType}
                <button
                  onClick={() => setFilterType("codigoBoleto")}
                  className="ml-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedPeriod !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Período: {selectedPeriod}
                <button
                  onClick={() => onPeriodChange("all")}
                  className="ml-2 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {recordCount} registros
            </span>
          </div>
        )}
      </div>
    </div>
  );
}