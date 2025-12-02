"use client";

import React from "react";

import { useState } from "react";
import {
  BarChart3,
  Users,
  Package,
  Landmark,
  TrendingUp,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { ReportClientVend } from "@/components/pages/relatorios/ReportClientVend";
import { ReportVendas } from "@/components/pages/relatorios/ReportVendas";
import { ReportVendasItens } from "./relatorios/ReportVendasItens";
import { ReportClientGroup } from "./relatorios/ReportClientGroup";

import { ReportProductSales } from "./relatorios/ReportProductSales";
import { ReportProductSemVendas } from "./relatorios/ReportProductSemVendas";

type DataView =
  | "vendas"
  | "clientes"
  | "produtos"
  | "grupoVendas"
  | "ReportProductSales"
  | "ReportProductSemVendas";

interface ViewConfig {
  id: DataView;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const viewConfigs: ViewConfig[] = [
  {
    id: "vendas",
    title: "Análise de Clientes e Vendas",
    description:
      "Monitore o ciclo de compra dos clientes, identifique inativos e avalie resultados de vendas.",
    icon: BarChart3,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: "clientes",
    title: "Análise de Vendas",
    description:
      "Relatório de vendas segmentado por representante, destacando resultados e performance comercial.",
    icon: Users,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "produtos",
    title: "Análise de Produtos",
    description:
      "Relatório de vendas por grupo de itens, evidenciando desempenho e participação de cada categoria.",
    icon: Package,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: "grupoVendas",
    title: "Vendas por Grupo de Clientes",
    description:
      "Relatório consolidado de desempenho comercial segmentado por grupos de clientes",
    icon: Landmark,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    id: "ReportProductSales",
    title: "Análise de Vendas - Últimos 6 Meses",
    description:
      "Relatório detalhado das transações comerciais realizadas nos últimos seis meses, apresentando indicadores de desempenho, variação de preços, volume de vendas e tendências por grupo de clientes.",
    icon: TrendingUp,
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    id: "ReportProductSemVendas",
    title: "Produtos Sem Vendas - Acima de 6 Meses",
    description:
      "Relatório detalhado dos produtos sem movimentação comercial há mais de seis meses, com análise por cliente e recomendações estratégicas para otimização do portfólio e retomada das vendas.",
    icon: EyeOff,
    color: "bg-violet-500/10 text-violet-400 border-purple-500/20",
  },
];

export function RelatorioPage() {
  // Removed API-related state and functions as they're now in VendasView
  const [activeView, setActiveView] = useState<DataView>("vendas");
  const [_loading, _setLoading] = React.useState<boolean>(true);

  const renderViewContent = () => {
    switch (activeView) {
      case "vendas":
        // Removed props as VendasView now manages its own data
        return <ReportClientVend />;
      case "clientes":
        return <ReportVendas />;
      case "produtos":
        return <ReportVendasItens />;
      case "grupoVendas":
        return <ReportClientGroup />;
      case "ReportProductSales":
        return <ReportProductSales />;
      case "ReportProductSemVendas":
        return <ReportProductSemVendas />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className=" mx-auto px-10 sm:px-12 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Relatórios de Vendas
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Dashboard integrado com SAP para análise de performance de
                vendas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* KPI Cards */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-6">
            {viewConfigs.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;

              return (
                <Card
                  key={view.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 ${
                    isActive
                      ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/20"
                      : "bg-card/50 border-border/40 hover:bg-card/70"
                  } backdrop-blur-sm`}
                  onClick={() => setActiveView(view.id)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div
                        className={`p-2 sm:p-3 rounded-lg ${
                          isActive ? view.color : "bg-muted/50"
                        } transition-colors duration-300 flex-shrink-0`}
                      >
                        <Icon
                          className={`h-5 w-5 sm:h-6 sm:w-6 ${
                            isActive ? "" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm sm:text-base ${
                            isActive ? "text-primary" : "text-foreground"
                          } transition-colors duration-300 truncate`}
                        >
                          {view.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-none">
                          {view.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="transition-all duration-500 ease-in-out">
          {renderViewContent()}
        </div>
      </div>
    </div>
  );
}
