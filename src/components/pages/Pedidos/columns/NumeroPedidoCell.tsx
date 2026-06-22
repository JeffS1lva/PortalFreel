// src/components/pedidos/columns/NumeroPedidoCell/index.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import {
  Eye,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Scan,
  Grid3X3,
  ScrollText,
  Bookmark,
  FileCheck,
  AlertCircle,
  PanelRightOpen,
  FileText,
  RefreshCw,
  Activity,
  Printer,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Configuração do worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import logo from "@/assets/logoBrowser.png";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

interface NumeroPedidoCellProps {
  numeroPedido: string | number | null;
}

interface PageData {
  id: number;
  canvas: HTMLCanvasElement;
  thumbnail: string;
  textContent: string;
}

interface ViewState {
  scale: number;
  rotation: number;
  viewMode: "scroll" | "grid";
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  focusMode: boolean;
}

export const NumeroPedidoCell = ({ numeroPedido }: NumeroPedidoCellProps) => {
  const navigate = useNavigate();
  const hasNotaFiscal =
    numeroPedido !== null && numeroPedido !== undefined && numeroPedido !== "";
  const pedidoId = numeroPedido?.toString() || "";

  // Estados do visualizador
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLaserPointer, setShowLaserPointer] = useState(false);
  const [documentStats, setDocumentStats] = useState({
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // NOVO: Estado para largura do container evitando recálculos com window.innerWidth
  const [containerWidth, setContainerWidth] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    viewMode: "scroll",
    sidebarOpen: true,
    rightPanelOpen: false,
    focusMode: false,
  });

  // Detectar mobile e atualizar largura do container
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewState((prev) => ({
          ...prev,
          sidebarOpen: false,
          rightPanelOpen: false,
        }));
      }
    };

    // NOVO: Atualizar largura do container de forma segura
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    checkMobile();
    updateContainerWidth();

    window.addEventListener("resize", checkMobile);
    window.addEventListener("resize", updateContainerWidth);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, []);

  const getAuthToken = () => {
    try {
      const authData =
        tokenStore.getAuthData() || tokenStore.getToken();
      if (authData) {
        const userData = JSON.parse(authData);
        return (
          userData.token || userData.accessToken || userData.jwt || authData
        );
      }
      return tokenStore.getToken();
    } catch {
      return tokenStore.getToken();
    }
  };

  // Renderização do PDF
  const renderPDF = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;

      const renderedPages: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvas, viewport }).promise;

        // Thumbnail
        const thumbnailCanvas = document.createElement("canvas");
        thumbnailCanvas.width = 150;
        thumbnailCanvas.height = (150 / canvas.width) * canvas.height;
        const thumbCtx = thumbnailCanvas.getContext("2d");

        if (thumbCtx) {
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = "high";
          thumbCtx.drawImage(
            canvas,
            0,
            0,
            thumbnailCanvas.width,
            thumbnailCanvas.height,
          );
        }

        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(" ");

        renderedPages.push({
          id: i,
          canvas,
          thumbnail: thumbnailCanvas.toDataURL(),
          textContent: text,
        });
      }

      const totalWords = renderedPages.reduce(
        (acc, page) => acc + page.textContent.trim().split(/\s+/).length,
        0,
      );

      setPages(renderedPages);
      setDocumentStats({
        wordCount: totalWords,
        charCount: renderedPages.reduce(
          (acc, page) => acc + page.textContent.length,
          0,
        ),
        readingTime: Math.ceil(totalWords / 200),
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao renderizar PDF:", err);
      setError("Erro ao processar documento");
      setIsLoading(false);
    }
  };

  const fetchPedidoPdf = async () => {
    if (!hasNotaFiscal) {
      setError("Número do pedido não disponível");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${apiBase}/Pedidos/imprime-pedido/${numeroPedido}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          responseType: "blob",
          timeout: 30000,
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const urlObject = URL.createObjectURL(blob);

      setPdfBlob(blob);
      setPdfUrl(urlObject);
      await renderPDF(blob);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.status === 404
            ? "Pedido não encontrado"
            : err.response?.status === 401
              ? "Sessão expirada"
              : "Erro ao carregar documento",
        );
      } else {
        setError("Erro inesperado");
      }
      setIsLoading(false);
    }
  };

  // Impressão
  const handlePrint = useCallback(() => {
    if (!pdfUrl && !pdfBlob) return;

    setIsPrinting(true);

    try {
      const printUrl =
        pdfUrl || (pdfBlob ? URL.createObjectURL(pdfBlob) : null);

      if (!printUrl) {
        setError("Erro ao preparar documento para impressão");
        setIsPrinting(false);
        return;
      }

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
      iframe.src = printUrl;

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setIsPrinting(false);
          }, 500);
        } catch (err) {
          window.open(printUrl, "_blank");
          setIsPrinting(false);
        }
      };

      iframe.onerror = () => {
        window.open(printUrl, "_blank");
        setIsPrinting(false);
      };

      document.body.appendChild(iframe);
      printIframeRef.current = iframe;

      setTimeout(() => {
        if (
          printIframeRef.current &&
          document.body.contains(printIframeRef.current)
        ) {
          document.body.removeChild(printIframeRef.current);
          printIframeRef.current = null;
        }
      }, 60000);
    } catch (err) {
      console.error("Erro na impressão:", err);
      setIsPrinting(false);
      if (pdfUrl) window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl, pdfBlob]);

  const handleDownload = useCallback(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedido-${pedidoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [pdfBlob, pedidoId]);

  // Efeito de laser pointer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Teclas de atalho
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case "l":
          if (e.ctrlKey) {
            e.preventDefault();
            setShowLaserPointer(!showLaserPointer);
          }
          break;
        case "p":
          if (e.ctrlKey) {
            e.preventDefault();
            handlePrint();
          }
          break;
        case "Escape":
          if (isFullscreen) setIsFullscreen(false);
          else if (viewState.focusMode)
            setViewState((p) => ({ ...p, focusMode: false }));
          else if (showMobileMenu) setShowMobileMenu(false);
          else setIsOpen(false);
          break;
        case "+":
        case "=":
          // CORRIGIDO: Zoom ilimitado - removido Math.min
          setViewState((prev) => ({
            ...prev,
            scale: prev.scale + 0.1,
          }));
          break;
        case "-":
          // CORRIGIDO: Zoom ilimitado - removido Math.max, apenas impede zoom negativo
          setViewState((prev) => ({
            ...prev,
            scale: Math.max(0.1, prev.scale - 0.1),
          }));
          break;
        case "0":
          setViewState((prev) => ({ ...prev, scale: 1, rotation: 0 }));
          break;
        case "b":
          if (e.ctrlKey) {
            e.preventDefault();
            toggleBookmark(1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, viewState, showMobileMenu, handlePrint]);

  // Cleanup
  useEffect(() => {
    if (!isOpen) {
      setPdfBlob(null);
      setPdfUrl(null);
      setPages([]);
      setError(null);
      setViewState({
        scale: 1,
        rotation: 0,
        viewMode: "scroll",
        sidebarOpen: !isMobile,
        rightPanelOpen: false,
        focusMode: false,
      });
      setShowMobileMenu(false);

      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }

      if (printIframeRef.current) {
        document.body.removeChild(printIframeRef.current);
        printIframeRef.current = null;
      }

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    }
  }, [isOpen, isMobile, pdfUrl]);

  const toggleBookmark = (pageNum: number) => {
    setBookmarks((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b),
    );
  };

  const currentPageData = pages[0];

  // Handler de abertura
  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasNotaFiscal) return;

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setIsOpen(true);
    if (!pdfBlob && !error) {
      await fetchPedidoPdf();
    }
  };

  return (
    <>
      {/* Trigger Button - COR ORIGINAL AZUL MANTIDA */}
      <div className="flex items-center gap-2">
        <span className="block text-center font-medium min-w-[50px] text-gray-900 dark:text-white">
          {hasNotaFiscal ? pedidoId : "N/A"}
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleOpen}
                disabled={!hasNotaFiscal}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-8 w-8 p-0 ${
                  hasNotaFiscal
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    : "opacity-50 cursor-not-allowed bg-primary text-primary-foreground"
                }`}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Visualizar</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {hasNotaFiscal ? "Visualizar Pedido" : "Pedido não disponível"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Visualizador Imersivo - CORES DOURADAS DO CANHOTOVIEWER */}
      <AnimatePresence>
        {isOpen && (
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
                isFullscreen
                  ? "fixed inset-0"
                  : "w-full h-full sm:w-[96vw] sm:h-[94vh] sm:max-w-6xl sm:rounded-3xl shadow-2xl"
              }`}
            >
              {/* Background dinâmico - Dourado */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-[#d4a820]/5 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-[#d4a820]/5 rounded-full blur-[60px] sm:blur-[100px] animate-pulse delay-1000" />
              </div>

              {/* Header Glassmorphism - Dourado */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`relative z-50 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[#d4a820]/20 bg-gray-900/90 backdrop-blur-2xl transition-all duration-300 ${
                  viewState.focusMode ? "opacity-0 hover:opacity-100" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#d4a820] to-[#b8941d] flex items-center justify-center text-gray-900 shadow-lg shadow-[#d4a820]/25 flex-shrink-0">
                    <Scan size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-white truncate">
                        Pedido de Venda
                      </h3>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">
                        Verificado
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <span className="truncate">
                          Nº do Documento #{pedidoId}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toolbar Central - Desktop - Dourado */}
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-700">
                  {/* View Modes */}
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-600">
                    {[
                      { id: "scroll", icon: ScrollText, label: "Rolagem" },
                      { id: "grid", icon: Grid3X3, label: "Grade" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() =>
                          setViewState((p) => ({
                            ...p,
                            viewMode: mode.id as any,
                          }))
                        }
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

                  {/* Zoom */}
                  <div className="flex items-center gap-1 px-2 border-r border-gray-600">
                    <button
                      onClick={() =>
                        // CORRIGIDO: Zoom ilimitado - removido Math.max
                        setViewState((p) => ({
                          ...p,
                          scale: Math.max(0.1, p.scale - 0.1),
                        }))
                      }
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <span className="text-sm font-semibold text-gray-300 w-12 sm:w-16 text-center tabular-nums">
                      {Math.round(viewState.scale * 100)}%
                    </span>
                    <button
                      onClick={() =>
                        // CORRIGIDO: Zoom ilimitado - removido Math.min
                        setViewState((p) => ({
                          ...p,
                          scale: p.scale + 0.1,
                        }))
                      }
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>

                  {/* Tools - Dourado */}
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      onClick={handlePrint}
                      disabled={isPrinting || !pdfBlob}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Imprimir (Ctrl+P)"
                    >
                      {isPrinting ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Printer size={18} />
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={!pdfBlob}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#d4a820] hover:bg-[#d4a820]/10 transition-colors disabled:opacity-50"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setViewState((p) => ({
                          ...p,
                          rightPanelOpen: !p.rightPanelOpen,
                        }))
                      }
                      className={`p-2 rounded-lg transition-colors ${viewState.rightPanelOpen ? "text-[#d4a820] bg-[#d4a820]/10" : "text-gray-400 hover:text-white hover:bg-gray-700/50"}`}
                      title="Painel lateral"
                    >
                      <PanelRightOpen size={18} />
                    </button>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Toolbar Mobile */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                    <Grid3X3 size={20} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>

              {/* Menu Mobile Flutuante - Dourado */}
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
                          { id: "scroll", icon: ScrollText, label: "Rolagem" },
                          { id: "grid", icon: Grid3X3, label: "Grade" },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setViewState((p) => ({
                                ...p,
                                viewMode: mode.id as any,
                              }));
                              setShowMobileMenu(false);
                            }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                              viewState.viewMode === mode.id
                                ? "bg-[#d4a820] text-gray-900"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            <mode.icon size={18} />
                            <span className="text-[10px]">{mode.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between bg-gray-700/50 rounded-xl p-2">
                        <button
                          onClick={() =>
                            // CORRIGIDO: Zoom ilimitado - removido Math.max
                            setViewState((p) => ({
                              ...p,
                              scale: Math.max(0.1, p.scale - 0.1),
                            }))
                          }
                          className="p-2 rounded-lg text-gray-400 hover:text-white"
                        >
                          <ZoomOut size={18} />
                        </button>
                        <span className="text-sm font-semibold text-white">
                          {Math.round(viewState.scale * 100)}%
                        </span>
                        <button
                          onClick={() =>
                            // CORRIGIDO: Zoom ilimitado - removido Math.min
                            setViewState((p) => ({
                              ...p,
                              scale: p.scale + 0.1,
                            }))
                          }
                          className="p-2 rounded-lg text-gray-400 hover:text-white"
                        >
                          <ZoomIn size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700">
                        <button
                          onClick={() => {
                            handlePrint();
                            setShowMobileMenu(false);
                          }}
                          disabled={isPrinting || !pdfBlob}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#d4a820]/20 text-[#d4a820] disabled:opacity-50"
                        >
                          {isPrinting ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <Printer size={18} />
                          )}
                          <span className="text-sm font-medium">Imprimir</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDownload();
                            setShowMobileMenu(false);
                          }}
                          disabled={!pdfBlob}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-700 text-gray-300 disabled:opacity-50"
                        >
                          <Download size={18} />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
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
                  {/* Laser Pointer - Dourado */}
                  <AnimatePresence>
                    {showLaserPointer && !isMobile && (
                      <motion.div
                        style={{ x: smoothMouseX, y: smoothMouseY }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute w-4 h-4 rounded-full bg-[#d4a820] shadow-lg shadow-[#d4a820]/50 pointer-events-none z-50 mix-blend-difference"
                      >
                        <div className="absolute inset-0 rounded-full bg-[#d4a820] animate-ping" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Conteúdo Principal */}
                  <div
                    ref={scrollContainerRef}
                    className="h-full overflow-auto"
                    style={{ overflowAnchor: "none" }} // CORREÇÃO: Previne scroll anchoring do navegador
                  >
                    {isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 border-t-[#d4a820]"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              src={logo}
                              className="text-[#d4a820] sm:w-16 sm:h-22 mr-3"
                            />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-white font-medium text-base sm:text-lg">
                            Carregando Pedido de Venda...
                          </p>
                          <div className="w-48 sm:w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.5, ease: "easeInOut" }}
                              className="h-full bg-gradient-to-r from-[#d4a820] to-[#b8941d]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-red-900/20 flex items-center justify-center"
                        >
                          <AlertCircle
                            size={32}
                            className="text-red-500 sm:w-12 sm:h-12"
                          />
                        </motion.div>
                        <div className="text-center max-w-md">
                          <h4 className="text-lg sm:text-xl font-bold text-white mb-2">
                            Erro ao carregar pedido
                          </h4>
                          <p className="text-sm text-gray-400 mb-4 sm:mb-6">
                            {error}
                          </p>
                          <Button
                            onClick={fetchPedidoPdf}
                            className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 font-semibold"
                          >
                            <RefreshCw
                              size={16}
                              className="mr-2 sm:w-[18px] sm:h-[18px]"
                            />
                            Tentar novamente
                          </Button>
                        </div>
                      </div>
                    ) : viewState.viewMode === "grid" ? (
                      // Vista em Grade - Dourado
                      <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {pages.map((page) => (
                          <motion.button
                            key={page.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() =>
                              setViewState((p) => ({
                                ...p,
                                viewMode: "scroll",
                              }))
                            }
                            className="group relative break-inside-avoid bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-[#d4a820]/10 hover:border-[#d4a820]/30 transition-all duration-300"
                          >
                            <img
                              src={page.canvas.toDataURL()}
                              alt={`Página ${page.id}`}
                              className="w-full h-auto"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                              <p className="text-white font-semibold text-sm sm:text-base">
                                Página {page.id}
                              </p>
                            </div>
                            {bookmarks.includes(page.id) && (
                              <div className="absolute top-3 left-3">
                                <Bookmark
                                  size={18}
                                  className="text-[#d4a820] fill-[#d4a820] drop-shadow-lg sm:w-5 sm:h-5"
                                />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    ) : viewState.viewMode === "scroll" ? (
                      // Rolagem Contínua - Dourado - CORRIGIDO: Removido whileInView que causava scroll automático
                      <div className="p-4 sm:p-8 max-w-full sm:max-w-4xl mx-auto space-y-4 sm:space-y-8">
                        {pages.map((page, index) => (
                          <motion.div
                            key={page.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative group"
                          >
                            <div
                              className="relative bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
                              style={{
                                transform: `scale(${viewState.scale})`,
                                transformOrigin: "top center",
                              }}
                            >
                              <img
                                src={page.canvas.toDataURL()}
                                alt={`Página ${page.id}`}
                                className="w-full h-auto"
                                style={{
                                  transform: `rotate(${viewState.rotation}deg)`,
                                  imageRendering: "crisp-edges",
                                }}
                              />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent">
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                  <span className="text-white font-medium text-sm sm:text-lg">
                                    Página {page.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      // Modo Imersivo (Padrão) - Dourado - CORRIGIDO: Animação simplificada sem spring
                      <div className="h-full flex items-center justify-center p-4 sm:p-12">
                        <AnimatePresence mode="wait">
                          {currentPageData && (
                            <motion.div
                              key="single-page"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.05 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="relative w-full max-w-4xl"
                            >
                              {/* CORRIGIDO: Glow estático sem animação de scale/opacity que causava reflows */}
                              <div className="absolute -inset-2 sm:-inset-4 bg-[#d4a820]/10 rounded-3xl blur-2xl -z-10" />

                              <div
                                className="relative bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-gray-800 mx-auto"
                                style={{
                                  width: isMobile
                                    ? "100%"
                                    : Math.min(
                                        currentPageData.canvas.width *
                                          viewState.scale *
                                          0.5,
                                        containerWidth * 0.9 ||
                                          window.innerWidth * 0.9,
                                      ),
                                  maxWidth: "100%",
                                  transform: `rotate(${viewState.rotation}deg)`,
                                }}
                              >
                                <img
                                  src={currentPageData.canvas.toDataURL()}
                                  alt="Pedido de Venda"
                                  className="w-full h-auto object-contain"
                                  style={{ imageRendering: "crisp-edges" }}
                                  draggable={false}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Controles flutuantes - Desktop - Dourado */}
                        {!isMobile && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                              opacity: isHovering ? 1 : 0,
                              y: isHovering ? 0 : 20,
                            }}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-700"
                          >
                            <button
                              onClick={() =>
                                // CORRIGIDO: Zoom ilimitado - removido Math.max
                                setViewState((p) => ({
                                  ...p,
                                  scale: Math.max(0.1, p.scale - 0.1),
                                }))
                              }
                              className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                            >
                              <ZoomOut size={24} />
                            </button>
                            <span className="text-lg font-bold text-white tabular-nums">
                              {Math.round(viewState.scale * 100)}%
                            </span>
                            <button
                              onClick={() =>
                                // CORRIGIDO: Zoom ilimitado - removido Math.min
                                setViewState((p) => ({
                                  ...p,
                                  scale: p.scale + 0.1,
                                }))
                              }
                              className="p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-[#d4a820] transition-colors"
                            >
                              <ZoomIn size={24} />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Painel Direito - Metadados - Dourado */}
                <AnimatePresence>
                  {viewState.rightPanelOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0, x: 20 }}
                      animate={{
                        width: isMobile ? "100%" : 320,
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{ width: 0, opacity: 0, x: 20 }}
                      className="bg-gray-900/60 backdrop-blur-2xl border-l border-[#d4a820]/10 overflow-y-auto absolute sm:relative right-0 top-0 bottom-0 z-40 sm:z-auto"
                    >
                      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {isMobile && (
                          <div className="flex items-center justify-between sm:hidden pb-4 border-b border-gray-800">
                            <h3 className="text-lg font-bold text-white">
                              Detalhes
                            </h3>
                            <button
                              onClick={() =>
                                setViewState((p) => ({
                                  ...p,
                                  rightPanelOpen: false,
                                }))
                              }
                              className="p-2 rounded-lg text-gray-400 hover:text-white"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        )}

                        {/* Estatísticas - Dourado */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <Activity
                              size={14}
                              className="text-[#d4a820] sm:w-4 sm:h-4"
                            />
                            Estatísticas
                          </h4>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700">
                              <p className="text-xl sm:text-2xl font-bold text-white">
                                {pages.length}
                              </p>
                              <p className="text-xs text-gray-400">Páginas</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700">
                              <p className="text-xl sm:text-2xl font-bold text-white">
                                {documentStats.wordCount}
                              </p>
                              <p className="text-xs text-gray-400">Palavras</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700">
                              <p className="text-xl sm:text-2xl font-bold text-white">
                                {documentStats.readingTime}
                              </p>
                              <p className="text-xs text-gray-400">
                                Min. leitura
                              </p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800 border border-gray-700">
                              <p className="text-xl sm:text-2xl font-bold text-white">
                                {bookmarks.length}
                              </p>
                              <p className="text-xs text-gray-400">Bookmarks</p>
                            </div>
                          </div>
                        </div>

                        {/* Informações - Dourado */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <FileCheck
                              size={14}
                              className="text-[#d4a820] sm:w-4 sm:h-4"
                            />
                            Informações
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-400">
                                Número do Pedido
                              </span>
                              <span className="text-xs sm:text-sm font-mono font-medium text-white">
                                #{pedidoId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-800 border border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-400">
                                Status
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#d4a820]/20 text-[#d4a820] text-xs font-medium border border-[#d4a820]/30">
                                Ativo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações Rápidas - Dourado */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <Printer
                              size={14}
                              className="text-[#d4a820] sm:w-4 sm:h-4"
                            />
                            Ações
                          </h4>
                          <div className="space-y-2">
                            <button
                              onClick={handlePrint}
                              disabled={isPrinting || !pdfBlob}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#d4a820]/20 text-[#d4a820] border border-[#d4a820]/30 hover:bg-[#d4a820]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPrinting ? (
                                <RefreshCw size={18} className="animate-spin" />
                              ) : (
                                <Printer size={18} />
                              )}
                              <span className="text-sm font-medium">
                                {isPrinting
                                  ? "Preparando..."
                                  : "Imprimir Pedido"}
                              </span>
                            </button>
                            <button
                              onClick={handleDownload}
                              disabled={!pdfBlob}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              <Download size={18} />
                              <span className="text-sm font-medium">
                                Download PDF
                              </span>
                            </button>
                          </div>
                        </div>

                        
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Minimalista - Dourado */}
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
                      Documento verificado
                    </span>
                  </div>

                  {isMobile && pdfBlob && (
                    <div className="flex items-center gap-2 sm:hidden">
                      <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="p-2 rounded-lg bg-[#d4a820]/20 text-[#d4a820] disabled:opacity-50"
                      >
                        {isPrinting ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Printer size={16} />
                        )}
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

                <span className="text-xs text-gray-500 font-mono flex items-center gap-2 truncate w-full sm:w-auto justify-end">
                  <FileText
                    className="text-[#d4a820] flex-shrink-0"
                    size={14}
                  />
                  <span className="truncate">Pedido #{pedidoId}</span>
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
