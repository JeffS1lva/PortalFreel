"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import { useParcelasAtrasadasColumns } from "@/hooks/useParcelasAtrasadas";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paginacao } from "@/components/pages/Paginacao";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import LoadingExample from "./Loading/Loading";
import { jwtDecode } from "jwt-decode";
import ParcelasFilter from "./ParcelasFilter/ParcelasFilter";
import { filterParcelasByDelayPeriod } from "@/components/pages/ParcelasFilter/PeriodFilter";
import EmptyBoletosError from "./ParcelasFilter/EmptyBoletosError";
import { StatusLegend } from "./ParcelasFilter/StatusLegend";

// ========== INTERFACES ==========
interface TokenDecoded {
  exp: number;
  [key: string]: any;
}

interface Totals {
  count: number;
  totalOriginal: number;
  totalExibidas: number;
}

// ========== UTILITIES ==========
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: TokenDecoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const getUserInternalCode = (): number => {
  try {
    const authData = localStorage.getItem("authData");
    return authData ? JSON.parse(authData).internalCode || 0 : 0;
  } catch {
    return 0;
  }
};

const calculateDiasAtraso = (dataVencimento: string): number => {
  try {
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    vencimento.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    return Math.max(
      0,
      Math.ceil((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
    );
  } catch {
    return 0;
  }
};

// ========== FORMATTERS ==========
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateString;
  }
};

const getDelayBadgeColor = (diasAtraso: number): string => {
  if (diasAtraso <= 30)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  if (diasAtraso <= 60)
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
};

