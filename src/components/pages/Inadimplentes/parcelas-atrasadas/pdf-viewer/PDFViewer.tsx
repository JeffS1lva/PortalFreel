// src/components/pdf-viewer/PDFViewer.tsx
import { useEffect, useRef } from "react";

interface PDFViewerProps {
  fileUrl: string;
  documentoId: string;
  onClose: () => void;
}

export function PDFViewer({ fileUrl, documentoId, onClose }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    const contentContainer = document.getElementById(`iframe-container-${documentoId}`);

    if (contentContainer) {
      if (isAndroid) {
        // Android: usar object
        contentContainer.innerHTML = `
          <object data="${fileUrl}" type="application/pdf" class="w-full h-full">
            <div class="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-6">
              <div class="text-center max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-gray-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p class="text-lg font-semibold mb-2">Este navegador não suporta PDFs embutidos</p>
                <a href="${fileUrl}" download="documento-${documentoId}.pdf" class="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  Baixar PDF
                </a>
              </div>
            </div>
          </object>
          <div class="absolute top-0 right-0 p-2 z-20">
            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors shadow-lg">
              Abrir em nova guia
            </a>
          </div>
        `;
      } else {
        // Desktop: usar iframe
        contentContainer.innerHTML = `<iframe src="${fileUrl}" frameborder="0" allow="fullscreen" class="w-full h-full" />`;
      }
    }

    // Animação de entrada
    setTimeout(() => {
      const viewerEl = document.getElementById(`viewer-container-${documentoId}`);
      viewerEl?.classList.remove("opacity-0", "scale-95");
      viewerEl?.classList.add("opacity-100", "scale-100");
    }, 50);

    return () => {
      URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl, documentoId]);

  const handleClose = () => {
    const viewerElement = document.getElementById(`viewer-container-${documentoId}`);
    if (viewerElement) {
      viewerElement.classList.remove("opacity-100", "scale-100");
      viewerElement.classList.add("opacity-0", "scale-95");
      setTimeout(onClose, 300);
    } else {
      onClose();
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div 
        id={`viewer-container-${documentoId}`}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Documento #{documentoId}</h3>
                <div className="flex items-center text-sm text-white/80">
                  <span>Documento oficial</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a 
                href={fileUrl} 
                download={`documento-${documentoId}.pdf`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-sky-800 hover:bg-blue-50 shadow-sm gap-1.5"
              >
                Download
              </a>
              <button 
                onClick={handleClose}
                className="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-400 dark:from-gray-800 to-transparent z-10" />
          <div id={`iframe-container-${documentoId}`} className="w-full h-full" />
          
          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-green-500 mr-2">✓</span>
              <span>Documento fiscal • Válido para operações</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Doc: {documentoId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}