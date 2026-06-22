"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Calendar,
  AlertTriangle,
  Truck,
  LayoutGrid,
  List,
  ChevronRight,
  FileText,
  Radar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Pedido, DateRange, OrderStatus } from "./types";
import {
  removeDuplicatePedidos,
  isTokenExpired,
  getUserInternalCode,
  determineOrderStatusFromPedido,
  getStatusInfo,
} from "./types";
import {
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/pages/Rastreio-Pedidos/SharedComponents";
import { PedidoDetails } from "@/components/pages/Rastreio-Pedidos/PedidosDetails";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ---------- Period Filter ----------
function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
}: {
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[7, 15, 30, 60].map((days) => (
        <button
          key={days}
          onClick={() => onPeriodChange(days)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedPeriod === days
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
        >
          {days} dias
        </button>
      ))}
    </div>
  );
}

// ---------- Status Counter Chips ----------
function StatusCounters({ pedidos }: { pedidos: Pedido[] }) {
  const counts = { entregue: 0, emRota: 0, preparacao: 0, processando: 0 };
  pedidos.forEach((p) => {
    const s = getStatusInfo(p);
    if (s.type === "success") counts.entregue++;
    else if (s.type === "info") counts.emRota++;
    else if (s.type === "pending") counts.preparacao++;
    else counts.processando++;
  });

  const items = [

    {
      label: "Em Rota",
      count: counts.emRota,
      icon: Truck,
      color: "text-primary",
    },
    {
      label: "Processando",
      count: counts.processando,
      icon: Package,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2  gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 bg-card rounded-lg border border-border p-3"
        >
          <item.icon size={18} className={item.color} aria-hidden="true" />
          <div>
            <p className="text-xl font-bold text-foreground leading-none">
              {item.count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Pedido Card (Grid view) ----------
function PedidoCard({
  pedido,
  onClick,
}: {
  pedido: Pedido;
  onClick: () => void;
}) {
  const status = getStatusInfo(pedido);
  const formatDateShort = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yy", { locale: ptBR });
    } catch {
      return "--/--/--";
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background group"
      aria-label={`Pedido ${pedido.numeroPedido}, ${pedido.nomeCliente}, ${status.text}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-foreground text-sm">
            {"# "}
            {pedido.numeroPedido}
          </p>
          {pedido.notaFiscal ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {"NF "}
              {pedido.notaFiscal}
            </p>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-destructive mt-0.5">
              <AlertTriangle size={10} aria-hidden="true" />
              {"Sem NF"}
            </span>
          )}
        </div>
        <StatusBadge text={status.text} type={status.type} />
      </div>

      {/* Client name */}
      <p
        className="text-sm text-foreground mb-3 truncate"
        title={pedido.nomeCliente}
      >
        {pedido.nomeCliente}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar size={12} aria-hidden="true" />
            {formatDateShort(pedido.dataLancamentoPedido)}
          </span>
          {pedido.nomeTransportadora && (
            <span
              className="flex items-center gap-1 truncate max-w-[120px]"
              title={pedido.nomeTransportadora}
            >
              <Truck size={12} aria-hidden="true" />
              {pedido.nomeTransportadora}
            </span>
          )}
        </div>
        <ChevronRight
          size={14}
          className="text-muted-foreground group-hover:text-primary transition-colors"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

// ---------- Pedido Row (List view) ----------
function PedidoRow({
  pedido,
  onClick,
}: {
  pedido: Pedido;
  onClick: () => void;
}) {
  const status = getStatusInfo(pedido);
  const formatDateShort = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yy", { locale: ptBR });
    } catch {
      return "--/--/--";
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-lg border border-border px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background group flex items-center gap-4"
      aria-label={`Pedido ${pedido.numeroPedido}, ${pedido.nomeCliente}, ${status.text}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm">
              {"# "}
              {pedido.numeroPedido}
            </p>
            {pedido.notaFiscal && (
              <span className="text-xs text-muted-foreground">
                {"NF "}
                {pedido.notaFiscal}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {pedido.nomeCliente}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar size={12} aria-hidden="true" />
          {formatDateShort(pedido.dataLancamentoPedido)}
        </span>
        {pedido.nomeTransportadora && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 max-w-[150px] truncate">
            <Truck size={12} aria-hidden="true" />
            {pedido.nomeTransportadora}
          </span>
        )}
      </div>

      <StatusBadge text={status.text} type={status.type} />
      <ChevronRight
        size={16}
        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
        aria-hidden="true"
      />
    </button>
  );
}

// ---------- Pagination Component ----------
function PedidoPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={currentPage === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page as number);
                }}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// ---------- Main PedidoTruck ----------
export function PedidoTruck() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDateRange, setActiveDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatus, setOrderStatus] =
    useState<OrderStatus>("recebido");
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const navigate = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end);
  }, []);

  useEffect(() => {
    const token = tokenStore.getToken();
    if (!token || isTokenExpired(token)) {
      tokenStore.setToken(null as unknown as string);
      navigate("/login");
    }
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedPeriod]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    setActiveDateRange({ start: startDate, end: endDate });
    fetchPedidosWithDateRange(startDate, endDate);
  };

  const fetchPedidosWithDateRange = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const token = tokenStore.getToken();
      const slpCode = getUserInternalCode();

      if (!token || isTokenExpired(token)) {
        tokenStore.setToken(null as unknown as string);
        navigate("/login");
        return;
      }

      setActiveDateRange({ start: startDate, end: endDate });

      const params = new URLSearchParams({
        dataINI: format(startDate, "yyyy-MM-dd"),
        dataFIM: format(endDate, "yyyy-MM-dd"),
        slpCode: String(slpCode),
      });

      const response = await axios.get(
        `${apiBase}/Pedidos/consultar-pedidos`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;

      let pedidosData = data.value || data.data || data;

      if (Array.isArray(pedidosData) && pedidosData.length > 0) {
        pedidosData = pedidosData.map((pedido: Record<string, unknown>) => ({
          ...pedido,
          numeroPedido: pedido.numeroPedido || "",
          nomeCliente: pedido.nomeCliente || "",
          notaFiscal: pedido.notaFiscal || "",
          chaveNFe: pedido.chaveNFe || "",
          codigoDoCliente: pedido.codigoDoCliente || "",
        }));

        pedidosData.sort(
          (
            a: { dataLancamentoPedido: string },
            b: { dataLancamentoPedido: string },
          ) => {
            if (!a.dataLancamentoPedido || !b.dataLancamentoPedido) return 0;
            const dataStrA = String(a.dataLancamentoPedido);
            const dataStrB = String(b.dataLancamentoPedido);
            const [yearA, monthA, dayA] = dataStrA.split("-");
            const [yearB, monthB, dayB] = dataStrB.split("-");
            const dataA = new Date(
              Number(yearA),
              Number(monthA) - 1,
              Number(dayA),
            ).getTime();
            const dataB = new Date(
              Number(yearB),
              Number(monthB) - 1,
              Number(dayB),
            ).getTime();
            return dataB - dataA;
          },
        );

        const pedidosUnicos = removeDuplicatePedidos(pedidosData);
        setAllPedidos(pedidosUnicos);
        setPedidos(pedidosUnicos);
        setError(null);
      } else {
        setAllPedidos([]);
        setPedidos([]);
        setError("empty");
      }
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          tokenStore.setToken(null as unknown as string);
          navigate("/login");
          return;
        }
        console.error("Erro na API:", err.response?.data || err.message);
      }
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase().trim();
    setSearchTerm(term);
    filterPedidos(term, statusFilter);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    filterPedidos(searchTerm, status);
  };

  const filterPedidos = (term: string, status: string | null) => {
    let filtered = allPedidos;

    if (term) {
      filtered = filtered.filter((p) => {
        const fields = [
          String(p.numeroPedido || ""),
          String(p.nomeCliente || ""),
          String(p.notaFiscal || ""),
          String(p.chaveNFe || ""),
          String(p.codigoDoCliente || ""),
        ];
        return fields.some((f) => f.toLowerCase().includes(term));
      });
    }

    if (status) {
      filtered = filtered.filter((p) => {
        const info = getStatusInfo(p);
        return info.type === status;
      });
    }

    setPedidos(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSelectPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setOrderStatus(determineOrderStatusFromPedido(pedido));
  };

  const handleRetry = () => {
    fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setPedidos(allPedidos);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(pedidos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPedidos = pedidos.slice(startIndex, endIndex);

  // ---------- Detail View ----------
  if (selectedPedido) {
    return (
      <div className="w-full  px-4 py-6">
        <PedidoDetails
          pedido={selectedPedido}
          orderStatus={orderStatus}
          onBack={() => setSelectedPedido(null)}
        />
      </div>
    );
  }

  // ---------- Card Grid View ----------
  return (
    <div className="w-full   px-4 py-6">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Radar size={20} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground text-balance">
              Rastreamento de Pedidos
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe todos os seus pedidos
            </p>
          </div>
        </div>
      </header>

      {/* Status Counters */}
      {!loading && !error && allPedidos.length > 0 && (
        <div className="mb-6 ">
          <StatusCounters pedidos={allPedidos} />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
              aria-hidden="true"
            />
            <label htmlFor="order-search" className="sr-only">
              Buscar pedidos
            </label>
            <input
              id="order-search"
              type="search"
              placeholder="Buscar por pedido, NF, cliente..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Period Filter */}
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label="Visualizacao em grade"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label="Visualizacao em lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => handleStatusFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === null
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            Todos ({allPedidos.length})
          </button>
          {[
            { key: "info", label: "Em Rota", icon: Truck },
            { key: "default", label: "Processando", icon: Package },
          ].map((item) => {
            const count = allPedidos.filter(
              (p) => getStatusInfo(p).type === item.key,
            ).length;
            return (
              <button
                key={item.key}
                onClick={() =>
                  handleStatusFilter(
                    statusFilter === item.key ? null : item.key,
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${statusFilter === item.key
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
              >
                <item.icon size={12} aria-hidden="true" />
                {item.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={handleRetry} />
      ) : pedidos.length === 0 ? (
        <EmptyState onReset={handleResetFilters} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPedidos.map((pedido, index) => (
            <PedidoCard
              key={`${pedido.numeroPedido}-${index}`}
              pedido={pedido}
              onClick={() => handleSelectPedido(pedido)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {currentPedidos.map((pedido, index) => (
            <PedidoRow
              key={`${pedido.numeroPedido}-${index}`}
              pedido={pedido}
              onClick={() => handleSelectPedido(pedido)}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && !error && pedidos.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-1 gap-4">
          <PedidoPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
