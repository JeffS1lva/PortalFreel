// src/components/pages/Boletos/cells/PedidosCompraCell.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  ShoppingCart,
  Copy,
  Check,
  Search,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// ============================================================================
// TIPOS
// ============================================================================

interface PedidosCompraCellProps {
  pedidos: string | string[] | null | undefined;
}

interface PedidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidos: string[];
}

// ============================================================================
// MODAL DE PEDIDOS - Estilo NumeroPedidoCell (Tema Dourado)
// ============================================================================

const PedidosModal: React.FC<PedidosModalProps> = ({ isOpen, onClose, pedidos }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setCopiedIndex(null);
    }
  }, [isOpen]);

  const filteredPedidos = pedidos.filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async (pedido: string, index: number) => {
    try {
      await navigator.clipboard.writeText(pedido);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-0 sm:p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative flex flex-col bg-gray-900 w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background dinâmico - Dourado */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-[#d4a820]/5 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#d4a820]/5 rounded-full blur-[60px] sm:blur-[80px] animate-pulse delay-1000" />
              {/* Grid sutil */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,168,32,0.8) 1px, transparent 0)`,
                  backgroundSize: "32px 32px",
                }}
              />
            </div>

            {/* Header Glassmorphism */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center text-gray-900 shadow-lg shadow-[#d4a820]/25 flex-shrink-0">
                    <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">
                      Pedidos de Compra
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">
                      {pedidos.length} item{pedidos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#d4a820] rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-[#d4a820]/70 rounded-full animate-pulse delay-150" />
                      <div className="w-0.5 h-0.5 bg-[#d4a820]/50 rounded-full animate-pulse delay-300" />
                    </div>
                    <span className="truncate">Visualização completa</span>
                  </div>
                </div>
              </div>

              {/* Busca e fechar - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a820]/50 focus:ring-1 focus:ring-[#d4a820]/50 w-56 text-sm"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors hover:rotate-90 duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Fechar - Mobile */}
              <div className="flex sm:hidden items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>

            {/* Busca mobile */}
            {isMobile && (
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a820]/50 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-hidden relative bg-gray-950">
              {/* Header da lista */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-800 bg-gradient-to-r from-[#d4a820]/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#d4a820]/20 rounded-lg">
                    <Info className="w-4 h-4 text-[#d4a820]" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    Lista de Pedidos
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {filteredPedidos.length} de {pedidos.length} exibidos
                </div>
              </div>

              {/* Lista de pedidos */}
              <div className="h-[calc(100%-60px)] overflow-y-auto p-4 sm:p-6">
                {filteredPedidos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Package size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-400">Nenhum pedido encontrado</p>
                    <p className="text-sm text-gray-600 mt-1">Tente ajustar sua busca</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPedidos.map((pedido, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group relative p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-[#d4a820]/50 hover:bg-gray-800 transition-all duration-200"
                      >
                        {/* Indicador lateral */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[#d4a820] to-[#b8941d] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center group-hover:from-[#d4a820] group-hover:to-[#b8941d] transition-all duration-200">
                              <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-xs text-[#d4a820]/70 font-medium">
                              Pedido #{String(index + 1).padStart(3, "0")}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(pedido, index)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors"
                            title="Copiar código"
                          >
                            {copiedIndex === index ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>

                        <div className="bg-gray-900 rounded-lg px-3 py-2.5 border border-gray-700 group-hover:border-[#d4a820]/30 transition-colors">
                          <span className="font-mono text-sm font-medium text-white break-all">
                            {pedido}
                          </span>
                        </div>

                        {/* Ações rápidas */}
                        <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#d4a820]/10 text-[#d4a820] text-xs font-medium hover:bg-[#d4a820]/20 transition-colors">
                            <ExternalLink size={12} />
                            Abrir
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-40 px-4 sm:px-6 py-3 border-t border-[#d4a820]/10 bg-gray-900/90 backdrop-blur-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a820]/10 border border-[#d4a820]/20">
                <div className="w-2 h-2 rounded-full bg-[#d4a820] animate-pulse" />
                <span className="text-xs font-medium text-[#d4a820]">
                  {filteredPedidos.length} pedido{filteredPedidos.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 hidden sm:inline-block">
                  Pressione <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">ESC</kbd> para fechar
                </span>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-[#d4a820] to-[#b8941d] text-gray-900 hover:from-[#e5b940] hover:to-[#c9a320] font-semibold rounded-xl px-4 py-2 text-sm shadow-lg hover:shadow-xl hover:shadow-[#d4a820]/25 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <X size={16} className="mr-2" />
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// CÉLULA PRINCIPAL - Componente Autônomo
// ============================================================================

export const PedidosCompraCell: React.FC<PedidosCompraCellProps> = ({ pedidos }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Normalizar entrada para array de strings
  const normalizePedidos = (input: PedidosCompraCellProps["pedidos"]): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean);
    if (typeof input === "string") {
      return input.split(",").map((p) => p.trim()).filter(Boolean);
    }
    return [];
  };

  const pedidosArray = normalizePedidos(pedidos);
  const hasPedidos = pedidosArray.length > 0;
  const totalPedidos = pedidosArray.length;

  // Sem pedidos - Estado vazio
  if (!hasPedidos) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-start w-full">
              <div className="flex items-center gap-2 px-3 w-full py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Inexistente
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nenhum pedido de compra associado</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Apenas 1 pedido - Mostra diretamente (estilo compacto)
  if (totalPedidos === 1) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-start gap-2 group cursor-pointer">
              <div className="flex items-center gap-2 px-3 w-full py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200">
                <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-mono text-sm font-medium text-green-800 dark:text-green-200 truncate max-w-[120px]">
                  {pedidosArray[0]}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pedido de compra: {pedidosArray[0]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Múltiplos pedidos - Botão para abrir modal
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#d4a820]/20 to-[#b8941d]/10 border border-[#d4a820]/30 rounded-lg hover:from-[#d4a820]/30 hover:to-[#b8941d]/20 hover:border-[#d4a820]/50 transition-all duration-200 hover:scale-105 active:scale-95 group shadow-sm hover:shadow-md hover:shadow-[#d4a820]/10"
            >
              <div className="w-6 h-6 rounded-md bg-[#d4a820]/20 flex items-center justify-center group-hover:bg-[#d4a820]/30 transition-colors">
                <ShoppingCart className="w-3.5 h-3.5 text-[#d4a820]" />
              </div>
              <span className="font-semibold text-[#d4a820] text-sm">
                {totalPedidos} <span className="text-[#d4a820]/70">pedidos</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#d4a820]/50 group-hover:text-[#d4a820] group-hover:translate-x-0.5 transition-all" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Clique para visualizar {totalPedidos} pedidos de compra</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PedidosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pedidos={pedidosArray}
      />
    </>
  );
};

// ============================================================================
// FACTORY FUNCTION - Para uso em colunas TanStack Table
// ============================================================================

export const createPedidosCompraCell = (row: any) => {
  const value = row.getValue("pedidosCompra");
  return <PedidosCompraCell pedidos={value} />;
};

// Export default para compatibilidade
export default PedidosCompraCell;