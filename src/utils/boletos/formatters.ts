export const formatCNPJ = (cnpj: string) => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

export const formatCurrency = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) return "R$ 0,00";
  
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatDatePtBr = (dateStr: string | number | Date) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
};

export const parseDate = (str: string) => {
  if (!str) return new Date(0);
  
  // Aceita dd/MM/yyyy ou yyyy-MM-dd
  if (str.includes("/")) {
    const [day, month, year] = str.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  } else {
    const [year, month, day] = str.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
};