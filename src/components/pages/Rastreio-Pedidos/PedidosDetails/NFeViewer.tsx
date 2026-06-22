// src/components/pedidos/EmbeddedNFeViewer.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Printer,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

// Configuração do worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/pdf.worker.min.mjs";

interface EmbeddedNFeViewerProps {
  chaveNFe: string;
  notaFiscal: string | number;
  companyCode: string;
  isOpen: boolean;
  onClose: () => void;
  transportadora?: string;
  filial?: string | number;
}

interface PageData {
  id: number;
  canvas: HTMLCanvasElement;
}

export const EmbeddedNFeViewer: React.FC<EmbeddedNFeViewerProps> = ({
  chaveNFe,
  notaFiscal,
  companyCode,
  isOpen,
  onClose,
  transportadora,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [pages, setPages] = useState<PageData[]>([]);
  const [scale, setScale] = useState(1);
  const [rotation] = useState(0);
  const [viewMode, setViewMode] = useState<"scroll" | "single">("scroll");

  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Função utilitária para obter token
  const getAuthToken = (): string | null => {
    return tokenStore.getToken();
  };

  // Renderização do PDF (mantida igual, mas com melhor escala inicial)
  const renderPDF = useCallback(async (url: string): Promise<PageData[]> => {
    try {
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;

      const renderedPages: PageData[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // escala boa para visualização

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
      console.error("Erro ao renderizar PDF:", err);
      throw err;
    }
  }, []);

  // Carrega apenas a DANFE
  const loadDanfe = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await axios.get(`${apiBase}/Danfe/gerar`, {
        params: { 
          companyCode, 
          chaveNF: chaveNFe,
          tipo: "danfe"   // ← Importante: força o backend a retornar apenas a DANFE
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        responseType: "blob",
        timeout: 45000,
      });

      const contentType = response.headers["content-type"] || "";

      if (!contentType.includes("application/pdf")) {
        const errorText = await response.data.text();
        let errorMsg = "Resposta não é um PDF válido";

        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Cria Blob e URL
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      objectUrlRef.current = objectUrl;

      // Renderiza as páginas
      const renderedPages = await renderPDF(objectUrl);
      setPages(renderedPages);
      
    } catch (err: any) {
      console.error("[EmbeddedNFeViewer] Erro ao carregar DANFE:", err);

      let mensagemErro = "Não foi possível carregar a DANFE. Tente novamente.";

      if (isAxiosError(err)) {
        const status = err.response?.status;

        if (err.response?.data instanceof Blob) {
          try {
            const errorText = await err.response.data.text();
            try {
              const errorJson = JSON.parse(errorText);
              mensagemErro = errorJson.message || errorJson.error || errorText;
            } catch {
              mensagemErro = errorText || `Erro ${status}`;
            }
          } catch {
            mensagemErro = `Erro interno do servidor (${status || "desconhecido"})`;
          }
        } else {
          switch (status) {
            case 404:
              mensagemErro = "DANFE não encontrada para esta nota fiscal.";
              break;
            case 401:
              mensagemErro = "Sessão expirada. Faça login novamente.";
              break;
            case 403:
              mensagemErro = "Sem permissão para visualizar esta DANFE.";
              break;
            case 500:
              mensagemErro = "Erro ao gerar DANFE. Verifique se a nota está autorizada na SEFAZ.";
              break;
            default:
              mensagemErro = err.message || `Erro ${status}`;
          }
        }
      } else if (err instanceof Error) {
        mensagemErro = err.message;
      }

      setErrorMessage(mensagemErro);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    loadDanfe();

    return () => {
      // Cleanup
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPages([]);
    };
  }, [isOpen, chaveNFe, companyCode]);

  // Download do PDF original (melhor que canvas)
  const handleDownload = useCallback(async () => {
    if (!chaveNFe || !companyCode) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await axios.get(`${apiBase}/Danfe/gerar`, {
        params: { companyCode, chaveNF: chaveNFe, tipo: "danfe" },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DANFE-${notaFiscal}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro no download:", err);
      alert("Não foi possível fazer o download da DANFE.");
    }
  }, [chaveNFe, companyCode, notaFiscal]);

  // Impressão (mantida, mas com melhoria leve)
  const handlePrint = useCallback(() => {
    if (pages.length === 0) return;
    
    setIsPrinting(true);
    
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setIsPrinting(false);
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>DANFE - Nota Fiscal ${notaFiscal}</title>
            <style>
              body { margin: 0; padding: 10px; }
              img { max-width: 100%; height: auto; display: block; page-break-after: always; }
              img:last-child { page-break-after: avoid; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${pages.map(page => `
              <img src="${page.canvas.toDataURL("image/png", 1.0)}" alt="Página ${page.id}" />
            `).join("")}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 800);
                }, 600);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (err) {
      console.error("Erro na impressão:", err);
    } finally {
      setIsPrinting(false);
    }
  }, [pages, notaFiscal]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: 1, 
        height: isExpanded ? "80vh" : "700px",
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
      exit={{ opacity: 0, height: 0 }}
      className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl"
      ref={containerRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              DANFE - Nota Fiscal #{notaFiscal}
            </h4>
            <p className="text-xs text-slate-400">
              {transportadora || "Documento Auxiliar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium text-slate-300 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(2.5, scale + 0.1))}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Modo de visualização */}
          <button
            onClick={() => setViewMode(viewMode === "scroll" ? "single" : "scroll")}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title={viewMode === "scroll" ? "Modo Página Única" : "Modo Rolagem"}
          >
            {viewMode === "scroll" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Expandir */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Imprimir */}
          <button
            onClick={handlePrint}
            disabled={isPrinting || isLoading || hasError}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            {isPrinting ? <RefreshCw size={16} className="animate-spin" /> : <Printer size={16} />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isLoading || hasError}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Área de Visualização */}
      <div className="relative flex-1 bg-slate-950 overflow-auto" style={{ height: "calc(100% - 60px)" }}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-3 border-slate-800 border-t-emerald-500"
              />
              <p className="text-sm text-slate-400">Gerando DANFE...</p>
            </motion.div>
          ) : hasError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div className="text-center max-w-sm">
                <h4 className="text-lg font-semibold text-white mb-2">Erro ao carregar DANFE</h4>
                <p className="text-sm text-slate-400 mb-4">{errorMessage}</p>
                <button
                  onClick={loadDanfe}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw size={16} />
                  Tentar novamente
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 sm:p-8"
            >
              {viewMode === "scroll" ? (
                <div
                  className="flex flex-col items-center gap-8"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                  }}
                >
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="bg-white rounded-lg shadow-xl overflow-hidden"
                      style={{
                        maxWidth: "850px",
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <img
                        src={page.canvas.toDataURL("image/png", 1.0)}
                        alt={`Página ${page.id}`}
                        className="w-full h-auto block"
                        style={{ minWidth: "600px" }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  {pages.length > 0 && (
                    <div
                      className="bg-white rounded-lg shadow-xl overflow-hidden"
                      style={{
                        maxWidth: "100%",
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                      }}
                    >
                      <img
                        src={pages[0].canvas.toDataURL("image/png", 1.0)}
                        alt="Página 1"
                        className="w-full h-auto block"
                        style={{ maxHeight: "65vh", objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>{pages.length} página(s)</span>
      </div>
    </motion.div>
  );
};

// Hook (mantido igual)
export const useEmbeddedNFeViewer = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return { isOpen, open, close, toggle };
};