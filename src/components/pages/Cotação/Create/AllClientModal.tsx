import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { X, List, ArrowUpRight, ChevronRight, Grid3X3, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Client } from "../type";

export const AllClientsModal = ({
  isOpen,
  onClose,
  onSelect,
  clients,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  clients: Client[];
  loading: boolean;
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "code" | "recent">("name");
  const scrollY = useMotionValue(0);
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.95]);

  const filteredClients = clients
    .filter(
      (c) =>
        c.cardName?.toLowerCase().includes(filter.toLowerCase()) ||
        c.cardCode?.toLowerCase().includes(filter.toLowerCase()) ||
        c.cnpj?.includes(filter),
    )
    .sort((a, b) => {
      if (sortBy === "name")
        return (a.cardName || "").localeCompare(b.cardName || "");
      if (sortBy === "code")
        return (a.cardCode || "").localeCompare(b.cardCode || "");
      return 0;
    });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl dark:bg-gray-950/95 md:bg-white/80 dark:md:bg-gray-950/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: "100%", scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 top-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full md:max-w-5xl md:h-[90vh] bg-white dark:bg-gray-900 md:rounded-3xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50 flex flex-col border-0 md:border md:border-gray-200 dark:md:border-white/10">
              <motion.div
                style={{ opacity: headerOpacity, scale: headerScale }}
                className="sticky top-0 z-10 bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 px-4 py-3 md:px-6 md:py-4"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[#f4c430] to-[#d4a820] dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-white shadow-lg">
                      <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        Todos os Clientes
                      </h2>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        {clients.length} cadastrados
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtrar por nome, código ou CNPJ..."
                    className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-gray-100 dark:bg-white/5 rounded-lg md:rounded-xl border border-gray-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between mt-2 md:mt-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortBy("name")}
                      className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-colors ${
                        sortBy === "name"
                          ? "bg-gradient-to-br from-[#f4c430] to-[#d4a820] text-white dark:bg-blue-500"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                      }`}
                    >
                      Nome
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortBy("code")}
                      className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-colors ${
                        sortBy === "code"
                          ? "bg-gradient-to-br from-[#f4c430] to-[#d4a820] text-white dark:bg-blue-500"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                      }`}
                    >
                      Código
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 md:p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-[#f4c430] shadow-sm dark:bg-white/10 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"}`}
                    >
                      <Grid3X3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-[#f4c430] shadow-sm dark:bg-white/10 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"}`}
                    >
                      <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="flex-1 overflow-y-auto p-3 md:p-6"
                onScroll={(e) => scrollY.set(e.currentTarget.scrollTop)}
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 md:gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 md:border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500"
                    />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Carregando clientes...
                    </p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 md:mb-4">
                      <Search className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum cliente encontrado</p>
                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                      Tente ajustar seus filtros
                    </p>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {filteredClients.map((client, idx) => (
                      <motion.button
                        key={client.cardCode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onSelect(client);
                          onClose();
                        }}
                        className="group relative p-3 md:p-5 bg-white dark:bg-white/5 rounded-xl md:rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#f4c430] dark:hover:border-[#f4c430] text-left overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-blue-100/20 dark:from-gray-800/20 to-transparent rounded-bl-full" />
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2 md:mb-3">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#f4c430] to-[#d4a820] dark:from-gray-800 dark:to-gray-900 text-white flex items-center justify-center text-sm md:text-lg font-bold shadow-lg">
                              {client.cardName?.charAt(0) || "C"}
                            </div>
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              whileHover={{ opacity: 1, x: 0 }}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#f4c430] dark:text-[#f4c430] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                            </motion.div>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1 line-clamp-1 group-hover:text-[#f4c430] dark:group-hover:text-[#f4c430] transition-colors text-sm md:text-base">
                            {client.cardName}
                          </h3>
                          <p className="text-[10px] md:text-xs font-mono text-gray-500 dark:text-gray-400 mb-1.5 md:mb-2">
                            {client.cardCode}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 dark:bg-white/5 rounded text-[10px] md:text-xs text-gray-500 dark:text-gray-500 truncate">
                              {client.cnpj || "Sem CNPJ"}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    {filteredClients.map((client, idx) => (
                      <motion.button
                        key={client.cardCode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          onSelect(client);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white dark:bg-white/5 rounded-lg md:rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#f4c430] dark:hover:border-[#f4c430] hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-left"
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-md md:rounded-lg bg-gradient-to-br from-[#f4c430] to-[#d4a820] dark:bg-white/10 text-blue-700 dark:text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0">
                          {client.cardName?.charAt(0) || "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {client.cardName}
                          </h4>
                          <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-mono text-[#f4c430] dark:text-blue-400">
                              {client.cardCode}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            <span className="truncate">
                              {client.cnpj || "Sem CNPJ"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};