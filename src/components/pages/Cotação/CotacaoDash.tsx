"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { Loader2Icon, FileTextIcon, XIcon } from "lucide-react";

import { DashboardHeader } from "@/components/pages/Cotação/Dahsboard/DashboardHeader";
import { KPICards } from "@/components/pages/Cotação/Dahsboard/KpiCards";
import { QuotationFilters } from "@/components/pages/Cotação/Dahsboard/QuotationFilters";
import { QuotationCard } from "@/components/pages/Cotação/Dahsboard/QuotationCard";
import { PdfViewerDialog } from "@/components/pages/Cotação/Dahsboard/PdfViewer";
import { EditQuotationModal } from "@/components/pages/Cotação/Dahsboard/EditCotacao/EditModal";
import type { QuotationSummary } from "./type";

const toSAPDate = (date: string | undefined): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

export function QuotationDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "true";

  const [isMounted, setIsMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [initialQuotations, setInitialQuotations] = useState<
    QuotationSummary[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [iframeOpen, setIframeOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [currentQuotationNumber, setCurrentQuotationNumber] = useState<
    string | number
  >("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const getUserInternalCode = (): string | null => {
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.internalCode || parsed.slpCode;
      } catch {
        return null;
      }
    }
    return null;
  };

  const fetchInitialQuotations = async (force = false) => {
    if (initialQuotations.length > 0 && !force) {
      setQuotations(initialQuotations);
      setHasInitialLoad(true);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("authData");
        navigate("/login");
        return;
      }

      const slpCode = getUserInternalCode();
      if (!slpCode) {
        setError("Usuário não identificado");
        return;
      }

      const response = await axios.get("/api/internal/Cotacoes", {
        params: { slpCode, top: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data =
        response.data.value || response.data.data || response.data || [];

      const mapped = data
        .map((quote: any, index: number) => mapQuotation(quote, index))
        .sort(
          (a: any, b: any) =>
            new Date(b.docDate).getTime() - new Date(a.docDate).getTime()
        );

      setInitialQuotations(mapped);
      setQuotations(mapped);
      setHasInitialLoad(true);
    } catch (err: any) {
      console.error("Erro ao carregar cotações iniciais:", err);
      setError("Falha ao carregar cotações. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const mapQuotation = (quote: any, index = 0): QuotationSummary => {
    // 1. TENTA PEGAR O BPL_ID DE QUALQUER FORMA POSSÍVEL
    const rawBplId =
      quote.BPL_IDAssignedToInvoice ??
      quote.BPLID ??
      quote.BPL_IdAssignedToInvoice ?? // variações comuns
      quote.bplid ??
      null;

    // 2. SE TIVER BPL_ID VÁLIDO → USA. SENÃO → DEFAULT 1 (Matriz)
    const bplId = rawBplId && Number(rawBplId) > 0 ? Number(rawBplId) : 1;

    const mainUsageFromSap =
      quote.TaxExtension?.MainUsage ?? quote.TaxExtension?.mainUsage;
    const calculatedMainUsage = bplId === 2 ? 90 : 40;
    const mainUsage = mainUsageFromSap ?? calculatedMainUsage;

    return {
      docEntry: quote.docEntry || quote.DocEntry || index,
      cardCode: quote.cardCode || quote.CardCode || "N/A",
      docDate:
        quote.docDate ||
        quote.DocDate ||
        new Date().toISOString().split("T")[0],
      docStatus: quote.docStatus || quote.DocStatus || "draft",
      docTotal: quote.docTotal || quote.DocTotal || 0,
      comments: quote.comments || quote.Comments || "",
      docDueDate: quote.docDueDate || quote.DocDueDate || "",
      taxDate: quote.taxDate || quote.TaxDate || "",
      numAtCard: quote.numAtCard || quote.NumAtCard || "",
      u_SKILL_FormaPagto:
        quote.u_SKILL_FormaPagto || quote.U_SKILL_FormaPagto || "",
      u_Portal: "44",
      u_UPSlpCd2: quote.u_UPSlpCd2 || quote.U_UPSlpCd2 || 0,
      u_UPSlpCd3: quote.u_UPSlpCd3 || quote.U_UPSlpCd3 || 0,
      u_UPSlpCd4: quote.u_UPSlpCd4 || quote.U_UPSlpCd4 || 0,
      openingRemarks: quote.openingRemarks || quote.OpeningRemarks || "",
      u_SKILL_ENDENT: quote.u_SKILL_ENDENT || quote.U_SKILL_ENDENT || "",
      u_POL_EnderEntrega:
        quote.u_POL_EnderEntrega || quote.U_POL_EnderEntrega || "",
      salesPersonCode: quote.salesPersonCode || quote.SalesPersonCode || 0,
      documentLines: quote.documentLines || quote.DocumentLines || [],
      cardName: quote.CardName || quote.cardName || "",
      docNum: quote.docNum || `${quote.docNum || index}`,

      // CORREÇÃO DEFINITIVA: nunca mais perde a filial
      BPL_IDAssignedToInvoice: bplId,

      // MainUsage sempre correto, mesmo se o SAP não devolver
      TaxExtension: {
        MainUsage: mainUsage,
      },
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchInitialQuotations();
  }, []);

  useEffect(() => {
    return () => {
      if (iframeUrl?.startsWith("blob:")) URL.revokeObjectURL(iframeUrl);
    };
  }, [iframeUrl]);

  const handleNewQuotation = () => {
    setIsTransitioning(true);
    setTimeout(
      () =>
        navigate(
          isEmbedded ? "/cotacao/create?embed=true" : "/cotacoes?embed=true"
        ),
      300
    );
  };

  const handleBackToPortal = () => navigate("/inicio");

  const handleViewQuotation = async (quotation: QuotationSummary) => {
    setDetailLoading(quotation.docEntry.toString());
    setIframeUrl("");
    setCurrentQuotationNumber(quotation.docNum || quotation.docEntry);

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("authData");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `/api/internal/Pedidos/imprime-cotacao/${quotation.docNum}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          responseType: "blob",
        }
      );

      if (!response.headers["content-type"]?.includes("pdf"))
        throw new Error("PDF inválido");

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setIframeUrl(url);
      setIframeOpen(true);
    } catch {
      alert("Erro ao carregar PDF");
    } finally {
      setDetailLoading(null);
    }
  };

  const handleCloseQuotation = async (docEntry: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        navigate("/login");
        return;
      }

      setQuotations((prev) =>
        prev.map((q) =>
          q.docEntry === docEntry ? { ...q, docStatus: "bost_Close" } : q
        )
      );
      setInitialQuotations((prev) =>
        prev.map((q) =>
          q.docEntry === docEntry ? { ...q, docStatus: "bost_Close" } : q
        )
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erro ao fechar cotação");
    }
  };

  const handleEditQuotation = (quotation: QuotationSummary) => {
    setSelectedQuotation(quotation);
    setEditModalOpen(true);
  };

  const handleSaveQuotation = async (updatedQuotation: QuotationSummary) => {
    console.group("[v0] SALVANDO COTAÇÃO - VALIDAÇÃO APRIMORADA");

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        navigate("/login");
        return;
      }

      const bplId = updatedQuotation.BPL_IDAssignedToInvoice;

      // Se por algum motivo veio inválido, força o correto (defesa em profundidade)
      const finalBplId = bplId && bplId > 0 ? bplId : 1;
      const mainUsage =
        updatedQuotation.TaxExtension?.MainUsage ??
        (finalBplId === 2 ? 90 : 40);

      const docDateStr =
        toSAPDate(updatedQuotation.docDate) ||
        new Date().toISOString().split("T")[0];
      const dueDateRaw = toSAPDate(updatedQuotation.docDueDate) || docDateStr;
      const taxDateRaw = toSAPDate(updatedQuotation.taxDate) || docDateStr;

      const DocDueDate = dueDateRaw < docDateStr ? docDateStr : dueDateRaw;
      const TaxDate = taxDateRaw < docDateStr ? docDateStr : taxDateRaw;

      const cleanAddress = (updatedQuotation.u_POL_EnderEntrega || "")
        .replace(/\s+/g, " ")
        .replace(/\r?\n|\r/g, " ")
        .trim()
        .substring(0, 100);

      const documentLines = updatedQuotation.documentLines
        .filter((line) => line.LineNum != null && line.ItemCode?.trim())
        .map((line, index) => {
          const rawPrice = Number(line.preco || line.Price || 0);
          const Price = Math.max(0.01, Number(rawPrice.toFixed(4)));
          const Quantity = Math.max(0.01, Number(line.Quantity) || 1);
          const DiscountPercent = Math.max(
            0,
            Math.min(100, Number(line.DiscountPercent) || 0)
          );

          const skillNp = (
            line.U_SKILL_NP?.trim() ||
            line.itemName?.trim() ||
            ""
          ).substring(0, 100);

          return {
            LineNum: index,
            ItemCode: line.ItemCode.trim().substring(0, 50),
            Quantity: Number(Quantity.toFixed(2)),
            Price: Number(Price.toFixed(4)),
            Currency: (line.Currency || "BRL").substring(0, 3),
            DiscountPercent: Number(DiscountPercent.toFixed(2)),
            MeasureUnit: (line.MeasureUnit || "UN").substring(0, 10),
            Usage: Number(line.Usage ?? mainUsage),
            UoMEntry: Number(line.UoMEntry),
            UoMCode: (line.UoMCode || "Unidade").substring(0, 20),
            ShipDate: toSAPDate(line.ShipDate) || DocDueDate,
            U_SKILL_NP: skillNp || null, // Only null if explicitly empty
          };
        });

      if (documentLines.length === 0) {
        throw new Error("A cotação deve conter pelo menos um item");
      }

      const payload = {
        DocObjectCode: "oQuotations",
        DocType: "dDocument_Items",
        BPL_IDAssignedToInvoice: Number(finalBplId),
        DocDate: docDateStr,
        DocDueDate: DocDueDate,
        TaxDate: TaxDate,
        NumAtCard: (updatedQuotation.numAtCard?.trim() || "").substring(0, 100),
        CardCode: updatedQuotation.cardCode.trim(),
        DocCurrency: "BRL",
        DocRate: 1,
        Comments: (updatedQuotation.comments?.trim() || "").substring(0, 254),
        PaymentGroupCode: Number(updatedQuotation.u_SKILL_FormaPagto) || 233,
        Confirmed: "tYES",
        Cancelled: "tNO",
        U_SKILL_FormaPagto: String(
          updatedQuotation.u_SKILL_FormaPagto || "15"
        ).substring(0, 10),
        U_Portal: "44",
        U_UPSlpCd2: Number(updatedQuotation.u_UPSlpCd2 || 129),
        U_UPSlpCd3: Number(updatedQuotation.u_UPSlpCd3 || 7),
        U_UPSlpCd4: Number(updatedQuotation.u_UPSlpCd4 || 65),
        OpeningRemarks: (
          updatedQuotation.openingRemarks?.trim() || ""
        ).substring(0, 254),
        U_SKILL_ENDENT: (updatedQuotation.u_SKILL_ENDENT || "").substring(
          0,
          100
        ),
        U_POL_EnderEntrega: cleanAddress,
        DocumentLines: documentLines,
        DocumentSpecialLines: [],
        TaxExtension: {
          MainUsage: Number(mainUsage),
        },
      };

      console.log(
        "[v0] Payload antes de enviar:",
        JSON.stringify(payload, null, 2)
      );

      console.log("[v0] Validações:", {
        temLinhas: documentLines.length,
        primeiraLinha: documentLines[0]
          ? {
              ItemCode: documentLines[0].ItemCode,
              Price: documentLines[0].Price,
              Quantity: documentLines[0].Quantity,
              U_SKILL_NP: documentLines[0].U_SKILL_NP,
            }
          : null,
        cardCode: payload.CardCode,
        docDueDate: payload.DocDueDate,
      });

      const response = await axios.patch(
        `/api/internal/Cotacoes/${updatedQuotation.docEntry}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[v0] Resposta do servidor:", response.data);
      alert("Cotação atualizada com sucesso!");

      setQuotations((prev) =>
        prev.map((q) =>
          q.docEntry === updatedQuotation.docEntry ? updatedQuotation : q
        )
      );
      setInitialQuotations((prev) =>
        prev.map((q) =>
          q.docEntry === updatedQuotation.docEntry ? updatedQuotation : q
        )
      );
    } catch (err: any) {
      console.error("[v0] ERRO COMPLETO:", err);

      let errorMessage = "Falha ao salvar cotação";
      let errorDetails = "";

      if (err.response) {
        console.error("[v0] Response Status:", err.response.status);
        console.error("[v0] Response Headers:", err.response.headers);
        console.error("[v0] Response Data:", err.response.data);

        const data = err.response.data;

        if (data?.error?.message?.value) {
          errorMessage = data.error.message.value;
        } else if (data?.error?.message) {
          errorMessage = data.error.message;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (typeof data === "string" && data.length > 0) {
          errorMessage = data;
        } else if (data?.errors) {
          errorMessage = "Erros de validação encontrados";
          errorDetails = JSON.stringify(data.errors, null, 2);
        } else if (err.response.status === 500 && !errorMessage) {
          errorMessage =
            "Erro interno do servidor - verifique o console para mais detalhes";
        }

        if (errorDetails) {
          console.error("[v0] Detalhes do erro:", errorDetails);
        }
      } else if (err.request) {
        console.error("[v0] Nenhuma resposta do servidor:", err.request);
        errorMessage = "Sem resposta do servidor. Verifique sua conexão.";
      } else {
        console.error("[v0] Erro ao configurar requisição:", err.message);
        errorMessage = err.message || "Erro desconhecido";
      }

      console.error("[v0] Mensagem final:", errorMessage);

      const fullError = errorDetails
        ? `${errorMessage}\n\n${errorDetails}`
        : errorMessage;

      alert(`Erro: ${fullError}`);
    } finally {
      console.groupEnd();
    }
  };

  const mapStatus = (
    q: QuotationSummary
  ): "draft" | "sent" | "approved" | "rejected" => {
    if (q.docStatus === "C") return "approved";
    if (q.docStatus === "O") return "sent";
    return "draft";
  };

  const openQuotations = quotations.filter((q) => q.docStatus !== "bost_Close");
  const totalValue = openQuotations.reduce((s, q) => s + q.docTotal, 0);
  const approvedCount = openQuotations.filter(
    (q) => mapStatus(q) === "approved"
  ).length;
  const pendingCount = openQuotations.filter(
    (q) => mapStatus(q) === "sent"
  ).length;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  const containerClasses = `min-h-screen bg-background transition-all duration-500 ease-out ${
    isMounted && !isTransitioning
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-4"
  }`;
  const showLoading = isSearching && !hasInitialLoad;
  const showEmpty = !isSearching && quotations.length === 0 && hasInitialLoad;
  const openCount = quotations.filter(
    (q) => q.docStatus !== "bost_Close"
  ).length;
  const closedCount = quotations.filter(
    (q) => q.docStatus === "bost_Close"
  ).length;

  return (
    <div className={containerClasses}>
      <DashboardHeader
        isEmbedded={isEmbedded}
        onNewQuotation={handleNewQuotation}
        onBackToPortal={handleBackToPortal}
      />
      <main
        className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12 space-y-10"
        role="main"
      >
        <KPICards
          totalValue={totalValue}
          totalQuotations={openCount}
          approvedCount={approvedCount}
          pendingCount={pendingCount}
          formatCurrency={formatCurrency}
        />
        <QuotationFilters
          onDataLoaded={(data) => {
            const mapped = data.map(mapQuotation);
            setQuotations(mapped);
            setHasInitialLoad(true);
          }}
          onLoading={setIsSearching}
          onError={setError}
          onClearSearch={() => {
            setError(null);
            if (initialQuotations.length > 0) setQuotations(initialQuotations);
            else fetchInitialQuotations(true);
          }}
          onUnauthorized={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("authData");
            navigate("/login");
          }}
        />

        <section aria-labelledby="quotations-heading">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="quotations-heading"
              className="text-2xl font-bold text-foreground tracking-tight"
            >
              Painel de Cotações
            </h2>
            {!showLoading &&
              !showEmpty &&
              quotations.length > 0 &&
              isSearching && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Buscando cotações...
                </div>
              )}
          </div>

          {showLoading && (
            <Card className="border-border bg-card">
              <CardContent className="p-16 text-center">
                <Loader2Icon className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground text-lg">
                  Carregando cotações...
                </p>
              </CardContent>
            </Card>
          )}

          {showEmpty && (
            <Card className="border-border bg-card">
              <CardContent className="p-16 text-center">
                <FileTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Nenhuma cotação encontrada.
                </p>
              </CardContent>
            </Card>
          )}

          {!showLoading && !showEmpty && quotations.length > 0 && (
            <div className="space-y-6">
              <div className="flex border-b border-border">
                {[
                  {
                    key: "open",
                    label: "Abertas",
                    count: openCount,
                    icon: (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    ),
                  },
                  {
                    key: "closed",
                    label: "Fechadas",
                    count: closedCount,
                    icon: <XIcon className="h-3.5 w-3.5 text-red-500" />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as "open" | "closed")}
                    className={`relative px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.key
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                    </span>
                    <span
                      className={`ml-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                        activeTab === tab.key
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="transition-all duration-300 ease-out">
                {activeTab === "open" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {quotations
                      .filter((q) => q.docStatus !== "bost_Close")
                      .map((q) => (
                        <QuotationCard
                          key={q.docEntry}
                          quotation={q}
                          isLoading={detailLoading === q.docEntry.toString()}
                          onView={handleViewQuotation}
                          onClose={handleCloseQuotation}
                          onEdit={handleEditQuotation}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                        />
                      ))}
                  </div>
                )}
                {activeTab === "closed" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {quotations
                      .filter((q) => q.docStatus === "bost_Close")
                      .map((q) => (
                        <QuotationCard
                          key={q.docEntry}
                          quotation={q}
                          isLoading={detailLoading === q.docEntry.toString()}
                          onView={handleViewQuotation}
                          onClose={handleCloseQuotation}
                          onEdit={handleEditQuotation}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <PdfViewerDialog
        open={iframeOpen}
        onOpenChange={(open) => {
          if (!open && iframeUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(iframeUrl);
            setIframeUrl("");
          }
          setIframeOpen(open);
        }}
        pdfUrl={iframeUrl}
        quotationNumber={currentQuotationNumber}
      />

      <EditQuotationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        quotation={selectedQuotation}
        onSave={handleSaveQuotation}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
