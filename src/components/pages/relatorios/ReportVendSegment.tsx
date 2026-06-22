"use client";

import { useState, useEffect } from "react";
import axios from "@/utils/axiosConfig";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Calendar,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Search,
  AlertCircle,
  Layers,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

interface SegmentData {
  segmento: string;
  representante: string;
  totalVendas: number;
  id: number;
}

interface PeriodOption {
  value: string;
  label: string;
  month: number;
  year: number;
}

interface PaginacaoProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const BAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

const Paginacao = ({ currentPage, pageCount, onPageChange }: PaginacaoProps) => {
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
          {label}
        </p>
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {`R$ ${payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        </p>
      </div>
    );
  }
  return null;
};

const generatePeriodOptions = (): PeriodOption[] => {
  const options: PeriodOption[] = [];
  const currentDate = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const value = `${year}-${month.toString().padStart(2, "0")}`;
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    options.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      month,
      year,
    });
  }

  return options;
};

const getUserInternalCode = (): number => {
  try {
    const authData = tokenStore.getAuthData();
    return authData ? JSON.parse(authData).internalCode || 0 : 0;
  } catch {
    return 0;
  }
};

const getToken = (): string | null =>
  tokenStore.getToken() ||
  tokenStore.getToken() ||
  tokenStore.getToken() ||
  tokenStore.getToken() ||
  tokenStore.getToken();

export function ReportVendSegment() {
  const [data, setData] = useState<SegmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Omit<SegmentData, "id">>("totalVendas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const itemsPerPage = 10;
  const periodOptions = generatePeriodOptions();

  useEffect(() => {
    if (periodOptions.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periodOptions[0].value);
    }
  }, []);

  const fetchData = async (period?: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const internalCode = getUserInternalCode();
      const token = getToken();

      if (internalCode === 0) throw new Error("InternalCode não encontrado. Verifique se está logado.");
      if (!token) throw new Error("Token não encontrado. Verifique se está logado.");

      const periodToUse = period || selectedPeriod;
      const selectedOption = periodOptions.find((o) => o.value === periodToUse);

      const currentDate = new Date();
      const numMes = selectedOption ? selectedOption.month : currentDate.getMonth() + 1;
      const numAno = selectedOption ? selectedOption.year : currentDate.getFullYear();

      const response = await axios.get(`${apiBase}/Consultas/consvdseg`, {
        params: { numMes, numAno, slpCode: internalCode },
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 30000,
      });

      

      let processed: SegmentData[] = [];
      if (Array.isArray(response.data)) processed = response.data;
      else if (response.data?.data) processed = response.data.data;
      else if (response.data?.value) processed = response.data.value;

      setData(processed);
    } catch (error: any) {
      let msg = "Erro ao carregar dados.";
      if (error.response) {
        const s = error.response.status;
        if (s === 401) msg = "Não autorizado (401). Token inválido ou expirado.";
        else if (s === 403) msg = "Acesso negado (403).";
        else if (s === 404) msg = "Endpoint não encontrado (404).";
        else if (s === 500) msg = "Erro interno do servidor (500).";
        else msg = `Erro ${s}: ${error.response.statusText}`;
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriod) fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Omit<SegmentData, "id">) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof Omit<SegmentData, "id">) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <TrendingUp className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-blue-600" />
    );
  };

  const getCurrentPeriodLabel = () =>
    periodOptions.find((o) => o.value === selectedPeriod)?.label ?? "Período atual";

  const filteredAndSorted = data
    .filter(
      (item) =>
        item.segmento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.representante.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number")
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const totalVendas = data.reduce((acc, i) => acc + i.totalVendas, 0);
  const uniqueSegments = new Set(data.map((i) => i.segmento)).size;
  const uniqueReps = new Set(data.map((i) => i.representante)).size;
  const avgVendas = data.length > 0 ? totalVendas / data.length : 0;

  const chartData = Object.values(
    data.reduce(
      (acc, item) => {
        if (!acc[item.segmento]) acc[item.segmento] = { name: item.segmento, value: 0 };
        acc[item.segmento].value += item.totalVendas;
        return acc;
      },
      {} as Record<string, { name: string; value: number }>
    )
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((item, i) => ({ ...item, color: BAR_COLORS[i % BAR_COLORS.length] }));

  const StatCardSkeleton = () => (
    <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number) => (
    <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">{icon}</div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6">
      {/* Header com filtro de período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Vendas por Segmento
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Defina o período desejado para gerar a análise por segmento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
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
            onClick={() => fetchData(selectedPeriod)}
            disabled={isLoading}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
              "Total Vendas",
              `R$ ${totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            )}
            {renderStatCard(
              <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />,
              "Segmentos",
              uniqueSegments
            )}
            {renderStatCard(
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
              "Representantes",
              uniqueReps
            )}
            {renderStatCard(
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
              "Média por Registro",
              `R$ ${avgVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            )}
          </>
        )}
      </div>

      {/* Gráfico de barras */}
      <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">📊</div>
            Top 10 Segmentos por Vendas
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            Ranking dos segmentos com maior volume de vendas em {getCurrentPeriodLabel()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <Skeleton className="h-[380px] w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-[380px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="h-10 w-10 opacity-40" />
                <p>Nenhum dado disponível para o período selecionado.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={90}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">🗂️</div>
                Detalhamento por Segmento
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Dados completos de vendas por segmento e representante para {getCurrentPeriodLabel()}.
              </CardDescription>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por segmento ou representante..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-1 sm:p-6">
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700">
                  <TableHead
                    className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("segmento")}
                  >
                    <div className="flex items-center gap-2 py-2">
                      Segmento {getSortIcon("segmento")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("representante")}
                  >
                    <div className="flex items-center gap-2 py-2">
                      Representante {getSortIcon("representante")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-slate-700 dark:text-slate-300 font-semibold text-xs lg:text-sm text-right"
                    onClick={() => handleSort("totalVendas")}
                  >
                    <div className="flex items-center gap-2 py-2 justify-end">
                      Total de Vendas {getSortIcon("totalVendas")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-200 dark:border-slate-700">
                      <TableCell className="py-4"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="py-4"><Skeleton className="h-5 w-56" /></TableCell>
                      <TableCell className="py-4 text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginated.length > 0 ? (
                  paginated.map((item, index) => (
                    <TableRow
                      key={item.id ?? index}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                BAR_COLORS[
                                chartData.findIndex((c) => c.name === item.segmento) % BAR_COLORS.length
                                ] ?? "#94a3b8",
                            }}
                          />
                          {item.segmento}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-slate-700 dark:text-slate-300 text-sm">
                        {item.representante}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          R${" "}
                          {item.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                        <AlertCircle className="h-10 w-10 opacity-40" />
                        <p className="font-medium">
                          {errorMessage ?? (searchTerm ? "Nenhum resultado encontrado." : "Nenhum dado disponível para o período selecionado.")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 md:flex-row items-center justify-between mt-6">
            <div className="w-full md:flex-1 order-2 md:order-1 md:flex">
              <Paginacao currentPage={currentPage} pageCount={totalPages} onPageChange={setCurrentPage} />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider order-1 md:order-2">
              <div className="relative">
                <span className="bg-gradient-to-r from-sky-900 to-slate-600 dark:from-indigo-600 dark:to-purple-700 text-white px-3 py-1.5 rounded-full font-mono text-sm">
                  {filteredAndSorted.length}
                </span>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <span className="text-gray-500 dark:text-gray-400">
                registro{filteredAndSorted.length !== 1 ? "s" : ""} encontrado{filteredAndSorted.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
