"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchIcon, Loader2Icon, AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import axios from "axios"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface QuotationFiltersProps {
  onDataLoaded?: (data: any[]) => void
  onLoading?: (loading: boolean) => void
  onError?: (error: string | null) => void
  onClearSearch?: () => void
  onUnauthorized?: () => void // Nova prop para redirecionar ao login
}

export function QuotationFilters({
  onDataLoaded,
  onLoading,
  onError,
  onClearSearch,
  onUnauthorized,
}: QuotationFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter] = useState("all")
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"info" | "warning" | "error" | null>(null)

  const lastSearchedTerm = useRef<string>("")
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const buildFiltro = useCallback(() => {
    const parts: string[] = []
    if (searchTerm.trim()) parts.push(searchTerm.trim())
    if (statusFilter !== "all") parts.push(`status:${statusFilter}`)
    return parts.length > 0 ? parts.join(" ") : "all"
  }, [searchTerm, statusFilter])

  const fetchCotacoes = async () => {
    const filtro = buildFiltro()
    const trimmedTerm = searchTerm.trim()

    if (lastSearchedTerm.current === trimmedTerm) return

    setIsSearching(true)
    setSearchError(null)
    setErrorType(null)
    onLoading?.(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")

      const response = await axios.get(`/api/external/Cotacoes/Consulta/${encodeURIComponent(filtro)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data || []

      lastSearchedTerm.current = trimmedTerm
      onDataLoaded?.(data)
    } catch (err: any) {
      const status = err.response?.status
      const message = err.response?.data?.message || err.message

      lastSearchedTerm.current = trimmedTerm

      let userMessage = ""
      let type: "info" | "warning" | "error" = "error"

      if (status === 401) {
        userMessage = "Sessão expirada. Faça login novamente."
        type = "warning"
        onUnauthorized?.() // Redireciona ao login
      } else if (status === 404) {
        userMessage = "Nenhum resultado encontrado para sua busca."
        type = "info"
        onDataLoaded?.([])
      } else if (status >= 500) {
        userMessage = "Erro interno do servidor. Contate o suporte."
        type = "error"
      } else {
        userMessage = message || "Erro ao buscar cotações."
        type = "error"
      }

      setSearchError(userMessage)
      setErrorType(type)
      onError?.(userMessage)
      if (status !== 404) onDataLoaded?.([])
    } finally {
      setIsSearching(false)
      onLoading?.(false)
    }
  }

  useEffect(() => {
    const trimmedTerm = searchTerm.trim()

    if (trimmedTerm.length === 0) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
      lastSearchedTerm.current = ""
      onClearSearch?.()
      return
    }

    if (trimmedTerm.length < 4) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
      return
    }

    if (lastSearchedTerm.current === trimmedTerm) return

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      fetchCotacoes()
    }, 300)

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [searchTerm, statusFilter, onClearSearch, onUnauthorized])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (searchError) {
      setSearchError(null)
      setErrorType(null)
      onError?.(null)
    }
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case "info":
        return <AlertCircleIcon className="h-4 w-4 text-blue-600" />
      case "warning":
        return <AlertCircleIcon className="h-4 w-4 text-amber-600" />
      case "error":
        return <AlertCircleIcon className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getErrorBg = () => {
    switch (errorType) {
      case "info":
        return "bg-blue-50 border-blue-200"
      case "warning":
        return "bg-amber-50 border-amber-200"
      case "error":
        return "bg-red-50 border-red-200"
      default:
        return "bg-red-50 border-red-200"
    }
  }

  return (
    <section aria-labelledby="filter-heading">
      <h2 id="filter-heading" className="sr-only">
        Buscar e filtrar cotações
      </h2>

      <Card className="border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="relative group">
                <SearchIcon
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Busque pelo código do cliente..."
                  value={searchTerm.toLocaleUpperCase()}
                  onChange={handleSearchChange}
                  className="pl-12 h-12 border-2 border-border focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-base placeholder:text-muted-foreground/60"
                  aria-label="Buscar cotações"
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {searchTerm.trim().length > 0 && searchTerm.trim().length < 4 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-amber-600 flex items-center gap-1"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  Digite pelo menos 4 caracteres
                </motion.p>
              )}

              {isSearching && searchTerm.trim().length >= 4 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-primary flex items-center gap-1"
                >
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                  Buscando...
                </motion.p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {searchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-lg border ${getErrorBg()} flex items-start gap-3`}
              >
                {getErrorIcon()}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      errorType === "info"
                        ? "text-blue-800"
                        : errorType === "warning"
                          ? "text-amber-200"
                          : "text-red-800"
                    }`}
                  >
                    {searchError}
                  </p>
                  {errorType === "error" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-8 text-xs"
                      onClick={() => {
                        setSearchError(null)
                        setErrorType(null)
                        onError?.(null)
                        fetchCotacoes()
                      }}
                    >
                      <RefreshCwIcon className="h-3 w-3 mr-1" />
                      Tentar novamente
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </section>
  )
}
