import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Search, User, FileText, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDate } from "@/utils/boletos/formatters";
import { DelayPeriodFilter } from "@/components/pages/ParcelasFilter/PeriodFilter";

// Interface para tipagem dos dados
interface ParcelaAtrasada {
  codigoVendedor: number;
  tipoDocumento: string;
  idDocumento: string;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  codigoParceiroNegocio: string;
  nomeParceiroNegocio: string;
  valorTotal: number;
  saldoDevido: number;
  diasAtraso: number;
  chaveNFe: string;
  filial: string;
  internalCode: number;
  idRegistro: number;
}

type FilterType =
  | "codigoParceiroNegocio"
  | "numeroDocumento"
  | "dataVencimento";

interface FilterProps {
  data: ParcelaAtrasada[];
  onFilteredDataChange: (filteredData: ParcelaAtrasada[]) => void;
  loading?: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedDelayPeriod: string;
  onDelayPeriodChange: (period: string) => void;
}

interface FilterState {
  searchValue: string;
  searchType: FilterType;
}

// Função única para calcular dias de atraso (usando a mesma lógica do PeriodFilter)
const calcularDiasAtraso = (dataVencimento: string): number => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vencimento = parseDate(dataVencimento);
    
    // Verificar se a data é válida
    if (isNaN(vencimento.getTime())) {
      return 0;
    }
    
    // Normalizar a data de vencimento para meia-noite
    vencimento.setHours(0, 0, 0, 0);

    // Se não venceu ainda, não há atraso
    if (vencimento >= hoje) return 0;

    // Calcula diferença em dias
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    return 0;
  }
};

// Função para calcular diferença em dias entre duas datas
const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Função para converter string de data para Date object
const parseDataVencimento = (dataVencimento: string): Date => {
  try {
    // Se a data já estiver no formato ISO (YYYY-MM-DD)
    if (dataVencimento.includes("-")) {
      return new Date(dataVencimento);
    }

    // Se a data estiver no formato brasileiro (DD/MM/YYYY)
    if (dataVencimento.includes("/")) {
      const [dia, mes, ano] = dataVencimento.split("/");
      return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }

    // Tentar usar parseDate se disponível
    if (typeof parseDate === "function") {
      return parseDate(dataVencimento);
    }

    // Fallback: tentar criar Date diretamente
    return new Date(dataVencimento);
  } catch (error) {
    return new Date();
  }
};

// Função para filtrar por prazo de vencimento
const filterByDuePeriod = (
  item: ParcelaAtrasada,
  periodFilter: string
): boolean => {
  if (periodFilter === "all") return true;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  try {
    const dataVencimento = parseDataVencimento(item.dataVencimento);
    dataVencimento.setHours(0, 0, 0, 0);

    const diasParaVencimento = getDaysDifference(hoje, dataVencimento);

    switch (periodFilter) {
      case "overdue":
        return diasParaVencimento < 0;
      case "today":
        return diasParaVencimento === 0;
      case "1-30":
        return diasParaVencimento >= 1 && diasParaVencimento <= 30;
      case "31-60":
        return diasParaVencimento >= 31 && diasParaVencimento <= 60;
      case "61-90":
        return diasParaVencimento >= 61 && diasParaVencimento <= 90;
      case "91-120":
        return diasParaVencimento >= 91 && diasParaVencimento <= 120;
      case "120+":
        return diasParaVencimento > 120;
      default:
        return true;
    }
  } catch (error) {
    return false;
  }
};

// Função para verificar se atende ao filtro de dias de atraso (corrigida)
const atendeFiltroDiasAtraso = (
  item: ParcelaAtrasada,
  filtro: string
): boolean => {
  if (filtro === "all") return true;

  // Usar diasAtraso se já calculado, senão calcular
  let diasAtraso = item.diasAtraso;
  if (typeof diasAtraso !== 'number' || diasAtraso < 0) {
    diasAtraso = calcularDiasAtraso(item.dataVencimento);
  }

  switch (filtro) {
    case "1-30":
      return diasAtraso >= 1 && diasAtraso <= 30;
    case "31-60":
      return diasAtraso >= 31 && diasAtraso <= 60;
    case "61-90":
      return diasAtraso >= 61 && diasAtraso <= 90;
    case "90+":
      return diasAtraso > 90;
    default:
      return true;
  }
};

