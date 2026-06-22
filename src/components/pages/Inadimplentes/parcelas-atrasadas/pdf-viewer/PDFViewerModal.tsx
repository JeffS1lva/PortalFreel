// src/components/pdf-viewer/PDFViewerModal.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  AlertCircle,
  RefreshCw,
  Scan,
  Hash,
  ZoomIn,
  ZoomOut,
  Printer,
  ScrollText,
  Grid3X3,
  PanelRightOpen,
  Truck,
  Activity,
  RotateCw,
  FileCheck,
  Receipt,
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import logo from "@/assets/logoBrowser.png";
import { ViewState, PageData } from "@/types/parcelaAtrasada";

// Configuração do worker
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/pdf.worker.min.mjs";

interface PDFViewerModalProps {
  danfeUrl: string;
  canhotoUrl: string | null;
  notaId: string;
  onClose: () => void;
  transportadora?: string;
  filial: string | number;
  companyCode: string;
  chaveNFe: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  danfeUrl,
  canhotoUrl,
  notaId,
  onClose,
  transportadora,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCanhoto, setIsLoadingCanhoto] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canhotoError, setCanhotoError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const [danfePages, setDanfePages] = useState<PageData[]>([]);
  const [canhotoPages, setCanhotoPages] = useState<PageData[]>([]);

  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    viewMode: "scroll",
    sidebarOpen: false,
    rightPanelOpen: false,
    focusMode: false,
    activeTab: "danfe",
  });

  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const canhotoDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const podeVerCanhoto = !!canhotoUrl;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Renderização do PDF
  const renderPDF = useCallback(
    async (url: string, isCanhoto = false): Promise<PageData[]> => {
      try {
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;

        if (isCanhoto) {
          canhotoDocRef.current = pdf;
        } else {
          pdfDocRef.current = pdf;
        }

        const renderedPages: PageData[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const scale = 2.2;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Falha ao obter contexto 2D");

          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvas, viewport }).promise;
          renderedPages.push({ id: pageNum, canvas });
        }

        return renderedPages;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Carrega DANFE
  useEffect(() => {
    const loadDanfe = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const pages = await renderPDF(danfeUrl, false);
        setDanfePages(pages);
        setIsLoading(false);
      } catch (err) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    if (danfeUrl) loadDanfe();

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
      if (canhotoDocRef.current) {
        canhotoDocRef.current.destroy().catch(() => {});
        canhotoDocRef.current = null;
      }
    };
  }, [danfeUrl, renderPDF]);

  // Carrega Canhoto quando muda para a tab
  useEffect(() => {
    const loadCanhoto = async () => {
      if (!canhotoUrl || canhotoPages.length > 0) return;
      
      setIsLoadingCanhoto(true);
      setCanhotoError(null);
      
      try {
        const pages = await renderPDF(canhotoUrl, true);
        setCanhotoPages(pages);
      } catch (err) {
        setCanhotoError("Erro ao carregar comprovante de entrega");
      } finally {
        setIsLoadingCanhoto(false);
      }
    };

    if (viewState.activeTab === "canhoto" && canhotoUrl) {
      loadCanhoto();
    }
  }, [viewState.activeTab, canhotoUrl, canhotoPages.length, renderPDF]);

  const handleDownload = useCallback(() => {
    const urlToDownload = viewState.activeTab === "canhoto" && canhotoUrl ? canhotoUrl : danfeUrl;
    const fileName = viewState.activeTab === "canhoto"
      ? `comprovante-de-entrega-NF${notaId}.pdf`
      : `notaFiscal-NF${notaId}.pdf`;

    const link = document.createElement("a");
    link.href = urlToDownload;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [danfeUrl, canhotoUrl, notaId, viewState.activeTab]);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    const urlToPrint = viewState.activeTab === "canhoto" && canhotoUrl ? canhotoUrl : danfeUrl;

    try {
      if (printIframeRef.current) {
        document.body.removeChild(printIframeRef.current);
      }

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "100%";
      iframe.style.bottom = "100%";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      iframe.src = urlToPrint;

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setIsPrinting(false);
          }, 500);
        } catch (err) {
          window.open(urlToPrint, "_blank");
          setIsPrinting(false);
        }
      };

      document.body.appendChild(iframe);
      printIframeRef.current = iframe;

      setTimeout(() => {
        if (printIframeRef.current?.parentNode) {
          document.body.removeChild(printIframeRef.current);
          printIframeRef.current = null;
        }
      }, 60000);
    } catch (err) {
      setIsPrinting(false);
      window.open(urlToPrint, "_blank");
    }
  }, [danfeUrl, canhotoUrl, viewState.activeTab]);

  const visiblePages = viewState.activeTab === "canhoto" ? canhotoPages : danfePages;
  const isLoadingCurrent = viewState.activeTab === "canhoto" ? isLoadingCanhoto : isLoading;
  const currentError = viewState.activeTab === "canhoto" ? canhotoError : hasError ? "Erro ao carregar documento" : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-0 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`relative flex flex-col bg-gray-900 overflow-hidden ${
          viewState.focusMode
            ? "fixed inset-0"
            : "w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl shadow-2xl"
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-[#d4a820]/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-[#d4a820]/5 rounded-full blur-[60px] sm:blur-[100px] animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`relative z-50 flex flex-col border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl transition-all duration-300 ${
            viewState.focusMode ? "opacity-0 hover:opacity-100" : ""
          }`}
        >
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center text-gray-900 shadow-lg shadow-[#d4a820]/25 flex-shrink-0">
                <Scan size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">
                    Nota Fiscal
                  </h3>
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

            {/* Toolbar */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700">
              <div className="flex items-center gap-1 pr-2 border-r border-gray-600">
                {[
                  { id: "scroll", icon: ScrollText, label: "Rolagem" },
                  { id: "grid", icon: Grid3X3, label: "Grade" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewState((p) => ({ ...p, viewMode: mode.id as any }))}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      viewState.viewMode === mode.id
                        ? "bg-[#d4a820] text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                    title={mode.label}
                  >
                    <mode.icon size={18} />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 px-2 border-r border-gray-600">
                <button
                  onClick={() => setViewState((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm font-semibold text-gray-300 w-12 sm:w-16 text-center tabular-nums">
                  {Math.round(viewState.scale * 100)}%
                </span>
                <button
                  onClick={() => setViewState((p) => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))}
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
                  onClick={() => setViewState((p) => ({ ...p, rightPanelOpen: !p.rightPanelOpen }))}
                  className={`p-2 rounded-lg transition-colors ${
                    viewState.rightPanelOpen
                      ? "text-[#d4a820] bg-[#d4a820]/10"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
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

            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setViewState((p) => ({ ...p, rightPanelOpen: !p.rightPanelOpen }))}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          {podeVerCanhoto && (
            <div className="px-3 sm:px-6 pb-3">
              <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50 w-fit">
                <button
                  onClick={() => setViewState((p) => ({ ...p, activeTab: "danfe", scale: 1 }))}
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
                  onClick={() => setViewState((p) => ({ ...p, activeTab: "canhoto", scale: 1.2 }))}
                  disabled={isLoadingCanhoto}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewState.activeTab === "canhoto"
                      ? "bg-[#d4a820] text-gray-900 shadow-lg shadow-[#d4a820]/25"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoadingCanhoto ? <RefreshCw size={18} className="animate-spin" /> : <Receipt size={18} />}
                  <span className="hidden sm:inline">Comprovante de Entrega</span>
                  <span className="sm:hidden">Canhoto</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
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
                      <img src={logo} className="text-[#d4a820] sm:w-16 sm:h-22 mr-3" alt="Logo" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium text-base sm:text-lg">
                      {viewState.activeTab === "canhoto" ? "Carregando Comprovante..." : "Carregando Nota Fiscal..."}
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
                      Erro ao carregar documento
                    </h4>
                    <p className="text-sm text-gray-400 mb-4 sm:mb-6">{currentError}</p>
                    {viewState.activeTab === "canhoto" && (
                      <button
                        onClick={() => {
                          setCanhotoError(null);
                          setViewState((p) => ({ ...p, activeTab: "danfe" }));
                        }}
                        className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 py-2 font-semibold flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Voltar para DANFE
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
                      style={{ transform: `scale(${viewState.scale})`, transformOrigin: "top center" }}
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
                            alt={`Página ${page.id}`}
                            className="w-full h-auto block"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {viewState.viewMode === "grid" && (
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
                      style={{ transform: `scale(${viewState.scale})`, transformOrigin: "top center" }}
                    >
                      {visiblePages.map((page) => (
                        <div
                          key={`${viewState.activeTab}-${page.id}`}
                          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-700"
                          style={{ transform: `rotate(${viewState.rotation}deg)` }}
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

            {/* Floating Controls */}
            {!isMobile && !isLoadingCurrent && !currentError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHovering ? 1 : 0, y: isHovering ? 0 : 20 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-700"
              >
                <button
                  onClick={() => setViewState((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.1) }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                >
                  <ZoomOut size={24} />
                </button>
                <span className="text-lg font-bold text-white tabular-nums">{Math.round(viewState.scale * 100)}%</span>
                <button
                  onClick={() => setViewState((p) => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                >
                  <ZoomIn size={24} />
                </button>
                <div className="w-px h-8 bg-gray-700 mx-2" />
                <button
                  onClick={() => setViewState((p) => ({ ...p, rotation: p.rotation + 90 }))}
                  className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                >
                  <RotateCw size={24} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {viewState.rightPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: 20 }}
                animate={{ width: isMobile ? "100%" : 320, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 20 }}
                className="bg-gray-900/60 backdrop-blur-2xl border-l border-[#d4a820]/10 overflow-y-auto absolute sm:relative right-0 top-0 bottom-0 z-40"
              >
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {isMobile && (
                    <div className="flex items-center justify-between sm:hidden pb-4 border-b border-gray-800">
                      <h3 className="text-lg font-bold text-white">Detalhes</h3>
                      <button
                        onClick={() => setViewState((p) => ({ ...p, rightPanelOpen: false }))}
                        className="p-2 rounded-lg text-gray-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity size={14} className="text-[#d4a820]" />
                      Informações
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Nota Fiscal</span>
                        <span className="font-medium text-white">#{notaId}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-gray-800 border border-gray-700">
                        <span className="text-gray-400">Visualizando</span>
                        <span className={`font-medium ${viewState.activeTab === "canhoto" ? "text-[#d4a820]" : "text-white"}`}>
                          {viewState.activeTab === "canhoto" ? "Comprovante" : "Nota Fiscal"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {podeVerCanhoto && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText size={14} className="text-[#d4a820]" />
                        Documentos
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setViewState((p) => ({ ...p, activeTab: "danfe" }))}
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
                          onClick={() => setViewState((p) => ({ ...p, activeTab: "canhoto" }))}
                          disabled={isLoadingCanhoto}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all disabled:opacity-50 ${
                            viewState.activeTab === "canhoto"
                              ? "bg-[#d4a820]/20 border-[#d4a820]/50 text-[#d4a820]"
                              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {isLoadingCanhoto ? <RefreshCw size={18} className="animate-spin" /> : <Receipt size={18} />}
                          <span className="font-medium">Ver Comprovante</span>
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
          className={`relative z-40 px-4 sm:px-6 py-2 sm:py-3 border-t border-[#d4a820]/10 bg-gray-900/90 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 transition-all duration-300 ${
            viewState.focusMode ? "opacity-0 hover:opacity-100" : ""
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#d4a820]/10 border border-[#d4a820]/20">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#d4a820] animate-pulse" />
              <span className="text-xs font-medium text-[#d4a820]">
                {viewState.activeTab === "canhoto" ? "Modo Canhoto" : "Documento verificado"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono flex items-center gap-2 ${viewState.activeTab === "canhoto" ? "text-[#d4a820]" : "text-gray-500"}`}>
              {viewState.activeTab === "canhoto" ? <Receipt size={14} /> : <FileCheck size={14} />}
              <span>{viewState.activeTab === "canhoto" ? "Canhoto" : `Páginas: ${danfePages.length}`}</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};