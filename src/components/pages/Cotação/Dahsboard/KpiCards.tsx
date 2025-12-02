"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSignIcon, FileTextIcon } from "lucide-react"

interface KPICardsProps {
  totalValue: number
  totalQuotations: number
  approvedCount: number
  pendingCount: number
  formatCurrency: (value: number, currency?: string) => string
}

export function KPICards({ totalValue, totalQuotations,  formatCurrency }: KPICardsProps) {
  return (
    <section aria-labelledby="kpi-heading">
      <h2 id="kpi-heading" className="sr-only">
        Indicadores principais
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="border-border bg-card hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <DollarSignIcon className="h-6 w-6 text-teal-600" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{totalQuotations}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center">
                <FileTextIcon className="h-6 w-6 text-slate-600" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </section>
  )
}
