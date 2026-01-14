"use client"

import { CardContent, CustomCardCotacao } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  CheckCircle,
  FileText,
  Package,
  DollarSign,
  MapPin,
  TrendingUp,
  
  Eye,
  Calendar,
  User,
  Hash,
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  ShoppingBag,
  Percent,
} from "lucide-react"
import type { Quotation } from "@/components/pages/Cotação/type"
import { useState } from "react"
import { roundTo2, formatCurrency } from "@/components/pages/Cotação/utils/currency"

interface ReviewProps {
  quotation: Quotation
  totalValue: number
  totalDiscount: number
  subtotal: number
  stepRef: (el: HTMLDivElement | null) => void
  onComplete?: () => void
  isSubmitting?: boolean
}

export function Review({ quotation, totalValue, totalDiscount, subtotal, stepRef }: ReviewProps) {
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false)

  const hasMoreThanThreeItems = quotation.DocumentLines.length > 3
  const displayedItems = hasMoreThanThreeItems ? quotation.DocumentLines.slice(0, 3) : quotation.DocumentLines



  

  const renderItemCard = (line: any, index: number, isCompact = false) => {
    const lineTotal = roundTo2(
      (line.Quantity || 0) * (line.preco ?? line.Price ?? 0) * (1 - (line.DiscountPercent || 0) / 100),
    )

    return (
      <div
        key={index}
        className={`group relative overflow-hidden rounded-xl bg-gradient-to-br from-card to-muted/20 ${
          isCompact ? "p-4" : "p-5"
        } border border-border/60 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center justify-center min-w-[2.5rem] h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-base sm:text-lg mb-1 text-foreground group-hover:text-primary transition-colors truncate">
                {line.ItemCode || `Item ${index + 1}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {line.Quantity.toFixed(0)} {line.MeasureUnit}
                  </span>
                </div>
                {line.DiscountPercent > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-xs px-2.5 py-1 shadow-lg animate-pulse">
                    <Percent className="h-3 w-3 mr-1" />
                    {line.DiscountPercent.toFixed(0)}% OFF
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
            <p className="font-black text-xl sm:text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {formatCurrency(lineTotal, quotation.DocCurrency)}
            </p>
            {line.Price != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(line.preco, quotation.DocCurrency)}/unidade
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const todayFormatted = new Date().toLocaleDateString("pt-BR")

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 sm:space-y-8 focus:outline-none px-2 sm:px-0"
      role="region"
      aria-label="Revisão da cotação"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 sm:p-10 shadow-2xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-2xl sm:rounded-3xl blur-2xl animate-pulse" />
              <div className="relative p-3 sm:p-5 bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/90 animate-pulse" />
                <span className="text-white/90 font-bold uppercase tracking-wider text-xs sm:text-sm">
                  Última Etapa
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-2 leading-tight">
                Revisão Final
              </h1>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                Confirme todos os detalhes da sua cotação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 shadow-lg w-full lg:w-auto">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
            <div>
              <p className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
                Data de Criação
              </p>
              <p className="text-white font-bold text-sm sm:text-base">{todayFormatted}</p>
            </div>
          </div>
        </div>
      </div>

      <CustomCardCotacao className="overflow-hidden border-2 shadow-xl">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Reference Card */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-5 sm:p-6 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Referência
                      </span>
                    </div>
                    <p className="font-black text-xl sm:text-2xl text-foreground truncate">
                      {quotation.NumAtCard || "Não informado"}
                    </p>
                  </div>
                </div>

                {/* Customer Card */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-5 sm:p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Cliente
                      </span>
                    </div>
                    <p className="font-black text-xl sm:text-2xl text-foreground truncate">
                      {quotation.CardCode || "Não informado"}
                    </p>
                  </div>
                </div>

                {/* Launch Date Card */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-5 sm:p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-green-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Lançamento
                      </span>
                    </div>
                    <p className="font-black text-xl sm:text-2xl text-foreground">{todayFormatted}</p>
                  </div>
                </div>

                {/* Delivery Date Card */}
                <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-5 sm:p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Entrega
                      </span>
                    </div>
                    <p className="font-black text-xl sm:text-2xl text-foreground">
                      {new Date(quotation.DocDueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-muted/40 to-muted/10 p-5 sm:p-6 lg:p-8 border border-border/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="font-black text-xl sm:text-2xl flex items-center gap-3">
                    <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl shadow-lg">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    Itens do Pedido
                  </h3>
                  <Badge className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                    {quotation.DocumentLines.length} {quotation.DocumentLines.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {quotation.DocumentLines.length === 0 ? (
                    <div className="py-16 sm:py-20 text-center">
                      <div className="inline-flex p-5 sm:p-6 rounded-full bg-muted/50 mb-4">
                        <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground text-base sm:text-lg font-medium">Nenhum item adicionado</p>
                    </div>
                  ) : (
                    <>
                      {displayedItems.map((line, index) => renderItemCard(line, index))}

                      {hasMoreThanThreeItems && (
                        <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full mt-4 sm:mt-6 border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 bg-transparent h-14 sm:h-16 text-sm sm:text-base font-bold group"
                            >
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:scale-110 transition-transform" />
                              Visualizar Todos os {quotation.DocumentLines.length} Itens
                              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl sm:text-3xl font-black flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                </div>
                                <span className="flex items-center gap-2 flex-wrap">
                                  Lista Completa de Itens
                                  <Badge className="px-3 py-1.5 text-sm sm:text-base">
                                    {quotation.DocumentLines.length}
                                  </Badge>
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-[calc(90vh-140px)] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                              {quotation.DocumentLines.map((line, index) => renderItemCard(line, index, true))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  )}
                </div>
              </div>

              {(quotation.U_POL_EnderEntrega ||
                quotation.Comments ||
                quotation.OpeningRemarks ||
                quotation.U_SKILL_ENDENT) && (
                <div className="space-y-3 sm:space-y-4">
                  {quotation.U_POL_EnderEntrega && (
                    <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-card to-card/50 p-5 sm:p-6 border border-border/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl shrink-0">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base sm:text-lg mb-2">Endereço de Entrega</h4>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                            {quotation.U_POL_EnderEntrega}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {quotation.OpeningRemarks && (
                    <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 p-5 sm:p-6 border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-accent/20 rounded-xl shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Observações para o Cliente
                          </p>
                          <p className="text-sm sm:text-base leading-relaxed break-words">{quotation.OpeningRemarks}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {quotation.Comments && (
                    <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 p-5 sm:p-6 border border-border/50 hover:border-muted-foreground/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-muted rounded-xl shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Observações Internas
                          </p>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
                            {quotation.Comments}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <div className="sticky top-4 space-y-4 sm:space-y-6">
                {/* Summary Card */}
                <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card to-muted/20 p-5 sm:p-6 lg:p-7 border-2 border-border/50 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="p-2.5 sm:p-3 bg-primary/20 rounded-xl sm:rounded-2xl shadow-lg">
                      <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    <h3 className="font-black text-xl sm:text-2xl">Resumo Financeiro</h3>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-border/30">
                      <span className="text-muted-foreground font-semibold text-sm sm:text-base">Subtotal</span>
                      <span className="font-bold text-base sm:text-lg">
                        {formatCurrency(subtotal, quotation.DocCurrency)}
                      </span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between items-center py-3 sm:py-4 border-b border-border/30 bg-red-500/5 -mx-5 sm:-mx-6 lg:-mx-7 px-5 sm:px-6 lg:px-7 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400 font-semibold text-sm sm:text-base">
                            Desconto
                          </span>
                        </div>
                        <span className="font-bold text-base sm:text-lg text-red-600 dark:text-red-400">
                          - {formatCurrency(totalDiscount, quotation.DocCurrency)}
                        </span>
                      </div>
                    )}

                    <Separator className="my-2 sm:my-4" />

                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 sm:p-8 text-white shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/90 text-xs sm:text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total Geral
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-lg sm:text-xl font-bold text-white/90">{quotation.DocCurrency}</span>
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-lg">
                            {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        </CardContent>
      </CustomCardCotacao>

      

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.7s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.3);
          border-radius: 10px;
          margin: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)));
          border-radius: 10px;
          border: 2px solid hsl(var(--muted) / 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8));
        }
        
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
        }
      `}</style>
    </div>
  )
}
