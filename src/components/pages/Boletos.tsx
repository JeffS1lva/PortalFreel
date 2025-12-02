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
import { useBoletosColumns } from "@/hooks/useBoletosColumns";
import { sortByStatusPriority } from "@/components/pages/BoletosColumns/StatusBadge";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paginacao } from "../pages/Paginacao";
import { useNavigate } from "react-router-dom";
import { BoletoFilter } from "./FiltersBoletos/BoletosFilter";
import { useState, useEffect, useMemo } from "react";
import { Parcela } from "../../types/parcela";
import EmptyBoletosError from "./FiltersBoletos/EmptyBoletosError";
import FloatingLoading from "./Loading/Loading";
import { jwtDecode } from "jwt-decode";

interface TokenDecoded {
  exp: number;
  [key: string]: any;
}

// Função para verificar se o token está expirado
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

// Função para calcular a data de início baseada no período
const getStartDateByPeriod = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days + 1); // +1 para incluir hoje no período
  return date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
};

// Função para obter a data atual
const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
};

// Função helper para obter o texto do header da coluna
const getColumnHeaderText = (columnDef: any): string => {
  if (typeof columnDef.header === "string") {
    return columnDef.header;
  }
  if (typeof columnDef.header === "function") {
    try {
      const headerResult = columnDef.header({});
      return typeof headerResult === "string"
        ? headerResult
        : columnDef.id || "Campo";
    } catch {
      return columnDef.id || "Campo";
    }
  }
  return columnDef.id || "Campo";
};

// Função para calcular o pageSize baseado no tamanho da tela
const getPageSize = (): number => {
  if (typeof window !== "undefined") {
    const width = window.innerWidth;
    if (width >= 1800) return 10; // Telas grandes (1800px+)
    return 6; // Telas pequenas (padrão)
  }
  return 6; 
};