// Função melhorada para normalizar texto para busca
const normalizeText = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return "";
  
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Função melhorada para verificar se um item atende ao filtro de busca
const atendeFiltroBusca = (
  item: ParcelaAtrasada,
  searchValue: string,
  searchType: FilterType
): boolean => {
  // Se não há valor de busca, retorna true
  if (!searchValue || !searchValue.trim()) return true;

  const searchNormalized = normalizeText(searchValue);
  
  // Se o valor normalizado está vazio, retorna true
  if (!searchNormalized) return true;

  switch (searchType) {
    case "codigoParceiroNegocio": {
      const codigo = normalizeText(item.codigoParceiroNegocio);
      const nome = normalizeText(item.nomeParceiroNegocio);
      
      // Busca tanto no código quanto no nome do parceiro
      const encontrouCodigo = codigo.includes(searchNormalized);
      const encontrouNome = nome.includes(searchNormalized);
      
      return encontrouCodigo || encontrouNome;
    }

    case "numeroDocumento": {
      const numeroDoc = normalizeText(item.numeroDocumento);
      const idDoc = normalizeText(item.idDocumento);
      
      // Busca tanto no número quanto no ID do documento
      const encontrouNumero = numeroDoc.includes(searchNormalized);
      const encontrouId = idDoc.includes(searchNormalized);
      
      return encontrouNumero || encontrouId;
    }

    case "dataVencimento": {
      try {
        const dataVencimento = parseDataVencimento(item.dataVencimento);
        const dataFormatada = dataVencimento.toLocaleDateString("pt-BR");
        const dataNormalizada = normalizeText(dataFormatada);
        
        // Remove caracteres não numéricos da busca para comparar apenas números
        const searchNumbers = searchNormalized.replace(/\D/g, "");
        const dateNumbers = dataNormalizada.replace(/\D/g, "");
        
        const encontrou = dateNumbers.includes(searchNumbers);
        
        return encontrou;
      } catch (error) {
        return false;
      }
    }

    default:
      return true;
  }
};

