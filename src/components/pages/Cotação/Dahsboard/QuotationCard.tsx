// src/components/pages/Cotação/Dahsboard/QuotationCard.tsx
"use client"

import { useState } from "react"
import { CustomCardCotacoes, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  UsersIcon,
  Loader2Icon,
  EyeIcon,
  XIcon,
  FileXIcon,
  MailIcon,
} from "lucide-react"
import { EditQuotationButton } from "@/components/pages/Cotação/Dahsboard/EditCotacao/EditButton"
import type { QuotationSummary } from "@/components/pages/Cotação/type"

import { toast } from "sonner"
import { apiBase } from "@/lib/api";

interface QuotationCardProps {
  quotation: QuotationSummary
  onView: (quotation: QuotationSummary) => Promise<void> | void
  onClose?: (docEntry: number) => Promise<void> | void
  onEdit?: (quotation: QuotationSummary) => void
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
  const [_emailModalOpen, setEmailModalOpen] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [_pdfUrl, setPdfUrl] = useState<string>("")

  const isClosed = quotation.docStatus === "bost_Close"
  const isActionDisabled = isViewLoading || isCloseLoading || isCloseLoading || generatingPdf || isClosed

  // === VISUALIZAR (igual ao seu dashboard) ===
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

  // === FECHAR COTAÇÃO ===
  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isClosed) return toast.error("Cotação já fechada")
    if (!window.confirm("Tem certeza que deseja fechar esta cotação?")) return

    setIsCloseLoading(true)
    try {
      await onClose?.(quotation.docEntry)
      toast.success("Cotação fechada com sucesso!")
    } catch {
      toast.error("Erro ao fechar cotação")
    } finally {
      setIsCloseLoading(false)
    }
  }

  // === EDITAR ===
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isClosed) return toast.error("Cotação fechada não pode ser editada")
    onEdit?.(quotation)
  }

  // === GERAR PDF + ABRIR MODAL DE E‑MAIL ===
  const openEmailWithPdf = async () => {
    setGeneratingPdf(true)
    setPdfUrl("")

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Sessão expirada")

      const response = await fetch(
        `${apiBase}/Pedidos/imprime-cotacao/${quotation.docNum}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
        }
      )

      if (!response.ok) throw new Error("Erro ao gerar PDF")

      const blob = await response.blob()
      if (blob.type !== "application/pdf") throw new Error("Arquivo inválido")

      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setEmailModalOpen(true)
    } catch (err: any) {
      toast.error(err.message || "Falha ao gerar PDF da cotação")
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Limpa blob quando modal fechar
  /*const handleEmailModalClose = (open: boolean) => {
    setEmailModalOpen(open)
    if (!open && pdfUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl("")
    }
  }*/

  return (
    <>
      <CustomCardCotacoes
        key={quotation.docEntry}
        className={`
          w-full border-2 transition-all duration-300 group relative overflow-hidden
          ${isClosed
            ? "bg-red-50/80 border-red-400 shadow-lg shadow-red-500/10 hover:shadow-red-500/30"
            : "bg-card border-border hover:shadow-2xl hover:shadow-teal-500/10"
          }
        `}
      >
        {isClosed && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 transform rotate-45 translate-x-16 -translate-y-8 opacity-80 pointer-events-none" />
        )}

        <CardContent className="p-0 relative z-10">
          {/* HEADER */}
          <div className={`relative h-[180px] rounded-t-xl p-6 overflow-hidden ${isClosed ? "bg-gradient-to-r from-red-700 to-red-900" : "bg-gradient-to-r from-sky-900 to-zinc-800"}`}>
            <div className="absolute inset-0 bg-[url('/abstract-geometric-pattern.png')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between gap-2">
                {(isViewLoading || isCloseLoading || generatingPdf || isLoading) && (
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
                <h3 className="font-bold text-2xl text-white mb-1 tracking-tight">
                  {quotation.docNum}
                </h3>
                <p className={`text-sm font-medium ${isClosed ? "text-red-100" : "text-teal-50"}`}>
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
              <span className={`flex items-center gap-1.5 ${isClosed ? "text-red-700 font-medium" : "text-muted-foreground"}`}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDate(quotation.docDate)}
              </span>
              <span className={`flex items-center gap-1.5 ${isClosed ? "text-red-700 font-medium" : "text-muted-foreground"}`}>
                <UsersIcon className="h-3.5 w-3.5" />
                {quotation.documentLines?.length || 0} itens
              </span>
            </div>
          </div>

          {/* AÇÕES */}
          <div className="px-2 pb-2 space-y-2">
            {!isClosed && (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  className="h-10 text-xs"
                  onClick={handleView}
                  disabled={isActionDisabled}
                >
                  {isViewLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
                  Visualizar
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={openEmailWithPdf}
                  disabled={isActionDisabled}
                >
                  {generatingPdf ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <MailIcon className="h-4 w-4" />}
                  E‑mail
                </Button>

                <Button
                  size="sm"
                  className="h-10 text-xs bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleClose}
                  disabled={isActionDisabled}
                >
                  {isCloseLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <FileXIcon className="h-4 w-4" />}
                  Fechar
                </Button>
              </div>
            )}

            {isClosed && (
              <Button size="sm" variant="outline" className="w-full h-10" onClick={handleView} disabled={isActionDisabled}>
                {isViewLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <EyeIcon className="h-4 w-4" />}
                Visualizar
              </Button>
            )}

            {onEdit && !isClosed && (
              <EditQuotationButton
                onEdit={handleEditClick}
                disabled={isActionDisabled}
                isLoading={false}
              />
            )}
          </div>
        </CardContent>
      </CustomCardCotacoes>

      {/* MODAL DE E‑MAIL COM PDF OFICIAL */}
      
    </>
  )
}