"use client"

import { Button } from "@/components/ui/button"
import { FileTextIcon, ArrowLeftIcon, PlusIcon } from "lucide-react"

interface DashboardHeaderProps {
  isEmbedded: boolean
  onNewQuotation: () => void
  onBackToPortal: () => void
}

export function DashboardHeader({ isEmbedded, onNewQuotation, onBackToPortal }: DashboardHeaderProps) {
  return (
    <nav
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border"
      role="navigation"
      aria-label="Dashboard principal"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-900 to-zinc-800 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <FileTextIcon className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Cotações</h1>
              <p className="text-xs text-muted-foreground">Gerencie suas propostas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEmbedded && (
              <Button
                onClick={onBackToPortal}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Voltar ao portal principal"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Voltar
              </Button>
            )}
            <Button
              onClick={onNewQuotation}
              size="sm"
              className="bg-gradient-to-r from-sky-900 to-zinc-800 hover:from-teal-700 hover:to-sky-700 text-white shadow-lg shadow-sky-500/20 cursor-pointer"
              aria-label="Criar nova cotação"
            >
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Nova Cotação
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
