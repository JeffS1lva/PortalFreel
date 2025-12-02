"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ConsultaLiveData {
  codigo_Cliente: string;
  cliente: string;
  ddd: string;
  telefone: string;
  e_mail: string;
  ativo: string;
  grupo: string;
  representante: string;
  dt_Ult_Pedido: string;
  dias_Sem_Compra: number;
}

interface PaginacaoProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

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

const getUserInternalCode = (): number => {
  try {
    const authData = localStorage.getItem("authData");
    return authData ? JSON.parse(authData).internalCode || 0 : 0;
  } catch {
    return 0;
  }
};

export function ReportClientVend() {
  const [consultasData, setConsultasData] = useState<ConsultaLiveData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] =
    useState<keyof ConsultaLiveData>("dias_Sem_Compra");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchConsultasData = async () => {
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

      const response = await axios.get("/api/external/Consultas/consclive", {
        params: { slpCode: internalCode },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      let processedData: ConsultaLiveData[] = [];

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

      setConsultasData(processedData);
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
    fetchConsultasData();
  }, []);

  const filteredAndSortedData = consultasData
    .filter((client) => client.ativo === "S") // ← Apenas ativos
    .filter((client) => client.dias_Sem_Compra <= 180) // ← Máximo 180 dias
    .filter(
      (client) =>
        client.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.codigo_Cliente
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        client.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.representante.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: keyof ConsultaLiveData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof ConsultaLiveData) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <TrendingUp className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-blue-600" />
    );
  };

  const getStatusColor = (dias: number) => {
    if (dias > 60)
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    if (dias > 30)
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
  };

  const getStatusIcon = (dias: number) => {
    if (dias > 60) return <XCircle className="h-4 w-4" />;
    if (dias > 30) return <Clock className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6">
      <Card className="bg-white/80 dark:bg-slate-800/80  dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  📊
                </div>
                <span className="text-sm sm:text-base lg:text-lg">
                  Relatório Detalhado de Clientes
                </span>
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por Nome do Cliente, Código do Cliente..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  aria-label="Campo de busca para filtrar clientes"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 w-full sm:w-auto"
                aria-label="Filtros adicionais"
              >
                <Filter className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Filtros</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-1 sm:p-6">
          <div className="rounded-lg sm:rounded-xl  border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("codigo_Cliente")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("codigo_Cliente")
                    }
                    aria-sort={
                      sortField === "codigo_Cliente"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Código
                      {getSortIcon("codigo_Cliente")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("cliente")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("cliente")
                    }
                    aria-sort={
                      sortField === "cliente"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Cliente
                      {getSortIcon("cliente")}
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 font-semibold py-2 text-xs lg:text-sm">
                    Contato
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("grupo")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("grupo")}
                    aria-sort={
                      sortField === "grupo"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Grupo
                      {getSortIcon("grupo")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("dias_Sem_Compra")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("dias_Sem_Compra")
                    }
                    aria-sort={
                      sortField === "dias_Sem_Compra"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Última Compra
                      {getSortIcon("dias_Sem_Compra")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("ativo")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("ativo")}
                    aria-sort={
                      sortField === "ativo"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Status
                      {getSortIcon("ativo")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors md:table-row"
                      role="row"
                    >
                      <div className="hidden md:contents">
                        <TableCell className="py-4">
                          <Skeleton className="h-8 w-16" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-8 w-48" />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3.5 w-40 mt-1" />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-8 w-24" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-8 w-16" />
                        </TableCell>
                      </div>

                      <TableCell className="md:hidden p-0" colSpan={6}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl m-2 p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24 mt-1" />
                              </div>
                            </div>
                            <Skeleton className="h-6 w-16" />
                          </div>
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-6 w-6 rounded-full" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton
                                  className={`h-4 w-${i === 2 ? "40" : "24"}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((consulta, index) => (
                    <TableRow
                      key={index}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors md:table-row"
                      role="row"
                    >
                      <div className="hidden md:contents">
                        <TableCell className="py-4">
                          <div className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 font-medium">
                            {consulta.codigo_Cliente}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <div className="text-slate-900 dark:text-slate-100 font-semibold text-base mb-1">
                              {consulta.cliente}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              <span>Rep: {consulta.representante}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-500" />
                              <span>
                                ({consulta.ddd}) {consulta.telefone}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-500" />
                              <span
                                className="truncate max-w-[200px]"
                                title={consulta.e_mail}
                              >
                                {consulta.e_mail}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {consulta.grupo}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm ${getStatusColor(
                                consulta.dias_Sem_Compra
                              )}`}
                            >
                              {getStatusIcon(consulta.dias_Sem_Compra)}
                              <span>{consulta.dias_Sem_Compra} dias</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={`flex items-center gap-2 px-3 py-2 font-medium ${
                              consulta.ativo === "S"
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                            } border`}
                          >
                            {consulta.ativo === "S" ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </div>

                      <TableCell className="md:hidden p-0" colSpan={6}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl m-2 p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                          {/* Header do Card */}
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {consulta.cliente}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Código: {consulta.codigo_Cliente}
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                  consulta.ativo === "S"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {consulta.ativo === "S" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    Inativo
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>

                          {/* Conteúdo Principal */}
                          <div className="space-y-3">
                            {/* Representante */}
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Building2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Representante
                                </span>
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right max-w-32 truncate">
                                {consulta.representante}
                              </div>
                            </div>

                            {/* Telefone */}
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Phone className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Telefone
                                </span>
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right">
                                ({consulta.ddd}) {consulta.telefone}
                              </div>
                            </div>

                            {/* Email */}
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Mail className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Email
                                </span>
                              </div>
                              <div
                                className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right max-w-40 truncate"
                                title={consulta.e_mail}
                              >
                                {consulta.e_mail}
                              </div>
                            </div>

                            {/* Grupo */}
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Users className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Grupo
                                </span>
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs"
                                >
                                  {consulta.grupo}
                                </Badge>
                              </div>
                            </div>

                            {/* Dias sem compra */}
                            <div className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                  <Calendar className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Última Compra
                                </span>
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium text-right">
                                <div
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(
                                    consulta.dias_Sem_Compra
                                  )}`}
                                >
                                  {getStatusIcon(consulta.dias_Sem_Compra)}
                                  <span>{consulta.dias_Sem_Compra} dias</span>
                                </div>
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
                      colSpan={6}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
