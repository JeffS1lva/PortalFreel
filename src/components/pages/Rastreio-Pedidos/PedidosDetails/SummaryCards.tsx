"use client";

import { Truck, MapPin, Calendar, Users } from "lucide-react";
import type { Pedido, TrackingData } from "@/components/pages/Rastreio-Pedidos/types";
import { formatDate } from "@/components/pages/Rastreio-Pedidos/types";

export interface SummaryCardsProps {
  pedido: Pedido;
  trackingData: TrackingData | null;
}

export function SummaryCards({ pedido, trackingData }: SummaryCardsProps) {
  const cliente = trackingData?.nomeCliente || pedido.nomeCliente;
  const transportadora = trackingData?.nomeTransportadora 
    || pedido.nomeTransportadora 
    || "Não definida";

  const estado = pedido.estado;
  const dataPedido = trackingData?.dataPedido
    ? formatDate(new Date(trackingData.dataPedido).toISOString())
    : formatDate(pedido.dataLancamentoPedido);

  const cards = [
    {
      label: "Cliente",
      value: cliente,
      icon: <Users size={20} />,
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary bg-primary/10",
    },
    {
      label: "Transportadora",
      value: transportadora,
      icon: <Truck size={20} />,
      color: "from-accent/10 to-accent/5",
      iconColor: "text-accent-foreground bg-accent/20",
    },
    {
      label: "Estado",
      value: estado,
      icon: <MapPin size={20} />,
      color: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Data do Pedido",
      value: dataPedido,
      icon: <Calendar size={20} />,
      color: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden bg-gradient-to-br ${card.color} rounded-xl border border-border/50 p-4`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.iconColor} shrink-0`}
              aria-hidden="true"
            >
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {card.label}
              </p>
              <p
                className="font-semibold text-foreground text-sm truncate"
                title={card.value}
              >
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}