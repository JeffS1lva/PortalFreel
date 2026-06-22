"use client"

import { useRef } from "react"
import {
  Package,
  Calendar,
  Search,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"
import type { Pedido, DateRange } from "./types"
import {
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/pages/Rastreio-Pedidos/SharedComponents"

// PedidoListItem sub-component
const PedidoListItem = ({
  pedido,
  isSelected,
  onClick,
  onKeyDown,
}: {
  pedido: Pedido
  isSelected: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) => {
  const getStatusInfo = (pedido: Pedido) => {
    if (pedido.notaFiscal && new Date(pedido.dataParaEntrega) < new Date()) {
      return { text: "Entregue", type: "success" as const }
    } else if (pedido.notaFiscal) {
      return { text: "Em Rota", type: "info" as const }
    } else if (pedido.statusPicking === "Concluido") {
      return { text: "Em Preparacao", type: "pending" as const }
    } else {
      return { text: "Processando", type: "default" as const }
    }
  }

  const status = getStatusInfo(pedido)
  const formatDateOnly = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return "Data indisponivel"
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Pedido ${pedido.numeroPedido}, cliente ${pedido.nomeCliente}, status ${status.text}`}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
        isSelected
          ? "bg-blue-50 dark:bg-gray-800 border-l-4 border-l-blue-600 shadow-sm"
          : ""
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {"Pedido: "}{pedido.numeroPedido}
          </div>
          <div>
            {pedido.notaFiscal ? (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {"NF: #"}{pedido.notaFiscal}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-1 rounded-md">
                <AlertTriangle size={12} aria-hidden="true" />
                {"NF nao emitida"}
              </span>
            )}
          </div>
        </div>
        <StatusBadge text={status.text} type={status.type} />
      </div>

      <div
        className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate"
        title={pedido.nomeCliente}
      >
        {pedido.nomeCliente}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} aria-hidden="true" />
          <span>{formatDateOnly(pedido.dataLancamentoPedido)}</span>
        </div>
        <ChevronRight
          size={16}
          className="text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

// Main PedidoSidebar component
interface PedidoSidebarProps {
  pedidos: Pedido[]
  allPedidos: Pedido[]
  selectedPedido: Pedido | null
  loading: boolean
  error: string | null
  searchTerm: string
  activeDateRange: DateRange
  selectedPeriod: number
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectPedido: (pedido: Pedido) => void
  onKeyDown: (e: React.KeyboardEvent, pedido: Pedido) => void
  onPeriodChange: (days: number) => void
  onCustomDateApply: (startDate: Date, endDate: Date) => void
  onRetry: () => void
  onResetFilters: () => void
  PeriodFilterComponent: React.ComponentType<{
    activeDateRange: DateRange
    selectedPeriod: number
    onPeriodChange: (days: number) => void
    onCustomDateApply: (startDate: Date, endDate: Date) => void
  }>
  logoSrc?: string
}

export function PedidoSidebar({
  pedidos,
  selectedPedido,
  loading,
  error,
  searchTerm,
  activeDateRange,
  selectedPeriod,
  onSearch,
  onSelectPedido,
  onKeyDown,
  onPeriodChange,
  onCustomDateApply,
  onRetry,
  onResetFilters,
  PeriodFilterComponent,
  logoSrc,
}: PedidoSidebarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const orderListRef = useRef<HTMLDivElement>(null)

  return (
    <aside
      className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[calc(100vh-2rem)]"
      aria-label="Lista de pedidos"
    >
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-gray-900 to-blue-900 dark:from-gray-900 dark:to-blue-950 py-4 px-6">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <Package
            size={20}
            className="text-blue-200"
            aria-hidden="true"
          />
          Meus Pedidos
        </h2>
      </header>

      {/* Period Filter */}
      <PeriodFilterComponent
        activeDateRange={activeDateRange}
        selectedPeriod={selectedPeriod}
        onPeriodChange={onPeriodChange}
        onCustomDateApply={onCustomDateApply}
      />

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label htmlFor="order-search" className="sr-only">
          Buscar pedidos
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none"
            size={16}
            aria-hidden="true"
          />
          <input
            id="order-search"
            ref={searchInputRef}
            type="search"
            placeholder="Busque seus pedidos..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={searchTerm}
            onChange={onSearch}
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            Busque por numero do pedido, nota fiscal ou nome do cliente
          </span>
        </div>
      </div>

      {/* Order List */}
      <nav
        ref={orderListRef}
        className="flex-1 overflow-y-auto"
        aria-label="Lista de pedidos disponiveis"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : pedidos.length === 0 ? (
          <EmptyState onReset={onResetFilters} />
        ) : (
          <div role="list">
            {pedidos.map((pedido, index) => (
              <div
                key={`${pedido.numeroPedido}-${index}`}
                role="listitem"
              >
                <PedidoListItem
                  pedido={pedido}
                  isSelected={
                    selectedPedido?.numeroPedido === pedido.numeroPedido
                  }
                  onClick={() => onSelectPedido(pedido)}
                  onKeyDown={(e) => onKeyDown(e, pedido)}
                />
              </div>
            ))}
          </div>
        )}
      </nav>

      <Separator />

      {/* Footer */}
      <footer className="flex py-4 gap-3 px-4 items-center bg-gradient-to-r from-gray-900 to-blue-900 dark:from-gray-950 dark:to-blue-950">
        <div className="relative">
          <span
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-1.5 rounded-full shadow-lg font-semibold text-sm"
            aria-label={`${pedidos.length} pedidos registrados`}
          >
            {pedidos.length}
          </span>
          <div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"
            aria-hidden="true"
          />
        </div>
        <span className="text-xs uppercase tracking-wider text-gray-300 dark:text-gray-400">
          {"Pedido"}{pedidos.length !== 1 ? "s" : ""}{" registrado"}
          {pedidos.length !== 1 ? "s" : ""}
        </span>
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Logo Polar Fix"
            className="w-8 ml-auto"
          />
        )}
      </footer>
    </aside>
  )
}
