"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Logo from "@/assets/logoBrowser.png"

interface QuotationNavbarProps {
  totalValue: number
  itemsCount: number
  currency: string
  onBackClick: () => void
  onViewClick: () => void
}

export const QuotationNavbar = forwardRef<HTMLDivElement, QuotationNavbarProps>(
  ({ totalValue, itemsCount, currency, onBackClick, onViewClick }, ref) => {
    return (
      <motion.nav
        ref={ref}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg"
      >
        <div className="w-full px-3 md:px-6 py-3 md:py-1">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8, ease: "easeInOut" }}>
                <img src={Logo || "/placeholder.svg"} className="w-10 md:w-12 text-white drop-shadow-md" alt="Logo" />
              </motion.div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                  Nova Cotação
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-semibold tracking-wide whitespace-nowrap">Gestão</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <motion.div
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60"
                whileHover={{ scale: 1.05 }}
              >
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Total</p>
                  <p className="text-lg font-black text-indigo-600">
                    {currency} {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/60"
                whileHover={{ scale: 1.05 }}
              >
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Itens</p>
                  <p className="text-lg font-black text-purple-600">{itemsCount}</p>
                </div>
              </motion.div>
            </div>

            {/* Mobile Stats */}
            <div className="md:hidden flex items-center gap-3">
              <motion.div className="text-right" whileHover={{ scale: 1.05 }}>
                <p className="text-xs font-bold text-indigo-600">Total</p>
                <p className="text-sm font-black text-indigo-600">
                  {currency} {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </motion.div>
              <div className="w-px h-8 bg-slate-200" />
              <motion.div className="text-right" whileHover={{ scale: 1.05 }}>
                <p className="text-xs font-bold text-purple-600">Itens</p>
                <p className="text-sm font-black text-purple-600">{itemsCount}</p>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onBackClick}
                className="h-9 md:h-10 px-3 md:px-4 bg-primary text-white hover:bg-slate-950 rounded-lg md:rounded-xl flex items-center justify-center gap-1 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <Button
                onClick={onViewClick}
                className="h-9 md:h-10 px-3 md:px-4 bg-slate-500 text-white hover:bg-slate-600 rounded-lg md:rounded-xl flex items-center justify-center gap-1 text-sm"
              >
                <EyeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Visualizar Cotações</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>
    )
  }
)

QuotationNavbar.displayName = "QuotationNavbar"