// ========== MOBILE CARD COMPONENTS ==========
const MobileCardHeader: React.FC<{ parcela: ParcelaAtrasada }> = ({
  parcela,
}) => (
  <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Doc. {parcela.numeroDocumento}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {parcela.nomeParceiroNegocio.length > 25
            ? `${parcela.nomeParceiroNegocio.slice(0, 25)}...`
            : parcela.nomeParceiroNegocio}
        </div>
      </div>
    </div>
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${getDelayBadgeColor(
        parcela.diasAtraso
      )}`}
    >
      {parcela.diasAtraso} dias
    </span>
  </div>
);

const MobileCardValues: React.FC<{ parcela: ParcelaAtrasada }> = ({
  parcela,
}) => (
  <div className="flex justify-between gap-4 mb-4">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <svg
          className="w-3 h-3 text-blue-600 dark:text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Valor Total
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(parcela.valorTotal)}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <svg
          className="w-3 h-3 text-green-600 dark:text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Saldo Devido
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(parcela.saldoDevido)}
        </div>
      </div>
    </div>
  </div>
);

interface MobileCardDetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MobileCardDetailRow: React.FC<MobileCardDetailRowProps> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex justify-between items-center py-2">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
      {value}
    </div>
  </div>
);

const MobileCardDetails: React.FC<{ parcela: ParcelaAtrasada }> = ({
  parcela,
}) => (
  <div className="space-y-3">
    <MobileCardDetailRow
      icon={
        <svg
          className="w-3 h-3 text-gray-600 dark:text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      }
      label="Vencimento"
      value={formatDate(parcela.dataVencimento)}
    />
    <MobileCardDetailRow
      icon={
        <svg
          className="w-3 h-3 text-gray-600 dark:text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      }
      label="Emissão"
      value={formatDate(parcela.dataEmissao)}
    />
    <MobileCardDetailRow
      icon={
        <svg
          className="w-3 h-3 text-gray-600 dark:text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      }
      label="Código Cliente"
      value={parcela.codigoParceiroNegocio}
    />
    <MobileCardDetailRow
      icon={
        <svg
          className="w-3 h-3 text-gray-600 dark:text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      }
      label="Tipo"
      value={parcela.tipoDocumento}
    />
  </div>
);

const MobileCard: React.FC<{ parcela: ParcelaAtrasada }> = ({ parcela }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl m-2 p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
    <MobileCardHeader parcela={parcela} />
    <MobileCardValues parcela={parcela} />
    <MobileCardDetails parcela={parcela} />
  </div>
);

// ========== EMPTY STATE COMPONENT ==========
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm">
      Nenhuma parcela encontrada
    </p>
    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
      Tente ajustar os filtros de pesquisa
    </p>
  </div>
);

// ========== MAIN COMPONENT ==========
export const ParcelasAtrasadas: React.FC = () => {
  // ========== STATES ==========
  const [parcelasOriginais, setParcelasOriginais] = useState<ParcelaAtrasada[]>(
    []
  );
  const [parcelasExibidas, setParcelasExibidas] = useState<ParcelaAtrasada[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados da tabela
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Estados para os filtros de período
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedDelayPeriod, setSelectedDelayPeriod] = useState<string>("all");

  // ========== HOOKS ==========
  const navigate = useNavigate();
  const columns = useParcelasAtrasadasColumns();

  // ========== DATA PROCESSING ==========
  const normalizeApiData = useCallback((rawData: any[]): ParcelaAtrasada[] => {
    return rawData
      .filter((item) => item && typeof item === "object")
      .map((item: any): ParcelaAtrasada => {
        const diasAtraso = calculateDiasAtraso(item.dataVencimento || "");
        return {
          codigoVendedor: Number(item.codigoVendedor) || 0,
          tipoDocumento: String(item.tipoDocumento || "NF"),
          idDocumento: String(item.id || item.idDocumento || ""),
          numeroDocumento: String(item.numNF || item.numeroDocumento || ""),
          dataEmissao: String(item.dataEmissao || new Date().toISOString()),
          dataVencimento: String(item.dataVencimento || ""),
          codigoParceiroNegocio: String(
            item.codigoPN || item.codigoParceiroNegocio || ""
          ),
          nomeParceiroNegocio: String(
            item.nomePN || item.nomeParceiroNegocio || ""
          ),
          valorTotal: Number(item.valorParcela || item.valorTotal || 0),
          saldoDevido: Number(
            item.valorParcela || item.saldoDevido || item.valorTotal || 0
          ),
          diasAtraso,
          chaveNFe: String(item.chaveNFe || ""),
          idRegistro: Number(item.id || item.idRegistro || 0),
          filial: String(item.filial || ""),
          internalCode: Number(item.internalCode || item.codigoVendedor || 0),
          pedidosCompra: String(item.pedidosCompra || ""),
        };
      });
  }, []);

  const extractApiData = useCallback((responseData: any): any[] => {
    if (Array.isArray(responseData)) return responseData;

    const possiblePaths = [
      "data",
      "parcelas",
      "value",
      "results",
      "items",
      "content",
    ];

    for (const path of possiblePaths) {
      if (Array.isArray(responseData[path])) return responseData[path];
    }

    // Find any array in response
    for (const key of Object.keys(responseData)) {
      if (Array.isArray(responseData[key])) return responseData[key];
    }

    return [];
  }, []);

  // ========== API CALLS ==========
  const carregarDadosIniciais = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const slpCode = getUserInternalCode();
      if (!slpCode) {
        setError("Código do usuário não encontrado. Faça login novamente.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      const response = await axios.get("/api/external/Parcelas/atrasadas", {
        params: { slpCode },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      const rawData = extractApiData(response.data);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setParcelasOriginais([]);
        setParcelasExibidas([]);
        setError("empty");
        return;
      }

      const normalizedData = normalizeApiData(rawData);
      setParcelasOriginais(normalizedData);
      setParcelasExibidas(normalizedData);
      setError(normalizedData.length === 0 ? "empty" : null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        switch (status) {
          case 401:
            localStorage.clear();
            navigate("/login");
            break;
          case 500:
            setError("Erro interno no servidor. Tente novamente mais tarde.");
            break;
          case 403:
            setError("Acesso negado. Verifique suas permissões.");
            break;
          case 404:
            setError("Endpoint não encontrado. Verifique a URL da API.");
            break;
          default:
            if (err.code === "ECONNABORTED") {
              setError("Timeout na requisição. Tente novamente.");
            } else {
              setError(`Erro na API: ${status || "Desconhecido"}`);
            }
        }
      } else {
        setError("Erro de conexão. Verifique sua internet.");
      }
      setParcelasOriginais([]);
      setParcelasExibidas([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, extractApiData, normalizeApiData]);

  // ========== EVENT HANDLERS ==========
  const handleFilteredDataChange = useCallback(
    (dadosFiltrados: ParcelaAtrasada[]) => {
      const dadosComFiltroPeriodo =
        selectedDelayPeriod === "all"
          ? dadosFiltrados
          : filterParcelasByDelayPeriod(dadosFiltrados, selectedDelayPeriod);

      setParcelasExibidas(dadosComFiltroPeriodo);
      setColumnFilters([]);
      setError(dadosComFiltroPeriodo.length === 0 ? "empty" : null);
    },
    [selectedDelayPeriod]
  );

  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);

  const handleDelayPeriodChange = useCallback((period: string) => {
    setSelectedDelayPeriod(period);
  }, []);

  const handleRetry = useCallback(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handlePageChange = useCallback((page: number) => {
    table.setPageIndex(page - 1);
  }, []);

  // ========== EFFECTS ==========
  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  useEffect(() => {
    if (parcelasOriginais.length > 0) {
      const dadosComFiltroPeriodo =
        selectedDelayPeriod === "all"
          ? parcelasOriginais
          : filterParcelasByDelayPeriod(parcelasOriginais, selectedDelayPeriod);

      setParcelasExibidas(dadosComFiltroPeriodo);
      setColumnFilters([]);
    }
  }, [selectedDelayPeriod, parcelasOriginais]);

  // ========== TABLE CONFIGURATION ==========
  const table = useReactTable({
    data: parcelasExibidas,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableGlobalFilter: true,
    manualPagination: false,
    autoResetPageIndex: true,
    initialState: {
      pagination: { pageSize: 6 },
    },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [parcelasExibidas, table]);

  // ========== COMPUTED VALUES ==========
  const totals: Totals = useMemo(() => {
    const filteredRows = table.getFilteredRowModel().rows;
    return {
      count: filteredRows.length,
      totalOriginal: parcelasOriginais.length,
      totalExibidas: parcelasExibidas.length,
    };
  }, [table, parcelasOriginais.length, parcelasExibidas.length]);

  // ========== CONDITIONAL RENDERING ==========
  if (loading) {
    return <LoadingExample message="Carregando Parcelas em Atraso..." />;
  }

  if (error && error !== "empty") {
    return (
      <EmptyBoletosError
        alertMessage={`Erro: ${error}`}
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
      />
    );
  }

  // ========== RENDER ==========
  return (
    <div className="w-full p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold dark:text-white">
          Parcelas em Atraso
        </h1>
      </div>

      {/* Filters */}

      <ParcelasFilter
        data={parcelasOriginais}
        onFilteredDataChange={handleFilteredDataChange}
        loading={loading}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        selectedDelayPeriod={selectedDelayPeriod}
        onDelayPeriodChange={handleDelayPeriodChange}
      />

      {/* Legend */}
      <StatusLegend />

      {/* Table */}
      <div className="rounded-md border dark:border-gray-700 mb-4">
        <Table>
          <TableHeader className="dark:bg-gray-800 hidden md:table-header-group">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="dark:text-gray-300 dark:font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="dark:bg-gray-900">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="dark:border-gray-700 dark:hover:bg-gray-800/50 md:table-row"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="dark:text-gray-200">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </div>

                  {/* Mobile Layout */}
                  <TableCell className="md:hidden p-0" colSpan={columns.length}>
                    <MobileCard parcela={row.original} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="dark:border-gray-700">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center dark:text-gray-400"
                >
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between dark:text-gray-300 mt-4">
        <div className="flex-1">
          <Paginacao
            currentPage={table.getState().pagination.pageIndex + 1}
            pageCount={table.getPageCount()}
            onPageChange={handlePageChange}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider group">
            <div className="relative">
              <span className="bg-gradient-to-r from-sky-900 to-slate-600 dark:from-indigo-600 dark:to-purple-700 text-white px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 font-mono text-sm">
                {totals.count}
              </span>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
              <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                Total de parcela{totals.count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
