"use client";

import React from "react";
import {
  Clock,
  Package,
  Truck,
  ShoppingBag,
  Calendar,
  Check,
  Box,
} from "lucide-react";
import type {
  OrderStatus,
  DeliveryStep,
  TrackingData,
} from "@/components/pages/Rastreio-Pedidos/types";
import { formatDate } from "@/components/pages/Rastreio-Pedidos/types";

export interface DeliveryTimelineProps {
  orderStatus: OrderStatus;
  trackingData: TrackingData | null;
}

function getDeliverySteps(
  trackingData: TrackingData | null,
  currentStatus: OrderStatus,
): DeliveryStep[] {
  const formatEntregaDescription = (): React.ReactNode => (
    <>{"Seu pedido está a caminho."}</>
  );

  const dataPedido = trackingData?.dataPedido
    ? new Date(trackingData.dataPedido).toISOString()
    : undefined;

  const dataPicking = trackingData?.ultimaDataPicking
    ? new Date(trackingData.ultimaDataPicking).toISOString()
    : undefined;

  return [
    {
      id: "pedido_registrado",
      label: "Pedido Registrado",
      description: "Seu pedido foi recebido e está sendo processado",
      icon: <ShoppingBag size={18} />,
      date: dataPedido ? formatDate(dataPedido) : undefined,
      isActive: currentStatus === "pedido_registrado",
      isCompleted: [
        "pedido_registrado",
        "pedido_em_separacao",
        "pedido_pronto_envio",
        "pedido_com_transportadora",
      ].includes(currentStatus),
    },
    {
      id: "pedido_em_separacao",
      label: "Pedido em Separação",
      description: "Seu pedido está sendo separado em nosso estoque",
      icon: <Box size={18} />,
      date: dataPicking ? formatDate(dataPicking) : undefined,
      isActive: currentStatus === "pedido_em_separacao",
      isCompleted: [
        "pedido_em_separacao",
        "pedido_pronto_envio",
        "pedido_com_transportadora",
      ].includes(currentStatus),
    },
    {
      id: "pedido_pronto_envio",
      label: "Pronto para Envio",
      description: "Seu pedido foi separado e está sendo preparado para envio",
      icon: <Package size={18} />,
      isActive: currentStatus === "pedido_pronto_envio",
      isCompleted: [
        "pedido_pronto_envio",
        "pedido_com_transportadora",
      ].includes(currentStatus),
    },
    {
      id: "pedido_com_transportadora",
      label: "Com Transportadora",
      description: formatEntregaDescription(),
      icon: <Truck size={18} />,
      isActive: currentStatus === "pedido_com_transportadora",
      isCompleted: ["pedido_com_transportadora"].includes(currentStatus),
    },
  ];
}

function ProgressBar({ steps }: { steps: DeliveryStep[] }) {
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div
      className="relative w-full h-2 rounded-full bg-secondary overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary to-emerald-500 transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent animate-pulse"
        style={{ width: `${Math.min(progress + 10, 100)}%` }}
      />
    </div>
  );
}

function CompactSteps({ orderStatus, trackingData }: DeliveryTimelineProps) {
  const steps = getDeliverySteps(trackingData, orderStatus);
  const completedSteps = steps.filter((s) => s.isCompleted).length;

  return (
    <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2.5">
      <div className="text-right">
        <p className="text-xs text-muted-foreground font-medium">Progresso</p>
        <p className="text-lg font-bold text-foreground leading-none mt-0.5">
          {completedSteps}
          <span className="text-muted-foreground font-normal text-sm">
            {"/"}
            {steps.length}
          </span>
        </p>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              step.isCompleted
                ? "bg-emerald-500 shadow-[0_0_6px_1px] shadow-emerald-500/30"
                : step.isActive
                  ? "bg-primary shadow-[0_0_6px_1px] shadow-primary/30"
                  : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function DeliveryTimeline({
  orderStatus,
  trackingData,
}: DeliveryTimelineProps) {
  const steps = getDeliverySteps(trackingData, orderStatus);

  return (
    <section aria-label="Progresso da entrega">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Clock size={16} className="text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Progresso da Entrega
        </h3>
      </div>

      <ProgressBar steps={steps} />

      <ol className="mt-6 space-y-1" role="list">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`relative flex items-start gap-4 rounded-xl p-4 transition-all duration-300 ${
              step.isActive
                ? "bg-primary/5 border border-primary/15"
                : step.isCompleted
                  ? "bg-emerald-500/5 border border-transparent"
                  : "border border-transparent"
            }`}
            aria-current={step.isActive ? "step" : undefined}
          >
            {index < steps.length - 1 && (
              <div
                className="absolute left-[2.125rem] top-14 w-px h-[calc(100%-1.5rem)]"
                aria-hidden="true"
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    step.isCompleted
                      ? "bg-gradient-to-b from-emerald-500 to-emerald-500/30"
                      : "bg-border"
                  }`}
                />
              </div>
            )}

            <div
              className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all duration-300 ${
                step.isCompleted
                  ? "bg-emerald-500 text-card shadow-[0_0_0_4px] shadow-emerald-500/15"
                  : step.isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_0_4px] shadow-primary/15"
                    : "bg-secondary text-muted-foreground border border-border"
              }`}
              aria-hidden="true"
            >
              {step.isCompleted && !step.isActive ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                step.icon
              )}
            </div>

            <div className="flex-1 pt-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={`font-semibold text-sm ${
                    step.isActive
                      ? "text-primary"
                      : step.isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </h4>
                {step.isCompleted && !step.isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Concluído
                  </span>
                )}
                {step.isActive && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                )}
              </div>
              <div
                className={`text-sm leading-relaxed mt-1 ${
                  step.isActive || step.isCompleted
                    ? "text-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {step.description}
              </div>
              {step.date && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
                  <Calendar size={11} aria-hidden="true" />
                  <time dateTime={step.date}>{step.date}</time>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

DeliveryTimeline.CompactSteps = CompactSteps;
