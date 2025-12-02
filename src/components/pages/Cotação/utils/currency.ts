// utils/currency.ts
export const roundTo2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatCurrency = (value: number, currency: string = "R$"): string => {
  return `${currency} ${roundTo2(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatQuantity = (value: number): string => {
  const rounded = roundTo2(value);

  // Se for inteiro (ex: 1.00 → 1), mostra sem decimais
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }

  // Se tiver decimais, mostra apenas as necessárias (ex: 1.50 → 1.5)
  return rounded.toString().replace(/\.?0+$/, "");
};