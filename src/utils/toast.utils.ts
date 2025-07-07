// src/utils/toast.utils.ts

import { toast } from "sonner";

/**
 * Exibe um toast de erro
 */
export const showErrorToast = (title: string, description: string): void => {
  toast.error(title, {
    description,
    style: {
      backgroundColor: "white",
      color: "red",
      boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
    },
  });
};

/**
 * Exibe um toast de sucesso
 */
export const showSuccessToast = (title: string, description: string): void => {
  toast.success(title, {
    description,
    style: {
      backgroundColor: "white",
      color: "green",
      boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
    },
  });
};