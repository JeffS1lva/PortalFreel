"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight,  Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import axios from "axios"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { CheckCircle, Sparkles } from "lucide-react"

interface StepperControlsProps {
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrevious?: () => void
  onComplete?: () => Promise<void> // Agora pode ser async
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLoading?: boolean
  nextLabel?: string
  previousLabel?: string
  completeLabel?: string
  className?: string
  quotation?: any // Adicionar quotation para o último passo
  buildPayload?: () => any // Função para montar payload
}

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("access_token")
  }

  const handleComplete = async () => {
    if (isSubmitting || !isLastStep) return

    // Se houver onComplete personalizado (ex: navegação), executa primeiro
    if (onComplete) {
      setIsSubmitting(true)
      try {
        await onComplete()
      } catch (error) {
        console.error("Erro ao concluir:", error)
        setIsSubmitting(false)
        return
      }
    }

    // Se for último passo e tiver quotation + buildPayload → salvar
    if (isLastStep && quotation && buildPayload) {
      const token = getAuthToken()
      if (!token) {
        alert("Erro: Usuário não autenticado.")
        setIsSubmitting(false)
        return
      }

      setIsSubmitting(true)
      try {
        const payload = buildPayload()
        console.log("Payload enviado para /api/external/Cotacoes:", payload)
        await axios.post("/api/external/Cotacoes", payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        setIsSuccessOpen(true)
        window.dispatchEvent(new CustomEvent("quotation-saved"))
      } catch (error: any) {
        console.error("Erro ao salvar cotação:", error)
        const msg = error.response?.data?.message || error.message || "Falha ao salvar"
        alert(msg)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const isLoading = isSubmitting || externalLoading

  return (
    <>
      <div className={cn("w-full flex flex-col gap-2 md:gap-4", className)}>
        <div className="flex flex-col md:flex-row w-full gap-2 md:gap-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || !canGoPrevious || isLoading}
            className="w-full md:flex-1 gap-2 bg-transparent justify-center h-10 md:h-12 text-sm md:text-base"
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
              className="w-full md:flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 justify-center h-10 md:h-12 text-sm md:text-base font-bold shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Salvando...</span>
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
              className="w-full md:flex-1 gap-2 justify-center h-10 md:h-12 text-sm md:text-base"
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-0 shadow-2xl">
          <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 sm:p-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />

            <div className="relative flex flex-col items-center text-center space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/40 rounded-full blur-xl animate-ping" />
                <div className="relative p-4 sm:p-5 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30 shadow-2xl">
                  <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16 text-white drop-shadow-2xl" strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black">Cotação Salva!</h3>
                <p className="text-white/95 text-base sm:text-lg leading-relaxed">
                  Sua cotação foi enviada com sucesso.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-card">
            <Button
              onClick={() => {
                setIsSuccessOpen(false)
                // Opcional: redirecionar ou fechar
              }}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Concluir
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{current}</span>
      <span>/</span>
      <span>{total}</span>
    </div>
  )
}