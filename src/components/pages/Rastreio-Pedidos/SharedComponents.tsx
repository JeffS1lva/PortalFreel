"use client"

import {
  Clock,
  Package,
  Truck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import FloatingLoading from "../Loading/Loading"

// StatusBadge
export const StatusBadge = ({
  text,
  type,
}: {
  text: string
  type: "success" | "info" | "pending" | "default" | "warning"
}) => {
  const styles = {
    success:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    pending:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    warning:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    default:
      "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  }

  const icons = {
    success:  <Truck size={14} className="mr-1" aria-hidden="true" />,
    info: <Truck size={14} className="mr-1" aria-hidden="true" />,
    pending: <Clock size={14} className="mr-1" aria-hidden="true" />,
    warning: <AlertTriangle size={14} className="mr-1" aria-hidden="true" />,
    default: <Package size={14} className="mr-1" aria-hidden="true" />,
  }

  return (
    <span
      className={`${styles[type]} inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm`}
      role="status"
      aria-label={`Status: ${text}`}
    >
      {icons[type]}
      {text}
    </span>
  )
}

// InfoItem
export const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) => {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium mb-0.5">
          {label}
        </div>
        <div
          className="font-semibold text-gray-900 dark:text-gray-100 truncate"
          title={value}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

// EmptyState
export const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div
    className="flex flex-col items-center justify-center h-64 p-6 text-center"
    role="status"
    aria-live="polite"
  >
    <Package
      size={48}
      className="text-gray-400 dark:text-gray-600 mb-4"
      aria-hidden="true"
    />
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
      Nenhum pedido encontrado
    </h3>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
      {"Nao encontramos pedidos registrados com esses dados. Tente buscar pelo numero do Pedido, Nota Fiscal ou Nome do Cliente."}
    </p>
    <Button
      onClick={onReset}
      className="flex items-center gap-2"
      aria-label="Limpar filtros e tentar novamente"
    >
      <RefreshCw size={14} aria-hidden="true" />
      Limpar Filtros
    </Button>
  </div>
)

// LoadingState
export const LoadingState = () => (
  <FloatingLoading/>
)

// ErrorState
export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div
    className="flex flex-col items-center justify-center h-64 p-6 text-center"
    role="alert"
    aria-live="assertive"
  >
    <AlertTriangle
      size={48}
      className="text-red-500 dark:text-red-400 mb-4"
      aria-hidden="true"
    />
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
      Erro ao carregar pedidos
    </h3>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
      {"Ocorreu um erro ao tentar carregar os pedidos. Por favor, tente novamente mais tarde."}
    </p>
    <Button
      onClick={onRetry}
      className="flex items-center gap-2"
      aria-label="Tentar carregar pedidos novamente"
    >
      <RefreshCw size={14} aria-hidden="true" />
      Tentar Novamente
    </Button>
  </div>
)
