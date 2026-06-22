// src/components/pdf-viewer/usePDFViewer.ts
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosConfig";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { createRoot } from "react-dom/client";
import { getAuthToken } from "@/components/pages/Inadimplentes/utils/pdf";
import { PDFViewerModal } from "@/components/pages/Inadimplentes/parcelas-atrasadas/pdf-viewer/PDFViewerModal";
import logo from "@/assets/logoBrowser.png";
import { apiBase } from "@/lib/api";

interface UsePDFViewerParams {
  companyCode: string;
  chaveNFe: string;
  notaId: string;
  filial: string | number;
  transportadora?: string;
  enabled: boolean;
}

export const usePDFViewer = () => {
  const navigate = useNavigate();

  const openViewer = async (params: UsePDFViewerParams) => {
    const { companyCode, chaveNFe, notaId, filial, transportadora, enabled } = params;
    
    if (!enabled) return;

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    // Loading
    const loadingId = `loading-pdf-${notaId}`;
    const loadingContainer = document.createElement("div");
    loadingContainer.id = loadingId;
    loadingContainer.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
    
    const loadingRoot = createRoot(loadingContainer);
    loadingRoot.render(
      <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
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
          <p className="text-white font-medium text-base sm:text-lg">Processando documento...</p>
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
    );
    document.body.appendChild(loadingContainer);

    try {
      // Carrega DANFE
      const danfeResponse = await axios.get(`${apiBase}/Danfe/gerar`, {
        params: { companyCode, chaveNF: chaveNFe },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        responseType: "blob",
      });

      // Tenta carregar canhoto (opcional)
      let canhotoUrl: string | null = null;
      try {
        const canhotoResponse = await axios.get(
          `${apiBase}/Danfe/canhoto-pdf/${encodeURIComponent(filial)}/${encodeURIComponent(notaId)}/${encodeURIComponent(chaveNFe)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/pdf",
            },
            responseType: "blob",
            timeout: 10000,
          }
        );
        const blob = new Blob([canhotoResponse.data], { type: "application/pdf" });
        canhotoUrl = URL.createObjectURL(blob);
      } catch {
        // Canhoto não disponível, continua sem ele
        canhotoUrl = null;
      }

      loadingRoot.unmount();
      document.body.removeChild(loadingContainer);

      const danfeBlob = new Blob([danfeResponse.data], { type: "application/pdf" });
      const danfeUrl = URL.createObjectURL(danfeBlob);

      // Render modal
      const modalContainer = document.createElement("div");
      modalContainer.id = `pdf-viewer-root-${notaId}`;
      document.body.appendChild(modalContainer);

      const root = createRoot(modalContainer);
      const closeModal = () => {
        root.unmount();
        document.body.removeChild(modalContainer);
        URL.revokeObjectURL(danfeUrl);
        if (canhotoUrl) URL.revokeObjectURL(canhotoUrl);
      };

      root.render(
        <PDFViewerModal
          danfeUrl={danfeUrl}
          canhotoUrl={canhotoUrl}
          notaId={notaId}
          onClose={closeModal}
          transportadora={transportadora}
          filial={filial}
          companyCode={companyCode}
          chaveNFe={chaveNFe}
        />
      );
    } catch (error) {
      loadingRoot.unmount();
      document.body.removeChild(loadingContainer);

      // Error modal
      const errorContainer = document.createElement("div");
      errorContainer.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
      const errorRoot = createRoot(errorContainer);

      errorRoot.render(
        <div className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-red-900/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500 sm:w-12 sm:h-12" />
          </motion.div>
          <div className="text-center max-w-md">
            <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Erro ao carregar documento</h4>
            <p className="text-sm text-gray-400 mb-4 sm:mb-6">Não foi possível carregar a Nota Fiscal.</p>
            <button
              onClick={() => {
                errorRoot.unmount();
                document.body.removeChild(errorContainer);
              }}
              className="bg-[#d4a820] hover:bg-[#b8941d] text-gray-900 rounded-xl px-4 sm:px-6 py-2 font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      );
      document.body.appendChild(errorContainer);
    }
  };

  return { openViewer };
};