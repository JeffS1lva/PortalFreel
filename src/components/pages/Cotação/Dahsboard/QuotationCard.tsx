"use client"

import type React from "react"
import { useState } from "react"
import { CustomCardCotacoes, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, UsersIcon, Loader2Icon, EyeIcon, XIcon, FileXIcon } from "lucide-react"
import { EditQuotationButton } from "@/components/pages/Cotação/Dahsboard/EditCotacao/EditButton"

// IMPORT CORRETO
import type { QuotationSummary } from "@/components/pages/Cotação/type"

interface QuotationCardProps {
  quotation: QuotationSummary
  onView: (quotation: QuotationSummary) => Promise<void> | void
  onClose?: (docEntry: number) => Promise<void> | void
  onEdit?: (quotation: QuotationSummary) => void
  onUpdate?: (updatedQuotation: QuotationSummary) => Promise<void>
  formatCurrency: (value: number, currency?: string) => string
  formatDate: (dateString: string) => string
  isLoading: boolean
}

export function QuotationCard({
  quotation,
  onView,
  onClose,
  onEdit,
  formatCurrency,
  formatDate,
  isLoading,
}: QuotationCardProps) {
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [isCloseLoading, setIsCloseLoading] = useState(false)

  const isClosed = quotation.docStatus === "bost_Close"
  const isActionDisabled = isViewLoading || isCloseLoading || isLoading || isClosed

  const handleView = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsViewLoading(true)
    try {
      await onView(quotation)
    } finally {
      setIsViewLoading(false)
    }
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isClosed) {
      alert("Esta cotação já está fechada.")
      return
    }

    const confirmed = window.confirm("Tem certeza que deseja fechar esta cotação? Esta ação não pode ser desfeita.")
    if (!confirmed) return

    setIsCloseLoading(true)

    try {
      if (onClose) {
        await onClose(quotation.docEntry)
        alert("Cotação fechada com sucesso!")
      }
    } catch (error: any) {
      console.error("Erro ao fechar cotação:", error)
      alert(error.message || "Erro ao fechar a cotação.")
    } finally {
      setIsCloseLoading(false)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isClosed) {
      alert("Não é possível editar uma cotação fechada.")
      return
    }

    if (onEdit) {
      onEdit(quotation)
    }
  }

  return (
    <>
      <CustomCardCotacoes
        key={quotation.docEntry}
        className={`
          w-full border-2 transition-all duration-300 group relative overflow-hidden
          ${
            isClosed
              ? "bg-red-50/80 border-red-400 shadow-lg shadow-red-500/10 hover:shadow-red-500/30"
              : "bg-card border-border hover:shadow-2xl hover:shadow-teal-500/10"
          }
        `}
      >
        {/* FAIXA DIAGONAL VERMELHA */}
        {isClosed && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 transform rotate-45 translate-x-16 -translate-y-8 opacity-80 pointer-events-none" />
        )}

        <CardContent className="p-0 relative z-10">
          {/* HEADER */}
          <div
            className={`
              relative h-[180px] rounded-t-xl p-6 overflow-hidden
              ${isClosed ? "bg-gradient-to-r from-red-700 to-red-900" : "bg-gradient-to-r from-sky-900 to-zinc-800"}
            `}
          >
            <div className="absolute inset-0 bg-[url('/abstract-geometric-pattern.png')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between gap-2">
                {(isViewLoading || isCloseLoading || isLoading) && (
                  <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                )}
                {isClosed && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <XIcon className="h-3 w-3" />
                    FECHADA
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-2xl text-white mb-1 tracking-tight">{quotation.docNum}</h3>
                <p
                  className={`
                    text-sm font-medium
                    ${isClosed ? "text-red-100" : "text-teal-50"}
                  `}
                >
                  {formatCurrency(quotation.docTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="p-6 space-y-4 bg-white/70 backdrop-blur-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente:</p>
              <p className={`text-base font-semibold truncate ${isClosed ? "text-red-900" : "text-foreground"}`}>
                {quotation.cardName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Código: {quotation.cardCode}</p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span
                className={`flex items-center gap-1.5 ${
                  isClosed ? "text-red-700 font-medium" : "text-muted-foreground"
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDate(quotation.docDate)}
              </span>
              <span
                className={`flex items-center gap-1.5 ${
                  isClosed ? "text-red-700 font-medium" : "text-muted-foreground"
                }`}
              >
                <UsersIcon className="h-3.5 w-3.5" />
                {quotation.documentLines?.length || 0} itens
              </span>
            </div>
          </div>

          {/* AÇÕES */}
          <div className="px-2 pb-2 space-y-2">
            {/* VISUALIZAR E FECHAR */}
            {!isClosed && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-10 w-full bg-primary transition-colors flex items-center justify-center gap-1.5 text-xs text-muted cursor-pointer"
                  onClick={handleView}
                  disabled={isActionDisabled}
                >
                  {isViewLoading ? (
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <EyeIcon className="h-3.5 w-3.5" />
                      Visualizar
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="h-10 w-full bg-red-500 border-red-300 text-red-50 hover:bg-red-600 hover:border-red-500 transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  onClick={handleClose}
                  disabled={isActionDisabled}
                >
                  {isCloseLoading ? (
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <FileXIcon className="h-3.5 w-3.5" />
                      Fechar
                    </>
                  )}
                </Button>
              </div>
            )}

            {!isClosed && onEdit && (
              <EditQuotationButton onEdit={handleEditClick} disabled={isActionDisabled} isLoading={false} />
            )}

            {/* SE FECHADA: apenas Visualizar */}
            {isClosed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 w-full transition-colors bg-transparent flex items-center justify-center gap-1.5 text-xs border-red-400 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-500 cursor-pointer"
                onClick={handleView}
              >
                {isViewLoading ? (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <EyeIcon className="h-3.5 w-3.5" />
                    Visualizar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </CustomCardCotacoes>
    </>
  )
}