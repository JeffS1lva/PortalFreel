"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Truck,
  Building2,
  Calendar,
  AlertTriangle,
  Check,
  Copy,
  ChevronDown,
  ExternalLink,
  Search,
  Receipt,
  MapPin,
  Package,
  User,
  CreditCard,
  Clock,
  QrCode,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContentSefaz,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  Pedido,
  TrackingData,
} from "@/components/pages/Rastreio-Pedidos/types";
import { formatDate } from "@/components/pages/Rastreio-Pedidos/types";
import { CanhotoViewer } from "@/components/pages/Rastreio-Pedidos/Canhoto/CanhotoViewer";
import { useDanfeViewer } from "../../Pedidos/columns/NotaFiscalCell/hooks/useDanfeViewer";

// Import do hook useDanfeViewer para abrir o modal/iframe completo

export interface OrderDetailsProps {
  pedido: Pedido;
  trackingData: TrackingData | null;
}

// ============ FUNÇÃO AUXILIAR ============
function formatarNomeFilial(filial: string | undefined): string {
  if (!filial) return "Empresa Emitente";

  if (filial.trim() === "1") {
    return "Polar Fix Industria e Comercio de Produtos Hospitalares LTDA";
  }

  if (filial.trim() === "2") {
    return "Polar Fix Industria e Comercio de Produtos Hospitalares LTDA - MG";
  }

  return filial;
}

// ==================== TABS CUSTOMIZADAS ====================
interface CustomTabsProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

function CustomTabs({ children }: CustomTabsProps) {
  return <div className="w-full flex flex-col flex-1 min-h-0">{children}</div>;
}

interface TabsListProps {
  children: React.ReactNode;
  activeTab: string;
}

function TabsList({ children, activeTab }: TabsListProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeIndex = React.Children.toArray(children).findIndex(
      (child: any) => child?.props?.value === activeTab,
    );
    const activeTabElement = tabsRef.current[activeIndex];

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, children]);

  return (
    <div className="relative border-b bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
      <div className="flex items-center gap-1 px-3 sm:px-6 pt-2 overflow-x-auto scrollbar-hide">
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          return React.cloneElement(child as React.ReactElement<any>, {
            ref: (el: HTMLButtonElement | null) => {
              tabsRef.current[index] = el;
            },
          });
        })}
      </div>
      <div
        className="absolute bottom-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

