"use client";

import { TableHeader } from "@/components/ui/table";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  AlertCircle,
  Package,
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientGroupData {
  mes: number;
  ano: number;
  setor: string;
  valor_Total: number;
  representante: string;
  slpCode: number;
}

interface PaginacaoProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

interface PeriodOption {
  value: string;
  label: string;
  year: number;
}

const getMonthName = (monthNumber: number): string => {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[monthNumber - 1] || `Mês ${monthNumber}`;
};

const getSectorDescription = (setor: string): string => {
  const sectorMap: { [key: string]: string } = {
    CLINICA: "Clínica Distrib.",
    FARMACIA: "Farma Distrib.",
    HOSPITAL: "Hosp Hospital",
    DISTRIBUIDOR: "Distrib. Geral",
    LABORATORIO: "Lab. Análises",
  };

  // Try to find a match in the sector name
  for (const [key, description] of Object.entries(sectorMap)) {
    if (setor.toUpperCase().includes(key)) {
      return description;
    }
  }

  // If no match found, return a shortened version
  return setor.length > 15 ? setor.substring(0, 15) + "..." : setor;
};

const Paginacao = ({
  currentPage,
  pageCount,
  onPageChange,
}: PaginacaoProps) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(pageCount - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < pageCount - 1) {
      rangeWithDots.push("...", pageCount);
    } else {
      rangeWithDots.push(pageCount);
    }

    return rangeWithDots;
  };

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getVisiblePages().map((page, index) => (
        <Button
          key={index}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className="h-8 w-8 p-0"
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const handleBarClick = (_data: any) => {
  // You can add more interactive functionality here
};

export function ReportClientGroup() {
  const [clientGroupData, setClientGroupData] = useState<ClientGroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] =
    useState<keyof ClientGroupData>("valor_Total");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const itemsPerPage = 10;

  const generatePeriodOptions = (): PeriodOption[] => {
    const options: PeriodOption[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 1; i++) {
      const year = currentYear - i;
      const value = year.toString();
      const label = `Ano ${year}`;

      options.push({
        value,
        label,
        year,
      });
    }

    return options;
  };

  const periodOptions = generatePeriodOptions();

  useEffect(() => {
    if (periodOptions.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periodOptions[0].value);
    }
  }, []);

  const getUserInternalCode = (): number => {
    try {
      const authData = localStorage.getItem("authData");
      return authData ? JSON.parse(authData).internalCode || 0 : 0;
    } catch {
      return 0;
    }
  };

  const fetchClientGroupData = async (period?: string) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const internalCode = getUserInternalCode();

      if (internalCode === 0) {
        throw new Error(
          "InternalCode não encontrado no authData. Verifique se você está logado corretamente."
        );
      }

      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Token de autorização não encontrado. Verifique se você está logado."
        );
      }

      const periodToUse = period || selectedPeriod;
      const currentYear =
        Number.parseInt(periodToUse) || new Date().getFullYear();

      const response = await axios.get("/api/external/Consultas/consgrucl", {
        params: {
          slpCode: internalCode,
          numAno: currentYear,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      let processedData: ClientGroupData[] = [];

      if (Array.isArray(response.data)) {
        processedData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        processedData = response.data.data;
      } else if (
        response.data &&
        response.data.value &&
        Array.isArray(response.data.value)
      ) {
        processedData = response.data.value;
      } else {
        processedData = [];
      }

      setClientGroupData(processedData);
    } catch (error: any) {
      let errorMessage = "Erro ao carregar dados da API";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 401:
            errorMessage =
              "Erro de autorização (401). Verifique se o token está válido e se você tem permissão para acessar esta API.";
            break;
          case 403:
            errorMessage =
              "Acesso negado (403). Você não tem permissão para acessar este recurso.";
            break;
          case 404:
            errorMessage =
              "API não encontrada (404). Verifique se a URL está correta.";
            break;
          case 500:
            errorMessage =
              "Erro interno do servidor (500). Tente novamente mais tarde.";
            break;
          default:
            errorMessage = `Erro ${status}: ${
              error.response.statusText || "Erro desconhecido"
            }`;
        }
      } else if (error.request) {
        errorMessage =
          "Erro de conexão. Verifique sua internet e se o servidor está disponível.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod) {
      fetchClientGroupData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setCurrentPage(1);
  };

  const totalClients = clientGroupData.length;
  const totalValue = clientGroupData.reduce(
    (acc, client) => acc + client.valor_Total,
    0
  );
  const avgValue = totalClients > 0 ? totalValue / totalClients : 0;
  const uniqueSetores = new Set(clientGroupData.map((client) => client.setor))
    .size;

  const professionalColors = [
    "#1e40af", // Blue-800
    "#374151", // Gray-700
    "#0f766e", // Teal-700
    "#7c3aed", // Violet-600
    "#dc2626", // Red-600
    "#059669", // Emerald-600
    "#d97706", // Amber-600
    "#be185d", // Pink-700
    "#4338ca", // Indigo-700
    "#065f46", // Emerald-800
  ];

  const monthlyChartData = clientGroupData.reduce((acc, client) => {
    const monthKey = `${getMonthName(client.mes)} ${client.ano}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        name: monthKey,
        monthName: getMonthName(client.mes),
        month: client.mes,
        year: client.ano,
        value: 0,
        setores: new Set(),
        representantes: new Set(),
      };
    }

    acc[monthKey].value += client.valor_Total;
    acc[monthKey].setores.add(getSectorDescription(client.setor));
    acc[monthKey].representantes.add(client.representante);

    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyChartData)
  .sort((a: any, b: any) => {
    // Sort by year first, then by month for chronological order
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.month - b.month;
  })
  .map((item: any, index: number) => ({
    ...item,
    setores: Array.from(item.setores).join(", "),
    representantesCount: item.representantes.size,
    color: professionalColors[index % professionalColors.length],
  }));

  const setorChartData = clientGroupData.reduce((acc, client) => {
    const setorName =
      client.setor.length > 25
        ? client.setor.substring(0, 25) + "..."
        : client.setor;

    if (!acc[setorName]) {
      acc[setorName] = {
        name: setorName,
        fullName: client.setor,
        value: 0,
        representantes: new Set(),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      };
    }

    acc[setorName].value += client.valor_Total;
    acc[setorName].representantes.add(client.representante);

    return acc;
  }, {} as Record<string, any>);

  const sectorChartData = Object.values(setorChartData)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10)
    .map((item: any, index: number) => ({
      ...item,
      representantes: item.representantes.size,
      color: professionalColors[index % professionalColors.length],
      total: Object.values(setorChartData).reduce(
        (acc: number, curr: any) => acc + curr.value,
        0
      ),
    }));

  const filteredAndSortedData = clientGroupData
    .filter(
      (client) =>
        client.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.representante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMonthName(client.mes)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === "mes") {
        // Sort by month number for proper chronological order
        return sortDirection === "asc" ? a.mes - b.mes : b.mes - a.mes;
      }

      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: keyof ClientGroupData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof ClientGroupData) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <TrendingUp className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-blue-600" />
    );
  };

  const getCurrentPeriodLabel = () => {
    const selectedOption = periodOptions.find(
      (option) => option.value === selectedPeriod
    );
    return selectedOption ? selectedOption.label : "Período atual";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {label}
          </p>
          <p className="text-green-600 dark:text-green-400 font-bold">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Setores: {data.setores}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Representantes: {data.representantesCount}
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCardSkeleton = () => (
    <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
          <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-700 rounded-lg sm:rounded-xl">
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 rounded" />
          </div>
          <div className="text-center sm:text-left">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TopSectorSkeleton = () => (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Skeleton className="w-6 h-6 rounded-sm shadow-lg border-2 border-white dark:border-slate-800" />
          <Skeleton className="absolute -top-1 -right-1 w-4 h-4 rounded-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-1 justify-end mt-1">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number, iconBgClass = "bg-slate-100 dark:bg-slate-700", _iconTextClass = "text-slate-700 dark:text-slate-300") => (
    <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
          <div className={`p-2 sm:p-3 ${iconBgClass} rounded-lg sm:rounded-xl`}>
            {icon}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              {label}
            </p>
            <p
              className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100"
              aria-label={`${value} ${label.toLowerCase()}`}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Users className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Relatório de Grupos de Clientes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Defina o período desejado para gerar a análise detalhada de grupos
              de clientes por setor e representante.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClientGroupData(selectedPeriod)}
            disabled={isLoading}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {renderStatCard(
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-slate-700 dark:text-slate-300" />,
              "Total Setores",
              uniqueSetores
            )}
            {renderStatCard(
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-700 dark:text-green-400" />,
              "Valor Total",
              formatCurrency(totalValue),
              "bg-green-100 dark:bg-green-900/30",
              "text-green-700 dark:text-green-400"
            )}
            {renderStatCard(
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700 dark:text-blue-400" />,
              "Valor Médio",
              formatCurrency(avgValue),
              "bg-blue-100 dark:bg-blue-900/30",
              "text-blue-700 dark:text-blue-400"
            )}
            {renderStatCard(
              <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-teal-700 dark:text-teal-400" />,
              "Total Registros",
              totalClients,
              "bg-teal-100 dark:bg-teal-900/30",
              "text-teal-700 dark:text-teal-400"
            )}
          </>
        )}
      </div>

      {chartData.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <span className="text-sm sm:text-base lg:text-lg">
                Top 5 Meses por Valor (200k - 1.2M)
              </span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Gráfico dos 12 meses com maior faturamento na faixa de R$ 200.000 a
              R$ 1.200.000
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-80">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" vertical={false} />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `R$ ${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      fill="#1e40af"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                Top 5 Setores por Valor
              </div>
            </div>
            <div className="grid gap-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => <TopSectorSkeleton key={index} />)
              ) : (
                sectorChartData.slice(0, 5).map((setor, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    onClick={() => handleBarClick(setor)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-sm shadow-lg border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: setor.color }}
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 dark:bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                          {setor.fullName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-slate-100 font-bold text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {formatCurrency(setor.value)}
                      </span>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          #{index + 1}º lugar
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  📊
                </div>
                <span className="text-sm sm:text-base lg:text-lg">
                  Relatório Detalhado de Grupos de Clientes
                </span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">
                Análise detalhada dos grupos de clientes para{" "}
                {getCurrentPeriodLabel()}. Baseado em <b>{totalClients}</b>{" "}
                registros encontrados.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar setor, representante ou mês..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 text-sm sm:text-base"
                  aria-label="Campo de busca para filtrar grupos de clientes"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 w-full sm:w-auto"
                aria-label="Filtros adicionais"
              >
                <Building2 className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Filtros</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-1 sm:p-6">
          <div className="rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("setor")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("setor")}
                    aria-sort={
                      sortField === "setor"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Setor
                      {getSortIcon("setor")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("representante")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("representante")
                    }
                    aria-sort={
                      sortField === "representante"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Representante
                      {getSortIcon("representante")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("mes")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("mes")}
                    aria-sort={
                      sortField === "mes"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Mês
                      {getSortIcon("mes")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("ano")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("ano")}
                    aria-sort={
                      sortField === "ano"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Ano
                      {getSortIcon("ano")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("valor_Total")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("valor_Total")
                    }
                    aria-sort={
                      sortField === "valor_Total"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Valor Total
                      {getSortIcon("valor_Total")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      role="row"
                    >
                      <TableCell className="py-4 hidden md:table-cell">
                        <div>
                          <Skeleton className="h-5 w-48 mb-1" />
                          <Skeleton className="h-3.5 w-24" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <Skeleton className="h-6 w-24" />
                      </TableCell>

                      <TableCell className="md:hidden p-2" colSpan={5}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24 mt-1" />
                              </div>
                            </div>
                            <Skeleton className="h-6 w-24" />
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((client, index) => (
                    <TableRow
                      key={index}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      role="row"
                    >
                      {/* Desktop view */}
                      <TableCell className="py-4 hidden md:table-cell">
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 font-semibold text-base mb-1">
                            {client.setor}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>Setor</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {client.representante}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {getMonthName(client.mes)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {client.ano}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">
                          {formatCurrency(client.valor_Total)}
                        </div>
                      </TableCell>

                      {/* Mobile view */}
                      <TableCell className="md:hidden p-2" colSpan={5}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {client.setor}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {getMonthName(client.mes)}/{client.ano}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(client.valor_Total)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Users className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Representante
                                </span>
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right max-w-40 truncate">
                                {client.representante}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableCell
                      colSpan={5}
                      className="text-center text-slate-500 dark:text-slate-400 py-16"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-12 w-12 opacity-50" />
                        <div className="text-lg font-medium">
                          {searchTerm
                            ? "Nenhum resultado encontrado"
                            : "Nenhum dado disponível"}
                        </div>
                        {searchTerm && (
                          <p className="text-sm">
                            Tente ajustar os termos de busca ou limpar o filtro
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 md:flex-row items-center justify-between dark:text-gray-300 mt-6 space-y-4 md:space-y-0">
            <div className="w-full md:flex-1 order-2 md:order-1 md:flex">
              <Paginacao
                currentPage={currentPage}
                pageCount={totalPages}
                onPageChange={handlePageChange}
              />
            </div>

            <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider group order-1 md:order-2">
              <div className="relative">
                <span className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 text-white px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 font-mono text-sm">
                  {filteredAndSortedData.length}
                </span>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-slate-500 dark:group-hover:text-slate-300">
                  Cliente{filteredAndSortedData.length !== 1 ? "s" : ""}{" "}
                  encontrado
                  {filteredAndSortedData.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}