import { useState, useEffect, type ReactNode } from "react";
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
} from "lucide-react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Loading from "../Loading/Loading";
import React from "react";
import { useNavigate } from "react-router-dom";
import PeriodFilter from "./FilterTruck/PeriodFilter";
import LogoBrowser from "@/assets/logoBrowser.png";
import { Separator } from "@/components/ui/separator";

// Interfaces
interface Pedido {
  duplicateCount: React.ReactNode;
  hasDuplicates: any;
  status: any;
  grupo: string;
  filial: string;
  codigoTransportadora: string;
  nomeTransportadora: string | null;
  estado: string;
  codigoDoCliente: string;
  nomeCliente: string;
  numeroPedido: string;
  dataLancamentoPedido: string;
  dataParaEntrega: string;
  statusDoPedido: string;
  dataPicking: string;
  statusPicking: string;
  notaFiscal: string;
  chaveNFe: string;
  internalCode: number;
  statusNotaFiscal?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface DeliveryStep {
  id: OrderStatus;
  label: string;
  description: ReactNode;
  icon: React.ReactNode;
  date?: string;
  isActive: boolean;
  isCompleted: boolean;
}

// Status possíveis do pedido para a timeline
type OrderStatus =
  | "pedido_efetuado"
  | "liberado_logistica"
  | "previsao_entrega"
  | "entregue";

// Opções de período predefinidas

// Função para remover pedidos duplicados
// Critério: Remove apenas pedidos que tenham o MESMO número E a MESMA nota fiscal
// Permite pedidos com mesmo número se tiverem notas fiscais diferentes
const removeDuplicatePedidos = (pedidos: Pedido[]): Pedido[] => {
  const pedidosMap = new Map<string, Pedido>();

  pedidos.forEach((pedido) => {
    // Cria uma chave única baseada no número do pedido E na nota fiscal
    // Se não há nota fiscal, usa uma string vazia para diferenciá-la de casos com nota
    const notaFiscal = pedido.notaFiscal || "";
    const key = `${pedido.numeroPedido}-${notaFiscal}`;

    // Se ainda não existe um pedido com essa combinação exata, adiciona
    if (!pedidosMap.has(key)) {
      pedidosMap.set(key, pedido);
    } else {
      // Se já existe um pedido com mesmo número E mesma nota fiscal,
      // mantém o mais recente baseado na data de lançamento
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
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() > expirationTime;
  } catch (error) {
    return true;
  }
};

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

const slpCode = getUserInternalCode();

// Componente principal
const PedidoTruck = () => {
  // Estados
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
  const [, setStatusFilter] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] =
    useState<OrderStatus>("pedido_efetuado");
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Período selecionado em dias
  const navigate = useNavigate();

  // Efeito para carregar dados iniciais (15 dias)
  useEffect(() => {
    fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end);
  }, []);

  // Efeito para selecionar o primeiro pedido quando a lista é carregada
  useEffect(() => {
    if (pedidos.length > 0 && !selectedPedido) {
      setSelectedPedido(pedidos[0]);
      determineOrderStatus(pedidos[0]);
    }
  }, [pedidos]);

  // Determina o status do pedido baseado nas datas disponíveis
  const determineOrderStatus = (pedido: Pedido) => {
    const hoje = new Date();
    const dataEntrega = new Date(pedido.dataParaEntrega);

    if (pedido.notaFiscal && dataEntrega < hoje) {
      setOrderStatus("entregue");
    } else if (pedido.notaFiscal) {
      setOrderStatus("previsao_entrega");
    } else if (pedido.statusPicking === "Concluído") {
      setOrderStatus("liberado_logistica");
    } else {
      setOrderStatus("pedido_efetuado");
    }
  };

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

  // Função para alterar o período
  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const newDateRange = { start: startDate, end: endDate };
    setActiveDateRange(newDateRange);
    fetchPedidosWithDateRange(startDate, endDate);
  };

