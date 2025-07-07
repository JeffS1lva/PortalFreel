// src/features/auth/utils/validation.utils.ts

/**
 * Valida um endereço de email
 * @param email Email a ser validado
 * @returns true se o email for válido, false caso contrário
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};