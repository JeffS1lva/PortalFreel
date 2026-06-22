import type { ReactNode } from "react"
import { parseISO, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { tokenStore } from "@/utils/tokenStore";

export interface Pedido {
  codigoCliente: string
  transportadora: any
  duplicateCount: ReactNode
  hasDuplicates: boolean
  status: string
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
  nfNum: number
  companyCode: number
}

export interface DateRange {
  start: Date
  end: Date
}

export type OrderStatus =
  | "pedido_registrado"
  | "pedido_em_separacao"
  | "pedido_pronto_envio"
  | "pedido_com_transportadora"
  | "pedido_entregue"
  | "pedido_efetuado"
  | "liberado_logistica"
  | "previsao_entrega"
  | "entregue"
  | string;

export interface DeliveryStep {
  id: OrderStatus
  label: string
  description: ReactNode
  icon: React.ReactNode
  date?: string
  isActive: boolean
  isCompleted: boolean
}

export interface TrackingData {
  pedidoDocEntry: number;
  pedidoNum: number;
  codigoCliente: string;
  nomeCliente: string;
  dataPedido: string;
  valorTotal: number;
  ultimaDataPicking: string | null;
  nfNum: number | null;
  dataNF: string | null;
  entregaParcial: string;
  statusPedido: string;
  observacaoStatus: string;
  nomeTransportadora: string;
  id: number;
}

export interface AirtimeOcorrencia {
  tipo: string
  numero: string
  data: string
  hora: string | null
  obs: string
  cte_numero: string
  cte_aut_data: string
  nf_numero: string
  razao_remetente: string
  cnpj_remetente: string
  razao_destinatario: string
  cnpj_destinatario: string
  entrega_nome: string
  entrega_rg: string
  comprovante: { url: string }[]
}

export interface AirtimeResponse {
  message: string
  status: number
  data: {
    status: number
    message: string
    documento: string
    dados: AirtimeOcorrencia[]
  }[]
}

export const removeDuplicatePedidos = (pedidos: Pedido[]): Pedido[] => {
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

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Date.now() > payload.exp * 1000
  } catch {
    return true
  }
}

export const getUserInternalCode = (): number => {
  try {
    const authData = tokenStore.getAuthData()
    if (authData) {
      const userData = JSON.parse(authData)
      return userData.internalCode || 0
    }
    return 0
  } catch {
    return 0
  }
}

export const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString)
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return "Data indisponivel"
  }
}

export const getStatusInfo = (pedido: Pedido) => {
  if (pedido.notaFiscal && new Date(pedido.dataParaEntrega) < new Date()) {
    return { text: "Em Rota", type: "success" as const }
  } else if (pedido.notaFiscal) {
    return { text: "Em Rota", type: "info" as const }
  } else if (pedido.statusPicking === "Concluido") {
    return { text: "Em Preparacao", type: "pending" as const }
  } else {
    return { text: "Processando", type: "default" as const }
  }
}

export const getStatusBadgeProps = (orderStatus: OrderStatus) => {
  const textMap: Record<string, string> = {
    pedido_registrado: "Pedido Registrado",
    pedido_em_separacao: "Em Separação",
    pedido_pronto_envio: "Pronto para Envio",
    pedido_com_transportadora: "Com Transportadora",
    pedido_entregue: "Entregue",
    entregue: "Entregue",
    previsao_entrega: "Em Rota",
    liberado_logistica: "Em Preparação",
    pedido_efetuado: "Processando",
  }
  
  const typeMap: Record<string, "success" | "info" | "pending" | "default"> = {
    pedido_registrado: "default",
    pedido_em_separacao: "pending",
    pedido_pronto_envio: "pending",
    pedido_com_transportadora: "info",
    pedido_entregue: "success",
    entregue: "success",
    previsao_entrega: "info",
    liberado_logistica: "pending",
    pedido_efetuado: "default",
  }
  
  return { 
    text: textMap[orderStatus] || "Processando", 
    type: typeMap[orderStatus] || "default" 
  }
}

export const determineOrderStatusFromPedido = (pedido: Pedido): OrderStatus => {
  if (pedido.notaFiscal) return "pedido_com_transportadora"
  if (pedido.statusPicking === "Concluido") return "pedido_pronto_envio"
  if (pedido.dataPicking) return "pedido_em_separacao"
  return "pedido_registrado"
}