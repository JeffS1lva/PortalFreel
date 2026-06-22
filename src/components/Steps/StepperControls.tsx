"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Save,
  CheckCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import axios from "@/utils/axiosConfig";
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
import { motion } from "framer-motion";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

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

const getFriendlyErrorMessage = (error: any): string => {
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

    if (msg.includes("inactive") && msg.includes("customer")) {
      return "Cliente inativo no SAP. Não é possível criar cotação para clientes bloqueados ou inativos.";
    }
    if (msg.includes("10001071")) {
      return "Cliente inativo no SAP. Solicite a reativação do cadastro antes de cliente.";
    }

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

    return (
      sapMessage.trim().charAt(0).toUpperCase() + sapMessage.trim().slice(1)
    );
  }

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
  onComplete,
  canGoNext = true,
  isLoading: externalLoading = false,
  nextLabel = "Próximo",
  completeLabel = "Concluir",
  className,
  quotation,
  buildPayload,
}: StepperControlsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState<string>("");

  const isLastStep = currentStep === totalSteps;

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      tokenStore.getToken() ||
      tokenStore.getToken() ||
      tokenStore.getToken()
    );
  };

  const handleComplete = async () => {
    if (isSubmitting || !isLastStep) return;

    if (onComplete) {
      setIsSubmitting(true);
      try {
        await onComplete();
        setIsSubmitting(false);
        return;
      } catch (err) {
        setIsSubmitting(false);
        return;
      }
    }

    if (isLastStep && quotation && buildPayload) {
      const token = getAuthToken();

      if (!token) {
        setErrorAlertMessage("Erro: Usuário não autenticado.");
        return;
      }

      setIsSubmitting(true);

      try {
        const payload = buildPayload();
        await axios.post(`${apiBase}/Cotacoes`, payload, {
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
      <div
        className={cn(
          "w-full flex items-center justify-between gap-6",
          className,
        )}
      >

        {/* Botões */}
        <div className="flex items-center gap-3 ml-auto">
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={!canGoNext || isLoading}
              className={cn(
                "gap-2 rounded-full px-8 h-12 font-bold shadow-lg shadow-emerald-500/30 transition-all",
                "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:shadow-emerald-500/40",
                (!canGoNext || isLoading) && "opacity-50 cursor-not-allowed",
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{completeLabel}</span>
                  <Sparkles className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext || isLoading}
              className={cn(
                "gap-2 rounded-full px-8 h-12 font-bold shadow-lg shadow-indigo-500/30 transition-all",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/40",
                (!canGoNext || isLoading) && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-md p-0 rounded-3xl border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-10 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/30"
            >
              <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
            </motion.div>
            <h3 className="text-3xl font-black mb-2">Cotação Salva!</h3>
            <p className="text-white/90 text-lg">
              Sua proposta foi enviada com sucesso.
            </p>
          </div>
          <div className="p-6 bg-white">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full h-14 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Concluir
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Erro */}
      <AlertDialog
        open={!!errorAlertMessage}
        onOpenChange={() => setErrorAlertMessage("")}
      >
        <AlertDialogContent className="max-w-md rounded-3xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-red-600 text-xl">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              Não foi possível salvar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-4 text-slate-600 leading-relaxed">
              {errorAlertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <AlertDialogAction
              onClick={() => setErrorAlertMessage("")}
              className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border-0"
            >
              Fechar
            </AlertDialogAction>

            <AlertDialogAction
              asChild
              className="rounded-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <a
                href={`https://wa.me/5511974481125?text=${encodeURIComponent(
                  `Olá equipe!\n\nEstou com problema ao salvar uma cotação:\n\n"${errorAlertMessage}"\n\nCliente: ${quotation?.CardName || "Não informado"} (${quotation?.CardCode || "-"})\nNúmero: ${quotation?.docNum ? `#${quotation.docNum}` : "Nova"}\nUsuário: ${(() => {
                    try {
                      const d = JSON.parse(
                        tokenStore.getAuthData() || "{}",
                      );
                      return d.firstName && d.lastName
                        ? `${d.firstName} ${d.lastName}`
                        : d.login || d.email || "Não identificado";
                    } catch {
                      return "Não identificado";
                    }
                  })()}\nData/Hora: ${new Date().toLocaleString("pt-BR")}\n\nPodem me ajudar? Obrigado!`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Bot className="size-5" />
                Suporte via WhatsApp
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
