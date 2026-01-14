"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Save,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface StepperControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => Promise<void>;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
  className?: string;
  quotation?: any;
  buildPayload?: () => any;
}

// FUNÇÃO DE TRATAMENTO DE ERROS DO SAP – 100% FUNCIONAL (2025)
const getFriendlyErrorMessage = (error: any): string => {
  // Debug opcional (pode comentar depois)
  console.log("%c[ERRO RECEBIDO]", "color: red; font-weight: bold;", error);

  if (!error?.response) {
    if (error?.code === "ERR_NETWORK") return "Sem conexão com o servidor.";
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  const status = error.response?.status;
  const data = error.response?.data;

  let sapMessage = "";

  if (data) {
    if (data.error?.message?.value) sapMessage = data.error.message.value;
    else if (data.error?.message) sapMessage = data.error.message;
    else if (data.message) sapMessage = data.message;
    else if (typeof data.error === "string") sapMessage = data.error;
    else if (data.error?.code && data.error?.message)
      sapMessage = data.error.message;
    else if (typeof data === "string") sapMessage = data;
    else sapMessage = JSON.stringify(data);
  }

  if (sapMessage) {
    const msg = sapMessage.toLowerCase().trim();

    // Cliente inativo (seu erro exato)
    if (msg.includes("inactive") && msg.includes("customer")) {
      return "Cliente inativo no SAP. Não é possível criar cotação para clientes bloqueados ou inativos.";
    }
    if (msg.includes("10001071")) {
      return "Cliente inativo no SAP. Solicite a reativação do cadastro antes de cliente.";
    }

    // Outros erros comuns
    if (msg.includes("itemcode") || msg.includes("item code")) {
      return "Um ou mais códigos de itens são inválidos ou não existem no SAP.";
    }
    if (msg.includes("quantity")) {
      return "Quantidade inválida em um ou mais itens (deve ser maior que zero).";
    }
    if (
      msg.includes("price") ||
      msg.includes("unitprice") ||
      msg.includes("rate")
    ) {
      return "Preço unitário inválido, zerado ou ausente em algum item.";
    }
    if (msg.includes("cardcode") || msg.includes("business partner")) {
      return "Código do cliente inválido ou não encontrado no SAP.";
    }
    if (msg.includes("not found") || msg.includes("does not exist")) {
      return "Cliente ou item não encontrado no SAP.";
    }
    if (
      msg.includes("closed") ||
      msg.includes("cancelled") ||
      msg.includes("cannot be updated")
    ) {
      return "Esta cotação já foi fechada, cancelada ou convertida em pedido.";
    }
    if (
      msg.includes("session") ||
      msg.includes("login") ||
      msg.includes("timeout")
    ) {
      return "Sessão expirada. Faça login novamente.";
    }

    // Qualquer outra mensagem do SAP: mostra limpa
    return (
      sapMessage.trim().charAt(0).toUpperCase() + sapMessage.trim().slice(1)
    );
  }

  // Fallback por status HTTP
  switch (status) {
    case 400:
      return "Requisição inválida. Verifique todos os dados da cotação.";
    case 401:
      return "Sessão expirada. Faça login novamente.";
    case 403:
      return "Você não tem permissão para salvar esta cotação.";
    case 404:
      return "Cotação não encontrada.";
    case 422:
      return "Dados inválidos. Revise itens, preços e campos obrigatórios.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Erro no servidor SAP. Tente novamente em alguns minutos.";
    default:
      return "Erro ao salvar a cotação. Tente novamente.";
  }
};

export function StepperControls({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  canGoNext = true,
  canGoPrevious = true,
  isLoading: externalLoading = false,
  nextLabel = "Próximo",
  previousLabel = "Voltar",
  completeLabel = "Concluir",
  className,
  quotation,
  buildPayload,
}: StepperControlsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState<string>("");

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token")
    );
  };

  const handleComplete = async () => {
    if (isSubmitting || !isLastStep) return;

    // Chama onComplete personalizado se existir
    if (onComplete) {
      setIsSubmitting(true);
      try {
        await onComplete();
        setIsSubmitting(false);
        return; // não executa o salvar via API
      } catch (err) {
        setIsSubmitting(false);
        return;
      }
    }

    // Salvar cotação no SAP
    if (isLastStep && quotation && buildPayload) {
      const token = getAuthToken();

      if (!token) {
        setErrorAlertMessage("Erro: Usuário não autenticado.");
        return;
      }

      setIsSubmitting(true);

      try {
        const payload = buildPayload();
        //console.log("Enviando payload para /api/external/Cotacoes:", payload);

        await axios.post("/api/external/Cotacoes", payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setIsSuccessOpen(true);
        window.dispatchEvent(new CustomEvent("quotation-saved"));
      } catch (error: any) {
        console.error("FALHA AO SALVAR COTAÇÃO:", error);

        const friendlyMessage = getFriendlyErrorMessage(error);
        setErrorAlertMessage(friendlyMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = isSubmitting || externalLoading;

  return (
    <>
      <div className={cn("w-full flex flex-col gap-2 md:gap-4", className)}>
        <div className="flex flex-col md:flex-row w-full gap-2 md:gap-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || !canGoPrevious || isLoading}
            className="w-full md:flex-1 gap-2 bg-transparent justify-center h-10 md:h-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{previousLabel}</span>
          </Button>

          <div className="flex md:hidden items-center justify-center w-full">
            <ProgressIndicator current={currentStep} total={totalSteps} />
          </div>

          <div className="hidden md:flex items-center justify-center flex-shrink-0">
            <ProgressIndicator current={currentStep} total={totalSteps} />
          </div>

          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={!canGoNext || isLoading}
              className="w-full md:flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 justify-center h-10 md:h-12 font-bold shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{completeLabel}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext || isLoading}
              className="w-full md:flex-1 gap-2 justify-center h-10 md:h-12"
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MODAL DE SUCESSO */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm sm:max-w-md p-0 rounded-2xl sm:rounded-3xl border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 sm:p-10 text-white">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-5 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30">
                <CheckCircle className="h-16 w-16 text-white" strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black">Cotação Salva!</h3>
                <p className="text-white/95 text-lg">
                  Sua cotação foi enviada com sucesso.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-card">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full h-14 font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Concluir
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ERRO */}
      <AlertDialog
        open={!!errorAlertMessage}
        onOpenChange={() => setErrorAlertMessage("")}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Não foi possível salvar a cotação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2 whitespace-pre-wrap">
              {errorAlertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogAction
              onClick={() => setErrorAlertMessage("")}
              className="bg-red-600 hover:bg-red-700"
            >
              Fechar
            </AlertDialogAction>

            <AlertDialogAction
              asChild
              className="bg-green-600 hover:bg-green-700"
            >
              <a
                href={`https://wa.me/5511974481125?text=${encodeURIComponent(
                  `Olá equipe!

                    Estou com problema ao salvar uma cotação:

                    "${errorAlertMessage}"

                    Cliente: ${quotation?.CardName || "Não informado"} (${
                    quotation?.CardCode || "-"
                    })
                    Número: ${quotation?.docNum ? `#${quotation.docNum}` : "Nova"}
                    Usuário: ${(() => {
                    try {
                      const d = JSON.parse(
                        localStorage.getItem("authData") || "{}"
                      );
                      return d.firstName && d.lastName
                        ? `${d.firstName} ${d.lastName}`
                        : d.login || d.email || "Não identificado";
                    } catch {
                      return "Não identificado";
                    }
                  })()}
Data/Hora: ${new Date().toLocaleString("pt-BR")}

Podem me ajudar? Obrigado!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Suporte via WhatsApp <Bot className="size-5" />
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProgressIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{current}</span>
      <span>/</span>
      <span>{total}</span>
    </div>
  );
}
