"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import {
  Clock,
  Package,
  Truck,
  ShoppingBag,
  Calendar,
  Sparkles,
  MapPin,
  Search,
  FileText,
  AlertTriangle,
  RefreshCw,
  Info,
  ChevronRight,
  BadgeAlert,
  CheckCircle2,
} from "lucide-react"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import FloatingLoading from "../Loading/Loading"
import React from "react"
import { useNavigate } from "react-router-dom"
import PeriodFilter from "./FilterTruck/PeriodFilter"
import LogoBrowser from "@/assets/logoBrowser.png"
import { Separator } from "@/components/ui/separator"

// Interfaces
interface Pedido {
  duplicateCount: React.ReactNode
  hasDuplicates: any
  status: any
  grupo: string
  filial: string
  codigoTransportadora: string
  nomeTransportadora: string | null
  estado: string
  codigoDoCliente: string
  nomeCliente: string
  numeroPedido: string
  dataLancamentoPedido: string
  dataParaEntrega: string
  statusDoPedido: string
  dataPicking: string
  statusPicking: string
  notaFiscal: string
  chaveNFe: string
  internalCode: number
  statusNotaFiscal?: string
}

interface DateRange {
  start: Date
  end: Date
}

interface DeliveryStep {
  id: OrderStatus
  label: string
  description: ReactNode
  icon: React.ReactNode
  date?: string
  isActive: boolean
  isCompleted: boolean
}

type OrderStatus = "pedido_efetuado" | "liberado_logistica" | "previsao_entrega" | "entregue"

const removeDuplicatePedidos = (pedidos: Pedido[]): Pedido[] => {
  const pedidosMap = new Map<string, Pedido>()

  pedidos.forEach((pedido) => {
    const notaFiscal = pedido.notaFiscal || ""
    const key = `${pedido.numeroPedido}-${notaFiscal}`

    if (!pedidosMap.has(key)) {
      pedidosMap.set(key, pedido)
    } else {
      const existingPedido = pedidosMap.get(key)!
      const currentDate = new Date(pedido.dataLancamentoPedido)
      const existingDate = new Date(existingPedido.dataLancamentoPedido)

      if (currentDate > existingDate) {
        pedidosMap.set(key, pedido)
      }
    }
  })

  return Array.from(pedidosMap.values())
}

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const expirationTime = payload.exp * 1000
    return Date.now() > expirationTime
  } catch (error) {
    return true
  }
}

const getUserInternalCode = (): number => {
  try {
    const authData = localStorage.getItem("authData")
    if (authData) {
      const userData = JSON.parse(authData)
      return userData.internalCode || 0
    }
    return 0
  } catch (error) {
    return 0
  }
}

const slpCode = getUserInternalCode()