export const Boletos: React.FC = () => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [allParcelas, setAllParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchType] = useState<"codigoPN" | "numNF" | "codigoBoleto">(
    "codigoPN"
  );
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(getPageSize());

  // Estado para o período selecionado (padrão: 1 dia)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1");

  const navigate = useNavigate();
  const columns = useBoletosColumns();

  // Hook para monitorar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const newPageSize = getPageSize();
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        // Ajustar a página atual para evitar páginas vazias
        setCurrentPage(0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pageSize]);

  // Ordenar parcelas por status usando useMemo para otimização
  const sortedParcelas = useMemo(() => {
    return sortByStatusPriority([...parcelas]);
  }, [parcelas]);

  // Aplicar debounce ao valor de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Efeito para buscar quando o valor com debounce mudar ou período mudar
  useEffect(() => {
    fetchParcelas(debouncedSearchValue, selectedPeriod);
  }, [debouncedSearchValue, searchType, selectedPeriod]);

  // Carregar dados iniciais apenas uma vez com 1 dia por padrão
  useEffect(() => {
    fetchParcelas("", "1");
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
    data: sortedParcelas,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPaginationState = updater(table.getState().pagination);
        setCurrentPage(newPaginationState.pageIndex);
      } else {
        setCurrentPage(updater.pageIndex);
      }
    },
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

  // Função para filtrar parcelas por período localmente (caso a API não suporte filtro por data)
  const filterParcelasByPeriod = (
    parcelas: Parcela[],
    period: string
  ): Parcela[] => {
    if (period === "all") {
      return parcelas;
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1); // +1 para incluir hoje
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Fim do dia atual

    return parcelas.filter((parcela) => {
      // Assumindo que existe um campo de data na parcela (ajuste conforme sua estrutura)
      // Pode ser 'dataVencimento', 'dataCriacao', 'dataEmissao', etc.
      const parcelaDate = new Date(
        parcela.dataVencimento || parcela.dataCriacao || parcela.dataEmissao
      );
      return parcelaDate >= startDate && parcelaDate <= endDate;
    });
  };

  // Função para buscar as parcelas com filtro de período
  const fetchParcelas = async (
    searchValue: string = "",
    period: string = "3"
  ) => {
    try {
      setLoading(true);
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

      const slpCode = getUserInternalCode();

      if (!slpCode) {
        setError("Código do usuário não encontrado. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("authData");
        navigate("/login");
        return;
      }

      const currentPaginationState = table.getState().pagination;

      // Preparar parâmetros da requisição
      const params: Record<string, string | number> = {
        slpCode: slpCode,
      };

      // Tentar enviar parâmetros de data para a API
      if (period !== "all") {
        const startDate = getStartDateByPeriod(parseInt(period));
        const endDate = getCurrentDate();
        params.startDate = startDate;
        params.endDate = endDate;
        params.dataInicio = startDate; // Caso a API use nomes diferentes
        params.dataFim = endDate;
        params.periodo = period; // Enviar período como parâmetro adicional
      }

      // Adicionar filtro de busca se houver
      if (searchValue) {
        params[searchType] = searchValue;
      }

      const response = await axios.get("/api/external/Parcelas/parcelas", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Extrair os dados da resposta
      let parcelasData = [];
      if (response.data && Array.isArray(response.data.parcelas)) {
        parcelasData = response.data.parcelas;
      } else if (Array.isArray(response.data.value)) {
        parcelasData = response.data.value;
      } else if (Array.isArray(response.data.data)) {
        parcelasData = response.data.data;
      } else if (Array.isArray(response.data)) {
        parcelasData = response.data;
      }

      if (Array.isArray(parcelasData)) {
        // Aplicar filtro local por período como fallback
        // (caso a API não esteja filtrando corretamente)
        const filteredData = filterParcelasByPeriod(parcelasData, period);

        setAllParcelas(filteredData);
        setParcelas(filteredData);

        if (filteredData.length === 0) {
          setError("empty");
        } else {
          setError(null);
        }

        // Gerenciar paginação
        if (searchValue && debouncedSearchValue !== searchValue) {
          setCurrentPage(0);
        } else {
          const maxPage = Math.ceil(filteredData.length / pageSize) - 1;
          if (currentPaginationState.pageIndex > maxPage) {
            setCurrentPage(Math.max(0, maxPage));
          }
        }
      } else {
        setParcelas([]);
        setAllParcelas([]);
        setError("Formato de dados recebido é inválido");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("authData");
          navigate("/login");
        } else if (err.response?.status === 500) {
          setError(
            "Erro interno no servidor. A API de parcelas pode estar indisponível."
          );
        } else if (err.response?.status === 403) {
          setError(
            "Acesso negado. Você não tem permissão para visualizar estes dados."
          );
        } else {
          setError(
            `Erro ao carregar boletos: ${
              err.response?.status || "Desconhecido"
            }`
          );
        }
      } else {
        setError("error");
      }

      setParcelas([]);
      setAllParcelas([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const isNewSearch = searchValue !== debouncedSearchValue;

    if (searchType === "codigoBoleto") {
      const numericValue = searchValue.replace(/\D/g, "");
      table.getColumn(searchType)?.setFilterValue(numericValue);
    } else if (searchType === "codigoPN" || searchType === "numNF") {
      table.getColumn(searchType)?.setFilterValue(searchValue);
    }

    if (isNewSearch && searchValue) {
      setCurrentPage(0);
    }
  }, [searchValue, searchType, table, debouncedSearchValue]);

  const handleBack = () => {
    navigate("/inicio");
  };

  const handleRetry = () => {
    fetchParcelas(searchValue, selectedPeriod);
  };

  // Handler para mudança de período
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    setCurrentPage(0); // Reset para primeira página ao mudar período
  };

  if (loading) {
    return <FloatingLoading/>;
  }

  if (error === "empty") {
    return (
      <EmptyBoletosError
        alertMessage="Não foram encontrados boletos para o período selecionado."
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
      />
    );
  }

  if (error === "error") {
    return (
      <EmptyBoletosError
        alertMessage="Ocorreu um erro ao carregar os boletos. Por favor, tente novamente."
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
      />
    );
  }

  if (error && error !== "empty" && error !== "error") {
    return (
      <EmptyBoletosError
        alertMessage={error}
        onRetry={handleRetry}
        onBack={handleBack}
        showBackButton={true}
      />
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  return (
    <div className="w-full p-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold dark:text-white">Boletos</h1>
      </div>

      <BoletoFilter
        allParcelas={allParcelas}
        setParcelas={setParcelas}
        table={table}
        onSearch={(value) => {
          setSearchValue(value);
        }}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        recordCount={sortedParcelas.length}
      />

      <div className="rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader className="hidden md:table-header-group dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                {headerGroup.headers.map((header) => {
                  return (
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="dark:bg-gray-900 ">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="md:table-row dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  {/* Layout Desktop - Tabela Normal */}
                  <div className="hidden md:contents">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="dark:text-gray-200 ">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </div>

                  {/* Layout Mobile - Card Format */}
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
                              Boleto -{" "}
                              {row.original.codigoBoleto || row.original.numNF}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                      </div>

                      {/* Conteúdo Principal */}
                      <div className="space-y-3">
                        {row.getVisibleCells().map((cell, index) => {
                          // Use a função helper para obter o texto do header
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="dark:border-gray-700">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center dark:text-gray-400"
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
                      Nenhum boleto encontrado
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

      {/* Footer responsivo */}
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
              {sortedParcelas.length}
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
              Boleto{sortedParcelas.length !== 1 ? "s" : ""} registrado
              {sortedParcelas.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
