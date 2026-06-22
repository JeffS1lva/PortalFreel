import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { createRoot } from "react-dom/client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ScrollText,
  Grid3X3,
  Printer,
  AlertCircle,
  RefreshCw,
  FileCheck,
  Calendar,
  CreditCard,
  Activity,
  PanelRightOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

// Configuração do worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/pdf.worker.min.mjs";

// Funções de formatação
export const formatCNPJ = (cnpj: string) => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

export const formatCurrency = (value: { toLocaleString: (locale: string, options: { style: string; currency: string }) => string }) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatDatePtBr = (dateStr: string | number | Date) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
};

export const parseDate = (str: string) => {
  if (!str) return new Date(0);
 
  if (str.includes("/")) {
    const [day, month, year] = str.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  } else {
    const [year, month, day] = str.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
};

export const formatarValorMoeda = (valor: string | number | null | { toLocaleString: Function }) => {
  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  if (typeof valor === 'string') {
    const num = parseFloat(valor.replace(/[^\d,.]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }
  
  if (typeof valor === 'object' && valor !== null && typeof valor.toLocaleString === 'function') {
    return formatCurrency({
      toLocaleString: (locale: string, options: { style: string; currency: string }) => 
        valor.toLocaleString(locale, options)
    }).replace("R$", "").trim();
  }
  
  return valor?.toString() || "0,00";
};

interface PageData {
  id: number;
  canvas: HTMLCanvasElement;
}

interface ViewState {
  scale: number;
  rotation: number;
  viewMode: "scroll" | "grid";
  sidebarOpen: boolean;
}

interface BoletoViewerProps {
  boletoId: string | number;
  parcelaId: string | number;
  pdfData: ArrayBuffer;
  parcela: any;
  onClose: () => void;
}

// Componente de visualização em Canvas
const BoletoViewerContent: React.FC<BoletoViewerProps> = ({
  boletoId,
  parcelaId,
  pdfData,
  parcela,
  onClose,
}) => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    viewMode: "scroll",
    sidebarOpen: false,
  });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Renderizar PDF em canvas
  const renderPDF = useCallback(async (data: ArrayBuffer): Promise<PageData[]> => {
    try {
      const loadingTask = pdfjs.getDocument({
        data: data,
        useSystemFonts: true,
        cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/cmaps/",
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;

      const renderedPages: PageData[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 2.0;
        const viewport = page.getViewport({ scale, rotation: 0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Falha ao obter contexto 2D do canvas");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          viewport: viewport,
        }).promise;

        renderedPages.push({ id: pageNum, canvas });
      }

      return renderedPages;
    } catch (err) {
      console.error("Erro na renderização:", err);
      throw err;
    }
  }, []);

  // Carregar PDF
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const renderedPages = await renderPDF(pdfData);
        
        if (isMounted) {
          setPages(renderedPages);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro ao renderizar PDF:", err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, [pdfData, renderPDF]);

  // Calcular informações da parcela
  const formattedDueDate = parcela?.dataVencimento 
    ? formatDatePtBr(parcela.dataVencimento)
    : "Não disponível";

  const isCanceled = parcela?.status === "Cancelado";
  const numeroNF = parcela?.numNF || "";

  // Calcular dias restantes
  let diasRestantes: number | null = null;
  let statusVencimento = "";
  
  if (parcela?.dataVencimento && !isCanceled) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(parcela.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    const diferencaEmTempo = vencimento.getTime() - hoje.getTime();
    diasRestantes = Math.ceil(diferencaEmTempo / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      statusVencimento = "Vencido";
    } else if (diasRestantes === 0) {
      statusVencimento = "Vence hoje";
    } else if (diasRestantes === 1) {
      statusVencimento = "Vence amanhã";
    } else if (diasRestantes <= 5) {
      statusVencimento = `Vence em ${diasRestantes} dias`;
    }
  }

  // Download
  const handleDownload = useCallback(() => {
    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `boleto-${boletoId || parcelaId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [pdfData, boletoId, parcelaId]);

  // Print
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setIsPrinting(false);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    } else {
      setIsPrinting(false);
      URL.revokeObjectURL(url);
    }
  }, [pdfData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-0 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative flex flex-col bg-gray-900 overflow-hidden w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl shadow-2xl border border-gray-800"
      >
        {/* Background dinâmico */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-[#d4a820]/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-[#d4a820]/5 rounded-full blur-[60px] sm:blur-[100px] animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`relative z-50 flex flex-col border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl ${
            isCanceled ? 'border-red-500/20' : ''
          }`}
        >
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-gray-900 shadow-lg flex-shrink-0 ${
                isCanceled 
                  ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/25' 
                  : 'bg-gradient-to-br from-[#d4a820] to-[#b8941d] shadow-[#d4a820]/25'
              }`}>
                <CreditCard size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">
                    Boleto #{boletoId || parcelaId}
                  </h3>
                  {numeroNF && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">
                      NF {numeroNF}
                    </span>
                  )}
                  {isCanceled && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
                      Cancelado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Calendar size={10} className="sm:w-3 sm:h-3" />
                    <span className="truncate">Venc: {formattedDueDate}</span>
                  </span>
                  {statusVencimento && !isCanceled && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      diasRestantes !== null && diasRestantes < 0 
                        ? 'bg-red-500/20 text-red-400' 
                        : diasRestantes === 0 
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-[#d4a820]/20 text-[#d4a820]'
                    }`}>
                      {statusVencimento}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar Central */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700">
              <div className="flex items-center gap-1 pr-2 border-r border-gray-600">
                <button
                  onClick={() => setViewState(p => ({ ...p, viewMode: "scroll" }))}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewState.viewMode === "scroll"
                      ? "bg-[#d4a820] text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  title="Rolagem"
                >
                  <ScrollText size={18} />
                </button>
                <button
                  onClick={() => setViewState(p => ({ ...p, viewMode: "grid" }))}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewState.viewMode === "grid"
                      ? "bg-[#d4a820] text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  title="Grade"
                >
                  <Grid3X3 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-1 px-2 border-r border-gray-600">
                <button
                  onClick={() => setViewState(p => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm font-semibold text-gray-300 w-12 text-center tabular-nums">
                  {Math.round(viewState.scale * 100)}%
                </span>
                <button
                  onClick={() => setViewState(p => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <ZoomIn size={18} />
                </button>
              </div>

              <div className="flex items-center gap-1 pl-1">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting || isLoading}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50"
                  title="Imprimir"
                >
                  {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setViewState(p => ({ ...p, sidebarOpen: !p.sidebarOpen }))}
                  className={`p-2 rounded-lg transition-colors ${
                    viewState.sidebarOpen
                      ? "text-[#d4a820] bg-[#d4a820]/10"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  title="Painel lateral"
                >
                  <PanelRightOpen size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mobile buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setViewState(p => ({ ...p, sidebarOpen: !p.sidebarOpen }))}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Área Principal */}
        <div className="flex-1 flex overflow-hidden relative flex-col sm:flex-row">
          <div 
            className="flex-1 relative bg-gray-950 overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 bg-gray-900 z-20"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 border-t-[#d4a820]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 sm:w-16 sm:h-16 text-[#d4a820]" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium text-base sm:text-lg">Carregando boleto...</p>
                    <div className="w-48 sm:w-80 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                        className="h-full bg-gradient-to-r from-[#d4a820] to-[#b8941d]"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : hasError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8 bg-gray-900 z-20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-red-900/20 flex items-center justify-center"
                  >
                    <AlertCircle size={32} className="text-red-500 sm:w-12 sm:h-12" />
                  </motion.div>
                  <div className="text-center max-w-md">
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Erro ao carregar boleto</h4>
                    <p className="text-sm text-gray-400 mb-4 sm:mb-6">
                      Não foi possível renderizar o boleto. O arquivo pode estar corrompido.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 py-2 font-semibold flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Tentar novamente
                      </button>
                      <button
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-4 sm:px-6 py-2 font-semibold"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full overflow-auto flex items-start justify-center p-4 sm:p-8"
                >
                  {viewState.viewMode === "scroll" && (
                    <div
                      className="space-y-12 w-full max-w-5xl mx-auto flex flex-col items-center"
                      style={{
                        transform: `scale(${viewState.scale})`,
                        transformOrigin: "top center",
                      }}
                    >
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className={`bg-white rounded-2xl shadow-xl overflow-hidden border ${
                            isCanceled ? 'border-red-500/30' : 'border-gray-700'
                          }`}
                          style={{
                            maxWidth: 850,
                            transform: `rotate(${viewState.rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          <img
                            src={page.canvas.toDataURL("image/png", 1.0)}
                            alt={`Página ${page.id}`}
                            className="w-full h-auto block"
                            style={{ maxWidth: "100%" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {viewState.viewMode === "grid" && (
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
                      style={{
                        transform: `scale(${viewState.scale})`,
                        transformOrigin: "top center",
                      }}
                    >
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
                            isCanceled ? 'border-red-500/30' : 'border-gray-700'
                          }`}
                          style={{
                            transform: `rotate(${viewState.rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          <img
                            src={page.canvas.toDataURL("image/png")}
                            alt={`Página ${page.id}`}
                            className="w-full h-auto block"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controles flutuantes */}
            {!isMobile && !isLoading && !hasError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isHovering ? 1 : 0,
                  y: isHovering ? 0 : 20,
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-700"
              >
                <button
                  onClick={() => setViewState(p => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                >
                  <ZoomOut size={24} />
                </button>
                <span className="text-lg font-bold text-white tabular-nums">
                  {Math.round(viewState.scale * 100)}%
                </span>
                <button
                  onClick={() => setViewState(p => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                >
                  <ZoomIn size={24} />
                </button>
                <div className="w-px h-8 bg-gray-700 mx-2" />
                <button
                  onClick={() => setViewState(p => ({ ...p, rotation: p.rotation + 90 }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                  title="Rotacionar"
                >
                  <RotateCw size={24} />
                </button>
              </motion.div>
            )}

            {/* Watermark para boleto cancelado */}
            {isCanceled && !isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="transform -rotate-45 bg-red-600/80 text-white py-4 px-24 text-4xl font-bold border-4 border-red-400/50 backdrop-blur-sm">
                  CANCELADO
                </div>
              </div>
            )}
          </div>

          {/* Painel Direito */}
          <AnimatePresence>
            {viewState.sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: 20 }}
                animate={{ width: isMobile ? "100%" : 320, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 20 }}
                className="bg-gray-900/60 backdrop-blur-2xl border-l border-[#d4a820]/10 overflow-y-auto absolute sm:relative right-0 top-0 bottom-0 z-40 sm:z-auto"
              >
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {isMobile && (
                    <div className="flex items-center justify-between sm:hidden pb-4 border-b border-gray-800">
                      <h3 className="text-lg font-bold text-white">Detalhes do Boleto</h3>
                      <button
                        onClick={() => setViewState(p => ({ ...p, sidebarOpen: false }))}
                        className="p-2 rounded-lg text-gray-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity size={14} className="text-[#d4a820]" />
                      Informações do Documento
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Boleto</span>
                        <span className="font-medium text-white">#{boletoId || parcelaId}</span>
                      </div>
                      {numeroNF && (
                        <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                          <span className="text-gray-400">Nota Fiscal</span>
                          <span className="font-medium text-white">#{numeroNF}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Vencimento</span>
                        <span className={`font-medium ${
                          diasRestantes !== null && diasRestantes < 0 ? 'text-red-400' : 'text-white'
                        }`}>
                          {formattedDueDate}
                        </span>
                      </div>
                      
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          isCanceled ? 'text-red-400' : diasRestantes !== null && diasRestantes < 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {isCanceled ? (
                            <><XCircle size={14} /> Cancelado</>
                          ) : diasRestantes !== null && diasRestantes < 0 ? (
                            <><XCircle size={14} /> Vencido</>
                          ) : (
                            <><CheckCircle2 size={14} /> Em aberto</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-[#d4a820]" />
                      Ações Rápidas
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={handleDownload}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      >
                        <Download size={18} />
                        <span className="font-medium">Download PDF</span>
                      </button>
                      <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                      >
                        {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                        <span className="font-medium">Imprimir</span>
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
          className={`relative z-40 px-4 sm:px-6 py-2 sm:py-3 border-t border-[#d4a820]/10 bg-gray-900/90 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 ${
            isCanceled ? 'border-red-500/10' : ''
          }`}
        >
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#d4a820]/10 border border-[#d4a820]/20">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
              isCanceled ? 'bg-red-500' : 'bg-[#d4a820]'
            }`} />
            <span className={`text-xs font-medium ${
              isCanceled ? 'text-red-400' : 'text-[#d4a820]'
            }`}>
              {isCanceled ? 'Documento cancelado' : 'Documento oficial'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
              <FileCheck size={14} className="text-[#d4a820]" />
              <span>Páginas: {pages.length}</span>
            </span>
            <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
              <Clock size={14} className="text-[#d4a820]" />
              <span>ID: {boletoId || parcelaId}</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const useBoletoViewer = () => {
  const navigate = useNavigate();

  const showBoletoViewer = async (id: string | number, parcelaId: string | number, parcela: any = null) => {
    try {
      const token = tokenStore.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // Buscar dados da parcela se não tiver
      let parcelaData = parcela;
      if (!parcelaData && parcelaId) {
        try {
          const parcelaResponse = await axios.get(`${apiBase}/Parcelas/${parcelaId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          parcelaData = parcelaResponse.data;
        } catch (error) {
          // Continua mesmo sem dados da parcela
        }
      }

      const loadingId = `loading-boleto-${id}`;
      
      // Remover visualizador existente
      const existingViewer = document.getElementById(`boleto-viewer-${id}`);
      if (existingViewer) {
        existingViewer.remove();
      }

      // Mostrar loading moderno
      const loadingEl = document.createElement("div");
      loadingEl.id = loadingId;
      loadingEl.className = "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60";
      
      const loadingRoot = createRoot(loadingEl);
      loadingRoot.render(
        <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 border-t-[#d4a820] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CreditCard className="w-8 h-8 sm:w-16 sm:h-16 text-[#d4a820]" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-white font-medium text-base sm:text-lg">Carregando seu boleto...</p>
            <div className="w-48 sm:w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#d4a820] to-[#b8941d] animate-pulse w-full" />
            </div>
            <p className="text-sm text-gray-400">Aguarde um momento</p>
          </div>
        </div>
      );
      
      document.body.appendChild(loadingEl);

      try {
        const apiUrl = `${apiBase}/Boletos/${id}/pdf`;
        
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf, application/octet-stream",
          },
          responseType: "arraybuffer",
        });

        // Remover loading
        loadingRoot.unmount();
        document.body.removeChild(loadingEl);

        // Criar container do visualizador
        const viewerId = `boleto-viewer-${id}`;
        const container = document.createElement("div");
        container.id = viewerId;
        container.className = "fixed inset-0 z-50";
        document.body.appendChild(container);

        const root = createRoot(container);
        
        const closeViewer = () => {
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        };

        root.render(
          <BoletoViewerContent
            boletoId={id}
            parcelaId={parcelaId}
            pdfData={response.data}
            parcela={parcelaData}
            onClose={closeViewer}
          />
        );

      } catch (error) {
        loadingRoot.unmount();
        document.body.removeChild(loadingEl);
        handleBoletoError(error, navigate);
      }
    } catch (error) {
      toast.error("Erro ao visualizar boleto", {
        description: "Não foi possível carregar o boleto. Tente novamente mais tarde.",
      });
    }
  };

  return { showBoletoViewer };
};

const handleBoletoError = (error: unknown, navigate: NavigateFunction) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 404) {
      toast.error("Boleto não encontrado", {
        description: "Este Boleto não está disponível.",
        style: {
          backgroundColor: "white",
          color: "red",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
    } else if (status === 401 || status === 403) {
      toast.error("Acesso não autorizado", {
        description: "Sua sessão pode ter expirado. Tente fazer login novamente.",
      });
      navigate("/login");
    } else {
      toast.error(`Erro ao acessar o boleto (${status || "desconhecido"})`, {
        description: "Houve um problema ao tentar acessar o boleto. Tente novamente mais tarde.",
      });
    }
  } else {
    toast.error("Erro ao acessar o boleto", {
      description: "Houve um problema de conexão. Verifique sua internet e tente novamente.",
    });
  }
};