const StatusBadge = ({
  text,
  type,
}: {
  text: string
  type: "success" | "info" | "pending" | "default" | "warning"
}) => {
  const styles = {
    success:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    warning:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    default: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  }

  const icons = {
    success: <CheckCircle2 size={14} className="mr-1" aria-hidden="true" />,
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

const InfoItem = ({
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
        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={value}>
          {value}
        </div>
      </div>
    </div>
  )
}

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
    } else if (pedido.statusPicking === "Concluído") {
      return { text: "Em Preparação", type: "pending" as const }
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
      return "Data indisponível"
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Pedido ${pedido.numeroPedido}, cliente ${pedido.nomeCliente}, status ${status.text}`}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
        isSelected ? "bg-blue-50 dark:bg-gray-800 border-l-4 border-l-blue-600 shadow-sm" : ""
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Pedido: {pedido.numeroPedido}</div>
          <div>
            {pedido.notaFiscal ? (
              <span className="text-sm text-gray-700 dark:text-gray-300">NF: #{pedido.notaFiscal}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-1 rounded-md">
                <AlertTriangle size={12} aria-hidden="true" />
                NF não emitida
              </span>
            )}
          </div>
        </div>
        <StatusBadge text={status.text} type={status.type} />
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate" title={pedido.nomeCliente}>
        {pedido.nomeCliente}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} aria-hidden="true" />
          <span>{formatDateOnly(pedido.dataLancamentoPedido)}</span>
        </div>
        <ChevronRight size={16} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>
    </div>
  )
}

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 p-6 text-center" role="status" aria-live="polite">
    <Package size={48} className="text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" />
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhum pedido encontrado</h3>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
      Não encontramos pedidos registrados com esses dados. Tente buscar pelo número do Pedido, Nota Fiscal ou Nome do
      Cliente.
    </p>
    <Button onClick={onReset} className="flex items-center gap-2" aria-label="Limpar filtros e tentar novamente">
      <RefreshCw size={14} aria-hidden="true" />
      Limpar Filtros
    </Button>
  </div>
)

const LoadingState = () => (
  <div
    className="flex flex-col items-center justify-center h-full "
    role="status"
    aria-live="polite"
    aria-label="Carregando pedidos"
  >
    <FloatingLoading  />
  </div>
)

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 p-6 text-center" role="alert" aria-live="assertive">
    <AlertTriangle size={48} className="text-red-500 dark:text-red-400 mb-4" aria-hidden="true" />
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Erro ao carregar pedidos</h3>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
      Ocorreu um erro ao tentar carregar os pedidos. Por favor, tente novamente mais tarde.
    </p>
    <Button onClick={onRetry} className="flex items-center gap-2" aria-label="Tentar carregar pedidos novamente">
      <RefreshCw size={14} aria-hidden="true" />
      Tentar Novamente
    </Button>
  </div>
)

// Main component
const PedidoTruck = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([])
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDateRange, setActiveDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [, setStatusFilter] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pedido_efetuado")
  const [selectedPeriod, setSelectedPeriod] = useState(7)
  const navigate = useNavigate()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const orderListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end)
  }, [])

  useEffect(() => {
    if (pedidos.length > 0 && !selectedPedido) {
      setSelectedPedido(pedidos[0])
      determineOrderStatus(pedidos[0])
    }
  }, [pedidos])

  const determineOrderStatus = (pedido: Pedido) => {
    const hoje = new Date()
    const dataEntrega = new Date(pedido.dataParaEntrega)

    if (pedido.notaFiscal && dataEntrega < hoje) {
      setOrderStatus("entregue")
    } else if (pedido.notaFiscal) {
      setOrderStatus("previsao_entrega")
    } else if (pedido.statusPicking === "Concluído") {
      setOrderStatus("liberado_logistica")
    } else {
      setOrderStatus("pedido_efetuado")
    }
  }

  React.useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      localStorage.removeItem("token")
      navigate("/login")
      return
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem("token")
      navigate("/login")
      return
    }
  }, [navigate])

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days)

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const newDateRange = { start: startDate, end: endDate }
    setActiveDateRange(newDateRange)
    fetchPedidosWithDateRange(startDate, endDate)
  }

  const fetchPedidosWithDateRange = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        localStorage.removeItem("token")
        navigate("/login")
        return
      }

      if (isTokenExpired(token)) {
        localStorage.removeItem("token")
        navigate("/login")
        return
      }

      setActiveDateRange({
        start: startDate,
        end: endDate,
      })

      const formatarDataAPI = (date: Date) => {
        return format(date, "yyyy-MM-dd")
      }

      const params = {
        dataINI: formatarDataAPI(startDate),
        dataFIM: formatarDataAPI(endDate),
        slpCode: slpCode,
      }

      const response = await axios.get("/api/external/Pedidos/consultar-pedidos", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      let pedidosData = response.data.value || response.data.data || response.data

      if (Array.isArray(pedidosData)) {
        pedidosData = pedidosData.map((pedido) => ({
          ...pedido,
          numeroPedido: pedido.numeroPedido || "",
          nomeCliente: pedido.nomeCliente || "",
          notaFiscal: pedido.notaFiscal || "",
          chaveNFe: pedido.chaveNFe || "",
          codigoDoCliente: pedido.codigoDoCliente || "",
        }))

        pedidosData.sort((a: { dataLancamentoPedido: any }, b: { dataLancamentoPedido: any }) => {
          if (!a.dataLancamentoPedido || !b.dataLancamentoPedido) {
            return 0
          }
          const dataStrA = String(a.dataLancamentoPedido)
          const dataStrB = String(b.dataLancamentoPedido)
          const [yearA, monthA, dayA] = dataStrA.split("-")
          const [yearB, monthB, dayB] = dataStrB.split("-")
          const dataA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA)).getTime()
          const dataB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB)).getTime()
          return dataB - dataA
        })

        const pedidosUnicos = removeDuplicatePedidos(pedidosData)

        setAllPedidos(pedidosUnicos)
        setPedidos(pedidosUnicos)
      } else {
        setAllPedidos([])
        setPedidos([])
        setError("empty")
      }
      setError(null)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token")
      } else {
        setError("error")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase().trim()
    setSearchTerm(term)

    if (!term) {
      setPedidos(allPedidos)
      return
    }

    const filtered = allPedidos.filter((pedido) => {
      const numeroPedido = String(pedido.numeroPedido || "").toLowerCase()
      const nomeCliente = String(pedido.nomeCliente || "").toLowerCase()
      const notaFiscal = String(pedido.notaFiscal || "").toLowerCase()
      const chaveNFe = String(pedido.chaveNFe || "").toLowerCase()
      const codigoDoCliente = String(pedido.codigoDoCliente || "").toLowerCase()

      return (
        numeroPedido === term ||
        numeroPedido.includes(term) ||
        nomeCliente.includes(term) ||
        notaFiscal.includes(term) ||
        chaveNFe.includes(term) ||
        codigoDoCliente.includes(term)
      )
    })

    setPedidos(filtered)

    if (selectedPedido && !filtered.some((p) => p.numeroPedido === selectedPedido.numeroPedido)) {
      setSelectedPedido(filtered.length > 0 ? filtered[0] : null)
    }
  }

  const handleOrderKeyDown = (e: React.KeyboardEvent, pedido: Pedido) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setSelectedPedido(pedido)
      determineOrderStatus(pedido)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "dd/MM/yyyy ", { locale: ptBR })
    } catch {
      return "Data indisponível"
    }
  }


  const getDeliverySteps = (status: OrderStatus, pedido: Pedido): DeliveryStep[] => {
    const formatEntregaDescription = (): React.ReactNode => {
      return (
        <>
          Seu pedido está a caminho.
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mt-4 ">
            <CardContent className="pt-4">
              <div className="flex gap-3 text-blue-800 dark:text-blue-300">
                <Info className="shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div className="text-sm">
                  <p className="inline">
                    Dependendo da região, a entrega pode levar mais alguns dias. Qualquer dúvida entre em{" "}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        className="p-0 h-auto inline text-blue-700 dark:text-blue-400 underline underline-offset-2"
                      >
                        <a
                          href="https://mail.google.com/mail/?view=cm&fs=1&to=fretes@polarfix.com.br&cc=logistica@polarfix.com.br&su=Dúvida%20sobre%20Rastreamento%20de%20Pedido&body=Olá%20equipe%20Polar%20Fix%2C%0A%0AGostaria%20de%20obter%20informações%20sobre%20o%20rastreamento%20da%20minha%20mercadoria.%0A%0ADados%20do%20pedido%3A%0A-%20Número%20do%20pedido%20ou%20nota%3A%0A-%20Data%20da%20compra%3A%0A%0AFico%20no%20aguardo%20do%20retorno.%0A%0AAtenciosamente%2C%0A"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar email para suporte"
                        >
                          contato
                        </a>
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  .
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    return [
      {
        id: "pedido_efetuado",
        label: "Pedido Efetuado",
        description: "Seu pedido foi recebido e está sendo processado",
        icon: <ShoppingBag size={22} />,
        date: pedido.dataLancamentoPedido ? formatDate(pedido.dataLancamentoPedido) : undefined,
        isActive: status === "pedido_efetuado",
        isCompleted: ["pedido_efetuado", "liberado_logistica", "previsao_entrega", "entregue"].includes(status),
      },
      {
        id: "liberado_logistica",
        label: "Liberado para Logística",
        description: "Seu pedido foi separado e está sendo preparado para envio",
        icon: <Package size={22} />,
        isActive: status === "liberado_logistica",
        isCompleted: ["liberado_logistica", "previsao_entrega", "entregue"].includes(status),
      },
      {
        id: "previsao_entrega",
        label: "Liberado Para Transportadora",
        description: formatEntregaDescription(),
        icon: <Truck size={22} />,
        isActive: status === "previsao_entrega",
        isCompleted: ["previsao_entrega", "entregue"].includes(status),
      },
    ]
  }

  if (!selectedPedido) {
    return (
      <div className="w-full max-w-11/12  my-10 mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
        <header className="w-full  bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-700 dark:to-blue-900 py-6 px-8">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <Package size={24} className="text-blue-200" aria-hidden="true" />
            Meus Pedidos
          </h1>
        </header>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={() => fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end)} />
        ) : pedidos.length === 0 ? (
          <EmptyState
            onReset={() => {
              setSearchTerm("")
              setStatusFilter(null)
              setPedidos(allPedidos)
            }}
          />
        ) : (
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300">Selecione um pedido para visualizar detalhes.</p>
          </div>
        )}
      </div>
    )
  }

  const steps = getDeliverySteps(orderStatus, selectedPedido)

  return (
    <div className="w-full mx-auto p-4">
      <a
        href="#order-details"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Pular para detalhes do pedido
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside
          className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[calc(100vh-2rem)]"
          aria-label="Lista de pedidos"
        >
          <header className="w-full bg-gradient-to-r from-gray-900 to-blue-900 dark:from-gray-900 dark:to-blue-950 py-4 px-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <Package size={20} className="text-blue-200" aria-hidden="true" />
              Meus Pedidos
            </h2>
          </header>

          <PeriodFilter
            activeDateRange={activeDateRange}
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            onCustomDateApply={(startDate, endDate) => {
              setActiveDateRange({ start: startDate, end: endDate })
              fetchPedidosWithDateRange(startDate, endDate)
            }}
          />

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
                onChange={handleSearch}
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Busque por número do pedido, nota fiscal ou nome do cliente
              </span>
            </div>
          </div>

          <nav ref={orderListRef} className="flex-1 overflow-y-auto" aria-label="Lista de pedidos disponíveis">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState onRetry={() => fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end)} />
            ) : pedidos.length === 0 ? (
              <EmptyState
                onReset={() => {
                  setSearchTerm("")
                  setStatusFilter(null)
                  setPedidos(allPedidos)
                }}
              />
            ) : (
              <div role="list">
                {pedidos.map((pedido, index) => (
                  <div key={`${pedido.numeroPedido}-${index}`} role="listitem">
                    <PedidoListItem
                      pedido={pedido}
                      isSelected={selectedPedido?.numeroPedido === pedido.numeroPedido}
                      onClick={() => {
                        setSelectedPedido(pedido)
                        determineOrderStatus(pedido)
                      }}
                      onKeyDown={(e) => handleOrderKeyDown(e, pedido)}
                    />
                  </div>
                ))}
              </div>
            )}
          </nav>

          <Separator />

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
              ></div>
            </div>
            <span className="text-xs uppercase tracking-wider text-gray-300 dark:text-gray-400">
              Pedido{pedidos.length !== 1 ? "s" : ""} registrado
              {pedidos.length !== 1 ? "s" : ""}
            </span>
            <img src={LogoBrowser || "/placeholder.svg"} alt="Logo Polar Fix" className="w-8 ml-auto" />
          </footer>
        </aside>

        <main id="order-details" className="lg:col-span-8" aria-label="Detalhes do pedido selecionado">
          <article className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <header className="w-full bg-gradient-to-r from-gray-900 to-blue-900 dark:from-gray-900 dark:to-blue-950 py-6 px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-white text-2xl font-bold flex items-center gap-2 mb-2">
                    <Sparkles size={24} className="text-blue-200" aria-hidden="true" />
                    Acompanhamento do Pedido
                  </h2>
                  <p className="text-blue-100 text-lg font-medium">Pedido #{selectedPedido.numeroPedido}</p>
                  <p className="text-blue-100">
                    {selectedPedido.notaFiscal ? (
                      `Nota Fiscal #${selectedPedido.notaFiscal}`
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 rounded-md px-2 py-1 mt-1">
                        <BadgeAlert size={16} aria-hidden="true" />
                        Nota fiscal ainda não emitida
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <StatusBadge
                    text={
                      orderStatus === "entregue"
                        ? "Entregue"
                        : orderStatus === "previsao_entrega"
                          ? "Em Rota"
                          : orderStatus === "liberado_logistica"
                            ? "Em Preparação"
                            : "Processando"
                    }
                    type={
                      orderStatus === "entregue"
                        ? "success"
                        : orderStatus === "previsao_entrega"
                          ? "info"
                          : orderStatus === "liberado_logistica"
                            ? "pending"
                            : "default"
                    }
                  />
                </div>
              </div>
            </header>

            <section
              className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              aria-label="Informações resumidas"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Cliente" value={selectedPedido.nomeCliente} icon={<ShoppingBag size={20} />} />
                <InfoItem
                  label="Transportadora"
                  value={selectedPedido.nomeTransportadora || "Não definida"}
                  icon={<Truck size={20} />}
                />
              </div>
            </section>

            <div className="flex flex-col lg:flex-row gap-6 p-8 bg-white dark:bg-gray-900">
              <section className="flex-1" aria-label="Progresso da entrega">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  Progresso da Entrega
                </h3>

                <ol className="relative space-y-8" role="list">
                  {steps.map((step, index) => (
                    <li key={step.id} className="relative" aria-current={step.isActive ? "step" : undefined}>
                      {index < steps.length - 1 && (
                        <div className="absolute left-10 top-20 w-0.5 h-full -ml-px" aria-hidden="true">
                          <div
                            className={`h-full transition-all duration-500 ${
                              step.isCompleted
                                ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
                                : "bg-gray-300 dark:bg-gray-700"
                            }`}
                          ></div>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div
                          className={`flex items-center justify-center w-20 h-20 rounded-full shrink-0 border-4 shadow-lg transition-all duration-300 relative z-10 ${
                            step.isCompleted
                              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-300 dark:border-emerald-700 text-white"
                              : step.isActive
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 dark:border-blue-700 text-white"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600"
                          }`}
                          aria-hidden="true"
                        >
                          {step.icon}
                        </div>

                        <div className="flex-1 pt-2">
                          <h4
                            className={`font-semibold text-base mb-1 ${
                              step.isActive
                                ? "text-blue-700 dark:text-blue-400"
                                : step.isCompleted
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {step.label}
                          </h4>

                          <div
                            className={`text-sm ${
                              step.isActive || step.isCompleted
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {step.description}
                          </div>

                          {step.date && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                              <Clock size={14} aria-hidden="true" />
                              <time dateTime={step.date}>{step.date}</time>
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="flex-1" aria-label="Detalhes completos do pedido">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    Detalhes do Pedido
                  </h3>

                  <div className="space-y-6">
                    {/* Cronograma */}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Calendar size={16} aria-hidden="true" />
                        Cronograma
                      </h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Calendar size={14} aria-hidden="true" />
                            Pedido Realizado:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            <time dateTime={selectedPedido.dataLancamentoPedido}>
                              {formatDate(selectedPedido.dataLancamentoPedido)}
                            </time>
                          </dd>
                        </div>

                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Package size={14} aria-hidden="true" />
                            Picking Concluído:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedPedido.dataPicking ? (
                              <time dateTime={selectedPedido.dataPicking}>
                                {formatDate(selectedPedido.dataPicking)}
                              </time>
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Nota Fiscal */}
                    <div
                      className={`rounded-lg p-4 border ${
                        selectedPedido.notaFiscal
                          ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <h4
                        className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                          selectedPedido.notaFiscal
                            ? "text-emerald-900 dark:text-emerald-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <FileText size={16} aria-hidden="true" />
                        Nota Fiscal
                      </h4>

                      {selectedPedido.notaFiscal ? (
                        <dl className="space-y-3">
                          <div className="flex justify-between items-center">
                            <dt className="text-sm text-gray-700 dark:text-gray-300">Número:</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                              {selectedPedido.notaFiscal}
                            </dd>
                          </div>

                          <div className="flex justify-between items-center">
                            <dt className="text-sm text-gray-700 dark:text-gray-300">Status:</dt>
                            <dd>
                              <StatusBadge text={selectedPedido.statusNotaFiscal || "Emitida"} type="success" />
                            </dd>
                          </div>

                          {selectedPedido.chaveNFe && (
                            <div className="pt-1">
                              <dt className="text-sm text-gray-700 dark:text-gray-300 mb-1">Chave NFe:</dt>
                              <dd className="bg-white dark:bg-gray-900 p-2 rounded border border-emerald-200 dark:border-emerald-800 break-all text-xs text-gray-700 dark:text-gray-300 font-mono">
                                {selectedPedido.chaveNFe}
                              </dd>
                            </div>
                          )}
                        </dl>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3">
                          <AlertTriangle
                            size={24}
                            className="text-gray-400 dark:text-gray-600 mb-2"
                            aria-hidden="true"
                          />
                          <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                            Nota fiscal ainda não emitida
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Informações de Entrega */}
                    <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                        <Truck size={16} aria-hidden="true" />
                        Informações de Entrega
                      </h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Truck size={14} aria-hidden="true" />
                            Transportadora:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedPedido.nomeTransportadora || "Não definida"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <MapPin size={14} aria-hidden="true" />
                            Estado:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">{selectedPedido.estado}</dd>
                        </div>

                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Info size={14} aria-hidden="true" />
                            Filial:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">{selectedPedido.filial}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <ShoppingBag size={16} aria-hidden="true" />
                        Informações do Cliente
                      </h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <ShoppingBag size={14} aria-hidden="true" />
                            Nome:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100 text-right">
                            {selectedPedido.nomeCliente}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FileText size={14} aria-hidden="true" />
                            Código:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedPedido.codigoDoCliente}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center">
                          <dt className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Sparkles size={14} aria-hidden="true" />
                            Grupo:
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">{selectedPedido.grupo}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </main>
      </div>
    </div>
  )
}

export default PedidoTruck
