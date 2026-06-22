"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Spinner com múltiplas camadas e efeito de pulso */}
      <div className="relative">
        {/* Anel externo com gradiente */}
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/30 animate-[spin_3s_linear_infinite]" />
        
        {/* Anel intermediário */}
        <div className="absolute inset-2 rounded-full border-2 border-primary/50 border-t-primary animate-spin" />
        
        {/* Centro com pulso */}
        <div className="absolute inset-5 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute inset-6 rounded-full bg-primary/40 animate-pulse delay-75" />
      </div>

      {/* Texto com animação de fade staggered */}
      <div className="text-center space-y-3">
        <p className="text-base font-semibold text-foreground animate-pulse">
          Carregando Rastreio
          <span className="inline-flex ml-1">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-150">.</span>
            <span className="animate-bounce delay-300">.</span>
          </span>
        </p>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <svg 
            className="w-3 h-3 animate-bounce" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <span className="animate-pulse">Buscando informações atualizadas do pedido</span>
        </div>
      </div>

      {/* Barra de progresso simulada */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] w-1/2" />
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="w-fit gap-2">
          <RefreshCw size={14} />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}