import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

interface UseDanfeOptions {
  notaId: string;
}

interface DanfeState {
  isLoading: boolean;
  error: string | null;
  pdfUrl: string | null;
}

export const useDanfe = ({ }: UseDanfeOptions) => {
  const navigate = useNavigate();
  const [state, setState] = useState<DanfeState>({
    isLoading: false,
    error: null,
    pdfUrl: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setPdfUrl = useCallback((pdfUrl: string | null) => {
    setState((prev) => ({ ...prev, pdfUrl }));
  }, []);

  const clearError = useCallback(() => setError(null), [setError]);
  const clearPdf = useCallback(() => {
    if (state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl);
    }
    setPdfUrl(null);
  }, [state.pdfUrl, setPdfUrl]);

  const fetchDanfe = useCallback(
    async (companyCode: string, chaveNFe: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = tokenStore.getToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${apiBase}/Danfe/gerar`, {
          params: { companyCode, chaveNF: chaveNFe },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          responseType: "blob",
          timeout: 30000,
        });

        const contentType = response.headers["content-type"];
        if (!contentType?.includes("application/pdf")) {
          throw new Error("Resposta não é um PDF válido");
        }

        const blob = new Blob([response.data], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(blob);

        setPdfUrl(fileUrl);
      } catch (error) {
        let message =
          "Estamos com dificuldades para acessar este documento no momento.";

        if (isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            message = "Tempo limite esgotado. Tente novamente.";
          } else if (error.response?.status === 401) {
            navigate("/login");
            return;
          } else if (error.response?.status === 404) {
            message = "Documento não encontrado.";
          }
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [navigate, setLoading, setError, setPdfUrl]
  );

  return {
    ...state,
    fetchDanfe,
    clearError,
    clearPdf,
  };
};