function TabsTrigger({ children, isActive, onClick, ref }: TabsTriggerProps) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3
        text-xs sm:text-sm font-medium whitespace-nowrap
        transition-colors duration-200 rounded-t-lg
        ${
          isActive
            ? "text-amber-500 dark:text-yellow-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
        }
      `}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({
  value,
  activeTab,
  children,
  className = "",
}: TabsContentProps) {
  if (value !== activeTab) return null;
  return <div className={`mt-0 ${className}`}>{children}</div>;
}

// ==================== MODAL CONSULTA SEFAZ ====================
function NFeConsultaModal({
  chaveNFe,
  trackingData,
  pedido,
  isOpen,
  onClose,
}: {
  chaveNFe: string;
  trackingData: TrackingData | null;
  pedido: Pedido;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");

  const uf = chaveNFe.substring(0, 2);
  const cnpjEmitente = chaveNFe.substring(6, 20);
  const modelo = chaveNFe.substring(20, 22);
  const serie = chaveNFe.substring(22, 25);
  const numeroNF = chaveNFe.substring(25, 34);

  const formatarCNPJ = (cnpj: string) => {
    if (cnpj.length !== 14) return cnpj;
    return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12, 14)}`;
  };

  const formatarChave = (chave: string) => {
    return chave.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  const sefazUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${chaveNFe.replace(/\D/g, "")}`;

  const valorTotal = trackingData?.valorTotal || 0;
  const dataEmissao = trackingData?.dataNF || pedido.dataLancamentoPedido;

  const handleCopyChave = () => {
    navigator.clipboard.writeText(chaveNFe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { value: "geral", label: "Geral", icon: FileText },
    {
      value: "emitente",
      label: "Emitente",
      icon: Building2,
      shortLabel: "Emit.",
    },
    {
      value: "destinatario",
      label: "Destinatário",
      icon: User,
      shortLabel: "Dest.",
    },
    {
      value: "transporte",
      label: "Transporte",
      icon: Truck,
      shortLabel: "Transp.",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-blur backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

      <DialogContentSefaz
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] 
        w-full h-[100dvh] sm:h-[85vh] md:h-[80vh] lg:h-[85vh] 
        sm:max-w-[95vw] md:max-w-[800px] lg:max-w-[850px]
        sm:rounded-2xl p-0 gap-0 overflow-hidden bg-background border-0 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 pb-3 sm:pb-4 shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

          <DialogHeader className="relative space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                    Nota Fiscal Eletrônica
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs sm:text-sm mt-0.5">
                    Consulta pública de NF-e
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 bg-white/5 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Chave de Acesso
                </span>
                <button
                  onClick={handleCopyChave}
                  className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                      <span className="text-amber-500">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-[10px] sm:text-sm font-mono text-slate-200 break-all block leading-relaxed tracking-wide">
                {formatarChave(chaveNFe)}
              </code>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <CustomTabs activeTab={activeTab} onValueChange={setActiveTab}>
          <TabsList activeTab={activeTab}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  isActive={isActive}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.shortLabel || tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full w-full">
              <div className="p-3 sm:p-6">
                {/* Tab Geral */}
                <TabsContent
                  value="geral"
                  activeTab={activeTab}
                  className="space-y-3 sm:space-y-4"
                >
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 overflow-hidden relative shadow-yellow-500/20">
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-4 sm:p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-medium uppercase tracking-wider opacity-90 block mb-1">
                            Valor Total da NF-e
                          </span>
                          <span className="text-2xl sm:text-4xl font-bold">
                            {formatarValor(valorTotal)}
                          </span>
                        </div>
                        <div className="p-2 sm:p-3 bg-slate-900/10 rounded-xl">
                          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-slate-800" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Card>
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          Dados da Nota Fiscal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Número
                          </span>
                          <span className="font-mono font-medium text-xs sm:text-sm">
                            {numeroNF}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Série
                          </span>
                          <span className="font-mono font-medium text-xs sm:text-sm">
                            {serie}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Modelo
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {modelo === "55" ? "55 - NF-e" : modelo}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Data Emissão
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {formatDate(dataEmissao)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          Cronograma
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Pedido Realizado
                          </span>
                          <span className="text-xs sm:text-sm font-medium">
                            {formatDate(pedido.dataLancamentoPedido)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Separação
                          </span>
                          <span className="text-xs sm:text-sm font-medium">
                            {pedido.dataPicking
                              ? formatDate(pedido.dataPicking)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-border/50">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Emissão NF
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
                            {formatDate(dataEmissao)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-dashed border-2">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-xs sm:text-sm mb-1">
                            DANFE e XML
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                            Acesse o documento auxiliar da nota fiscal
                            eletrônica ou faça o download do arquivo XML no
                            portal da SEFAZ.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sefazUrl, "_blank")}
                            className="gap-2 w-full sm:w-auto text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Portal SEFAZ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Emitente */}
                <TabsContent
                  value="emitente"
                  activeTab={activeTab}
                  className="space-y-3 sm:space-y-4"
                >
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Dados do Emitente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h4 className="font-semibold text-sm sm:text-lg mb-1">
                          {formatarNomeFilial(pedido.filial)}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          CNPJ: {formatarCNPJ(cnpjEmitente)}
                        </p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Inscrição Estadual
                          </span>
                          <span className="font-medium">ISENTO</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            UF
                          </span>
                          <span className="font-medium">{uf}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Município
                          </span>
                          <span className="font-medium">Não informado</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            CEP
                          </span>
                          <span className="font-medium">Não informado</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Destinatário */}
                <TabsContent
                  value="destinatario"
                  activeTab={activeTab}
                  className="space-y-3 sm:space-y-4"
                >
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-base font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Dados do Destinatário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h4 className="font-semibold text-sm sm:text-lg mb-1">
                          {trackingData?.nomeCliente || pedido.nomeCliente}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Código:{" "}
                          {trackingData?.codigoCliente ||
                            pedido.codigoDoCliente}
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground block">
                              Endereço
                            </span>
                            <span className="font-medium">
                              {pedido.estado
                                ? `Estado: ${pedido.estado}`
                                : "Endereço não detalhado no pedido"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground block">
                              Grupo
                            </span>
                            <span className="font-medium">
                              {pedido.grupo || "Não informado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Transporte */}
                <TabsContent
                  value="transporte"
                  activeTab={activeTab}
                  className="space-y-3 sm:space-y-4"
                >
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-base font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Informações de Transporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h4 className="font-semibold text-sm sm:text-base mb-1">
                          {pedido.nomeTransportadora ||
                            "Transportadora não definida"}
                        </h4>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Filial de Saída
                          </span>
                          <span className="font-medium">
                            {formatarNomeFilial(pedido.filial)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Estado Destino
                          </span>
                          <span className="font-medium">
                            {pedido.estado || "—"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {trackingData?.entregaParcial && (
                    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
                              Entrega Parcial
                            </span>
                            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                              {trackingData.entregaParcial}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </CustomTabs>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shrink-0">
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            <span className="font-medium">Protocolo:</span>{" "}
            {chaveNFe.substring(35, 44)}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(sefazUrl, "_blank")}
              className="gap-2 text-xs w-full sm:w-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Consultar no Portal
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-xs w-full sm:w-auto"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContentSefaz>
    </Dialog>
  );
}

// ==================== NFeKey ====================
function NFeKey({
  chaveNFe,
  trackingData,
  pedido,
}: {
  chaveNFe: string;
  trackingData: TrackingData | null;
  pedido: Pedido;
}) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(chaveNFe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sefazUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${chaveNFe.replace(/\D/g, "")}`;

  return (
    <div className="mt-3">
      <dt className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        Chave de Acesso
      </dt>

      <dd className="space-y-2">
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-3 mb-3 border border-slate-100 dark:border-slate-800">
            <code className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all block leading-relaxed tracking-wide">
              {chaveNFe}
            </code>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="h-9 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-semibold text-xs shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Consultar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(sefazUrl, "_blank")}
              className="h-9 text-xs border-slate-300 dark:border-slate-600"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Portal Sefaz
            </Button>
          </div>

          <button
            onClick={handleCopy}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-amber-500" />
                <span className="text-amber-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar chave</span>
              </>
            )}
          </button>
        </div>
      </dd>

      <NFeConsultaModal
        chaveNFe={chaveNFe}
        trackingData={trackingData}
        pedido={pedido}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// ==================== DETAIL COMPONENTS ====================
