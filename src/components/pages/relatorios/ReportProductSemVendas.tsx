"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import axios from "axios";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Package,
  DollarSign,
  MapPin,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface SaleData {
  codigo: string;
  nome: string;
  cnpj: string;
  codItem: string;
  descricao: string;
  ultimaNota?: number;
  ultimaData?: string;
  qtUltComp?: number;
  precoUltComp?: number;
  mediaQtHist?: number;
  estado: string;
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

export function ReportProductSemVendas() {
  const [saleData, setSaleData] = useState<SaleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof SaleData>("qtUltComp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [productName, setProductName] = useState<string>("");

  const itemsPerPage = 10;

  const getSearchType = (term: string): "cnpj" | "codigo" | "nome" => {
    if (!term.trim()) return "nome";
    const trimmed = term.trim();
    // Verifica se é CNPJ (formato exato: XX.XXX.XXX/XXXX-XX)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (cnpjRegex.test(trimmed)) return "cnpj";
    // Verifica se é código do cliente (ex: começa com C e seguido de números, ou alfanumérico curto)
    if (/^[Cc]\d{4,6}$/.test(trimmed) || /^\d{5,10}$/.test(trimmed))
      return "codigo";
    // Para nome do cliente: qualquer texto com pelo menos 3 caracteres e sem ser só números
    const lowerTrimmed = trimmed.toLowerCase();
    if (lowerTrimmed.length >= 3 && !/^\d+$/.test(lowerTrimmed)) return "nome";
    return "nome"; // default
  };

  const currentSearchType = getSearchType(productName);

  const isValidClientSearch = (term: string): boolean => {
    if (!term.trim()) return false;
    const trimmed = term.trim().toLowerCase();
    // Verifica se é CNPJ (formato aproximado: XX.XXX.XXX/XXXX-XX)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (cnpjRegex.test(term)) return true;
    // Verifica se é código do cliente (ex: começa com C e seguido de números, ou alfanumérico curto)
    if (/^[Cc]\d{4,6}$/.test(term) || /^\d{5,10}$/.test(term)) return true;
    // Para nome do cliente: qualquer texto com pelo menos 3 caracteres e sem ser só números
    if (trimmed.length >= 3 && !/^\d+$/.test(trimmed)) return true;
    return false;
  };

  const getUserInternalCode = (): number => {
    try {
      const authData = localStorage.getItem("authData");
      return authData ? JSON.parse(authData).internalCode || 0 : 0;
    } catch {
      return 0;
    }
  };

  const fetchSaleData = async (productName?: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (!isValidClientSearch(productName || "")) {
        setErrorMessage(
          "Use um termo de busca válido: número do CNPJ, nome do cliente ou código do cliente."
        );
        setSaleData([]);
        setIsLoading(false);
        return;
      }

      const internalCode = getUserInternalCode();
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      if (!token || internalCode === 0) {
        throw new Error(
          "Dados de autenticação incompletos. Faça login novamente."
        );
      }

      const ultParams = {
        slpCode: internalCode,
        filtro: productName || "",
      };


      const response = await axios.get("/api/external/Consultas/semvendas", {
        params: ultParams,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 500000,
      });

      let ultProcessed: SaleData[] = [];
      if (Array.isArray(response.data)) {
        ultProcessed = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        ultProcessed = response.data.data;
      } else if (response.data && Array.isArray(response.data.value)) {
        ultProcessed = response.data.value;
      }

      setSaleData(ultProcessed);
    } catch (error: any) {
      setSaleData([]);
      if (error.response?.status === 404) {
        const searchType = getSearchType(productName || "");
        let message = "";
        switch (searchType) {
          case "cnpj":
            message = `Não foram identificadas produtos sem vendas associadas ao cliente com o CNPJ "${productName}".`;
            break;
          case "codigo":
            message = `Não foram identificadas produtos sem vendas vinculadas ao código de cliente "${productName}".`;
            break;
          case "nome":
            message = `Não foram identificadas produtos sem vendas para o cliente denominado "${productName}".`;
            break;
          default:
            message = `Não foram identificadas produtos sem vendas relacionadas a "${productName}".`;
        }
        setErrorMessage(message);
      } else {
        setErrorMessage("Erro ao carregar dados. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setProductName("");
    setSaleData([]);
    setCurrentPage(1);
    setSortField("qtUltComp");
    setSortDirection("desc");
    setErrorMessage(null);
  };

  const filteredAndSortedData = saleData
    .filter((sale) => {
      const searchLower = searchTerm.toLowerCase();
      return Object.values(sale).some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

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

  const handleSort = (field: keyof SaleData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof SaleData) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === "asc" ? (
      <TrendingUp className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-blue-600" />
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setProductName(value);
    setCurrentPage(1);
  };

  const getEmptyStateMessage = () => {
    if (isLoading) return "Buscando Informações...";
    if (errorMessage) return errorMessage;
    if (searchTerm && saleData.length === 0)
      return "Realize sua consulta...";
    if (searchTerm) return "Nenhum resultado encontrado";
    return "Visualize Suas Informações";
  };

  const showSuggestions = !isLoading && !searchTerm && saleData.length === 0;
  const showSearchTip =
    searchTerm && saleData.length > 0 && filteredAndSortedData.length === 0;
  const showTips = showSuggestions || (!!errorMessage && !isLoading);

  const allTips = [
    { type: "cnpj", text: "CNPJ (ex.: 00.000.000/0000-00)" },
    { type: "nome", text: "Nome do Cliente (ex.: Notre Dame)" },
    { type: "codigo", text: "Código do Cliente (ex.: C26260)" },
  ];

  const tipItems = showSuggestions
    ? allTips
    : allTips.filter((tip) => tip.type !== currentSearchType);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6 ">
      <div className="bg-white/80 border rounded-2xl dark:bg-slate-800/80 dark:border-slate-700 backdrop-blur-sm ">
        <CardHeader className="p-5 sm:p-6  dark:from-indigo-900 dark:via-slate-900 dark:to-indigo-900  ">
          <div className="flex flex-col gap-5">
            {/* Título com ícone estilizado */}
            <CardTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-xl text-slate-900 dark:text-slate-100">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-800 dark:via-purple-700 dark:to-pink-700 flex items-center justify-center shadow-md animate-pulse">
                📊
              </div>
              <span className="font-semibold text-base sm:text-lg lg:text-xl">
                Relatório Detalhado de Produtos Sem Vendas
              </span>
            </CardTitle>

            {/* Barra de busca e botões */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Campo de busca */}
              <div className="relative flex-1 min-w-0 max-w-full sm:max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-300" />
                <Input
                  placeholder="Faça busca por Cliente, CNPJ ou Código do Cliente"
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="pl-10 pr-3 py-2 sm:py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm sm:text-base transition-all duration-300"
                  aria-label="Campo para filtro de produto e busca na tabela"
                />
              </div>

              {/* Botão Buscar */}
              <Button
                variant="default"
                size="sm"
                onClick={() => fetchSaleData(productName)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? "Carregando..." : "Buscar"}
              </Button>

              {/* Botão Limpar Filtro */}
              {(searchTerm !== "" || saleData.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilter}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1 px-3 py-2 text-sm sm:text-base rounded-lg transition-all duration-300"
                >
                  Limpar Filtro <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-1 sm:p-6">
          <div className="rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm ">
            <Table>
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("codigo")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("codigo")}
                    aria-sort={
                      sortField === "codigo"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Código
                      {getSortIcon("codigo")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("nome")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("nome")}
                    aria-sort={
                      sortField === "nome"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Cliente
                      {getSortIcon("nome")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("cnpj")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("cnpj")}
                    aria-sort={
                      sortField === "cnpj"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      CNPJ
                      {getSortIcon("cnpj")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("codItem")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("codItem")
                    }
                    aria-sort={
                      sortField === "codItem"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Código Item
                      {getSortIcon("codItem")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("descricao")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("descricao")
                    }
                    aria-sort={
                      sortField === "descricao"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Descrição
                      {getSortIcon("descricao")}
                    </div>
                  </TableHead>

                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("ultimaNota")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("ultimaNota")
                    }
                    aria-sort={
                      sortField === "ultimaNota"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Última Nota
                      {getSortIcon("ultimaNota")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("ultimaData")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("ultimaData")
                    }
                    aria-sort={
                      sortField === "ultimaData"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Última Data
                      {getSortIcon("ultimaData")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("qtUltComp")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("qtUltComp")
                    }
                    aria-sort={
                      sortField === "qtUltComp"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Qtde. da Última Compra (Unid.)
                      {getSortIcon("qtUltComp")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("precoUltComp")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("precoUltComp")
                    }
                    aria-sort={
                      sortField === "precoUltComp"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center  py-2">
                      Preço Unitário da Última Compra (R$)
                      {getSortIcon("precoUltComp")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("mediaQtHist")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSort("mediaQtHist")
                    }
                    aria-sort={
                      sortField === "mediaQtHist"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Média de Qtde. Histórica (Em Unid)
                      {getSortIcon("mediaQtHist")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold text-xs lg:text-sm"
                    onClick={() => handleSort("estado")}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("estado")}
                    aria-sort={
                      sortField === "estado"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center gap-2 py-2">
                      Estado
                      {getSortIcon("estado")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((sale, index) => (
                    <TableRow
                      key={index}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      role="row"
                    >
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.codigo}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 font-semibold text-base mb-1">
                            {sale.nome}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>Cliente</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.cnpj}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.codItem}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.descricao}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.ultimaNota || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.ultimaData
                            ? formatDate(sale.ultimaData)
                            : "Sem vendas"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.qtUltComp?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">
                          R$ {Number(sale.precoUltComp || 0).toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {sale.mediaQtHist?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell">
                        <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                          {(sale.estado)}
                        </div>
                      </TableCell>

                      <TableCell className="md:hidden p-2" colSpan={15}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {sale.nome}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Código: {sale.codigo} | Estado:{" "}
                                  {(sale.estado)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {sale.qtUltComp?.toLocaleString() || 0}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                  <DollarSign className="w-2 h-2 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Preço Últ. Compra
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(sale.precoUltComp || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                  <Package className="w-2 h-2 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Média Qt. Hist.
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {sale.mediaQtHist?.toLocaleString() || 0}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                                  <Calendar className="w-2 h-2 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Última Data
                                </span>
                              </div>
                              <div className="text-slate-900 dark:text-slate-100">
                                {sale.ultimaData
                                  ? formatDate(sale.ultimaData)
                                  : "Sem vendas"}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                  <MapPin className="w-2 h-2 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  CNPJ
                                </span>
                              </div>
                              <div className="text-slate-900 dark:text-slate-100">
                                {sale.cnpj}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center">
                                  <Package className="w-2 h-2 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Código Item
                                </span>
                              </div>
                              <div className="text-slate-900 dark:text-slate-100">
                                {sale.codItem}
                              </div>
                            </div>

                            <div className="col-span-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                  <Package className="w-2 h-2 text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Descrição
                                </span>
                              </div>
                              <div className="text-slate-900 dark:text-slate-100 text-sm">
                                {sale.descricao}
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
                      colSpan={15}
                      className="text-center py-20 relative overflow-hidden"
                    >
                      <motion.div
                        className="flex flex-col items-center gap-8 relative z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      >
                        {/* Ícone central com brilho pulsante */}
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 2, -2, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="relative"
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/30 via-indigo-400/20 to-transparent blur-2xl animate-pulse" />
                          <AlertCircle className="h-20 w-20 text-amber-500 drop-shadow-lg relative z-10" />
                        </motion.div>

                        {/* Título */}
                        <motion.h2
                          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          {getEmptyStateMessage()}
                        </motion.h2>

                        {/* Sugestões de busca */}
                        {showTips && (
                          <motion.div
                            className="text-sm text-center max-w-lg bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/70 shadow-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          >
                            <p className="mb-4 font-medium text-slate-700 dark:text-slate-300">
                              {showSuggestions
                                ? "Experimente buscar por:"
                                : "Tente buscar por:"}
                            </p>
                            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                              {tipItems.map((item, index) => (
                                <motion.li
                                  key={index}
                                  className="flex items-center gap-3 cursor-pointer group"
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{
                                    delay: 0.6 + index * 0.1,
                                    duration: 0.4,
                                  }}
                                  whileHover={{ x: 6 }}
                                >
                                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full group-hover:scale-125 transition-transform" />
                                  <span className="text-blue-600 dark:text-blue-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors group-hover:underline">
                                    {item.text}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        )}

                        {/* Dica de pesquisa */}
                        {showSearchTip && (
                          <motion.p
                            className="text-sm mt-3 text-slate-500 dark:text-slate-400 italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                          >
                            Tente ajustar os termos de busca ou limpar o filtro.
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Fundo com gradiente animado */}
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 opacity-60 blur-3xl" />
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
                  Venda{filteredAndSortedData.length !== 1 ? "s" : ""}{" "}
                  encontrado
                  {filteredAndSortedData.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}