  // Buscar pedidos da API
  const fetchPedidosWithDateRange = async (startDate: Date, endDate: Date) => {
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

      setActiveDateRange({
        start: startDate,
        end: endDate,
      });

      const formatarDataAPI = (date: Date) => {
        return format(date, "yyyy-MM-dd");
      };

      const params = {
        dataINI: formatarDataAPI(startDate),
        dataFIM: formatarDataAPI(endDate),
        slpCode: slpCode,
      };

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
        pedidosData = pedidosData.map((pedido) => ({
          ...pedido,
          numeroPedido: pedido.numeroPedido || "",
          nomeCliente: pedido.nomeCliente || "",
          notaFiscal: pedido.notaFiscal || "",
          chaveNFe: pedido.chaveNFe || "",
          codigoDoCliente: pedido.codigoDoCliente || "",
        }));

        pedidosData.sort(
          (
            a: { dataLancamentoPedido: any },
            b: { dataLancamentoPedido: any }
          ) => {
            if (!a.dataLancamentoPedido || !b.dataLancamentoPedido) {
              return 0;
            }
            const dataStrA = String(a.dataLancamentoPedido);
            const dataStrB = String(b.dataLancamentoPedido);
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
            return dataB - dataA;
          }
        );

        // Remove duplicatas antes de definir os estados
        const pedidosUnicos = removeDuplicatePedidos(pedidosData);

        setAllPedidos(pedidosUnicos);
        setPedidos(pedidosUnicos);
      } else {
        setAllPedidos([]);
        setPedidos([]);
        setError("empty");
      }
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
      } else {
        setError("error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pedidos por termo de busca
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase().trim();
    setSearchTerm(term);

    if (!term) {
      setPedidos(allPedidos);
      return;
    }

    const filtered = allPedidos.filter((pedido) => {
      const numeroPedido = String(pedido.numeroPedido || "").toLowerCase();
      const nomeCliente = String(pedido.nomeCliente || "").toLowerCase();
      const notaFiscal = String(pedido.notaFiscal || "").toLowerCase();
      const chaveNFe = String(pedido.chaveNFe || "").toLowerCase();
      const codigoDoCliente = String(
        pedido.codigoDoCliente || ""
      ).toLowerCase();

      return (
        numeroPedido === term ||
        numeroPedido.includes(term) ||
        nomeCliente.includes(term) ||
        notaFiscal.includes(term) ||
        chaveNFe.includes(term) ||
        codigoDoCliente.includes(term)
      );
    });

    setPedidos(filtered);

    if (
      selectedPedido &&
      !filtered.some((p) => p.numeroPedido === selectedPedido.numeroPedido)
    ) {
      setSelectedPedido(filtered.length > 0 ? filtered[0] : null);
    }
  };

  // Métodos para formatar datas
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy ", { locale: ptBR });
    } catch {
      return "Data indisponível";
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data indisponível";
    }
  };

  // Determina os passos com base no status atual
  const getDeliverySteps = (
    status: OrderStatus,
    pedido: Pedido
  ): DeliveryStep[] => {
    const formatEntregaDescription = (): React.ReactNode => {
      return (
        <>
          Seu pedido está a caminho.
          <Card className="bg-slate-200 dark:bg-sidebar-accent mt-10">
            <CardContent>
              <div className="flex gap-3 text-red-600 dark:text-red-500">
                <BadgeAlert />
                <div>
                  <p className="inline">
                    Dependendo da região, a entrega pode levar mais alguns dias.
                    Qualquer dúvida entre em{" "}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant={"bottomTrucker"}
                        className="border-0 p-0 h-auto inline"
                      >
                        <a
                          href="https://mail.google.com/mail/?view=cm&fs=1&to=fretes@polarfix.com.br&cc=logistica@polarfix.com.br&su=Dúvida%20sobre%20Rastreamento%20de%20Pedido&body=Olá%20equipe%20Polar%20Fix%2C%0A%0AGostaria%20de%20obter%20informações%20sobre%20o%20rastreamento%20da%20minha%20mercadoria.%0A%0ADados%20do%20pedido%3A%0A-%20Número%20do%20pedido%20ou%20nota%3A%0A-%20Data%20da%20compra%3A%0A%0AFico%20no%20aguardo%20do%20retorno.%0A%0AAtenciosamente%2C%0A"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:underline-offset-2"
                          title="Enviar email"
                        >
                          contato.
                        </a>
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      );
    };

    return [
      {
        id: "pedido_efetuado",
        label: "Pedido Efetuado",
        description: "Seu pedido foi recebido e está sendo processado",
        icon: <ShoppingBag size={22} />,
        date: pedido.dataLancamentoPedido
          ? formatDate(pedido.dataLancamentoPedido)
          : undefined,
        isActive: status === "pedido_efetuado",
        isCompleted: [
          "pedido_efetuado",
          "liberado_logistica",
          "previsao_entrega",
          "entregue",
        ].includes(status),
      },
      {
        id: "liberado_logistica",
        label: "Liberado para Logística",
        description:
          "Seu pedido foi separado e está sendo preparado para envio",
        icon: <Package size={22} />,
        isActive: status === "liberado_logistica",
        isCompleted: [
          "liberado_logistica",
          "previsao_entrega",
          "entregue",
        ].includes(status),
      },
      {
        id: "previsao_entrega",
        label: "Liberado Para Transportadora",
        description: formatEntregaDescription(),
        icon: <Truck size={22} />,
        isActive: status === "previsao_entrega",
        isCompleted: ["previsao_entrega", "entregue"].includes(status),
      },
    ];
  };

  // Componente para badges de status
  const StatusBadge = ({
    text,
    type,
  }: {
    text: string;
    type: "success" | "info" | "pending" | "default" | "warning";
  }) => {
    const styles = {
      success: "bg-green-100 text-green-800 border-green-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      warning: "bg-orange-100 text-orange-800 border-orange-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`${styles[type]} text-xs font-semibold px-3 py-1 rounded-full border`}
      >
        {text}
      </span>
    );
  };

  // Componente para itens de informação
  const InfoItem = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: React.ReactNode;
  }) => {
    return (
      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors dark:bg-sidebar dark:border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm text-blue-600 ">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-medium dark:text-gray-500">
            {label}
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-300">
            {value}
          </div>
        </div>
      </div>
    );
  };

  // Componente para cada pedido na lista
  const PedidoListItem = ({
    pedido,
    isSelected,
    onClick,
  }: {
    pedido: Pedido;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    const getStatusInfo = (pedido: Pedido) => {
      if (pedido.notaFiscal && new Date(pedido.dataParaEntrega) < new Date()) {
        return { text: "Entregue", type: "success" as const };
      } else if (pedido.notaFiscal) {
        return { text: "Em Rota", type: "info" as const };
      } else if (pedido.statusPicking === "Concluído") {
        return { text: "Em Preparação", type: "pending" as const };
      } else {
        return { text: "Processando", type: "default" as const };
      }
    };

    const status = getStatusInfo(pedido);

    return (
      <div
        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-sidebar-accent ${
          isSelected
            ? "bg-zinc-100 border-l-4 border-l-blue-500 dark:bg-sidebar-accent dark:border-l-blue-500"
            : ""
        }`}
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium text-gray-900 dark:text-zinc-100">
              Pedido: {pedido.numeroPedido}
            </div>
            <div>
              {pedido.notaFiscal ? (
                <span className="flex text-md font-medium text-gray-900 dark:text-zinc-100">
                  Nota Fiscal: #{pedido.notaFiscal}
                </span>
              ) : (
                <span className="flex text-sm font-medium text-red-500 bg-red-100 px-2 mt-1 rounded-sm">
                  Nota fiscal ainda não emitida
                </span>
              )}
            </div>
          </div>
          <StatusBadge text={status.text} type={status.type} />
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-600 mb-1">
          {pedido.nomeCliente}
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDateOnly(pedido.dataLancamentoPedido)}
          </div>
          <div className="flex items-center gap-1">
            <ChevronRight
              size={16}
              className="text-blue-500 dark:text-gray-500"
            />
          </div>
        </div>
      </div>
    );
  };

  // Componente para o estado vazio
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <Package size={48} className="text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-600 mb-2">
        Nenhum pedido encontrado
      </h3>
      <p className="text-gray-500 max-w-md">
        Não encontramos pedidos registrados com esses dados. Tente buscar pelo
        número do Pedido, Nota Fiscal ou Nome do Cliente.
      </p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        onClick={() => {
          setSearchTerm("");
          setStatusFilter(null);
          setPedidos(allPedidos);
        }}
      >
        <RefreshCw size={14} />
        Tentar novamente
      </button>
    </div>
  );

  // Componente para o estado de carregamento
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <Loading message="Carregandos Pedidos..." />
    </div>
  );

  // Componente para o estado de erro
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Erro ao carregar pedidos
      </h3>
      <p className="text-gray-500 max-w-md">
        Ocorreu um erro ao tentar carregar os pedidos. Por favor, tente
        novamente mais tarde.
      </p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        onClick={() =>
          fetchPedidosWithDateRange(activeDateRange.start, activeDateRange.end)
        }
      >
        <RefreshCw size={14} />
        Tentar novamente
      </button>
    </div>
  );

  // Caso não haja um pedido selecionado, mostra apenas a lista de pedidos
  if (!selectedPedido) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-sidebar dark:border rounded-xl shadow-lg overflow-hidden ">
        <div className="w-full bg-gradient-to-r from-sky-800 to-zinc-900  py-6 px-8">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Package size={20} className="text-blue-200" />
            Meus Pedidos
          </h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : pedidos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4">
            <p className="text-gray-700">
              Selecione um pedido para visualizar detalhes.
            </p>
          </div>
        )}
      </div>
    );
  }

  const steps = getDeliverySteps(orderStatus, selectedPedido);

  return (
    <div className="w-full  max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Coluna da lista de pedidos */}
        <div className="md:col-span-4 bg-white dark:bg-sidebar dark:border rounded-xl shadow-lg overflow-hidden h-6/9">
          <div className="w-full bg-gradient-to-r from-sky-800 to-zinc-900 dark:bg-gradient-to-r dark:from-sky-900 dark:to-zinc-900 py-4 px-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <Package size={18} className="text-blue-200" />
              Meus Pedidos
            </h2>
          </div>
          {/* Filtro de Período */}
          <PeriodFilter
            activeDateRange={activeDateRange}
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            onCustomDateApply={(startDate, endDate) => {
              setActiveDateRange({ start: startDate, end: endDate });
              fetchPedidosWithDateRange(startDate, endDate);
            }}
          />
          {/* Barra de pesquisa */}
          <div className="p-4 border-b dark:border-b-gray-700 border-gray-200">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Busque seus pedidos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-accent dark:focus:ring-border"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          {/* Lista de pedidos */}
          <div className="h-full  overflow-y-auto scrollbar max-h-screen">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : pedidos.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y flex-1 divide-gray-100">
                {pedidos.map((pedido, index) => (
                  <PedidoListItem
                    key={`${pedido.numeroPedido}-${index}`}
                    pedido={pedido}
                    isSelected={
                      selectedPedido?.numeroPedido === pedido.numeroPedido
                    }
                    onClick={() => {
                      setSelectedPedido(pedido);
                      determineOrderStatus(pedido);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex py-8    gap-2 px-3 items-center font-medium text-xs uppercase tracking-wider group bg-gradient-to-r from-zinc-900 to-sky-800 ">
            <div className="relative">
              <span className="bg-gradient-to-r from-sky-900 to-slate-600 dark:from-indigo-600 dark:to-purple-700  text-white px-3 py-1.5 rounded-full shadow-lg  transition-all duration-300 hover:shadow-xl hover:scale-105 font-mono text-sm">
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
              <span className="text-gray-200 dark:text-gray-400 transition-colors duration-300 group-hover:text-sky-200 dark:group-hover:text-indigo-300">
                Pedido{pedidos.length !== 1 ? "s" : ""} registrado
                {pedidos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <img
              src={LogoBrowser}
              alt="Logo Polar Fix"
              className="w-8   ml-auto"
            />
          </div>
        </div>

        {/* Coluna dos detalhes do pedido */}
        <div className="md:col-span-8">
          <div className="w-full bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-xl overflow-hidden">
            {/* Cabeçalho com gradiente */}
            <div className="w-full bg-gradient-to-r from-sky-800 to-slate-900 dark:bg-gradient-to-r dark:from-sky-900 dark:to-slate-900 py-6 px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-200" />
                    Acompanhamento do Pedido
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Pedido #{selectedPedido.numeroPedido}
                  </p>
                  <p className="text-blue-100">
                    {selectedPedido.notaFiscal ? (
                      `Nota Fiscal #${selectedPedido.notaFiscal}`
                    ) : (
                      <span className="flex items-center text-sm font-medium text-red-500 bg-red-200 rounded-sm p-1 w-full max-w-60 mt-1 gap-1">
                        <BadgeAlert size={18} />
                        Nota fiscal ainda não emitida
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-3 md:mt-0">
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
            </div>

            {/* Informações resumidas do pedido */}
            <div className="p-6 bg-white border-b border-gray-100 dark:bg-sidebar dark:border-b-accent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <InfoItem
                  label="Cliente"
                  value={selectedPedido.nomeCliente}
                  icon={<ShoppingBag size={18} />}
                />
                <InfoItem
                  label="Transportadora"
                  value={selectedPedido.nomeTransportadora || "Não definida"}
                  icon={<Truck size={18} className="w-12" />}
                />
              </div>
            </div>

            {/* Container para timeline e detalhes */}
            <div className="flex flex-col dark:bg-sidebar dark:border gap-6 p-8">
              {/* Timeline de status */}
              <div className="w-full   relative">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600 " />
                  Progresso da Entrega
                </h3>

                {/* Linha conectora */}
                <div className="absolute left-10 top-16  w-1 bg-gradient-to-b from-blue-100 to-green-100 rounded-full -translate-x-1/2 z-0"></div>

                {/* Passos */}
                <div className="flex flex-col relative z-10">
                  {steps.map((step, index) => (
                    <div key={step.id} className="mb-8 last:mb-0 relative">
                      {/* Linha conectando os passos (exceto o último) */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-10 left-20 right-0 h-1 bg-gray-200 overflow-hidden ">
                          <div
                            className={`h-full ${
                              step.isCompleted ? "bg-green-500" : "bg-gray-300"
                            } transition-all duration-500 ease-in-out`}
                            style={{
                              width: step.isCompleted ? "100%" : "0%",
                              background: step.isCompleted
                                ? "linear-gradient(to right, #4ade80, #22d3ee)"
                                : "#e5e7eb",
                            }}
                          ></div>
                        </div>
                      )}

                      <div className="flex flex-col items-start">
                        {/* Ícone do passo */}
                        <div
                          className={`flex items-center justify-center w-20 h-20 rounded-full shrink-0 border-4 shadow-md transition-all duration-300 relative z-10 ${
                            step.isCompleted
                              ? "bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white"
                              : step.isActive
                              ? "bg-gradient-to-br from-blue-400 to-blue-600 border-blue-100 text-white"
                              : "bg-gray-100 border-white dark:border-zinc-300 text-gray-400"
                          }`}
                        >
                          {step.icon}
                        </div>

                        {/* Informações do passo */}
                        <div className="ml-2 mt-4 flex-1">
                          <h3
                            className={`font-semibold text-sm ${
                              step.isActive
                                ? "text-blue-700"
                                : step.isCompleted
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </h3>

                          <p
                            className={`mt-1 ${
                              step.isActive || step.isCompleted
                                ? "text-gray-700 dark:text-gray-600"
                                : "text-gray-500"
                            }`}
                          >
                            {step.description}
                          </p>

                          {step.date && (
                            <p className="text-sm text-gray-500 mt-2 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {step.date}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes do pedido */}
              <div className="w-full ">
                <div className="bg-white dark:bg-sidebar dark:border-accent rounded-xl shadow-lg p-6 h-full border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Detalhes do Pedido
                  </h3>

                  <div className="space-y-6">
                    {/* Bloco de datas */}
                    <div className="bg-blue-50 dark:bg-sidebar dark:border rounded-lg p-4 border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-600" />
                        Cronograma
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <Calendar size={16} className="text-blue-600" />
                            Pedido Realizado:
                          </div>
                          <span className="font-medium">
                            {formatDate(selectedPedido.dataLancamentoPedido)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <Package size={16} className="text-blue-600" />
                            Picking Concluído:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.dataPicking
                              ? formatDate(selectedPedido.dataPicking)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco de nota fiscal */}
                    <div
                      className={`${
                        selectedPedido.notaFiscal
                          ? "bg-green-50 border-green-100 dark:bg-sidebar dark:border"
                          : "bg-gray-50 border-gray-100 dark:bg-sidebar dark:border"
                      } rounded-lg p-4 border`}
                    >
                      <h4
                        className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                          selectedPedido.notaFiscal
                            ? "text-gray-800 dark:text-gray-500"
                            : "text-gray-600 dark:text-gray-100"
                        }`}
                      >
                        <FileText
                          size={14}
                          className={
                            selectedPedido.notaFiscal
                              ? "text-gray-600"
                              : "text-gray-500"
                          }
                        />
                        Nota Fiscal
                      </h4>

                      {selectedPedido.notaFiscal ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-500">
                              Número:
                            </span>
                            <span className="font-medium">
                              {selectedPedido.notaFiscal}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-500">
                              Status:
                            </span>
                            <StatusBadge
                              text={
                                selectedPedido.statusNotaFiscal || "Emitida"
                              }
                              type="success"
                            />
                          </div>

                          {selectedPedido.chaveNFe && (
                            <div className="pt-1">
                              <span className="text-sm text-gray-700 dark:text-gray-500">
                                Chave NFe:
                              </span>
                              <div className="mt-1 bg-white p-2 rounded border border-green-200 break-all text-xs text-gray-600">
                                {selectedPedido.chaveNFe}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3">
                          <AlertTriangle
                            size={24}
                            className="text-gray-400 mb-2"
                          />
                          <p className="text-gray-500 text-sm text-center">
                            Nota fiscal ainda não emitida
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bloco de transporte */}
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 dark:bg-sidebar dark:border">
                      <h4 className="text-sm font-medium text-indigo-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <Truck size={14} className="text-indigo-600 " />
                        Informações de Entrega
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <Truck size={16} className="text-indigo-600" />
                            Transportadora:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.nomeTransportadora ||
                              "Não definida"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <MapPin size={16} className="text-indigo-600" />
                            Estado:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.estado}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <Info size={16} className="text-indigo-600" />
                            Filial:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.filial}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informações adicionais do cliente */}
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 dark:bg-sidebar dark:border">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-amber-600" />
                        Informações do Cliente
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <ShoppingBag size={16} className="text-amber-600" />
                            Nome:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.nomeCliente}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <FileText size={16} className="text-amber-600" />
                            Código:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.codigoDoCliente}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-500">
                            <Sparkles size={16} className="text-amber-600" />
                            Grupo:
                          </div>
                          <span className="font-medium">
                            {selectedPedido.grupo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoTruck;
