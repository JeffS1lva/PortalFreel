import { useState } from "react";
import {
  X,
  Eye,
  Package,
  Sparkles,
  ShoppingCart,
  Info,
  AlertCircle,
} from "lucide-react";

interface PedidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidos: string[];
}

interface PedidosCompraCellProps {
  pedidos: string | null | undefined;
}

// Componente do Modal com cores douradas/azuis (padrão NumeroPedidoCell)
const PedidosModal: React.FC<PedidosModalProps> = ({
  isOpen,
  onClose,
  pedidos,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-500">
      <div className="bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-[#d4a820]/20 p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-lg md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-500 relative">
        {/* Background decorativo - Dourado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4a820]/10 via-purple-900/10 to-blue-900/20 rounded-2xl sm:rounded-3xl pointer-events-none" />

        {/* Padrão de fundo sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,168,32,0.5) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Header - Dourado e Azul */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6 sm:mb-8 md:mb-10 relative z-10">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-[#d4a820] via-[#b8941d] to-[#d4a820] rounded-2xl sm:rounded-3xl shadow-xl shadow-[#d4a820]/25">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
              </div>
              <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-[#d4a820] via-[#b8941d] to-[#d4a820] rounded-2xl sm:rounded-3xl opacity-20 blur-lg animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#d4a820] via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Pedidos de Compra
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#d4a820] rounded-full animate-pulse shadow-lg shadow-[#d4a820]/50" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#d4a820]/70 rounded-full animate-pulse delay-150" />
                  <div className="w-1 h-1 bg-[#d4a820]/50 rounded-full animate-pulse delay-300" />
                </div>
                <p className="text-sm sm:text-base text-gray-400 font-semibold">
                  {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
                  <span className="hidden sm:inline"> • Visualização Completa</span>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 sm:p-3 text-gray-400 hover:text-white hover:bg-red-900/30 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden self-end sm:self-start"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl cursor-pointer" />
            <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-180 transition-transform duration-300 relative z-10 cursor-pointer" />
          </button>
        </div>

        {/* Lista de pedidos */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4a820]/30 to-transparent" />
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-800 rounded-full border border-[#d4a820]/20">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4a820]" />
              <span className="text-xs sm:text-sm font-medium text-gray-300">
                Lista de Pedidos
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4a820]/30 to-transparent" />
          </div>

          <div className="bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-800 shadow-xl overflow-hidden relative">
            {/* Header da lista - Dourado */}
            <div className="bg-gradient-to-r from-[#d4a820]/20 to-[#b8941d]/10 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-[#d4a820]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#d4a820] to-[#b8941d] rounded-lg sm:rounded-xl">
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900" />
                  </div>
                  <span className="font-semibold text-white text-sm sm:text-base">
                    Códigos dos Pedidos
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  {pedidos.length} itens
                </div>
              </div>
            </div>

            {/* Lista - Dourado e Azul */}
            <div className="divide-y divide-gray-800 max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto">
              {pedidos.map((pedido, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-gradient-to-r hover:from-[#d4a820]/10 hover:to-blue-900/10 transition-all duration-200 relative"
                >
                  {/* Indicador lateral - Dourado */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-[#d4a820] via-[#b8941d] to-[#d4a820] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Numeração - Dourado */}
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-[#d4a820] group-hover:to-[#b8941d] transition-all duration-200 border border-gray-700 group-hover:border-[#d4a820]/50">
                      <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-gray-900">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo do pedido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <span className="text-xs font-medium text-[#d4a820]/70">
                        Pedido #{String(index + 1).padStart(3, "0")}
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700 group-hover:border-[#d4a820]/30 transition-colors duration-200">
                      <span className="font-mono text-xs sm:text-sm font-medium text-white break-all">
                        {pedido}
                      </span>
                    </div>
                  </div>

                  {/* Indicador visual - Dourado */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-[#d4a820] to-[#b8941d] rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Dourado */}
        <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 md:pt-8 border-t border-[#d4a820]/20 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#d4a820] rounded-full animate-pulse shadow-[#d4a820]/50" />
              <p className="text-xs sm:text-sm text-gray-400">
                Visualização completa de {pedidos.length} pedidos
              </p>
            </div>
            <button
              onClick={onClose}
              className="group px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gradient-to-r from-[#d4a820] via-[#b8941d] to-[#d4a820] text-gray-900 rounded-xl sm:rounded-2xl hover:from-[#e5b940] hover:via-[#c9a320] hover:to-[#e5b940] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-[#d4a820]/25 hover:scale-105 active:scale-95 relative overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Fechar Visualização</span>
                <span className="sm:hidden">Fechar</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente da célula - CORES ORIGINAIS MANTIDAS (verde/azul)
export const PedidosCompraCell: React.FC<PedidosCompraCellProps> = ({
  pedidos,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Verificar se pedidos é null, undefined ou string vazia
  if (!pedidos || pedidos.trim() === "") {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="w-24 sm:w-32 md:w-40">
          <div className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-md sm:rounded-lg min-h-[32px] sm:min-h-[36px] justify-start hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30 transition-all duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 flex-shrink-0 transition-transform duration-200" />
            <span className="font-medium text-red-800 dark:text-red-200 text-xs sm:text-sm relative z-10 truncate">
              Inexistente
            </span>
          </div>
        </div>
      </div>
    );
  }

  const pedidosArray = String(pedidos)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // Se for apenas um pedido - VERDE (original)
  if (pedidosArray.length === 1) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="w-24 sm:w-32 md:w-40">
          <div className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-md sm:rounded-lg min-h-[32px] sm:min-h-[36px] hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0 transition-transform duration-200" />
            <span
              className="font-mono text-xs sm:text-sm font-medium text-green-800 dark:text-green-200 truncate relative z-10 flex-1 min-w-0"
              title={pedidosArray[0]}
            >
              {pedidosArray[0]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Para múltiplos pedidos - AZUL (original)
  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-24 sm:w-32 md:w-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-md sm:rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 w-full justify-start min-h-[32px] sm:min-h-[36px] hover:scale-105 active:scale-95 relative overflow-hidden shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold text-blue-800 dark:text-blue-200 text-xs relative z-10 flex-1 min-w-0">
            {pedidosArray.length} <span className="hidden sm:inline">pedidos</span>
          </span>
          <div className="ml-auto">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
          </div>
        </button>
      </div>

      <PedidosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pedidos={pedidosArray}
      />
    </div>
  );
};