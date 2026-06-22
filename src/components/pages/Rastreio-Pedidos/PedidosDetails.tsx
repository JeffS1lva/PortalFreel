"use client";

import { useEffect, useState } from "react";
import axios from "@/utils/axiosConfig";
import { FileText, AlertTriangle, Hash, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pedido, OrderStatus, TrackingData } from "./types";
import { isTokenExpired } from "./types";
import { DeliveryTimeline } from "@/components/pages/Rastreio-Pedidos/PedidosDetails/DeliveryTimeline";
import { SummaryCards } from "@/components/pages/Rastreio-Pedidos/PedidosDetails/SummaryCards";
import { OrderDetails } from "@/components/pages/Rastreio-Pedidos/PedidosDetails/OrderDetails";
import { LoadingState, ErrorState } from "@/components/pages/Rastreio-Pedidos/PedidosDetails/StatusComponents";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

interface TrackingResponse {
  odataContext: string;
  value: TrackingData[];
}

function mapApiStatusToOrderStatus(apiStatus: string): OrderStatus | null {
  const statusMap: Record<string, OrderStatus> = {
    "1 - Pedido registrado": "pedido_registrado",
    "2 - Pedido em separação": "pedido_em_separacao",
    "3 - Pedido pronto para envio": "pedido_pronto_envio",
    "4 - Pedido com transportadora": "pedido_com_transportadora",
    // Legados
    "1 - Pedido em aberto": "pedido_registrado",
    "2 - Pedido liberado para picking": "pedido_em_separacao",
    "3 - Picking concluído": "pedido_pronto_envio",
    "4 - Pedido liberado para transportadora": "pedido_com_transportadora",
    "5 - Pedido entregue": "pedido_com_transportadora",
  };

  return statusMap[apiStatus] ?? null;
}

export interface PedidoDetailsProps {
  pedido: Pedido;
  orderStatus: OrderStatus;
  onBack: () => void;
}

export function PedidoDetails({
  pedido,
  orderStatus: initialOrderStatus,
  onBack,
}: PedidoDetailsProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrderStatus, setCurrentOrderStatus] =
    useState<OrderStatus>(initialOrderStatus);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = tokenStore.getToken();
      if (!token || isTokenExpired(token)) {
        tokenStore.setToken(null as unknown as string);
        return;
      }

      const response = await axios.get<TrackingResponse>(
        `${apiBase}/Pedidos/pedido-tracking/${pedido.numeroPedido}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.value && response.data.value.length > 0) {
        const data = response.data.value[0];
        setTrackingData(data);
        const mappedStatus = mapApiStatusToOrderStatus(data.statusPedido);
        setCurrentOrderStatus(mappedStatus ?? initialOrderStatus);
      } else {
        setTrackingData(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Erro ao carregar dados: ${err.message}`
          : "Erro desconhecido ao carregar tracking do pedido"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [pedido.numeroPedido]);


  return (
    <article className="w-full" aria-label="Detalhes do pedido selecionado">
      <header className="relative overflow-hidden bg-card border border-border rounded-2xl mb-6">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative p-6">
          <div className="mb-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar para pedidos
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Hash size={24} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-2xl font-bold text-foreground text-balance">
                    {"Pedido #"}
                    {pedido.numeroPedido}
                  </h2>
                  
                </div>
                <p className="text-muted-foreground text-sm">
                  {trackingData?.nfNum || pedido.notaFiscal ? (
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} aria-hidden="true" />
                      {"Nota Fiscal #"}  
                      {pedido.notaFiscal}                   
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={13} aria-hidden="true" />
                      {"Nota fiscal pendente"}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <DeliveryTimeline.CompactSteps 
              orderStatus={currentOrderStatus} 
              trackingData={trackingData}
            />
          </div>
        </div>
      </header>

      {error && <ErrorState error={error} onRetry={fetchTrackingData} />}

      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6">
          <LoadingState />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <SummaryCards pedido={pedido} trackingData={trackingData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <DeliveryTimeline 
                orderStatus={currentOrderStatus} 
                trackingData={trackingData}
              />
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <OrderDetails pedido={pedido} trackingData={trackingData} />
            </div>
          </div>
        </>
      )}
    </article>
  );
}