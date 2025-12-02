// src/features/auth/utils/api.utils.ts

import axios from "@/utils/axiosConfig";
import { ApiResponse, ApiError } from "../types/auth.types";

/**
 * Faz uma chamada API com fallback para uma URL externa caso a interna falhe
 * Os erros só são exibidos quando ambas as tentativas falharem
 */
export const makeApiCallWithFallback = async (
  internalEndpoint: string,
  externalEndpoint: string,
  data: Record<string, any>,
  timeout: number = 20000
): Promise<ApiResponse> => {
  let internalError: ApiError | null = null;
  let externalError: ApiError | null = null;

  try {
    // Primeira tentativa: API interna
    // Adiciona flag para indicar que é parte de um fallback
    const response = await axios.post(internalEndpoint, data, {
      headers: { 
        "Content-Type": "application/json",
        "X-Fallback-Request": "true" // Flag para o interceptor não mostrar toast
      },
      timeout,
    });
    return response;
  } catch (error) {
    internalError = error as ApiError;
    
    try {
      // Segunda tentativa: API externa
      // Também adiciona a flag de fallback
      const response = await axios.post(externalEndpoint, data, {
        headers: { 
          "Content-Type": "application/json",
          "X-Fallback-Request": "true" // Flag para o interceptor não mostrar toast
        },
        timeout,
      });
      return response;
    } catch (error) {
      externalError = error as ApiError;
      
      // Ambas as tentativas falharam, agora precisamos decidir qual erro retornar
      const finalError = selectBestError(internalError, externalError);
      
      // Remove a flag de fallback para permitir que o toast seja mostrado
      if (finalError.config?.headers) {
        delete finalError.config.headers['X-Fallback-Request'];
      }
      
      throw finalError;
    }
  }
};

/**
 * Seleciona o melhor erro para mostrar ao usuário
 * Prioriza erros com mais informação ou mais específicos
 */
const selectBestError = (internalError: ApiError, externalError: ApiError): ApiError => {
  // Se um dos erros tem resposta do servidor e o outro não, prefere o que tem resposta
  if (internalError.response && !externalError.response) {
    return internalError;
  }
  if (externalError.response && !internalError.response) {
    return externalError;
  }
  
  // Se ambos têm resposta, prioriza por status
  if (internalError.response && externalError.response) {
    const internalStatus = internalError.response.status;
    const externalStatus = externalError.response.status;
    
    // Prioriza erros de autenticação/autorização (401, 403)
    if ([401, 403].includes(internalStatus) && ![401, 403].includes(externalStatus)) {
      return internalError;
    }
    if ([401, 403].includes(externalStatus) && ![401, 403].includes(internalStatus)) {
      return externalError;
    }
    
    // Prioriza erros de cliente (4xx) sobre erros de servidor (5xx)
    if (internalStatus >= 400 && internalStatus < 500 && externalStatus >= 500) {
      return internalError;
    }
    if (externalStatus >= 400 && externalStatus < 500 && internalStatus >= 500) {
      return externalError;
    }
    
    // Se ambos são do mesmo tipo, prefere o interno (primeiro tentado)
    return internalError;
  }
  
  // Se nenhum tem resposta, verifica o tipo de erro
  if (internalError.code === 'ECONNABORTED' && externalError.code !== 'ECONNABORTED') {
    return externalError; // Prefere erro de rede sobre timeout
  }
  if (externalError.code === 'ECONNABORTED' && internalError.code !== 'ECONNABORTED') {
    return internalError; // Prefere erro de rede sobre timeout
  }
  
  // Por padrão, retorna o erro interno (primeira tentativa)
  return internalError;
};

/**
 * Versão da função que sempre mostra erros (para casos específicos)
 */
export const makeApiCallWithFallbackShowErrors = async (
  internalEndpoint: string,
  externalEndpoint: string,
  data: Record<string, any>,
  timeout: number = 20000
): Promise<ApiResponse> => {
  try {
    const response = await axios.post(internalEndpoint, data, {
      headers: { "Content-Type": "application/json" },
      timeout,
    });
    return response;
  } catch (internalError) {
    const response = await axios.post(externalEndpoint, data, {
      headers: { "Content-Type": "application/json" },
      timeout,
    });
    return response;
  }
};