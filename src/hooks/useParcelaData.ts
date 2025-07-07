import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ParcelaData {
  dataVencimento?: string | Date;
  statusPagamento?: string;
  numNF?: string;
  status?: string;
  [key: string]: any;
}

interface UseParcelaDataReturn {
  parcelaData: ParcelaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache simples para evitar múltiplas chamadas para a mesma parcela
const parcelaCache = new Map<string, { data: ParcelaData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useParcelaData(
  parcelaId: string | number | null | undefined,
  boletoId: string | number | null | undefined,
  initialData?: ParcelaData | null
): UseParcelaDataReturn {
  const [parcelaData, setParcelaData] = useState<ParcelaData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParcelaData = useCallback(async () => {
    if (!parcelaId || !boletoId) return;

    const cacheKey = `${boletoId}-${parcelaId}`;
    
    // Verificar cache primeiro
    const cached = parcelaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setParcelaData(cached.data);
      return;
    }

    if (loading) return; // Evitar chamadas simultâneas

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token não encontrado");
        return;
      }

      const response = await axios.get(
        `/api/external/Parcelas/${boletoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;
      setParcelaData(data);
      
      // Salvar no cache
      parcelaCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('Erro ao buscar dados da parcela:', err);
      setError('Erro ao carregar dados da parcela');
    } finally {
      setLoading(false);
    }
  }, [parcelaId, boletoId, loading]);

  useEffect(() => {
    if (parcelaId && boletoId && !parcelaData && !loading) {
      fetchParcelaData();
    }
  }, [parcelaId, boletoId, fetchParcelaData, parcelaData, loading]);

  return {
    parcelaData,
    loading,
    error,
    refetch: fetchParcelaData
  };
}