import axios from "@/utils/axiosConfig";
import { ApiResponse } from "../types/auth.types";
import { apiBase } from "@/lib/api";

export const makeApiCallWithFallback = async (
  endpoint: string,
  data: Record<string, any>,
  timeout: number = 20000
): Promise<ApiResponse> => {
  const response = await axios.post(`${apiBase}${endpoint}`, data, {
    headers: { "Content-Type": "application/json" },
    timeout,
  });
  return response;
};
