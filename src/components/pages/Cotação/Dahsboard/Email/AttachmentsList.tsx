"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { X, Paperclip, Loader2 } from "lucide-react"

interface AttachmentsListProps {
  pdfUrl?: string
  includePdf: boolean
  setIncludePdf: (value: boolean) => void
  attachments: File[]
  renderAttachment: (file: File, index: number) => React.ReactNode
  generatingPdf?: boolean
  quotationDocNum: number
  openInNewTab: (url?: string | null) => void
}

export function AttachmentsList({
  pdfUrl,
  includePdf,
  setIncludePdf,
  attachments,
  renderAttachment,
  generatingPdf = false,
  quotationDocNum,
  openInNewTab,
}: AttachmentsListProps) {
  return (
    <div className="px-6 py-3 bg-white border-t flex gap-2 items-center overflow-x-auto">
      {pdfUrl && includePdf && (
        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-md min-w-[140px] group hover:bg-red-100 transition-colors">
          <button
            type="button"
            onClick={() => openInNewTab(pdfUrl)}
            className="w-10 h-10 flex items-center justify-center rounded bg-red-100 group-hover:bg-red-200 transition-colors flex-shrink-0"
          >
            <Paperclip className="h-4 w-4 text-red-600" />
          </button>
          <div className="text-xs truncate max-w-[100px] flex-1">Cotação_{quotationDocNum}.pdf</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={() => setIncludePdf(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {attachments.map((f, i) => renderAttachment(f, i))}

      {generatingPdf && (
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md text-xs text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando PDF...
        </div>
      )}
    </div>
  )
}
