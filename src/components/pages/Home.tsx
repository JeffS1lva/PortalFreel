import type { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { DashboardAnalytics } from "./HomeDash/DashBoardAnalytics";
import { NavigationAndContacts } from "./HomeDash/NavigateAndContacts";
import LoadingExample from "./Loading/Loading";

interface TokenDecoded {
  exp: number;
  [key: string]: any;
}

// Utilities
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: TokenDecoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const getUserInternalCode = (): number => {
  try {
    const authData = localStorage.getItem("authData");
    return authData ? JSON.parse(authData).internalCode || 0 : 0;
  } catch {
    return 0;
  }
};

const calculateDiasAtraso = (dataVencimento: string): number => {
  try {
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    vencimento.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    return Math.max(
      0,
      Math.ceil((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
    );
  } catch {
    return 0;
  }
};

export function Init() {
  const [parcelasAtrasadas, setParcelasAtrasadas] = useState<ParcelaAtrasada[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Normalize API data
  const normalizeApiData = useCallback((rawData: any[]): ParcelaAtrasada[] => {
    const normalized = rawData
      .filter((item) => item && typeof item === "object")
      .map((item: any): ParcelaAtrasada => {
        const diasAtraso = calculateDiasAtraso(item.dataVencimento || "");
        return {
          codigoVendedor: Number(item.codigoVendedor) || 0,
          tipoDocumento: String(item.tipoDocumento || "NF"),
          idDocumento: String(item.id || item.idDocumento || ""),
          numeroDocumento: String(item.numNF || item.numeroDocumento || ""),
          dataEmissao: String(item.dataEmissao || new Date().toISOString()),
          dataVencimento: String(item.dataVencimento || ""),
          codigoParceiroNegocio: String(
            item.codigoPN || item.codigoParceiroNegocio || ""
          ),
          nomeParceiroNegocio: String(
            item.nomePN || item.nomeParceiroNegocio || ""
          ),
          valorTotal: Number(item.valorParcela || item.valorTotal || 0),
          saldoDevido: Number(
            item.valorParcela || item.saldoDevido || item.valorTotal || 0
          ),
          diasAtraso,
          chaveNFe: String(item.chaveNFe || ""),
          idRegistro: Number(item.id || item.idRegistro || 0),
          filial: String(item.filial || ""),
          internalCode: Number(item.internalCode || item.codigoVendedor || 0),
        };
      });

    return normalized;
  }, []);

  // Extract data from API response
  const extractApiData = useCallback((responseData: any): any[] => {
    if (Array.isArray(responseData)) return responseData;

    const possiblePaths = [
      "data",
      "parcelas",
      "value",
      "results",
      "items",
      "content",
    ];

    for (const path of possiblePaths) {
      if (Array.isArray(responseData[path])) return responseData[path];
    }

    // Find any array in response
    for (const key of Object.keys(responseData)) {
      if (Array.isArray(responseData[key])) return responseData[key];
    }

    return [];
  }, []);

  // Função para carregar dados da API
  const carregarDadosApi = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const slpCode = getUserInternalCode();
      if (!slpCode) {
        setError("Código do usuário não encontrado. Faça login novamente.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      const response = await axios.get("/api/external/Parcelas/atrasadas", {
        params: { slpCode },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      const rawData = extractApiData(response.data);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setParcelasAtrasadas([]);
        setError(null); // Não considerar como erro se não houver dados
        return;
      }

      const normalizedData = normalizeApiData(rawData);
      setParcelasAtrasadas(normalizedData);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        switch (status) {
          case 401:
            localStorage.clear();
            navigate("/login");
            break;
          case 500:
            setError("Erro interno no servidor. Tente novamente mais tarde.");
            break;
          case 403:
            setError("Acesso negado. Verifique suas permissões.");
            break;
          case 404:
            setError("Endpoint não encontrado. Verifique a URL da API.");
            break;
          default:
            if (err.code === "ECONNABORTED") {
              setError("Timeout na requisição. Tente novamente.");
            } else {
              setError(`Erro na API: ${status || "Desconhecido"}`);
            }
        }
      } else {
        setError("Erro de conexão. Verifique sua internet.");
      }

      setParcelasAtrasadas([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, extractApiData, normalizeApiData]);

  // Carrega dados da API na inicialização
  useEffect(() => {
    carregarDadosApi();
  }, [carregarDadosApi]);

  const handleRetry = useCallback(() => {
    carregarDadosApi();
  }, [carregarDadosApi]);

  if (loading) {
    return <LoadingExample message="Carregando Dashboard..." />;
  }

  if (error) {
    return (
      <div className="w-full px-3 md:px-6 lg:px-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg text-red-600 dark:text-red-400 text-center px-4">
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-6 lg:px-8 max-w-screen-2xl mx-auto">
      <DashboardAnalytics parcelas={parcelasAtrasadas} />
      <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />
      <NavigationAndContacts />
    </div>
  );
}
