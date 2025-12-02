import { useState, useEffect, useCallback, useRef } from "react";

interface UseNumberInputReturn {
  value: string;
  rawValue: string;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: number) => void;
}

export const useNumberInput = (
  initialValue: number = 0,
  decimals: number = 2
): UseNumberInputReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const lastExternalValue = useRef<number>(initialValue);

  // Formata número para exibição (com vírgula decimal)
  const formatNumber = useCallback((num: number): string => {
    return num.toFixed(decimals).replace(".", ",");
  }, [decimals]);

  // Atualiza valor quando initialValue muda externamente (mas não durante edição)
  useEffect(() => {
    if (!isEditing && initialValue !== lastExternalValue.current) {
      lastExternalValue.current = initialValue;
      setDisplayValue(formatNumber(initialValue));
    }
  }, [initialValue, isEditing, formatNumber]);

  // Inicialização
  useEffect(() => {
    setDisplayValue(formatNumber(initialValue));
  }, []);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
    // Remove formatação para facilitar edição
    const numericValue = displayValue.replace(",", ".");
    setEditingValue(numericValue);
  }, [displayValue]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    
    // Converte para número e formata
    const normalized = editingValue.replace(",", ".");
    const num = parseFloat(normalized);
    
    if (isNaN(num) || normalized === "") {
      // Se inválido, volta para 0
      setDisplayValue(formatNumber(0));
      lastExternalValue.current = 0;
    } else {
      // Formata o número válido
      setDisplayValue(formatNumber(num));
      lastExternalValue.current = num;
    }
  }, [editingValue, formatNumber]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Permite apenas números, vírgula, ponto e um sinal negativo no início
    value = value.replace(/[^\d.,-]/g, "");
    
    // Garante apenas um separador decimal
    const parts = value.split(/[.,]/);
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    
    // Garante apenas um sinal negativo no início
    const negativeCount = (value.match(/-/g) || []).length;
    if (negativeCount > 1) {
      value = "-" + value.replace(/-/g, "");
    } else if (value.includes("-") && !value.startsWith("-")) {
      value = value.replace("-", "");
    }
    
    // Limita casas decimais durante digitação
    const decimalParts = value.split(/[.,]/);
    if (decimalParts.length === 2 && decimalParts[1].length > decimals) {
      value = decimalParts[0] + "." + decimalParts[1].substring(0, decimals);
    }
    
    setEditingValue(value);
  }, [decimals]);

  const setValue = useCallback((value: number) => {
    lastExternalValue.current = value;
    setDisplayValue(formatNumber(value));
    if (isEditing) {
      setEditingValue(value.toString().replace(".", ","));
    }
  }, [formatNumber, isEditing]);

  return {
    value: isEditing ? editingValue : displayValue,
    rawValue: isEditing ? editingValue.replace(",", ".") : displayValue.replace(",", "."),
    onFocus: handleFocus,
    onBlur: handleBlur,
    onChange: handleChange,
    setValue,
  };
};