import { tokenStore } from "@/utils/tokenStore";
// src/utils/pdf.ts
export const getAuthToken = (): string | null => {
  return tokenStore.getToken();
};

export const normalizeFilial = (filial: string | number | undefined): string => {
  if (filial === undefined || filial === null) return "";
  return String(filial).trim();
};