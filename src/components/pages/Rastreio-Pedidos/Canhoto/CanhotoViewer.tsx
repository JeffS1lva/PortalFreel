"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Eye,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  FileX,
  Scan,
  Grid3X3,
  ScrollText,
  Hash,
  FileCheck,
  Focus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  PanelRightOpen,
  FileText,
  RefreshCw,
  Activity,
  Truck,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import type { Pedido } from "@/components/pages/Rastreio-Pedidos/types";

import logo from "@/assets/logoBrowser.png";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

const TRANSPORTADORAS_AUTORIZADAS = [
  "AIRTIME SERVICOS E TRANSPORTES LTDA",
  "RODOVIARIO CAMILO DOS SANTOS FILHO LTDA",
  "MVT CAMPINAS COM LOG E SOLUCOES EM TRANSP EIRELI",
  "TERMACO TERMINAIS MARITIMOS DE CONTAINERS E SERVICOS ACESSORIOS LTDA",
  "EMPRESA DE TRANSPORTES PAJUCARA LTDA",
  "ATUAL CARGAS TRANSPORTES LTDA",
  "ITL - INTELIGENCIA EM TRANSPORTE E LOGISTICA LTDA",
  "POLAR FIX IND E COM DE PROD HOSP LTDA",
];

interface ViewState {
  scale: number;
  rotation: number;
  viewMode: "immersive" | "scroll" | "grid";
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  focusMode: boolean;
  presentationMode: boolean;
}

