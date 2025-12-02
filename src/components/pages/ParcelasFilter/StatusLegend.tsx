"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const StatusLegend = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <Button
        variant="default"
        onClick={() => setExpanded(!expanded)}
        className="mb-2 "
      >
        {expanded ? "Ocultar informações" : "Diretrizes de inadimplência"}
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="status-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700 shadow-sm">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="font-semibold text-amber-800 dark:text-amber-200">
                    Até 30 dias
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Atraso inicial — acompanhamento sugerido.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/30 dark:border-orange-700 shadow-sm">
                <span className="text-2xl">🟠</span>
                <div>
                  <div className="font-semibold text-orange-800 dark:text-orange-200">
                    31 a 60 dias
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Atraso moderado — atenção necessária.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-red-50 dark:bg-red-900/30 dark:border-red-700 shadow-sm">
                <span className="text-2xl">🔴</span>
                <div>
                  <div className="font-semibold text-red-800 dark:text-red-200">
                    61 a 90 dias
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Atraso alto — risco de inadimplência.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-red-600 shadow-lg animate-pulse">
                <span className="text-2xl text-white">🚨</span>
                <div>
                  <div className="font-semibold text-white">Acima de 90 dias</div>
                  <div className="text-sm text-white/80">
                    Atraso crítico — ação imediata recomendada.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
