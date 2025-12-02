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
  type VisibilityState,
} from "@tanstack/react-table";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paginacao } from "./Paginacao";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { PedidosFilter } from "./Pedidos/PedidosFilter";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import EmptyPedidosError from "./Pedidos/EmptyPedidosError";
import FloatingLoading from "./Loading/Loading";
import { usePedidosColumns, type Pedido } from "./Pedidos/PedidosColumns";
import { PedidosLegend } from "./Pedidos/PedidosCompra/PedidosStatus";

interface TokenDecoded {
  exp: number;
  [key: string]: any;
}

// Tipos para os filtros - ATUALIZADOS com as novas opções
type PeriodFilter =
  | "ontem"
  | "hoje"
  | "ultimos3Dias"
  | "ultimos7Dias"
  | "ultimos15Dias"
  | "ultimos45Dias"

export type SearchType =
  | "numeroPedido"
  | "statusDoPedido"
  | "notaFiscal"
  | "dataLancamentoPedido"
  | "dataParaEntrega"
  | "pedidosCompra";

const removeDuplicatePedidos = (pedidos: Pedido[]): Pedido[] => {
  const pedidosMap = new Map<string, Pedido>();

  pedidos.forEach((pedido) => {
    const key = `${pedido.numeroPedido}-${pedido.notaFiscal || "sem-nota"}`;

    // Se ainda não existe um pedido com essa combinação, adiciona
    if (!pedidosMap.has(key)) {
      pedidosMap.set(key, pedido);
    } else {
      // Se já existe, mantém o mais recente baseado na data de lançamento
      const existingPedido = pedidosMap.get(key)!;
      const currentDate = new Date(pedido.dataLancamentoPedido);
      const existingDate = new Date(existingPedido.dataLancamentoPedido);

      if (currentDate > existingDate) {
        pedidosMap.set(key, pedido);
      }
    }
  });

  return Array.from(pedidosMap.values());
};

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: TokenDecoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Função para obter o internalCode do usuário logado
const getUserInternalCode = (): number => {
  try {
    const authData = localStorage.getItem("authData");
    if (authData) {
      const userData = JSON.parse(authData);
      return userData.internalCode || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Função para calcular o pageSize baseado no tamanho da tela
const getPageSize = (): number => {
  if (typeof window !== "undefined") {
    const width = window.innerWidth;
    if (width >= 1800) {
      return 10; // Telas grandes (1800px+)
    } else {
      return 6; // Telas pequenas
    }
  }
  return 6; // Fallback para SSR
};

export const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [, setAllPedidos] = React.useState<Pedido[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchType, setSearchType] =
    React.useState<SearchType>("numeroPedido");
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [currentPeriodFilter, setCurrentPeriodFilter] =
    React.useState<PeriodFilter>("hoje");
  const [activeDateRange, setActiveDateRange] = React.useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [pageSize, setPageSize] = React.useState<number>(getPageSize());

  const navigate = useNavigate();

  // Usar o hook usePedidosColumns para obter as definições de colunas
  const columns = usePedidosColumns();

  // Hook para monitorar mudanças no tamanho da tela
  React.useEffect(() => {
    const handleResize = () => {
      const newPageSize = getPageSize();
      setPageSize(newPageSize);
    };

    // Adicionar event listener para resize
    window.addEventListener("resize", handleResize);

    // Configurar o pageSize inicial
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
  }, [navigate]);

  const table = useReactTable({
    data: pedidos,
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
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  // Atualizar o pageSize da tabela quando o estado mudar
  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  // Função para buscar pedidos com intervalo de datas
  const fetchPedidosWithDateRange = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      // Obter o internalCode do usuário logado
      const slpCode = getUserInternalCode();

      if (!slpCode) {
        setError("Código do usuário não encontrado. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("authData");
        navigate("/login");
        return;
      }

      // Guardar as datas atuais de filtro
      setActiveDateRange({
        start: startDate,
        end: endDate,
      });

      // Formatar data para API no padrão YYYY-MM-DD
      const formatarDataAPI = (date: Date) => {
        return format(date, "yyyy-MM-dd");
      };

      // Configurar parâmetros da requisição incluindo o slpCode
      const params = {
        dataINI: formatarDataAPI(startDate),
        dataFIM: formatarDataAPI(endDate),
        slpCode: slpCode, // Adicionar o internalCode como parâmetro
      };

      // Datas ajustadas para garantir inclusão do dia completo
      const response = await axios.get(
        "/api/external/Pedidos/consultar-pedidos",
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let pedidosData =
        response.data.value || response.data.data || response.data;

      if (Array.isArray(pedidosData)) {
        // Remover duplicatas por numeroPedido (se necessário)

        // Ordenação decrescente
        pedidosData.sort(
          (
            a: { dataLancamentoPedido: string | number | Date },
            b: { dataLancamentoPedido: string | number | Date }
          ) => {
            if (!a.dataLancamentoPedido || !b.dataLancamentoPedido) {
              return 0;
            }

            // Garantir que estamos trabalhando com strings antes de usar split
            const dataStrA = String(a.dataLancamentoPedido);
            const dataStrB = String(b.dataLancamentoPedido);

            // Criar objeto Date usando split para evitar problemas de timezone
            const [yearA, monthA, dayA] = dataStrA.split("-");
            const [yearB, monthB, dayB] = dataStrB.split("-");

            const dataA = new Date(
              Number(yearA),
              Number(monthA) - 1,
              Number(dayA)
            ).getTime();
            const dataB = new Date(
              Number(yearB),
              Number(monthB) - 1,
              Number(dayB)
            ).getTime();

            return dataB - dataA; // Ordem decrescente
          }
        );

        const pedidosUnicos = removeDuplicatePedidos(pedidosData);

        setAllPedidos(pedidosUnicos);
        setPedidos(pedidosUnicos);

        if (pedidosData.length === 0) {
          setError("empty");
        } else {
          setError(null);
        }
      } else {
        setAllPedidos([]);
        setPedidos([]);
        setError("empty");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("authData");
          navigate("/login");
        } else if (err.response?.status === 500) {
          setError(
            "Erro interno no servidor. A API de pedidos pode estar indisponível."
          );
        } else if (err.response?.status === 403) {
          setError(
            "Acesso negado. Você não tem permissão para visualizar estes dados."
          );
        } else {
          setError(
            `Erro ao carregar pedidos: ${
              err.response?.status || "Desconhecido"
            }`
          );
        }
      } else {
        setError("error");
      }
      setAllPedidos([]);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Função ATUALIZADA para aplicar o filtro de período selecionado
  const applyPeriodFilter = (periodFilter: PeriodFilter) => {
    setCurrentPeriodFilter(periodFilter);

    // Criar uma nova data no timezone local
    const hoje = new Date();
    // Padronizamos para o início do dia (00:00:00)
    hoje.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date = hoje;

    switch (periodFilter) {
      case "ontem":
        // Apenas ontem
        startDate = subDays(hoje, 1);
        endDate = subDays(hoje, 1);
        // Garantir que pegue o dia completo
        startDate = startOfDay(startDate);
        endDate = endOfDay(endDate);
        break;

      case "hoje":
        // Apenas hoje
        startDate = hoje;
        endDate = hoje;
        // Garantir que pegue o dia completo
        startDate = startOfDay(startDate);
        endDate = endOfDay(endDate);
        break;

      case "ultimos3Dias":
        // Últimos 3 dias (incluindo hoje)
        startDate = subDays(hoje, 2);
        break;

      case "ultimos7Dias":
        // Últimos 7 dias (uma semana)
        startDate = subDays(hoje, 6);
        break;

      case "ultimos15Dias":
        // Últimos 15 dias
        startDate = subDays(hoje, 14);
        break;

      case "ultimos45Dias":
        // Últimos 60 dias (2 meses)
        startDate = subDays(hoje, 45);
        break;

      default:
        // Fallback para hoje
        startDate = hoje;
        endDate = hoje;
        startDate = startOfDay(startDate);
        endDate = endOfDay(endDate);
        break;
    }

    fetchPedidosWithDateRange(startDate, endDate);
  };

  // Na primeira renderização, busca os dados de hoje
  React.useEffect(() => {
    applyPeriodFilter("ultimos15Dias");
  }, []);

  // Efeito para aplicar filtros de texto (número de pedido, status, nota fiscal)
  React.useEffect(() => {
    if (searchType === "numeroPedido" || searchType === "notaFiscal") {
      const numericValue = searchValue.replace(/\D/g, "");
      table.getColumn(searchType)?.setFilterValue(numericValue);
    } else if (searchType === "statusDoPedido") {
      table.getColumn(searchType)?.setFilterValue(searchValue);
    } else if (searchType === "pedidosCompra") {
      // Implementar filtro personalizado para pedidos de compra
      if (searchValue.trim() === "") {
        // Se não há valor de busca, remover o filtro
        table.getColumn("pedidosCompra")?.setFilterValue(undefined);
      } else {
        // Aplicar filtro personalizado para pedidos de compra
        table.getColumn("pedidosCompra")?.setFilterValue(searchValue);
      }
    }
  }, [searchValue, searchType, table]);

  const handleBack = () => {
    navigate("/inicio");
  };

  // Função para tentar novamente
  const handleRetry = () => {
    // Tenta buscar os pedidos novamente usando o mesmo intervalo de datas
    fetchPedidosWithDateRange(
      activeDateRange.start || new Date(),
      activeDateRange.end || new Date()
    );
  };

  if (loading) {
    return <FloatingLoading />;
  }

  if (error === "empty") {
    return (
      <EmptyPedidosError
        message="Não foram encontrados pedidos para o período selecionado."
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
        logoUrl="/logo.svg"
      />
    );
  }

  if (error === "error") {
    return (
      <EmptyPedidosError
        message="Ocorreu um erro ao carregar os pedidos. Por favor, tente novamente."
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
        logoUrl="/logo.svg"
      />
    );
  }

  // Verificar se há erro específico que não seja "empty" ou "error"
  if (error && error !== "empty" && error !== "error") {
    return (
      <EmptyPedidosError
        message={error}
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
        logoUrl="/logo.svg"
      />
    );
  }

  // Função para lidar com a mudança de página na paginação
  const handlePageChange = (page: number) => {
    table.setPageIndex(page - 1);
  };

  const currentPage = table.getState().pagination.pageIndex;

  const getColumnHeaderText = (columnDef: any): string => {
    if (typeof columnDef.header === "string") {
      return columnDef.header;
    }
    return columnDef.accessorKey || columnDef.id || "Campo";
  };

  return (
    <div className="w-full p-2">
      <h1 className="text-3xl pb-1 font-bold">Pedidos</h1>

      <PedidosFilter
        searchType={searchType}
        setSearchType={setSearchType}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        currentPeriodFilter={currentPeriodFilter}
        applyPeriodFilter={applyPeriodFilter}
        activeDateRange={activeDateRange}
        setActiveDateRange={setActiveDateRange}
        fetchPedidosWithDateRange={fetchPedidosWithDateRange}
      />

      <PedidosLegend />

      <div className="rounded-md border">
        <Table>
          <TableHeader className="hidden md:table-header-group">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="md:table-row"
                >
                  {/* Layout Desktop - Tabela Normal */}
                  <div className="hidden md:contents">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </div>

                  {/* Layout Mobile - Card Format Melhorado */}
                  <TableCell className="md:hidden p-0" colSpan={columns.length}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl m-2 p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                      {/* Header do Card */}
                      <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              Pedido - {row.original.numeroPedido}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {row.original.dataLancamentoPedido
                                ? (() => {
                                    // Usar split para preservar a data exata sem ajuste de timezone
                                    const dateString = String(
                                      row.original.dataLancamentoPedido
                                    );
                                    const [year, month, day] =
                                      dateString.split("-");
                                    return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
                                  })()
                                : "Data não disponível"}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Ativo
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo Principal */}
                      <div className="space-y-3">
                        {row.getVisibleCells().map((cell, index) => {
                          // Fixed: Use the helper function to get header text
                          const header = getColumnHeaderText(
                            cell.column.columnDef
                          );

                          return (
                            <div
                              key={cell.id}
                              className="flex justify-between items-center py-2"
                            >
                              <div className="flex items-center gap-2">
                                {/* Ícone baseado no tipo de campo */}
                                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  {index === 0 && (
                                    <svg
                                      className="w-3 h-3 text-gray-600 dark:text-gray-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path
                                        fillRule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {index === 1 && (
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
                                  )}
                                  {index === 2 && (
                                    <svg
                                      className="w-3 h-3 text-gray-600 dark:text-gray-400"
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
                                  )}
                                  {index > 2 && (
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
                                  )}
                                </div>

                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  {header}
                                </span>
                              </div>

                              <div className="text-sm text-gray-900 dark:text-gray-100 font-medium text-right max-w-32 truncate">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer do Card */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Nenhum pedido encontrado
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      Tente ajustar os filtros de pesquisa
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer responsivo melhorado */}
      <div className="flex flex-col md:flex-row items-center justify-between dark:text-gray-300 mt-6 space-y-4 md:space-y-0">
        <div className="w-full md:flex-1 order-2 md:order-1">
          <Paginacao
            currentPage={currentPage + 1}
            pageCount={table.getPageCount()}
            onPageChange={handlePageChange}
          />
        </div>

        <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider group order-1 md:order-2">
          <div className="relative">
            <span className="bg-gradient-to-r from-sky-900 to-slate-600 dark:from-indigo-600 dark:to-purple-700 text-white px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 font-mono text-sm">
              {pedidos.length}
            </span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
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
            <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-sky-500 dark:group-hover:text-indigo-300">
              Pedido{pedidos.length !== 1 ? "s" : ""} registrado
              {pedidos.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
