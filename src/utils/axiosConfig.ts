import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { toast } from "sonner";

// Create axios instance with timeout
const axiosInstance: AxiosInstance = axios.create({
  timeout: 30000, // 30 segundos timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Define error response interface
interface ErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

// Sistema de debounce para evitar múltiplos toasts
let lastAuthErrorTime = 0;
let isRedirecting = false;
const AUTH_ERROR_DEBOUNCE_TIME = 3000; // 3 segundos

// Função para verificar se deve mostrar o toast de auth error
const shouldShowAuthError = (): boolean => {
  const now = Date.now();
  if (now - lastAuthErrorTime < AUTH_ERROR_DEBOUNCE_TIME) {
    return false;
  }
  lastAuthErrorTime = now;
  return true;
};

// Função para verificar se é uma requisição de fallback
const isFallbackRequest = (error: AxiosError): boolean => {
  return !!error.config?.headers?.["X-Fallback-Request"];
};

// Função para verificar se é realmente um erro de autenticação
const isAuthenticationError = (error: AxiosError): boolean => {
  // Se não há response, não é erro de autenticação
  if (!error.response) return false;

  // 401 é sempre erro de autenticação
  if (error.response.status === 401) return true;

  // Para 403, precisa verificar se é realmente erro de sessão/token
  if (error.response.status === 403) {
    const errorData = error.response.data as ErrorResponse;

    // Verifica tanto 'message' quanto 'error' fields
    const errorMessage = errorData?.message || errorData?.error || "";

    // Se não tem mensagem, assumimos que é erro de permissão, não de sessão
    if (!errorMessage) return false;

    const message = errorMessage.toLowerCase();

    // Palavras-chave específicas que indicam problema de sessão/token
    const sessionKeywords = [
      "sessão expirada",
      "session expired",
      "token expirado",
      "token expired",
      "token inválido",
      "invalid token",
      "faça login novamente",
      "please login again",
      "não autenticado",
      "not authenticated",
      "unauthorized",
      "não autorizado",
    ];

    // Só considera erro de autenticação se encontrar palavras específicas de sessão
    return sessionKeywords.some((keyword) => message.includes(keyword));
  }

  return false;
};

// Função para limpar dados de autenticação
const clearAuthData = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("authData");
};

// Função para redirecionar para login
const redirectToLogin = (): void => {
  if (!isRedirecting) {
    isRedirecting = true;
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  }
};

// Função para obter mensagem de erro dos dados da resposta
const getErrorMessage = (errorData: ErrorResponse | undefined): string => {
  if (!errorData) return "";
  return errorData.message || errorData.error || "";
};

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError): Promise<never> => {
    // Evita processamento duplo
    if ((error as any).__processed) {
      console.log("Error already processed, skipping...");
      return Promise.reject(error);
    }
    (error as any).__processed = true;

    // Verifica se é uma requisição de fallback - se for, não mostra toast
    const shouldShowToast = !isFallbackRequest(error);

    // Log para debug - remover em produção
    console.log("Axios Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      code: error.code,
      message: error.message,
      isFallback: !shouldShowToast,
    });

    // Handle cases where there's no response (network errors, timeouts, etc.)
    if (!error.response) {
      if (shouldShowToast) {
        if (error.code === "ECONNABORTED") {
          // Timeout específico
          toast.error("Tempo esgotado", {
            description:
              "A operação demorou muito para responder. Tente novamente.",
            duration: 4000,
          });
        } else {
          // Erro de rede geral
          toast.error("Erro de conexão", {
            description:
              "Verifique sua conexão com a internet e tente novamente.",
            duration: 4000,
          });
        }
      }
      return Promise.reject(error);
    }

    // Handle authentication errors (401/403)
    if (error.response.status === 401 || error.response.status === 403) {
      if (isAuthenticationError(error)) {
        // Erro de sessão/token - redireciona para login
        // Sempre processa erros de autenticação, mesmo em fallback
        if (shouldShowAuthError()) {
          toast.error("Sessão expirada", {
            description: "Sua sessão expirou. Por favor, faça login novamente.",
            duration: 4000,
          });

          clearAuthData();
          redirectToLogin();
        }
      } else {
        // 403 de permissão ou outros erros - não redireciona
        if (shouldShowToast) {
          const errorData = error.response.data as ErrorResponse;
          const errorMessage = getErrorMessage(errorData);

          // Personaliza a mensagem baseada no tipo de erro
          let title = "Acesso negado";
          let description = "Você não tem permissão para acessar este recurso.";

          if (errorMessage) {
            // Se tem mensagem específica do servidor, usa ela
            description = errorMessage;

            // Ajusta o título baseado no conteúdo da mensagem
            const message = errorMessage.toLowerCase();
            if (
              message.includes("permissão") ||
              message.includes("permission")
            ) {
              title = "Sem permissão";
            } else if (
              message.includes("acesso") ||
              message.includes("access")
            ) {
              title = "Acesso restrito";
            } else if (
              message.includes("autorização") ||
              message.includes("authorization")
            ) {
              title = "Sem autorização";
            }
          }

          toast.error(title, {
            description,
            duration: 4000,
          });
        }
      }
    }
    // Handle server errors (5xx)
    else if (error.response.status >= 500) {
      const errorData = error.response.data as ErrorResponse;
      const errorMessage = getErrorMessage(errorData);

      // Só aplica a mensagem genérica se não tiver mensagem válida
      const hasValidErrorMessage =
        errorMessage &&
        typeof errorMessage === "string" &&
        errorMessage.trim() !== "";

      if (!hasValidErrorMessage) {
        // Verifica se é um erro de login baseado na URL da requisição
        const isLoginRequest =
          error.config?.url?.includes("/login") ||
          error.config?.url?.includes("/auth") ||
          error.config?.url?.includes("/signin");

        if (isLoginRequest) {
          error.response.data = {
            message: "E-mail ou senha inválidos, tente novamente.",
          } as ErrorResponse;
        } else {
          // Para outros endpoints, usa uma mensagem genérica de erro interno
          error.response.data = {
            message: "Erro interno do servidor. Tente novamente mais tarde.",
          } as ErrorResponse;
        }
      }
    }
    // Handle client errors (4xx) that aren't 401/403
    else if (error.response.status >= 400 && error.response.status < 500) {
      if (shouldShowToast) {
        const errorData = error.response.data as ErrorResponse;
        const errorMessage = getErrorMessage(errorData);

        // Para outros erros 4xx, mostra toast se necessário
        if (errorMessage) {
          toast.error("Erro na requisição", {
            description: errorMessage,
            duration: 4000,
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor para reset de flags quando necessário
axiosInstance.interceptors.request.use(
  (config) => {
    // Reset redirection flag on new requests (optional)
    // isRedirecting = false;

    // Adiciona token se existir
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