export function CanhotoViewer({ pedido }: { pedido: Pedido }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [canhotoNaoInserido, setCanhotoNaoInserido] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageBlobRef = useRef<Blob | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    viewMode: "immersive",
    sidebarOpen: true,
    rightPanelOpen: false,
    focusMode: false,
    presentationMode: false,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewState((prev) => ({ ...prev, sidebarOpen: false, rightPanelOpen: false }));
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const nomeTransportadora =
    (pedido as any).transportadora ||
    (pedido as any).nomeTransportadora ||
    (pedido as any).transportadoraNome ||
    "";

  const isTransportadoraAutorizada = TRANSPORTADORAS_AUTORIZADAS.some(
    (autorizada) =>
      nomeTransportadora.toUpperCase().trim() === autorizada.toUpperCase().trim(),
  );

  const canFetchCanhoto = !!(pedido.chaveNFe && isTransportadoraAutorizada);

  const getAuthToken = () => {
    try {
      const authData = tokenStore.getAuthData();
      if (authData) {
        const userData = JSON.parse(authData);
        return userData.token || userData.accessToken || userData.jwt;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchCanhoto = async () => {
    if (!canFetchCanhoto) {
      setError("Dados insuficientes para buscar o canhoto");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCanhotoNaoInserido(false);

    try {
      const url = `${apiBase}/Danfe/comprovante/${pedido.chaveNFe}`;
      const token = getAuthToken();

      const response = await axios.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "image/jpeg",
        },
        responseType: "blob",
        timeout: 30000,
      });

      const blob = new Blob([response.data], { type: "image/jpeg" });
      imageBlobRef.current = blob;
      const url_ = URL.createObjectURL(blob);
      setImageUrl(url_);
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          setCanhotoNaoInserido(true);
        } else {
          setError(
            err.response?.status === 401
              ? "Sessão expirada"
              : "Erro ao carregar documento",
          );
        }
      } else {
        setError("Erro inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = useCallback(() => {
    if (!imageUrl) return;

    setIsPrinting(true);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Canhoto - NF ${pedido.notaFiscal}</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; }
            img { max-width: 100%; height: auto; display: block; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Canhoto" />
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); setTimeout(() => window.close(), 800); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsPrinting(false);
  }, [imageUrl, pedido.notaFiscal]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "f":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); setIsFullscreen(!isFullscreen); }
          break;
        case "p":
          if (e.ctrlKey) { e.preventDefault(); handlePrint(); }
          break;
        case "Escape":
          if (isFullscreen) setIsFullscreen(false);
          else if (viewState.focusMode) setViewState((p) => ({ ...p, focusMode: false }));
          else if (showMobileMenu) setShowMobileMenu(false);
          else setIsOpen(false);
          break;
        case "+": case "=":
          setViewState((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.1, 4) }));
          break;
        case "-":
          setViewState((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.2) }));
          break;
        case "0":
          setViewState((prev) => ({ ...prev, scale: 1, rotation: 0 }));
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, viewState, showMobileMenu, handlePrint]);

  useEffect(() => {
    if (!isOpen) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      imageBlobRef.current = null;
      setViewState({
        scale: 1,
        rotation: 0,
        viewMode: "immersive",
        sidebarOpen: !isMobile,
        rightPanelOpen: false,
        focusMode: false,
        presentationMode: false,
      });
      setShowMobileMenu(false);
    }
  }, [isOpen, isMobile]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `canhoto-NF${pedido.notaFiscal}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, pedido.notaFiscal]);

  if (!isTransportadoraAutorizada || !canFetchCanhoto) return null;

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-900/20">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setIsOpen(true);
            if (!imageUrl && !error) fetchCanhoto();
          }}
          disabled={!canFetchCanhoto}
          className={`group relative w-full overflow-hidden rounded-2xl transition-all duration-500 ${
            canFetchCanhoto
              ? "bg-gray-900/90 backdrop-blur-xl border border-[#d4a820]/30 hover:border-[#d4a820] hover:shadow-2xl hover:shadow-[#d4a820]/20 cursor-pointer"
              : "bg-gray-900/50 border border-gray-900 cursor-not-allowed opacity-60"
          }`}
        >
          {canFetchCanhoto && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4a820]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}

          <div className="relative p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
            <motion.div
              animate={canFetchCanhoto ? { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
              className={`relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all duration-300 flex-shrink-0 ${
                canFetchCanhoto
                  ? "bg-gradient-to-br from-[#d4a820] to-[#b8941d] text-gray-900 shadow-lg shadow-[#d4a820]/25 group-hover:shadow-[#d4a820]/40"
                  : "bg-gray-800 text-gray-600"
              }`}
            >
              {canFetchCanhoto ? <FileText size={24} className="sm:w-8 sm:h-8" /> : <FileX size={24} className="sm:w-8 sm:h-8" />}
              {canFetchCanhoto && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#d4a820] rounded-full border-2 border-gray-900 flex items-center justify-center"
                >
                  <CheckCircle2 size={8} className="text-gray-900 sm:w-3 sm:h-3" />
                </motion.div>
              )}
            </motion.div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                <h4 className={`font-semibold text-base sm:text-lg transition-colors ${canFetchCanhoto ? "text-white group-hover:text-[#d4a820]" : "text-gray-500"}`}>
                  {canFetchCanhoto ? "Comprovante de Entrega" : "Documento Indisponível"}
                </h4>
                {canFetchCanhoto && (
                  <span className="px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30 hidden sm:inline-block">
                    JPG
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed truncate">
                {canFetchCanhoto
                  ? `NF ${pedido.notaFiscal} • ${nomeTransportadora.length > 20 ? nomeTransportadora.substring(0, 20) + "..." : nomeTransportadora}`
                  : "Informações fiscais incompletas ou transportadora não autorizada"}
              </p>
            </div>

            {canFetchCanhoto && (
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 text-sm">
                  <Eye size={14} />
                  <span>Visualizador Avançado</span>
                </div>
                <motion.div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-[#d4a820] group-hover:text-gray-900 transition-all duration-300"
                  whileHover={{ rotate: 45 }}
                >
                  <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                </motion.div>
              </div>
            )}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`relative flex flex-col bg-gray-900 overflow-hidden ${
                isFullscreen ? "fixed inset-0" : "w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl shadow-2xl"
              }`}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-[#d4a820]/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-[#d4a820]/5 rounded-full blur-[60px] sm:blur-[100px] animate-pulse delay-1000" />
              </div>

              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`relative z-50 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl transition-all duration-300 ${viewState.focusMode ? "opacity-0 hover:opacity-100" : ""}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center text-gray-900 shadow-lg shadow-[#d4a820]/25 flex-shrink-0">
                    <Scan size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-white truncate">Canhoto Digital</h3>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">Verificado</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <Hash size={10} className="sm:w-3 sm:h-3" />
                        <span className="truncate">NF {pedido.notaFiscal}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toolbar Desktop */}
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700">
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-600">
                    {[
                      { id: "immersive", icon: Focus, label: "Imersivo" },
                      { id: "scroll", icon: ScrollText, label: "Rolagem" },
                      { id: "grid", icon: Grid3X3, label: "Grade" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setViewState((p) => ({ ...p, viewMode: mode.id as any }))}
                        className={`p-2 rounded-xl transition-all duration-200 ${viewState.viewMode === mode.id ? "bg-[#d4a820] text-gray-900 shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-700/50"}`}
                        title={mode.label}
                      >
                        <mode.icon size={18} />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 px-2 border-r border-gray-600">
                    <button onClick={() => setViewState((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                      <ZoomOut size={18} />
                    </button>
                    <span className="text-sm font-semibold text-gray-300 w-12 sm:w-16 text-center tabular-nums">
                      {Math.round(viewState.scale * 100)}%
                    </span>
                    <button onClick={() => setViewState((p) => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                      <ZoomIn size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 pl-1">
                    <button onClick={handlePrint} disabled={isPrinting || !imageUrl} className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Imprimir (Ctrl+P)">
                      {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                    </button>
                    <button onClick={handleDownload} disabled={!imageUrl} className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50" title="Download">
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => setViewState((p) => ({ ...p, rightPanelOpen: !p.rightPanelOpen }))}
                      className={`p-2 rounded-lg transition-colors ${viewState.rightPanelOpen ? "text-[#d4a820] bg-[#d4a820]/10" : "text-gray-400 hover:text-white hover:bg-gray-700/50"}`}
                      title="Painel lateral"
                    >
                      <PanelRightOpen size={18} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Toolbar Mobile */}
                <div className="flex sm:hidden items-center gap-2">
                  <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
                    <Grid3X3 size={20} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </motion.div>

              {/* Menu Mobile */}
              <AnimatePresence>
                {showMobileMenu && isMobile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-16 right-4 z-50 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700 p-4 shadow-2xl sm:hidden"
                  >
                    <div className="space-y-3 min-w-[200px]">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "immersive", icon: Focus, label: "Imersivo" },
                          { id: "scroll", icon: ScrollText, label: "Rolagem" },
                          { id: "grid", icon: Grid3X3, label: "Grade" },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => { setViewState((p) => ({ ...p, viewMode: mode.id as any })); setShowMobileMenu(false); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${viewState.viewMode === mode.id ? "bg-[#d4a820] text-gray-900" : "bg-gray-700 text-gray-400"}`}
                          >
                            <mode.icon size={18} />
                            <span className="text-[10px]">{mode.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between bg-gray-700/50 rounded-xl p-2">
                        <button onClick={() => setViewState((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))} className="p-2 rounded-lg text-gray-400 hover:text-white"><ZoomOut size={18} /></button>
                        <span className="text-sm font-semibold text-white">{Math.round(viewState.scale * 100)}%</span>
                        <button onClick={() => setViewState((p) => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))} className="p-2 rounded-lg text-gray-400 hover:text-white"><ZoomIn size={18} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700">
                        <button onClick={() => { handlePrint(); setShowMobileMenu(false); }} disabled={isPrinting || !imageUrl} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#d4a820]/20 text-[#d4a820] disabled:opacity-50">
                          {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                          <span className="text-sm font-medium">Imprimir</span>
                        </button>
                        <button onClick={() => { handleDownload(); setShowMobileMenu(false); }} disabled={!imageUrl} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-700 text-gray-300 disabled:opacity-50">
                          <Download size={18} />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
                      <button onClick={() => { setViewState((p) => ({ ...p, rightPanelOpen: !p.rightPanelOpen })); setShowMobileMenu(false); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-700 text-gray-300">
                        <PanelRightOpen size={18} />
                        <span className="text-sm font-medium">{viewState.rightPanelOpen ? "Fechar painel" : "Abrir painel"}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Área Principal */}
              <div className="flex-1 flex overflow-hidden relative flex-col sm:flex-row">
                <div
                  ref={containerRef}
                  className="flex-1 relative bg-gray-950 overflow-hidden"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <div ref={scrollContainerRef} className="h-full overflow-auto">
                    {isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
                        <div className="relative">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 border-t-[#d4a820]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img src={logo} className="text-[#d4a820] sm:w-16 sm:h-22 mr-3" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-white font-medium text-base sm:text-lg">Processando documento...</p>
                          <div className="w-48 sm:w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }} className="h-full bg-gradient-to-r from-[#d4a820] to-[#b8941d]" />
                          </div>
                        </div>
                      </div>
                    ) : canhotoNaoInserido ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                          <motion.div
                            animate={{ opacity: [0.04, 0.1, 0.04], scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#d4a820] blur-[100px]"
                          />
                        </div>

                        <div className="relative w-full max-w-md mb-10 overflow-hidden">
                          <div className="h-px w-full bg-gray-800" />
                          <div className="relative h-12 flex items-center">
                            <div className="absolute inset-0 flex items-center overflow-hidden">
                              <motion.div
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="flex gap-4 whitespace-nowrap"
                                style={{ width: "200%" }}
                              >
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <div key={i} className="w-8 h-0.5 bg-[#d4a820]/30 flex-shrink-0" />
                                ))}
                              </motion.div>
                            </div>
                            <motion.div
                              animate={{ x: ["-60px", "calc(100% + 60px)"] }}
                              transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }}
                              className="absolute flex items-center gap-1"
                            >
                              <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center shadow-lg shadow-[#d4a820]/40"
                              >
                                <Truck size={20} className="text-gray-900" />
                              </motion.div>
                              <motion.div
                                animate={{ opacity: [0, 0.6, 0], x: [0, -8] }}
                                transition={{ duration: 0.4, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-gray-600 -ml-2"
                              />
                            </motion.div>
                          </div>
                          <div className="h-px w-full bg-gray-800" />
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="relative w-full max-w-md"
                        >
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: "1.25rem" }}>
                            <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="19" ry="19" fill="none" stroke="#d4a820" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="8 6">
                              <animateTransform attributeName="transform" type="translate" values="0,0; -14,0; 0,0" dur="2s" repeatCount="indefinite" />
                            </rect>
                          </svg>

                          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-[1.25rem] p-8 text-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6"
                            >
                              <motion.span
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                              />
                              Aguardando registro
                            </motion.div>

                            <motion.h4 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl font-bold text-white mb-3">
                              Canhoto não inserido
                            </motion.h4>

                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm text-gray-400 leading-relaxed mb-8">
                              A transportadora ainda não registrou o comprovante de entrega.
                              O documento será disponibilizado assim que for enviado.
                            </motion.p>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center justify-center gap-2 text-xs">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Em Rota
                              </div>
                              <div className="w-4 h-px bg-gray-700" />
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Canhoto pendente
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    ) : error ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-red-900/20 flex items-center justify-center">
                          <AlertCircle size={32} className="text-red-500 sm:w-12 sm:h-12" />
                        </motion.div>
                        <div className="text-center max-w-md">
                          <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Erro ao carregar documento</h4>
                          <p className="text-sm text-gray-400 mb-4 sm:mb-6">{error}</p>
                          <Button onClick={fetchCanhoto} className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 font-semibold">
                            <RefreshCw size={16} className="mr-2 sm:w-[18px] sm:h-[18px]" />
                            Tentar novamente
                          </Button>
                        </div>
                      </div>
                    ) : imageUrl ? (
                      viewState.viewMode === "grid" ? (
                        <div className="p-4 sm:p-8 flex items-center justify-center h-full">
                          <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setViewState((p) => ({ ...p, viewMode: "immersive" }))}
                            className="group relative bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-[#d4a820]/10 hover:border-[#d4a820]/30 transition-all duration-300 w-full max-w-sm sm:max-w-2xl"
                          >
                            <img src={imageUrl} alt="Canhoto" className="w-full h-auto" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                              <p className="text-white font-semibold text-sm sm:text-base">Canhoto Digital</p>
                            </div>
                          </motion.button>
                        </div>
                      ) : viewState.viewMode === "scroll" ? (
                        <div className="p-4 sm:p-8 max-w-full sm:max-w-4xl mx-auto">
                          <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="relative group"
                          >
                            <div
                              className="relative bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
                              style={{ transform: `scale(${viewState.scale})`, transformOrigin: "top center" }}
                            >
                              <img
                                src={imageUrl}
                                alt="Canhoto"
                                className="w-full h-auto"
                                style={{ transform: `rotate(${viewState.rotation}deg)`, imageRendering: "crisp-edges" }}
                              />
                            </div>
                          </motion.div>
                        </div>
                      ) : (
                        // Modo Imersivo
                        <div className="h-full flex items-center justify-center p-4 sm:p-12">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key="single-image"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                              className="relative w-full max-w-4xl"
                            >
                              <motion.div
                                className="absolute -inset-2 sm:-inset-4 bg-[#d4a820]/10 rounded-3xl blur-2xl -z-10"
                                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                              />
                              <div
                                className="relative bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-gray-800 mx-auto"
                                style={{
                                  maxWidth: "100%",
                                  transform: `scale(${viewState.scale}) rotate(${viewState.rotation}deg)`,
                                  transformOrigin: "center center",
                                }}
                              >
                                <img
                                  src={imageUrl}
                                  alt="Canhoto"
                                  className="w-full h-auto object-contain"
                                  style={{ imageRendering: "crisp-edges" }}
                                  draggable={false}
                                />
                                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm font-medium border border-[#d4a820]/20">
                                  <span className="text-[#d4a820]">Canhoto Digital</span>
                                </div>
                              </div>
                            </motion.div>
                          </AnimatePresence>

                          {!isMobile && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: isHovering ? 1 : 0, y: isHovering ? 0 : 20 }}
                              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-700"
                            >
                              <button onClick={() => setViewState((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))} className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"><ZoomOut size={24} /></button>
                              <span className="text-lg font-bold text-white tabular-nums">{Math.round(viewState.scale * 100)}%</span>
                              <button onClick={() => setViewState((p) => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))} className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"><ZoomIn size={24} /></button>
                            </motion.div>
                          )}
                        </div>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Painel Direito */}
                <AnimatePresence>
                  {viewState.rightPanelOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0, x: 20 }}
                      animate={{ width: isMobile ? "100%" : 320, opacity: 1, x: 0 }}
                      exit={{ width: 0, opacity: 0, x: 20 }}
                      className="bg-gray-900/60 backdrop-blur-2xl border-l border-[#d4a820]/10 overflow-y-auto absolute sm:relative right-0 top-0 bottom-0 z-40 sm:z-auto"
                    >
                      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {isMobile && (
                          <div className="flex items-center justify-between sm:hidden pb-4 border-b border-gray-800">
                            <h3 className="text-lg font-bold text-white">Detalhes</h3>
                            <button onClick={() => setViewState((p) => ({ ...p, rightPanelOpen: false }))} className="p-2 rounded-lg text-gray-400 hover:text-white"><X size={20} /></button>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <Activity size={14} className="text-[#d4a820] sm:w-4 sm:h-4" />
                            Status
                          </h4>
                          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#d4a820] animate-pulse" />
                              <p className="text-sm font-medium text-white">
                                {imageUrl ? "Imagem carregada" : "Aguardando"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Formato: JPEG</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <FileCheck size={14} className="text-[#d4a820] sm:w-4 sm:h-4" />
                            Informações
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-400">Nota Fiscal</span>
                              <span className="text-xs sm:text-sm font-mono font-medium text-white">#{pedido.notaFiscal}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-400">Filial</span>
                              <span className="text-xs sm:text-sm font-medium text-white">{pedido.filial}</span>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-400 block mb-1">Transportadora</span>
                              <span className="text-xs sm:text-sm font-medium text-white break-words">{nomeTransportadora}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <Printer size={14} className="text-[#d4a820] sm:w-4 sm:h-4" />
                            Ações
                          </h4>
                          <div className="space-y-2">
                            <button onClick={handlePrint} disabled={isPrinting || !imageUrl} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#d4a820]/20 text-[#d4a820] border border-[#d4a820]/30 hover:bg-[#d4a820]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                              <span className="text-sm font-medium">{isPrinting ? "Preparando..." : "Imprimir Documento"}</span>
                            </button>
                            <button onClick={handleDownload} disabled={!imageUrl} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50">
                              <Download size={18} />
                              <span className="text-sm font-medium">Download JPG</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`relative z-40 px-4 sm:px-6 py-2 sm:py-3 border-t border-[#d4a820]/10 bg-gray-900/90 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 transition-all duration-300 ${viewState.focusMode ? "opacity-0 hover:opacity-100" : ""}`}
              >
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#d4a820]/10 border border-[#d4a820]/20">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#d4a820] animate-pulse" />
                    <span className="text-xs font-medium text-[#d4a820]">Documento verificado</span>
                  </div>
                  {isMobile && imageUrl && (
                    <div className="flex items-center gap-2 sm:hidden">
                      <button onClick={handlePrint} disabled={isPrinting} className="p-2 rounded-lg bg-[#d4a820]/20 text-[#d4a820] disabled:opacity-50">
                        {isPrinting ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />}
                      </button>
                      <button onClick={handleDownload} className="p-2 rounded-lg bg-gray-800 text-gray-300"><Download size={16} /></button>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-mono flex items-center gap-2 truncate w-full sm:w-auto justify-end">
                  <Truck className="text-[#d4a820] flex-shrink-0" size={14} />
                  <span className="truncate">{nomeTransportadora}</span>
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
