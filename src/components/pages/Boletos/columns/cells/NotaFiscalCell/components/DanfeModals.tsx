import React, { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createRoot } from "react-dom/client";
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
  Hash,
  FileText,
  Receipt,
  Truck,
  Activity,
  PanelRightOpen,
} from "lucide-react";

// Configuração do worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/pdf.worker.min.mjs";

const TRANSPORTADORAS_AUTORIZADAS = [
  "AIRTIME SERVICOS E TRANSPORTES LTDA",
  "RODOVIARIO CAMILO DOS SANTOS FILHO LTDA",
  "MVT CAMPINAS COM LOG E SOLUCOES EM TRANSP EIRELI",
  "TERMACO TERMINAIS MARITIMOS DE CONTAINERS E SERVICOS ACESSORIOS LTDA",
  "EMPRESA DE TRANSPORTES PAJUCARA LTDA",
  "ATUAL CARGAS TRANSPORTES LTDA",
];

interface PageData {
  id: number;
  canvas: HTMLCanvasElement;
}

interface ViewState {
  scale: number;
  rotation: number;
  viewMode: "scroll" | "grid";
  sidebarOpen: boolean;
  activeTab: "danfe" | "canhoto";
}

// Loading Modal
export const DanfeLoadingModal: React.FC<{ notaId: string }> = ({ notaId }) => {
  useEffect(() => {
    const id = `loading-danfe-${notaId}`;
    if (document.getElementById(id)) return;

    const el = document.createElement("div");
    el.id = id;
    el.className =
      "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60";
    
    el.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
        <div class="relative">
          <div class="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 border-t-[#d4a820] animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-8 h-8 sm:w-16 sm:h-16 text-[#d4a820]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div class="text-center space-y-2">
          <p class="text-white font-medium text-base sm:text-lg">Carregando Nota Fiscal</p>
          <div class="w-48 sm:w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-[#d4a820] to-[#b8941d] animate-pulse w-full"></div>
          </div>
          <p class="text-sm text-gray-400">Aguarde um momento</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(el);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [notaId]);

  return null;
};

// Error Modal
export const DanfeErrorModal: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  useEffect(() => {
    const id = "danfe-error-modal";
    if (document.getElementById(id)) return;

    const el = document.createElement("div");
    el.id = id;
    el.className =
      "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60";
    
    el.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center max-w-md mx-4 border border-gray-800 transform transition-all duration-300 scale-100">
        <div class="bg-red-900/20 p-4 rounded-2xl mb-4">
          <svg class="h-10 w-10 text-red-500 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2 text-center">
          Não foi possível carregar a DANFE
        </h3>
        <p class="text-gray-400 mb-6 text-center text-sm">${message}</p>
        <button id="close-danfe-error" class="px-6 py-2.5 bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl font-semibold transition-colors">
          Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(el);

    const closeBtn = document.getElementById("close-danfe-error");
    const handleClose = () => {
      el.remove();
      onClose();
    };

    closeBtn?.addEventListener("click", handleClose);

    return () => {
      el.remove();
    };
  }, [message, onClose]);

  return null;
};

// Função para verificar se a transportadora está autorizada
const isTransportadoraAutorizada = (transportadora?: string): boolean => {
  if (!transportadora) return false;
  const transportadoraNormalizada = transportadora.trim().toUpperCase();
  return TRANSPORTADORAS_AUTORIZADAS.some(
    (autorizada) => autorizada.toUpperCase() === transportadoraNormalizada,
  );
};

// Função para normalizar filial
const normalizeFilial = (filial: string | number | undefined): string => {
  if (filial === undefined || filial === null) return "";
  return String(filial).trim();
};