function DetailSection({
  title,
  icon,
  variant = "default",
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const variantStyles = {
    default: "bg-card border-border",
    primary: "bg-primary/[0.03] border-primary/10",
    success: "bg-yellow-500/[0.03] border-yellow-200 dark:border-yellow-800/50",
    warning: "bg-amber-500/[0.03] border-amber-200 dark:border-amber-800/50",
  };

  const iconStyles = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-amber-600 dark:text-amber-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className={`rounded-xl border p-3 sm:p-5 transition-all duration-200 ${variantStyles[variant]}`}
    >
      <button
        type="button"
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        disabled={!collapsible}
        aria-expanded={isOpen}
      >
        <h4
          className={`text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-2.5 ${iconStyles[variant]}`}
        >
          {icon}
          {title}
        </h4>
        {collapsible && (
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>
      {isOpen && <div className="mt-3 sm:mt-4">{children}</div>}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
      <dt className="text-xs sm:text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-xs sm:text-sm text-right max-w-[60%]">
        {children}
      </dd>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export function OrderDetails({ pedido, trackingData }: OrderDetailsProps) {
  const dataPedido = trackingData?.dataPedido || pedido.dataLancamentoPedido;
  const dataPicking = trackingData?.ultimaDataPicking || pedido.dataPicking;
  const nfNum = trackingData?.nfNum?.toString() || pedido.notaFiscal;
  const dataNF = trackingData?.dataNF;

  // Hook do useDanfeViewer - mesmo comportamento da tabela de pedidos
  const { handleView } = useDanfeViewer({
    companyCode: String(pedido.companyCode ?? pedido.filial ?? "1"),
    chaveNFe: pedido.chaveNFe || "",
    notaFiscal: nfNum || "",
    enabled: !!pedido.chaveNFe && !!nfNum,
    transportadora: pedido.nomeTransportadora || undefined,
    filial: pedido.filial || "",
  });

  const handleOpenDanfe = (e: React.MouseEvent) => {
    handleView(e);
  };

  return (
    <section aria-label="Detalhes completos do pedido">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10">
          <FileText
            size={14}
            className="sm:w-4 sm:h-4 text-primary"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          Detalhes do Pedido
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <DetailSection
          title="Cronograma"
          icon={<Calendar size={14} className="sm:w-[15px] sm:h-[15px]" />}
          variant="primary"
        >
          <dl className="space-y-0">
            <DetailRow label="Pedido Realizado">
              <time dateTime={dataPedido}>{formatDate(dataPedido)}</time>
            </DetailRow>
            <DetailRow label="Separação Concluída">
              {dataPicking ? (
                <time dateTime={dataPicking}>{formatDate(dataPicking)}</time>
              ) : (
                <span className="text-muted-foreground">{"\u2014"}</span>
              )}
            </DetailRow>
            {dataNF && (
              <DetailRow label="Data Emissão NF">
                <time dateTime={dataNF}>
                  {formatDate(new Date(dataNF).toISOString())}
                </time>
              </DetailRow>
            )}
          </dl>
        </DetailSection>

        {/* ===================== NOTA FISCAL ===================== */}
        <DetailSection
          title="Nota Fiscal"
          icon={<FileText size={14} className="sm:w-[15px] sm:h-[15px]" />}
          variant={nfNum ? "success" : "warning"}
        >
          {nfNum ? (
            <dl>
              {pedido.chaveNFe && (
                <>
                  <div className="pt-4">
                    <button
                      onClick={handleOpenDanfe}
                      title="Visualizar DANFE em PDF"
                      className="
                        group relative w-full flex items-center gap-3 p-4 sm:p-5
                        rounded-2xl overflow-hidden
                        bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700
                        hover:from-slate-700 hover:via-slate-700 hover:to-slate-600
                        text-white
                        shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30
                        border border-slate-600/30 hover:border-yellow-500/40
                        transition-all duration-300 ease-out
                        active:scale-[0.98]
                        cursor-pointer
                      "
                    >
                      {/* Background shimmer dourado */}
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />

                      {/* Glow amarelo sutil no hover */}
                      <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-yellow-500/5 via-amber-500/5 to-yellow-500/5" />

                      {/* Ícone container */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/30 transition-shadow duration-300">
                          <FileText
                            className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900"
                            strokeWidth={2}
                          />
                        </div>
                      </div>

                      {/* Conteúdo central */}
                      <div className="relative z-10 flex-1 min-w-0 text-left ">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-yellow-50 transition-colors duration-300">
                            Visualizar Nota Fiscal
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider border border-yellow-500/30">
                            PDF
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300 truncate">
                          NF {pedido.notaFiscal} •{" "}
                          {pedido.nomeTransportadora || "DANFE Digital"}
                        </p>
                      </div>

                      {/* Seta/ícone à direita */}
                      <div className="relative z-10 flex-shrink-0 flex items-center gap-2">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-yellow-400 transition-colors duration-300">
                          <Eye className="w-4 h-4" />
                          <span>Visualizador Avançado</span>
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-700/50 group-hover:bg-yellow-500/20 flex items-center justify-center transition-colors duration-300">
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 transition-colors duration-300" />
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}

              <CanhotoViewer pedido={pedido} />
              <NFeKey
                chaveNFe={pedido.chaveNFe}
                trackingData={trackingData}
                pedido={pedido}
              />

              {/* BOTÃO VER DANFE - ESTILO IGUAL AO COMPROVANTE DE ENTREGA */}
            </dl>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <AlertTriangle
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] text-amber-500"
                  aria-hidden="true"
                />
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Nota fiscal ainda não emitida
              </p>
            </div>
          )}
        </DetailSection>

        <DetailSection
          title="Informações de Entrega"
          icon={<Truck size={14} className="sm:w-[15px] sm:h-[15px]" />}
          variant="primary"
        >
          <dl className="space-y-0">
            <DetailRow label="Transportadora">
              {pedido.nomeTransportadora || "Não definida"}
            </DetailRow>
            <DetailRow label="Estado">{pedido.estado}</DetailRow>
            <DetailRow label="Filial">
              {formatarNomeFilial(pedido.filial)}
            </DetailRow>
            {trackingData?.entregaParcial && (
              <DetailRow label="Entrega Parcial">
                {trackingData.entregaParcial}
              </DetailRow>
            )}
          </dl>
        </DetailSection>

        <DetailSection
          title="Informações do Cliente"
          icon={<Building2 size={14} className="sm:w-[15px] sm:h-[15px]" />}
          variant="default"
          collapsible
          defaultOpen={true}
        >
          <dl className="space-y-0">
            <DetailRow label="Nome">
              <span
                className="truncate max-w-[150px] sm:max-w-[200px] inline-block"
                title={trackingData?.nomeCliente || pedido.nomeCliente}
              >
                {trackingData?.nomeCliente || pedido.nomeCliente}
              </span>
            </DetailRow>
            <DetailRow label="Código">
              {trackingData?.codigoCliente || pedido.codigoDoCliente}
            </DetailRow>
            <DetailRow label="Grupo">{pedido.grupo}</DetailRow>
            {trackingData && (
              <DetailRow label="Valor Total">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(trackingData.valorTotal)}
              </DetailRow>
            )}
          </dl>
        </DetailSection>
      </div>
    </section>
  );
}
