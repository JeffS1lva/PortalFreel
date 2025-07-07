// src/features/auth/utils/error.utils.ts

import { toast } from 'sonner';
import { ApiError } from "../types/auth.types";

/**
 * Extrai mensagem de erro da resposta da API
 */
const extractErrorMessage = (errorData: any): string => {
  if (!errorData || typeof errorData !== 'object') return '';
  
  // Prioriza 'error' depois 'message'
  return errorData.error || errorData.message || '';
};

/**
 * Processa erros de API e retorna mensagens amigáveis
 */
export const handleApiError = (error: ApiError, showToast: boolean = true): string => {
  let errorMessage = '';
  
  // Casos onde não há resposta do servidor (rede, timeout, etc.)
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      errorMessage = "E-mail ou senha inválidos, tente novamente.";
    } else if (error.message.includes("Network Error")) {
      errorMessage = "Servidor indisponível. Verifique sua conexão.";
    } else {
      errorMessage = "Falha ao processar sua solicitação. Por favor, tente novamente.";
    }
    
    if (showToast) {
      toast.error("Erro de conexão", {
        description: errorMessage,
        duration: 4000
      });
    }
    
    return errorMessage;
  }

  // Casos com resposta do servidor
  const status = error.response.status;
  const responseData = error.response.data;
  const serverMessage = extractErrorMessage(responseData);

  switch (status) {
    case 400:
      errorMessage = serverMessage || "Dados inválidos. Verifique as informações e tente novamente.";
      break;
      
    case 401:
      // 401 já foi tratado pelo interceptor (logout automático)
      errorMessage = "Sessão expirada. Redirecionando para login...";
      break;
      
    case 403:
      if (serverMessage) {
        const message = serverMessage.toLowerCase();
        if (message.includes("sem autorização") || message.includes("não autorizado")) {
          errorMessage = "Sem autorização para acessar o portal.";
        } else if (message.includes("bloqueado")) {
          errorMessage = "Usuário bloqueado. Entre em contato com o suporte.";
        } else {
          errorMessage = serverMessage;
        }
      } else {
        errorMessage = "Acesso não autorizado. Verifique suas permissões.";
      }
      break;
      
    case 404:
      errorMessage = "E-mail não encontrado no sistema.";
      break;
      
    case 409:
      errorMessage = serverMessage || "Conflito nos dados. Verifique as informações.";
      break;
      
    case 429:
      errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      break;
      
    case 500:
    case 502:
    case 503:
    case 504:
      // Para erros de servidor, usa mensagem específica se disponível
      if (serverMessage) {
        errorMessage = serverMessage;
      } else {
        errorMessage = "E-mail ou senha inválidos, tente novamente.";
      }
      break;
      
    default:
      errorMessage = serverMessage || `Erro ${status}. Tente novamente.`;
  }

  // Mostra toast apenas se solicitado e não for 401 (já tratado pelo interceptor)
  if (showToast && status !== 401) {
    let toastTitle = "Erro";
    
    if (status === 403) toastTitle = "Acesso negado";
    else if (status === 404) toastTitle = "Não encontrado";
    else if (status === 429) toastTitle = "Muitas tentativas";
    else if (status >= 500) toastTitle = "Erro do servidor";
    
    toast.error(toastTitle, {
      description: errorMessage,
      duration: 4000
    });
  }

  return errorMessage;
};

/**
 * Processa erros específicos de primeiro acesso
 */
export const handleFirstAccessError = (error: ApiError, showToast: boolean = true): string => {
  let errorMessage = '';
  
  // Casos onde não há resposta do servidor
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      errorMessage = "Seu e-mail não foi encontrado no sistema, verifique se digitou corretamente e tente novamente.";
    } else if (error.message.includes("Network Error")) {
      errorMessage = "Servidor indisponível. Verifique sua conexão e tente novamente mais tarde.";
    } else {
      errorMessage = "Não foi possível processar sua solicitação de primeiro acesso. Por favor, tente novamente.";
    }
    
    if (showToast) {
      toast.error("Erro de conexão", {
        description: errorMessage,
        duration: 4000
      });
    }
    
    return errorMessage;
  }

  // Casos com resposta do servidor
  const status = error.response.status;
  const responseData = error.response.data;
  const serverMessage = extractErrorMessage(responseData);

  switch (status) {
    case 400:
      errorMessage = serverMessage || "Dados inválidos. Verifique o e-mail e tente novamente.";
      break;
      
    case 403:
      errorMessage = serverMessage || "Acesso não autorizado para realizar primeiro acesso.";
      break;
      
    case 404:
      errorMessage = "E-mail não encontrado no sistema. Verifique se digitou corretamente.";
      break;
      
    case 409:
      errorMessage = "Este e-mail já possui acesso. Por favor, use a opção 'Esqueceu sua senha?' se necessário.";
      break;
      
    case 429:
      errorMessage = "Muitas solicitações. Por favor, aguarde alguns minutos antes de tentar novamente.";
      break;
      
    case 500:
    case 502:
    case 503:
    case 504:
      errorMessage = "Erro interno ao processar sua solicitação de primeiro acesso. Por favor, tente novamente mais tarde.";
      break;
      
    default:
      errorMessage = serverMessage || "Não foi possível processar sua solicitação. Tente novamente.";
  }

  if (showToast) {
    let toastTitle = "Erro no primeiro acesso";
    
    if (status === 404) toastTitle = "E-mail não encontrado";
    else if (status === 409) toastTitle = "E-mail já cadastrado";
    else if (status === 429) toastTitle = "Muitas solicitações";
    else if (status >= 500) toastTitle = "Erro do servidor";
    
    toast.error(toastTitle, {
      description: errorMessage,
      duration: 4000
    });
  }

  return errorMessage;
};

/**
 * Verifica se o erro requer exibição do modal de timeout
 */
export const isErrorRequiringModal = (error: ApiError): boolean => {
  return (
    error.code === "ECONNABORTED" ||
    error.message.includes("timeout") ||
    error.message.includes("Network Error") ||
    !!(error.response && error.response.status >= 500)
  );
};

/**
 * Versão silenciosa do handleApiError (sem toast)
 */
export const getApiErrorMessage = (error: ApiError): string => {
  return handleApiError(error, false);
};

/**
 * Versão silenciosa do handleFirstAccessError (sem toast)  
 */
export const getFirstAccessErrorMessage = (error: ApiError): string => {
  return handleFirstAccessError(error, false);
};