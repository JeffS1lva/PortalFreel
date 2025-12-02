"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  FileTextIcon,
  MapPinIcon,
  PackageIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  DollarSignIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react"
import { initialQuotation, type DocumentLine, type Quotation } from "@/components/pages/Cotação/type"
import { GeneralInformation } from "@/components/pages/Cotação/Pages/InfoGeneral"
import { Addresses } from "@/components/pages/Cotação/Pages/Addresses"
import { Items } from "@/components/pages/Cotação/Pages/Items"
import { Review } from "@/components/pages/Cotação/Pages/Review"

export function QuotationForm() {
  const [quotation, setQuotation] = useState<Quotation>(initialQuotation)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(25)
  const [showSuccess, setShowSuccess] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setProgress(currentStep * 25)
  }, [currentStep])

  useEffect(() => {
    const currentStepElement = stepRefs.current[currentStep - 1]
    if (currentStepElement) {
      currentStepElement.focus()
    }
  }, [currentStep])

  const updateQuotation = (field: keyof Quotation, value: any) => {
    setQuotation((prev) => ({ ...prev, [field]: value }))
  }

  const updateDocumentLine = (index: number, field: string, value: any) => {
    const updatedLines = [...quotation.DocumentLines]
    updatedLines[index] = { ...updatedLines[index], [field]: value }
    setQuotation((prev) => ({ ...prev, DocumentLines: updatedLines }))
  }

  const addDocumentLine = () => {
    const newLine: DocumentLine = {
      LineNum: quotation.DocumentLines.length,
      ItemCode: "",
      Quantity: 1,
      Price: 0,
      Currency: "R$",
      DiscountPercent: 0,
      MeasureUnit: "UN",
      Usage: quotation.BPL_IDAssignedToInvoice === 1 ? 40 : 90,
      UoMEntry: 0,
      UoMCode: "",
      listCode:0,
      ShipDate: new Date().toISOString().split("T")[0],
      U_SKILL_NP: "",
      preco: 0
    }
    setQuotation((prev) => ({
      ...prev,
      DocumentLines: [...prev.DocumentLines, newLine],
    }))
  }

  const removeDocumentLine = (index: number) => {
    const updatedLines = quotation.DocumentLines.filter((_, i) => i !== index)
    updatedLines.forEach((line, i) => {
      line.LineNum = i
    })
    setQuotation((prev) => ({ ...prev, DocumentLines: updatedLines }))
  }

  const calculateTotal = () => {
    return quotation.DocumentLines.reduce((total, line) => {
      const lineTotal = line.Quantity * line.Price * (1 - line.DiscountPercent / 100)
      return total + lineTotal
    }, 0)
  }

  const calculateTotalDiscount = () => {
    return quotation.DocumentLines.reduce((total, line) => {
      const discount = line.Quantity * line.Price * (line.DiscountPercent / 100)
      return total + discount
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setShowSuccess(true)

      // Reset after showing success
      setTimeout(() => {
        setQuotation(initialQuotation)
        setCurrentStep(1)
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Erro ao enviar cotação:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalValue = calculateTotal()
  const totalDiscount = calculateTotalDiscount()
  const subtotal = totalValue + totalDiscount

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" && currentStep < 4) {
      nextStep()
    } else if (e.key === "ArrowLeft" && currentStep > 1) {
      prevStep()
    }
  }

  return (
    <div className="min-h-screen bg-background flex" onKeyDown={handleKeyDown}>
      {/* Sidebar Navigation */}
      <aside
        className="w-96 bg-card border-r border-border sticky top-0 h-screen hidden lg:block"
        role="navigation"
        aria-label="Navegação de etapas"
      >
        <div className="p-8 space-y-8 overflow-y-auto h-full">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                <FileTextIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Inicie uma Nova Cotação</h2>
                <p className="text-xs text-muted-foreground">Plataforma Integrada de Gestão de Cotações</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Progresso</span>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Etapa {currentStep} de 4</p>
          </div>

          <Separator className="bg-border" />

          {/* Step Navigation */}
          <nav className="space-y-2" aria-label="Etapas da cotação">
            {[
              { step: 1, title: "Informações Gerais", icon: FileTextIcon, desc: "Dados básicos" },
              { step: 2, title: "Endereços", icon: MapPinIcon, desc: "Local de entrega" },
              { step: 3, title: "Itens", icon: PackageIcon, desc: "Produtos e serviços" },
              { step: 4, title: "Revisão", icon: CheckCircleIcon, desc: "Confirmar dados" },
            ].map(({ step, title, icon: Icon, desc }) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all focus-bold group ${
                  currentStep === step
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "hover:bg-muted text-foreground/70 hover:text-foreground"
                }`}
                aria-current={currentStep === step ? "step" : undefined}
                aria-label={`Etapa ${step}: ${title}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    currentStep === step ? "bg-primary/10" : "bg-muted/5 group-hover:bg-muted/20"
                  }`}
                >
                  {currentStep > step ? <CheckCircleIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm">{title}</div>
                  <div className={`text-xs mt-0.5 ${currentStep === step ? "opacity-90" : "opacity-60"}`}>{desc}</div>
                </div>
                {currentStep > step && <CheckCircleIcon className="h-5 w-5 text-accent flex-shrink-0" />}
              </button>
            ))}
          </nav>

          <Separator className="bg-border" />

          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Resumo Rápido</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-foreground/80">Total</span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {quotation.DocCurrency} {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-foreground/80">Itens</span>
                </div>
                <span className="text-sm font-bold text-foreground">{quotation.DocumentLines.length}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Navigation */}
        <nav
          className="lg:hidden border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95"
          role="navigation"
          aria-label="Navegação móvel"
        >
          <div className="px-6 py-4 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {[
                { step: 1, title: "Geral", icon: FileTextIcon },
                { step: 2, title: "Endereço", icon: MapPinIcon },
                { step: 3, title: "Itens", icon: PackageIcon },
                { step: 4, title: "Revisão", icon: CheckCircleIcon },
              ].map(({ step, title, icon: Icon }) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-smooth focus-ring ${
                    currentStep === step
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-current={currentStep === step ? "step" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{title}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Form Content */}
        <main className="max-w-6xl mx-auto p-2" role="main">
          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 1 && (
              <GeneralInformation
                quotation={quotation}
                updateQuotation={updateQuotation}
                stepRef={(el) => {
                  stepRefs.current[0] = el
                }}
              />
            )}

            {currentStep === 2 && (
              <Addresses
                quotation={quotation}
                updateQuotation={updateQuotation}
                stepRef={(el) => {
                  stepRefs.current[1] = el
                }}
              />
            )}

            {currentStep === 3 && (
              <Items
                quotation={quotation}
                updateDocumentLine={updateDocumentLine}
                addDocumentLine={addDocumentLine}
                removeDocumentLine={removeDocumentLine}
                stepRef={(el) => {
                  stepRefs.current[2] = el
                }}
              />
            )}

            {currentStep === 4 && (
              <Review
                quotation={quotation}
                totalValue={totalValue}
                totalDiscount={totalDiscount}
                subtotal={subtotal}
                stepRef={(el) => {
                  stepRefs.current[3] = el
                }}
              />
            )}

            {/* Navigation Buttons */}
            <div
              className="flex justify-between items-center pt-8 gap-4 flex-wrap"
              role="navigation"
              aria-label="Navegação entre etapas"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-10 h-16 border-2 transition-all hover:scale-105 focus-bold bg-transparent text-lg font-semibold"
                aria-label="Voltar para etapa anterior"
              >
                <ArrowLeftIcon className="h-6 w-6 mr-3" />
                Anterior
              </Button>

              <div className="flex gap-4 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="px-10 h-16 border-2 transition-all hover:scale-105 focus-bold bg-transparent text-lg font-semibold"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (confirm("Tem certeza que deseja cancelar? Todos os dados serão perdidos.")) {
                      setQuotation(initialQuotation)
                      setCurrentStep(1)
                    }
                  }}
                  aria-label="Cancelar cotação"
                >
                  <XIcon className="h-6 w-6 mr-3" />
                  Cancelar
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={nextStep}
                    className="px-10 h-16 bg-primary hover:opacity-90 shadow-xl hover:shadow-2xl transition-all hover:scale-105 focus-bold text-lg font-semibold cursor-pointer"
                    aria-label="Avançar para próxima etapa"
                  >
                    Próximo
                    <ArrowRightIcon className="h-6 w-6 ml-3" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="px-10 h-16 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 focus-bold text-lg font-semibold"
                    disabled={isSubmitting}
                    aria-label="Finalizar e enviar cotação"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground mr-3"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-6 w-6 mr-3" />
                        Finalizar Cotação
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="bg-card rounded-3xl p-16 max-w-lg w-full shadow-2xl border-4 border-primary/30 animate-bounce-in">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-primary shadow-2xl">
                <CheckCircleIcon className="h-16 w-16 text-primary-foreground" />
              </div>
              <div>
                <h2 id="success-title" className="text-4xl font-bold mb-4 gradient-text">
                  Cotação Criada!
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Sua cotação foi processada com sucesso e está pronta para ser enviada ao cliente.
                </p>
              </div>
              <div className="pt-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        Use as setas do teclado para navegar entre as etapas. Pressione Tab para navegar entre os campos.
      </div>
    </div>
  )
}