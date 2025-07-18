"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";


export const PedidosLegend = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <Button
        variant="ButtonStatus"
        onClick={() => setExpanded(!expanded)}
        className="mb-2"
      >
        {expanded ? "Ocultar informações" : "Diretrizes de pedidos de compra"}
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="pedidos-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-900/30 dark:border-green-700 shadow-sm">
                <span className="text-lg">📋</span>
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    Pedido único
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Exibe o número direto com botão de copiar.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700 shadow-sm">
                <span className="text-lg">📦</span>
                <div>
                  <div className="font-semibold text-blue-800 dark:text-blue-200">
                    Múltiplos pedidos
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Botão mostra quantidade — clique para ver lista.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/30 dark:border-purple-700 shadow-sm">
                <span className="text-lg">📋</span>
                <div>
                  <div className="font-semibold text-purple-800 dark:text-purple-200">
                    Copiar individual
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Cada pedido tem seu botão de copiar.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/30 dark:to-cyan-900/30 dark:border-indigo-700 shadow-lg">
                <span className="text-lg">📑</span>
                <div>
                  <div className="font-semibold text-indigo-800 dark:text-indigo-200">
                    Copiar todos
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Em Pedidos múltiplos você pode copiar todos juntos.
                  </div>
                </div>
              </div>
            </div>

            <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Como funciona a coluna
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A coluna de pedidos de compra funciona de forma inteligente: quando há apenas um pedido, 
                ele é exibido diretamente com um botão de copiar. Para múltiplos pedidos, é exibido 
                um botão que mostra todos os pedidos organizados e opções 
                para copiar individualmente ou todos de uma vez. 
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};