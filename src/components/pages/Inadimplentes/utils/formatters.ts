// src/utils/formatters.ts
export const formatDate = (dateString: string): string => {
  if (!dateString) return "Data inválida";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Data inválida";
  }
};

export const formatCurrency = (value: number): string => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return "R$ 0,00";
  }
};

export const isOverdue = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return date < new Date();
  } catch {
    return false;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};