// src/features/auth/types/auth.types.ts

export interface UserData {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  internalCode: number;
  name?: string; // Nome da empresa/usuário
  requiresPasswordReset?: boolean;
  isPasswordReset?: boolean;
}

export interface LoginFormProps {
  className?: string;
  onLoginSuccess: (userData: UserData) => void;
}

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export interface ApiResponse {
  data?: {
    token?: string;
    firstName?: string;
    lastName?: string;
    message?: string;
    error?: string; // Adicionado para compatibilidade com respostas de erro
    requiresPasswordReset?: boolean;
    user?: {
      internalCode: number;
      email: string;
      name: string;
      password?: string;
      isPasswordReset: boolean;
    };
  };
  status: number;
}

export interface ApiError extends Error {
  response?: {
    status: number;
    data?: any;
  };
  code?: string;
  config?: {
    headers?: Record<string, any>;
    [key: string]: any;
  };
}