// Componente interno do Modal de PDF
const PDFViewerContent: React.FC<{
  danfeData: ArrayBuffer;
  notaId: string;
  onClose: () => void;
  transportadora?: string;
  filial: string | number;
  companyCode: string;
  chaveNFe: string;
  token: string;
}> = ({ 
  danfeData, 
  notaId, 
  onClose, 
  transportadora, 
  filial, 
  chaveNFe,
  token 
}) => {
  const [danfePages, setDanfePages] = useState<PageData[]>([]);
  const [canhotoPages, setCanhotoPages] = useState<PageData[]>([]);
  const [canhotoData, setCanhotoData] = useState<ArrayBuffer | null>(null);
  const [isLoadingDanfe, setIsLoadingDanfe] = useState(true);
  const [isLoadingCanhoto, setIsLoadingCanhoto] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canhotoError, setCanhotoError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    viewMode: "scroll",
    sidebarOpen: false,
    activeTab: "danfe",
  });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const canhotoDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const isFetchingCanhoto = useRef(false);

  const filialNormalizada = normalizeFilial(filial);
  const temFilial = filialNormalizada !== "";
  const podeVerCanhoto = isTransportadoraAutorizada(transportadora);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Renderizar PDF em canvas a partir de ArrayBuffer
  const renderPDF = useCallback(async (data: ArrayBuffer, isCanhoto = false): Promise<PageData[]> => {
    try {
      const loadingTask = pdfjs.getDocument({
        data: data,
        useSystemFonts: true,
        cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/cmaps/",
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      
      if (isCanhoto) {
        canhotoDocRef.current = pdf;
      } else {
        pdfDocRef.current = pdf;
      }

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

  // Carregar DANFE inicialmente
  useEffect(() => {
    let isMounted = true;

    const loadDanfe = async () => {
      try {
        setIsLoadingDanfe(true);
        setHasError(false);
        
        const renderedPages = await renderPDF(danfeData, false);
        
        if (isMounted) {
          setDanfePages(renderedPages);
          setIsLoadingDanfe(false);
        }
      } catch (err) {
        console.error("Erro ao renderizar DANFE:", err);
        if (isMounted) {
          setHasError(true);
          setIsLoadingDanfe(false);
        }
      }
    };

    loadDanfe();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
      if (canhotoDocRef.current) {
        canhotoDocRef.current.destroy().catch(() => {});
        canhotoDocRef.current = null;
      }
    };
  }, [danfeData, renderPDF]);

  // Buscar canhoto
  const fetchCanhoto = useCallback(async () => {
    if (canhotoPages.length > 0 || canhotoData || isFetchingCanhoto.current) {
      return;
    }

    isFetchingCanhoto.current = true;
    setIsLoadingCanhoto(true);
    setCanhotoError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const url = `${apiBase}/Danfe/canhoto-pdf/${encodeURIComponent(filialNormalizada)}/${encodeURIComponent(notaId)}/${encodeURIComponent(chaveNFe)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Canhoto vazio");
      }

      setCanhotoData(arrayBuffer);
      const pages = await renderPDF(arrayBuffer, true);
      setCanhotoPages(pages);
      setIsLoadingCanhoto(false);
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error && err.name === "AbortError") {
        setCanhotoError("Tempo de espera excedido (30s). Tente novamente.");
      } else {
        console.error("[Canhoto] Erro:", err);
        setCanhotoError(
          err instanceof Error 
            ? err.message 
            : "Erro ao carregar comprovante de entrega"
        );
      }
      setIsLoadingCanhoto(false);
    } finally {
      isFetchingCanhoto.current = false;
    }
  }, [filialNormalizada, notaId, chaveNFe, token, canhotoPages.length, canhotoData, renderPDF]);

  // Carregar canhoto quando mudar para a tab
  useEffect(() => {
    if (viewState.activeTab === "canhoto" && podeVerCanhoto) {
      if (canhotoPages.length === 0 && !canhotoData && !isFetchingCanhoto.current) {
        fetchCanhoto();
      }
    }
  }, [viewState.activeTab, podeVerCanhoto, canhotoPages.length, canhotoData, fetchCanhoto]);

  const visiblePages = viewState.activeTab === "canhoto" ? canhotoPages : danfePages;
  const isLoadingCurrent = viewState.activeTab === "canhoto" ? isLoadingCanhoto : isLoadingDanfe;
  const currentError = viewState.activeTab === "canhoto" ? canhotoError : hasError ? "Erro ao carregar documento" : null;

  // Download
  const handleDownload = useCallback(() => {
    const dataToDownload = viewState.activeTab === "canhoto" && canhotoData ? canhotoData : danfeData;
    const fileName = viewState.activeTab === "canhoto" 
      ? `comprovante-de-entrega-NF${notaId}.pdf`
      : `notaFiscal-NF${notaId}.pdf`;
    
    const blob = new Blob([dataToDownload], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [danfeData, canhotoData, notaId, viewState.activeTab]);

  // Print
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    const dataToPrint = viewState.activeTab === "canhoto" && canhotoData ? canhotoData : danfeData;
    
    const blob = new Blob([dataToPrint], { type: "application/pdf" });
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
  }, [danfeData, canhotoData, viewState.activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-0 sm:p-4"
    >
      <motion.div
        id={`viewer-container-${notaId}`}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative flex flex-col bg-gray-900 overflow-hidden w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl shadow-2xl border border-gray-800 transition-all duration-300"
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
          className="relative z-50 flex flex-col border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center text-gray-900 shadow-lg shadow-[#d4a820]/25 flex-shrink-0">
                <svg className="h-5 w-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">Nota Fiscal</h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">
                    Verificado
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Hash size={10} className="sm:w-3 sm:h-3" />
                    <span className="truncate">NF {notaId}</span>
                  </span>
                  {transportadora && (
                    <>
                      <span className="hidden sm:inline text-gray-600">•</span>
                      <span className="hidden sm:flex items-center gap-1 truncate">
                        <Truck size={10} className="sm:w-3 sm:h-3" />
                        <span className="truncate">{transportadora}</span>
                      </span>
                    </>
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
                  disabled={isPrinting || isLoadingCurrent}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50"
                  title="Imprimir"
                >
                  {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isLoadingCurrent}
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

            {/* Mobile close button */}
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

          {/* Tabs de navegação DANFE/Canhoto */}
          {podeVerCanhoto && (
            <div className="px-3 sm:px-6 pb-3">
              <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50 w-fit">
                <button
                  onClick={() => setViewState(p => ({ ...p, activeTab: "danfe", scale: 1 }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewState.activeTab === "danfe"
                      ? "bg-[#d4a820] text-gray-900 shadow-lg shadow-[#d4a820]/25"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <FileCheck size={18} />
                  <span className="hidden sm:inline">Nota Fiscal</span>
                  <span className="sm:hidden">DANFE</span>
                </button>
                <button
                  onClick={() => setViewState(p => ({ ...p, activeTab: "canhoto", scale: 1.2 }))}
                  disabled={isLoadingCanhoto || !temFilial || isFetchingCanhoto.current}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewState.activeTab === "canhoto"
                      ? "bg-[#d4a820] text-gray-900 shadow-lg shadow-[#d4a820]/25"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoadingCanhoto ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Receipt size={18} />
                  )}
                  <span className="hidden sm:inline">Comprovante de Entrega</span>
                  <span className="sm:hidden">Canhoto</span>
                  {!temFilial && <span className="text-xs ml-1">(sem filial)</span>}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Área Principal */}
        <div className="flex-1 flex overflow-hidden relative flex-col sm:flex-row">
          <div 
            className="flex-1 relative bg-gray-950 overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <AnimatePresence mode="wait">
              {isLoadingCurrent ? (
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
                      <svg className="w-8 h-8 sm:w-16 sm:h-16 text-[#d4a820]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium text-base sm:text-lg">
                      {viewState.activeTab === "canhoto" ? "Carregando Comprovante de Entrega..." : "Carregando Nota Fiscal..."}
                    </p>
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
              ) : currentError ? (
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
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {viewState.activeTab === "canhoto" ? "Erro ao carregar canhoto" : "Erro ao carregar documento"}
                    </h4>
                    <p className="text-sm text-gray-400 mb-4 sm:mb-6">{currentError}</p>
                    {viewState.activeTab === "canhoto" && (
                      <button
                        onClick={() => {
                          isFetchingCanhoto.current = false;
                          fetchCanhoto();
                        }}
                        className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 py-2 font-semibold flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
                        Tentar novamente
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={viewState.activeTab}
                  initial={{ opacity: 0, x: viewState.activeTab === "canhoto" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: viewState.activeTab === "canhoto" ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
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
                      {visiblePages.map((page) => (
                        <div
                          key={`${viewState.activeTab}-${page.id}`}
                          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-700"
                          style={{
                            maxWidth: 850,
                            transform: `rotate(${viewState.rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          <img
                            src={page.canvas.toDataURL("image/png", 1.0)}
                            alt={viewState.activeTab === "canhoto" ? "Canhoto" : `Página ${page.id}`}
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
                      {visiblePages.map((page) => (
                        <div
                          key={`${viewState.activeTab}-${page.id}`}
                          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-700"
                          style={{
                            transform: `rotate(${viewState.rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          <img
                            src={page.canvas.toDataURL("image/png")}
                            alt={viewState.activeTab === "canhoto" ? "Canhoto" : `Página ${page.id}`}
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
            {!isMobile && !isLoadingCurrent && !currentError && (
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
                      <h3 className="text-lg font-bold text-white">Detalhes</h3>
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
                      {viewState.activeTab === "canhoto" ? "Informações do Canhoto" : "Informações da NF-e"}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Nota Fiscal</span>
                        <span className="font-medium text-white">#{notaId}</span>
                      </div>

                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Visualizando</span>
                        <span className={`font-medium ${viewState.activeTab === "canhoto" ? "text-[#d4a820]" : "text-white"}`}>
                          {viewState.activeTab === "canhoto" ? "Comprovante de Entrega" : "Nota Fiscal"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Só mostra ações rápidas de canhoto se a transportadora estiver autorizada */}
                  {podeVerCanhoto && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText size={14} className="text-[#d4a820]" />
                        Ações Rápidas
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setViewState(p => ({ ...p, activeTab: "danfe" }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            viewState.activeTab === "danfe"
                              ? "bg-[#d4a820]/20 border-[#d4a820]/50 text-[#d4a820]"
                              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          <FileCheck size={18} />
                          <span className="font-medium">Ver Nota Fiscal</span>
                        </button>
                        <button
                          onClick={() => {
                            if (canhotoPages.length === 0 && !canhotoData) {
                              isFetchingCanhoto.current = false;
                            }
                            setViewState(p => ({ ...p, activeTab: "canhoto" }));
                          }}
                          disabled={isLoadingCanhoto || !temFilial || isFetchingCanhoto.current}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all disabled:opacity-50 ${
                            viewState.activeTab === "canhoto"
                              ? "bg-[#d4a820]/20 border-[#d4a820]/50 text-[#d4a820]"
                              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {isLoadingCanhoto ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <Receipt size={18} />
                          )}
                          <span className="font-medium">Ver Comprovante de Entrega</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-40 px-4 sm:px-6 py-2 sm:py-3 border-t border-[#d4a820]/10 bg-gray-900/90 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
        >
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#d4a820]/10 border border-[#d4a820]/20">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#d4a820] animate-pulse" />
              <span className="text-xs font-medium text-[#d4a820]">
                {viewState.activeTab === "canhoto" ? "Modo Canhoto" : "Documento verificado"}
              </span>
            </div>

            {isMobile && !isLoadingCurrent && !currentError && (
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="p-2 rounded-lg bg-[#d4a820]/20 text-[#d4a820] disabled:opacity-50"
                >
                  {isPrinting ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300"
                >
                  <Download size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono flex items-center gap-2 truncate ${viewState.activeTab === "canhoto" ? "text-[#d4a820]" : "text-gray-500"}`}>
              {viewState.activeTab === "canhoto" ? (
                <>
                  <Receipt size={14} />
                  <span>Canhoto</span>
                </>
              ) : (
                <>
                  <FileCheck size={14} />
                  <span>Páginas: {danfePages.length}</span>
                </>
              )}
            </span>
            <span className="text-xs text-gray-500 font-mono items-center gap-2 truncate hidden sm:flex">
              <Truck className="text-[#d4a820] flex-shrink-0" size={14} />
              <span className="truncate">{transportadora || "DANFE Digital"}</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// PDF Viewer Modal - Componente principal que gerencia o portal
export const DanfePDFViewer: React.FC<{
  fileUrl: string;
  notaId: string;
  onClose: () => void;
  transportadora?: string;
  filial?: string | number;
  companyCode?: string;
  chaveNFe?: string;
}> = ({ fileUrl, notaId, onClose, transportadora, filial, companyCode, chaveNFe }) => {
  const [danfeData, setDanfeData] = useState<ArrayBuffer | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Buscar token
  useEffect(() => {
    const storedToken = tokenStore.getToken() || "";
    setToken(storedToken);
  }, []);

  // Buscar o PDF como ArrayBuffer primeiro
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setIsLoadingPdf(true);
        setLoadError(null);

        abortControllerRef.current = new AbortController();

        const response = await fetch(fileUrl, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error("PDF vazio recebido");
        }

        setDanfeData(arrayBuffer);
        setIsLoadingPdf(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Erro ao buscar PDF:", err);
        setLoadError(err instanceof Error ? err.message : "Erro ao carregar PDF");
        setIsLoadingPdf(false);
      }
    };

    fetchPdf();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fileUrl]);

  // Renderizar o modal quando tivermos os dados
  useEffect(() => {
    if (!danfeData || isLoadingPdf || !token) return;

    const id = `danfe-viewer-${notaId}`;
    
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    const container = document.createElement("div");
    container.id = id;
    container.className = "fixed inset-0 z-50";
    document.body.appendChild(container);
    containerRef.current = container;

    const root = createRoot(container);
    rootRef.current = root;

    root.render(
      <PDFViewerContent
        danfeData={danfeData}
        notaId={notaId}
        onClose={onClose}
        transportadora={transportadora}
        filial={filial || ""}
        companyCode={companyCode || ""}
        chaveNFe={chaveNFe || ""}
        token={token}
      />
    );

    requestAnimationFrame(() => {
      const viewer = document.getElementById(`viewer-container-${notaId}`);
      if (viewer) {
        viewer.classList.remove("opacity-0", "scale-95");
        viewer.classList.add("opacity-100", "scale-100");
      }
    });

    return () => {
      setTimeout(() => {
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }
        if (containerRef.current && document.body.contains(containerRef.current)) {
          document.body.removeChild(containerRef.current);
        }
        containerRef.current = null;
      }, 0);
    };
  }, [danfeData, isLoadingPdf, token, notaId, onClose, transportadora, filial, companyCode, chaveNFe]);

  if (isLoadingPdf) {
    return <DanfeLoadingModal notaId={notaId} />;
  }

  if (loadError) {
    return <DanfeErrorModal message={loadError} onClose={onClose} />;
  }

  return null;
};