const ParcelasFilter: React.FC<FilterProps> = ({
  data = [],
  onFilteredDataChange,
  loading = false,
  selectedPeriod,
  onPeriodChange,
  selectedDelayPeriod,
  onDelayPeriodChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchValue: "",
    searchType: "codigoParceiroNegocio",
  });

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const filterOptions = [
    {
      value: "codigoParceiroNegocio" as FilterType,
      label: "Cliente",
      icon: User,
      placeholder: "Buscar por código ou nome do cliente...",
    },
    {
      value: "numeroDocumento" as FilterType,
      label: "Nº Documento",
      icon: FileText,
      placeholder: "Buscar por número do documento...",
    },
    {
      value: "dataVencimento" as FilterType,
      label: "Data Vencimento",
      icon: FileText,
      placeholder: "Buscar por data de vencimento (DD/MM/AAAA)...",
    },
  ];

  // Preparar dados com diasAtraso calculado
  const dataWithCalculatedDelay = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      diasAtraso: typeof item.diasAtraso === 'number' && item.diasAtraso >= 0 
        ? item.diasAtraso 
        : calcularDiasAtraso(item.dataVencimento)
    }));
  }, [data]);

  // Filtrar dados localmente usando useMemo para performance
  const filteredData = useMemo(() => {
    if (!dataWithCalculatedDelay || dataWithCalculatedDelay.length === 0) return [];

    const result = dataWithCalculatedDelay.filter((item) => {
      const passaBusca = atendeFiltroBusca(
        item,
        filters.searchValue,
        filters.searchType
      );
      const passaPeriodo = filterByDuePeriod(item, selectedPeriod);
      const passaAtraso = atendeFiltroDiasAtraso(item, selectedDelayPeriod);

      const passaFiltros = passaBusca && passaPeriodo && passaAtraso;

      return passaFiltros;
    });

    return result;
  }, [
    dataWithCalculatedDelay,
    filters.searchValue,
    filters.searchType,
    selectedPeriod,
    selectedDelayPeriod,
  ]);

  // Sempre que os dados filtrados mudarem, notificar o componente pai
  useEffect(() => {
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchValue: value }));
  }, []);

  const handleFilterTypeChange = useCallback((type: FilterType) => {
    setFilters((prev) => ({ 
      ...prev, 
      searchType: type, 
      searchValue: "" // Limpa o valor ao mudar o tipo
    }));
  }, []);

  const resetFilters = () => {
    setFilters({
      searchValue: "",
      searchType: "codigoParceiroNegocio",
    });
    onPeriodChange("all");
    onDelayPeriodChange("all");
  };

  const formatDateInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4)
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
      4,
      8
    )}`;
  };

  const handleDateInputChange = (value: string) => {
    if (filters.searchType === "dataVencimento") {
      const formatted = formatDateInput(value);
      handleSearchChange(formatted);
    } else {
      handleSearchChange(value);
    }
  };

  const getPlaceholder = () => {
    const option = filterOptions.find(
      (opt) => opt.value === filters.searchType
    );
    return option?.placeholder || "Pesquisar...";
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca principal - Sempre visível */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
        {/* Input de busca */}
        <div className="flex-1">
          <div className="relative">
            <Input
              value={filters.searchValue}
              onChange={(e) => handleDateInputChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="pl-8"
              disabled={loading}
              maxLength={
                filters.searchType === "dataVencimento" ? 10 : undefined
              }
              autoComplete="off"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Controles do lado direito - Visíveis apenas em telas grandes */}
        <div className="hidden lg:flex gap-2">
          {/* Select do tipo de filtro */}
          <Select
            value={filters.searchType}
            onValueChange={handleFilterTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Filtrar por" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filtrar por</SelectLabel>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Componente DelayPeriodFilter */}
          <DelayPeriodFilter
            selectedDelayPeriod={selectedDelayPeriod}
            onDelayPeriodChange={onDelayPeriodChange}
            recordCount={filteredData.length}
            showRecordCount={true}
            selectClassName="w-[200px]"
            countClassName="text-sm text-gray-600 whitespace-nowrap"
          />

          {/* Botão de limpar filtros */}
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-shrink-0"
            disabled={loading}
          >
            Limpar
          </Button>
        </div>

        {/* Botões de ação mobile */}
        <div className="flex gap-2 sm:flex-shrink-0 lg:hidden">
          <Button
            onClick={() => {
              /* Aplicar filtro de texto */
            }}
            disabled={!filters.searchValue}
            className="flex-1 sm:flex-none"
          >
            Filtrar
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-1 sm:flex-none"
          >
            Limpar
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
            {/* Seletor de tipo de busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de busca
              </label>
              <Select
                value={filters.searchType}
                onValueChange={handleFilterTypeChange}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Filtrar por</SelectLabel>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Componente DelayPeriodFilter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Período de Atraso
              </label>
              <DelayPeriodFilter
                selectedDelayPeriod={selectedDelayPeriod}
                onDelayPeriodChange={onDelayPeriodChange}
                recordCount={filteredData.length}
                showRecordCount={true}
                selectClassName="w-full"
                countClassName="text-sm text-gray-600 whitespace-nowrap"
              />
            </div>
          </div>
        </div>

        {/* Indicadores de filtros ativos */}
        {(filters.searchValue ||
          selectedPeriod !== "all" ||
          selectedDelayPeriod !== "all") && (
          <div className="flex flex-wrap gap-2 pb-3">
            {filters.searchValue && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {filters.searchValue}
                <button
                  onClick={() => handleSearchChange("")}
                  className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedPeriod !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Período: {selectedPeriod}
                <button
                  onClick={() => onPeriodChange("all")}
                  className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDelayPeriod !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Atraso: {selectedDelayPeriod}
                <button
                  onClick={() => onDelayPeriodChange("all")}
                  className="ml-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParcelasFilter;