import { Dialog, DialogPortal, DialogOverlayCotacao } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  DownloadIcon,
  PrinterIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  quotationNumber: string | number;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  pdfUrl,
  quotationNumber,
}: PdfViewerDialogProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `cotacao-${quotationNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const iframe = document.querySelector(
      'iframe[title="PDF Viewer"]'
    ) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  // Detectar dispositivo móvel e Android
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlayCotacao />
        <DialogPrimitive.Content
          className={cn(
            "bg-white dark:bg-gray-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex h-[90vh] w-[95vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] flex-col rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl duration-300  "
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Visualizar Cotação</h2>
                  <div className="flex items-center text-sm text-white/80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 mr-1"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Cotação #{quotationNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 rounded-lg bg-white/10 backdrop-blur-sm px-2 py-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    aria-label="Diminuir zoom"
                  >
                    <ZoomOutIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-white min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    aria-label="Aumentar zoom"
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                </div>
                {/* Action Buttons */}
                <Button
                  type="button"
                  size="sm"
                  className="inline-flex items-center justify-center px-4 py-5 rounded-lg text-sm font-medium transition-all bg-white/10 backdrop-blur-sm shadow-sm gap-1.5  cursor-pointer"
                  onClick={handlePrint}
                  aria-label="Imprimir PDF"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="inline-flex items-center justify-center px-4 py-5 rounded-lg text-sm font-medium transition-all bg-white/10 backdrop-blur-sm shadow-sm gap-1.5 cursor-pointer"
                  onClick={handleDownload}
                  aria-label="Baixar PDF"
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Baixar</span>
                </Button>
                {/* Close Button */}
                <DialogPrimitive.Close
                  className="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  aria-label="Fechar"
                >
                  <XIcon className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>
            </div>
          </div>

          {/* PDF Content */}
          <div
            className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative rounded-b-lg"
            id={`iframe-container-${quotationNumber}`}
          >
            {/* Gradiente superior */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-primary/20 border-t border-slate-400/50 dark:from-gray-800 to-transparent z-10"></div>

            {/* Conteúdo do PDF */}
            <div className="w-full h-full">
              {isAndroid ? (
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center top",
                    transition: "transform 0.2s ease-in-out",
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      Não foi possível exibir o PDF diretamente.
                    </p>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Abrir em nova aba
                    </a>
                  </div>
                </object>
              ) : isMobile ? (
                <embed
                  src={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center top",
                    transition: "transform 0.2s ease-in-out",
                  }}
                />
              ) : (
                <iframe
                  src={pdfUrl}
                  title="PDF Viewer"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="fullscreen"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center top",
                    transition: "transform 0.2s ease-in-out",
                  }}
                />
              )}
            </div>

            {/* Barra de informações inferior */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10 rounded-bl-md rounded-br-md">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2 text-green-500"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Documento oficial • Válido para operações</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {quotationNumber}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
