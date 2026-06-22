"use client";

import React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, InputCotacao } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrashIcon,
  CalculatorIcon,
  PackageCheck,
  PackageOpen,
  Search,
  Plus,
  Trash2,
  Eye,
  Edit3,
  X,
  CircleDollarSign,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import axios from "@/utils/axiosConfig";
import type {
  Quotation,
  DocumentLine,
  QuickSuggestion,
} from "@/components/pages/Cotação/type";
import {
  roundTo2,
  formatCurrency,
  formatQuantity,
} from "@/components/pages/Cotação/utils/currency";
import { useNumberInput } from "@/components/pages/Cotação/utils/useNumberInput";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";

export interface ExtendedDocumentLine extends DocumentLine {
  itemCode: string;
  itemName: string;
  listCode: number;
  nomeLista?: string;
  moeda?: string;
  unMedida?: string;
  unidade?: string;
  id?: number;
  UoMCode: string;
  UoMEntry: number;
  Usage: number;
  preco: number;
}

interface PriceItem {
  DiscountPercent: number | undefined;
  itemCode: string;
  itemName: string;
  listCode: number;
  nomeLista: string;
  moeda: string;
  preco: number;
  idUn: number;
  unMedida: string;
  unidade: string;
  id: number;
  UoMCode?: string;
  UoMEntry?: number;
  Usage?: number;
}

// Interface para produtos agrupados por código
interface GroupedProduct {
  itemCode: string;
  itemName: string;
  nomeLista: string;
  options: PriceItem[];
  defaultOption: PriceItem;
}

interface ItemsProps {
  quotation: Quotation;
  updateDocumentLine: (index: number, field: string, value: any) => void;
  addDocumentLine: (data?: Partial<ExtendedDocumentLine>) => void;
  removeDocumentLine: (index: number) => void;
  stepRef: (el: HTMLDivElement | null) => void;
}

interface NumberInputProps {
  value: number;
  onUpdate: (value: number) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  docCurrency?: string;
  formatMode?: "currency" | "quantity";
}

const calculateItemTotal = (line: Partial<ExtendedDocumentLine>): number => {
  const quantity = line.Quantity ?? 0;
  const unitPrice = line.preco ?? 0;
  const discountPercent = line.DiscountPercent ?? 0;
  return roundTo2(quantity * unitPrice * (1 - discountPercent / 100));
};

type SortField = "name" | "price" | "code";
type SortDirection = "asc" | "desc";

const extractUnitMeasure = (product: PriceItem): string => {
  const unMedida = product.unMedida;
  const uomCode = product.UoMCode;
  const unidade = product.unidade;

  if (unMedida) {
    const lower = unMedida.toLowerCase();
    const match = lower.match(/c\/(\d+)/);
    if (match) return `c/${match[1]}`;
    if (lower.includes("caixa")) return "CX";
    if (lower.includes("pacote") || lower.includes("pct")) return "PT";
    if (lower.includes("unidade")) return "UN";
  }

  if (uomCode && uomCode !== "UN") return uomCode;
  if (unidade && unidade !== "UN") return unidade;

  return unMedida || uomCode || unidade || "UN";
};

// Função utilitária para agrupar produtos por itemCode
const groupProductsByCode = (products: PriceItem[]): GroupedProduct[] => {
  const grouped = products.reduce(
    (acc, item) => {
      if (!acc[item.itemCode]) {
        acc[item.itemCode] = {
          itemCode: item.itemCode,
          itemName: item.itemName,
          nomeLista: item.nomeLista,
          options: [],
          defaultOption: item,
        };
      }
      acc[item.itemCode].options.push(item);
      return acc;
    },
    {} as Record<string, GroupedProduct>,
  );

  // Para cada grupo, ordena opções por preço e define a padrão
  const result = Object.values(grouped);
  result.forEach((group) => {
    group.options.sort((a, b) => (a.preco || 0) - (b.preco || 0));
    group.defaultOption = group.options[0];
  });

  return result;
};

// Componente de Paginação
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Info de itens */}
      <div className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-semibold text-foreground">{startItem}</span> até{" "}
        <span className="font-semibold text-foreground">{endItem}</span> de{" "}
        <span className="font-semibold text-foreground">{totalItems}</span>{" "}
        itens
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center gap-2">
        {/* Botão Primeira Página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Botão Anterior */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 ${currentPage === page ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Botão Próximo */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Botão Última Página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Seletor de itens por página */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Itens por página:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export function Items({
  quotation,
  updateDocumentLine: propsUpdateDocumentLine,
  addDocumentLine,
  removeDocumentLine,
  stepRef,
}: ItemsProps) {
  const [viewingItemIndex, setViewingItemIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempEditData, setTempEditData] = useState<
    Partial<ExtendedDocumentLine>
  >({});

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Accordion de cotação (expansível na parte inferior)
  const [isCartExpanded, setIsCartExpanded] = useState(true);

  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<ExtendedDocumentLine>>(
    {},
  );
  const [searchResults, setSearchResults] = useState<PriceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<PriceItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Estado para controlar qual UoM está selecionada em cada linha agrupada
  const [selectedUoM, setSelectedUoM] = useState<Record<string, PriceItem>>({});

  const quickSuggestions: QuickSuggestion[] = [
    { name: "Avental", icon: "shield", color: "from-green-400 to-emerald-600" },
    { name: "Compressa", icon: "package", color: "from-blue-400 to-cyan-600" },
    { name: "Lencol", icon: "bed", color: "from-purple-400 to-indigo-600" },
    { name: "Seringa", icon: "syringe", color: "from-red-400 to-pink-600" },
    { name: "Luva", icon: "hand", color: "from-yellow-400 to-orange-600" },
    {
      name: "Mascara",
      icon: "shield-check",
      color: "from-teal-400 to-green-600",
    },
  ];

  const syncUpdateDocumentLine = useCallback(
    (index: number, field: string, value: any) => {
      const safeValue =
        value != null ? value : typeof value === "number" ? 0 : "";
      const rounded =
        typeof safeValue === "number" ? roundTo2(safeValue) : safeValue;

      if (field === "ItemCode" || field === "itemCode") {
        propsUpdateDocumentLine(index, "ItemCode", rounded);
        propsUpdateDocumentLine(index, "itemCode", rounded);
      } else if (field === "U_SKILL_NP" || field === "itemName") {
        propsUpdateDocumentLine(index, "U_SKILL_NP", safeValue);
        propsUpdateDocumentLine(index, "itemName", safeValue);
      } else {
        propsUpdateDocumentLine(index, field, rounded);
      }
    },
    [propsUpdateDocumentLine],
  );

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const token = tokenStore.getToken();
        if (!token) throw new Error("No token found");

        const response = await axios.get(`${apiBase}/ListaPrecos`, {
          params: { VFiltro: "", VLista: quotation.PriceListNum || "" },
          headers: { Authorization: `Bearer ${token}` },
        });

        const products = response.data || [];
        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching all products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchAllProducts();
  }, [quotation.PriceListNum]);

  const fetchPriceList = async (filtro: string) => {
    try {
      setIsSearching(true);
      setSearchResults([]);

      if (!filtro.trim()) {
        return;
      }

      const token = tokenStore.getToken();
      if (!token) throw new Error("No token found");

      const response = await axios.get(`${apiBase}/ListaPrecos`, {
        params: { VFiltro: filtro, VLista: quotation.PriceListNum || "" },
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredData: PriceItem[] = response.data;
      setSearchResults(filteredData);
      // Reset para primeira página quando buscar
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching price list:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Agrupa todos os produtos por código
  const groupedAllProducts = useMemo(() => {
    return groupProductsByCode(allProducts);
  }, [allProducts]);

  // Agrupa os resultados da busca por código
  const groupedSearchResults = useMemo(() => {
    if (!searchTerm.trim() || searchResults.length === 0) return [];
    return groupProductsByCode(searchResults);
  }, [searchResults, searchTerm]);

  // Produtos a serem exibidos na tabela (busca ou todos)
  const displayedProducts = useMemo(() => {
    // Se estiver buscando e tiver resultados, mostra os resultados da busca
    if (searchTerm.trim() && groupedSearchResults.length > 0) {
      return groupedSearchResults;
    }
    // Se estiver buscando mas não tiver resultados, retorna array vazio
    if (searchTerm.trim() && groupedSearchResults.length === 0) {
      return [];
    }
    // Senão, mostra todos os produtos
    return groupedAllProducts;
  }, [groupedAllProducts, groupedSearchResults, searchTerm]);

  // Produtos ordenados para exibição
  const sortedDisplayedProducts = useMemo(() => {
    const products = [...displayedProducts];

    products.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.itemName || "").localeCompare(b.itemName || "");
          break;
        case "price":
          comparison =
            (a.defaultOption.preco || 0) - (b.defaultOption.preco || 0);
          break;
        case "code":
          comparison = (a.itemCode || "").localeCompare(b.itemCode || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return products;
  }, [displayedProducts, sortField, sortDirection]);

  // Paginação dos produtos
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedDisplayedProducts.slice(startIndex, endIndex);
  }, [sortedDisplayedProducts, currentPage, itemsPerPage]);

  // Total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(sortedDisplayedProducts.length / itemsPerPage);
  }, [sortedDisplayedProducts.length, itemsPerPage]);

  // Reset para página 1 quando mudar busca, ordenação ou itens por página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection, itemsPerPage]);

  // Função para selecionar UoM específica
  const handleUoMChange = (itemCode: string, option: PriceItem) => {
    setSelectedUoM((prev) => ({
      ...prev,
      [itemCode]: option,
    }));
  };

  // Função para obter a UoM selecionada ou a padrão
  const getSelectedOption = (group: GroupedProduct): PriceItem => {
    return selectedUoM[group.itemCode] || group.defaultOption;
  };

  const selectItemFromSearch = useCallback(
    (item: PriceItem) => {
      const bplId = quotation.BPL_IDAssignedToInvoice || 1;
      const correctUsage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40;

      const preco = roundTo2(item.preco ?? 0);
      const unidade = item.UoMCode || item.unidade || item.unMedida || "UN";
      const unMedida = item.unMedida || "Caixa c/20";

      const newData: Partial<ExtendedDocumentLine> = {
        ItemCode: item.itemCode ?? "",
        MeasureUnit: unMedida,
        Quantity: 1,
        DiscountPercent: item.DiscountPercent,
        ShipDate: "",
        itemCode: item.itemCode ?? "",
        itemName: item.itemName ?? "",
        listCode: item.listCode,
        nomeLista: item.nomeLista ?? "",
        moeda: item.moeda ?? "R$",
        idUn: item.idUn,
        unMedida: unMedida,
        unidade: unidade,
        id: item.id,
        UoMCode: item.UoMCode,
        UoMEntry: item.UoMEntry ?? 0,
        Usage: correctUsage,
        preco: preco,
      };

      setNewItemData(newData);
      setSearchResults([]);
      setSearchTerm("");
      setIsAddingNewItem(true);
    },
    [quotation.BPL_IDAssignedToInvoice],
  );

  const handleQuickSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    fetchPriceList(suggestion);
  };

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => fetchPriceList(searchTerm), 300);
      return () => clearTimeout(timeoutId);
    } else if (!searchTerm.trim()) {
      setSearchResults([]);
    }
  }, [searchTerm, quotation.PriceListNum]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const updateNewItemData = (field: string, value: any) => {
    const safeValue =
      value != null ? value : typeof value === "number" ? 0 : "";
    const rounded =
      typeof safeValue === "number" ? roundTo2(safeValue) : safeValue;
    setNewItemData((prev) => ({ ...prev, [field]: rounded }));
  };

  const handleAddNewItem = () => {
    const bplId = quotation.BPL_IDAssignedToInvoice || 1;
    const correctUsage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40;

    const preco = roundTo2(newItemData.preco ?? 0);

    const finalData: Partial<ExtendedDocumentLine> = {
      ...newItemData,
      ItemCode: newItemData.itemCode ?? newItemData.ItemCode ?? "",
      itemCode: newItemData.itemCode ?? newItemData.ItemCode ?? "",
      itemName: newItemData.itemName ?? "",
      Quantity: roundTo2(newItemData.Quantity ?? 0),
      DiscountPercent: roundTo2(newItemData.DiscountPercent ?? 0),
      MeasureUnit: newItemData.unMedida ?? "Caixa c/20",
      moeda: newItemData.moeda ?? "R$",
      unMedida: newItemData.unMedida ?? "Caixa c/20",
      unidade: newItemData.UoMCode || newItemData.unidade || "UN",
      listCode: newItemData.listCode,
      nomeLista: newItemData.nomeLista ?? "",
      idUn: newItemData.idUn,
      id: newItemData.id,
      UoMCode: newItemData.UoMCode,
      UoMEntry: newItemData.UoMEntry ?? 0,
      Usage: correctUsage,
      preco: preco,
    };

    addDocumentLine(finalData);
    setIsAddingNewItem(false);
    setNewItemData({});
    setSearchTerm("");
    setSearchResults([]);

    // Expandir o accordion automaticamente ao adicionar item
    setIsCartExpanded(true);
  };

  const handleCancelNewItem = () => {
    setIsAddingNewItem(false);
    setNewItemData({});
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleViewItem = (index: number) => {
    setViewingItemIndex(index);
    setEditingItemIndex(null);
  };

  const handleEditItem = (index: number) => {
    const line = documentLines[index];
    setTempEditData({ ...line });
    setEditingItemIndex(index);
    setViewingItemIndex(null);
  };

  const handleCloseView = () => {
    setViewingItemIndex(null);
    setEditingItemIndex(null);
    setTempEditData({});
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const documentLines = quotation.DocumentLines as ExtendedDocumentLine[];

  const cartTotal = useMemo(() => {
    return documentLines.reduce(
      (sum, line) => sum + calculateItemTotal(line),
      0,
    );
  }, [documentLines]);

  const NumberInput = ({
    value,
    onUpdate,
    label,
    placeholder = "0,00",
    disabled = false,
    readOnly = false,
    docCurrency = "R$",
    formatMode = "currency",
  }: NumberInputProps) => {
    const input = useNumberInput(value, 2);

    const getDisplayValue = (val: number): string => {
      if (formatMode === "quantity") {
        return formatQuantity(val);
      }
      return formatCurrency(val, docCurrency);
    };

    if (readOnly) {
      return (
        <div className="space-y-3 group">
          <Label className="text-sm font-bold">{label}</Label>
          <Input
            type="text"
            value={getDisplayValue(value)}
            readOnly
            className="h-14 border-2 bg-primary/5 text-lg cursor-not-allowed"
            placeholder={placeholder}
            aria-label={label}
            aria-readonly="true"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 group">
        <Label htmlFor={`input-${label}`} className="text-sm font-bold">
          {label}
        </Label>
        <Input
          id={`input-${label}`}
          type="text"
          inputMode="decimal"
          value={input.value}
          onFocus={input.onFocus}
          onBlur={() => {
            input.onBlur();
            onUpdate(Number.parseFloat(input.rawValue) || 0);
          }}
          onChange={input.onChange}
          className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50"
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          aria-describedby={`${label}-description`}
        />
      </div>
    );
  };

  const newItemTotal = calculateItemTotal(newItemData);

  const SortHeader = ({
    field,
    label,
    className = "",
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {label}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        ))}
      {sortField !== field && <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  );

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      className="animate-bounce-in focus:outline-none py-5 w-full"
      role="region"
      aria-label="Itens da cotação"
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {/* SEÇÃO 1: BUSCA PRINCIPAL */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative flex items-center bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="pl-6 pr-4 py-4 bg-primary/5 border-r border-border">
                <Search className="h-6 w-6 text-primary" />
              </div>

              <InputCotacao
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Busque por nome, código ou descrição do produto..."
                className="flex-1 border-0 text-lg h-14 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground/60 px-4"
                aria-label="Buscar produtos"
              />

              <div className="pr-4 flex items-center gap-2">
                {isSearching && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
                )}
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* SEÇÃO 2: BUSCAS POPULARES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-between "
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Buscas populares:
            </span>

            {quickSuggestions.map((suggestion) => {
              return (
                <button
                  key={suggestion.name}
                  onClick={() => handleQuickSuggestion(suggestion.name)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-muted to-muted/50 hover:from-primary/10 hover:to-accent/10 border border-border/50 hover:border-primary/30 transition-all duration-300 text-sm font-medium"
                >
                  <div
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${suggestion.color}`}
                  />
                  {suggestion.name}
                </button>
              );
            })}
          </div>

          <motion.button
            onClick={() => window.open("/Catalogo.pdf", "_blank")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary via-primary/90 to-accent text-white font-semibold text-smshadow-lg shadow-primary/20 border border-white/10 overflow-hidden transition-all duration-300 cursor-pointer"
          >
            {/* Glow animado */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/10 via-white/20 to-white/10 blur-xl" />

            {/* Ícone */}
            <motion.span
              className="flex items-center"
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Eye size={18} />
            </motion.span>

            <span className="relative">Visualizar Catálogo</span>
          </motion.button>
        </motion.div>

        {/* SEÇÃO 4: TABELA DE PRODUTOS AGRUPADOS POR CÓDIGO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              {searchTerm.trim()
                ? `Resultados da busca "${searchTerm}"`
                : "Produtos Disponíveis"}
            </h3>

            <div className="flex items-center gap-2">
              {isLoadingProducts && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Carregando...
                </div>
              )}
              {searchTerm.trim() && (
                <span className="text-sm text-muted-foreground">
                  {sortedDisplayedProducts.length} resultado(s)
                </span>
              )}
            </div>
          </div>

          {/* CABEÇALHO */}
          <div
            className="hidden md:grid bg-muted/50 rounded-lg px-4 py-3 text-xs font-semibold text-muted-foreground border border-border/50"
            style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 120px" }}
          >
            <SortHeader field="name" label="Produto" />
            <SortHeader field="code" label="Código" />
            <span className="flex items-center gap-1">Unidade de Medida</span>
            <SortHeader field="price" label="Preço" className="justify-end" />
            <span className="text-right">Ação</span>
          </div>

          {/* LISTA DE PRODUTOS AGRUPADOS */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {paginatedProducts.map((group, idx) => {
                const selectedOption = getSelectedOption(group);
                const hasDiscount =
                  selectedOption.DiscountPercent &&
                  selectedOption.DiscountPercent > 0;

                return (
                  <motion.div
                    key={group.itemCode}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group bg-card border border-border hover:border-primary/50 rounded-lg transition-all duration-200 hover:shadow-md"
                  >
                    {/* Layout Desktop */}
                    <div
                      className="hidden md:grid items-center gap-4 px-4 py-3"
                      style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 120px" }}
                    >
                      {/* Coluna Produto */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {group.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {group.nomeLista}
                        </p>
                        {group.options.length > 1 && (
                          <p className="text-xs text-primary/70 mt-1">
                            {group.options.length} unidades disponíveis
                          </p>
                        )}
                      </div>

                      {/* Coluna Código */}
                      <div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {group.itemCode}
                        </p>
                      </div>

                      {/* Coluna Unidade de Medida - SELECT DO SHADCN */}
                      <div className="relative">
                        {group.options.length > 1 ? (
                          <div className="space-y-1">
                            <Select
                              value={selectedOption.id.toString()}
                              onValueChange={(value) => {
                                const option = group.options.find(
                                  (opt) => opt.id.toString() === value,
                                );
                                if (option)
                                  handleUoMChange(group.itemCode, option);
                              }}
                            >
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {group.options.map((opt) => (
                                  <SelectItem
                                    key={opt.id}
                                    value={opt.id.toString()}
                                  >
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <span>{extractUnitMeasure(opt)}</span>
                                      <span className="text-zinc-800 text-xs">
                                        {formatCurrency(opt.preco, opt.moeda)}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p
                              className="text-xs text-muted-foreground truncate"
                              title={selectedOption.unMedida}
                            >
                              {selectedOption.unMedida}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded w-fit">
                              {extractUnitMeasure(group.defaultOption)}
                            </p>
                            <p
                              className="text-xs text-muted-foreground/70 truncate"
                              title={group.defaultOption.unMedida}
                            >
                              {group.defaultOption.unMedida}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Coluna Preço */}
                      <div className="text-right">
                        <p className="font-bold text-primary text-base">
                          {formatCurrency(
                            selectedOption.preco,
                            selectedOption.moeda,
                          )}
                        </p>
                        {hasDiscount && (
                          <p className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                            <Tag className="h-3 w-3" />
                            {selectedOption.DiscountPercent}% OFF
                          </p>
                        )}
                      </div>

                      {/* Coluna Ação */}
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 shadow-sm"
                          onClick={() => selectItemFromSearch(selectedOption)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* Layout Mobile */}
                    <div className="md:hidden p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-card-foreground line-clamp-2">
                            {group.itemName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                              {group.itemCode}
                            </span>
                            {group.options.length > 1 && (
                              <span className="text-primary">
                                ({group.options.length} UoMs)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary text-base">
                            {formatCurrency(
                              selectedOption.preco,
                              selectedOption.moeda,
                            )}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-green-600 font-medium">
                              -{selectedOption.DiscountPercent}%
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dropdown no mobile - SELECT DO SHADCN */}
                      {group.options.length > 1 && (
                        <div className="mb-3">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Unidade de Medida:
                          </label>
                          <Select
                            value={selectedOption.id.toString()}
                            onValueChange={(value) => {
                              const option = group.options.find(
                                (opt) => opt.id.toString() === value,
                              );
                              if (option)
                                handleUoMChange(group.itemCode, option);
                            }}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.options.map((opt) => (
                                <SelectItem
                                  key={opt.id}
                                  value={opt.id.toString()}
                                >
                                  <div className="flex flex-col">
                                    <span>
                                      {extractUnitMeasure(opt)} - {opt.unMedida}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {formatCurrency(opt.preco, opt.moeda)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => selectItemFromSearch(selectedOption)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar à Cotação
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {paginatedProducts.length === 0 && !isLoadingProducts && (
              <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <PackageOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">
                  {searchTerm.trim()
                    ? "Nenhum produto encontrado para esta busca"
                    : "Nenhum produto disponível"}
                </p>
                <p className="text-sm mt-1">
                  {searchTerm.trim()
                    ? "Tente ajustar sua busca"
                    : "Aguarde o carregamento dos produtos"}
                </p>
              </div>
            )}
          </div>

          {/* COMPONENTE DE PAGINAÇÃO */}
          {sortedDisplayedProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sortedDisplayedProducts.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>

        {/* SEÇÃO 5: ACCORDION EXPANSÍVEL - ITENS DA COTAÇÃO */}
        <AnimatePresence>
          {documentLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 border-2 border-primary/20 rounded-2xl overflow-hidden bg-card shadow-lg"
            >
              {/* Header do Accordion (sempre visível) */}
              <button
                onClick={() => setIsCartExpanded(!isCartExpanded)}
                className="w-full p-4 bg-gradient-to-r from-primary/10 to-accent/5 hover:from-primary/20 hover:to-accent/10 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-card-foreground">
                      Itens da Cotação
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {documentLines.length} item(s) • Total:{" "}
                      {formatCurrency(cartTotal, quotation.DocCurrency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-sm text-muted-foreground">
                    {isCartExpanded
                      ? "Clique para recolher"
                      : "Clique para expandir"}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center transition-transform duration-300 ${isCartExpanded ? "rotate-180" : ""}`}
                  >
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </button>

              {/* Conteúdo expansível */}
              <AnimatePresence>
                {isCartExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-border/50">
                      {/* Tabela de itens da cotação */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                                Produto
                              </th>
                              <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">
                                Qtd
                              </th>
                              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">
                                Preço Unit.
                              </th>
                              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">
                                Total
                              </th>
                              <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <AnimatePresence>
                              {documentLines.map((line, index) => {
                                const itemTotal = calculateItemTotal(line);
                                return (
                                  <motion.tr
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="min-w-[200px]">
                                        <p className="font-medium text-sm truncate">
                                          {line.itemName}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                          {line.itemCode}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center justify-center w-10 h-8 bg-muted rounded-lg font-semibold text-sm">
                                        {line.Quantity}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                                      {formatCurrency(
                                        line.preco || 0,
                                        quotation.DocCurrency,
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <span className="font-bold text-primary">
                                        {formatCurrency(
                                          itemTotal,
                                          quotation.DocCurrency,
                                        )}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleViewItem(index)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            removeDocumentLine(index)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>

                      {/* Footer com totais */}
                      <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCartExpanded(false)}
                          >
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Recolher
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {documentLines.length} itens no total
                          </span>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="text-right flex-1 sm:flex-none">
                            <p className="text-sm text-muted-foreground">
                              Total da Cotação
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(cartTotal, quotation.DocCurrency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem quando não há itens */}
        {documentLines.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-8 text-center text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border"
          >
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum item na cotação</p>
            <p className="text-sm mt-1">
              Adicione produtos da lista acima para começar
            </p>
          </motion.div>
        )}
      </div>

      {/* MODAIS */}
      {/* MODAL DE ADIÇÃO DE NOVO ITEM */}
      <AnimatePresence>
        {isAddingNewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={handleCancelNewItem}
            role="dialog"
            aria-labelledby="new-item-title"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-primary/50 overflow-hidden max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                      <Plus
                        className="text-primary-foreground h-6 w-6 sm:h-7 sm:w-7"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h4
                        id="new-item-title"
                        className="font-bold text-xl sm:text-2xl text-card-foreground"
                      >
                        Novo Item
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Preencha os dados do produto
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelNewItem}
                    className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300"
                    aria-label="Cancelar adição"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="new-item-code"
                      className="text-sm font-bold"
                    >
                      Código do Item
                    </Label>
                    <Input
                      id="new-item-code"
                      value={newItemData.itemCode ?? ""}
                      onChange={(e) =>
                        updateNewItemData("itemCode", e.target.value)
                      }
                      className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                      placeholder="Ex: PROD-001"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="new-item-name"
                      className="text-sm font-bold"
                    >
                      Nome do Item
                    </Label>
                    <Input
                      id="new-item-name"
                      value={newItemData.itemName ?? ""}
                      onChange={(e) =>
                        updateNewItemData("itemName", e.target.value)
                      }
                      className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                      placeholder="Ex: Avental Cirúrgico"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="new-item-currency"
                      className="text-sm font-bold"
                    >
                      Moeda
                    </Label>
                    <Input
                      id="new-item-currency"
                      value={newItemData.moeda ?? ""}
                      onChange={(e) =>
                        updateNewItemData("moeda", e.target.value)
                      }
                      className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                      placeholder="Ex: R$"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>

                  <NumberInput
                    value={newItemData.preco ?? 0}
                    onUpdate={() => {}}
                    label="Preço Unitário"
                    readOnly
                    docCurrency={quotation.DocCurrency}
                  />

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="new-item-measure"
                      className="text-sm font-bold"
                    >
                      Unidade de Medida
                    </Label>
                    <Input
                      id="new-item-measure"
                      value={newItemData.unMedida ?? "Caixa c/20"}
                      onChange={(e) =>
                        updateNewItemData("unMedida", e.target.value)
                      }
                      className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                      placeholder="Ex: Caixa c/20"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="new-item-unit"
                      className="text-sm font-bold"
                    >
                      Unidade
                    </Label>
                    <Input
                      id="new-item-unit"
                      value={newItemData.UoMCode || newItemData.unidade || "UN"}
                      onChange={(e) =>
                        updateNewItemData("UoMCode", e.target.value)
                      }
                      className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                      placeholder="Ex: CX"
                      readOnly
                      aria-readonly="true"
                    />
                  </div>

                  <NumberInput
                    value={newItemData.Quantity ?? 0}
                    onUpdate={(val) => updateNewItemData("Quantity", val)}
                    label="Quantidade"
                    placeholder="1"
                    formatMode="quantity"
                  />

                  <NumberInput
                    value={newItemData.DiscountPercent ?? 0}
                    onUpdate={(val) =>
                      updateNewItemData("DiscountPercent", val)
                    }
                    label="Desconto (%)"
                    docCurrency={quotation.DocCurrency}
                  />
                </div>

                <Separator className="my-6 sm:my-8" />

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-primary/20 shadow-lg">
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 font-semibold">
                      <CalculatorIcon className="h-5 w-5" aria-hidden="true" />
                      Total do Item
                    </p>
                    <p
                      className="text-2xl sm:text-3xl font-bold"
                      aria-live="polite"
                    >
                      {formatCurrency(
                        newItemTotal,
                        quotation.DocCurrency || "R$",
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleAddNewItem}
                      className="bg-primary hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 h-12 sm:h-14"
                      aria-label="Adicionar item à cotação"
                    >
                      <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                      Adicionar Item
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleCancelNewItem}
                      variant="outline"
                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all h-12 sm:h-14"
                      aria-label="Cancelar adição de item"
                    >
                      <Trash2 className="h-5 w-5 mr-2" aria-hidden="true" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE VISUALIZAÇÃO/EDIÇÃO */}
      <AnimatePresence>
        {(viewingItemIndex !== null || editingItemIndex !== null) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={handleCloseView}
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-detail-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-card via-card to-card/95 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-primary/30 max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-tr from-secondary/20 via-primary/10 to-transparent rounded-full blur-3xl -z-10" />

              <div className="relative overflow-y-auto max-h-[95vh] sm:max-h-[90vh] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {(() => {
                  const index = viewingItemIndex ?? editingItemIndex ?? 0;
                  const line =
                    editingItemIndex !== null
                      ? tempEditData
                      : documentLines[index];
                  const isEditing = editingItemIndex !== null;
                  const itemTotal = calculateItemTotal(line);

                  const updateTempEditData = (field: string, value: any) => {
                    const safeValue =
                      value != null
                        ? value
                        : typeof value === "number"
                          ? 0
                          : "";
                    const rounded =
                      typeof safeValue === "number"
                        ? roundTo2(safeValue)
                        : safeValue;
                    setTempEditData((prev) => ({ ...prev, [field]: rounded }));
                  };

                  const handleSaveEdit = () => {
                    if (editingItemIndex === null) return;
                    Object.entries(tempEditData).forEach(([field, value]) => {
                      syncUpdateDocumentLine(editingItemIndex, field, value);
                    });
                    const updatedLine = documentLines[editingItemIndex];
                    setTempEditData({ ...updatedLine, ...tempEditData });
                  };

                  return (
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
                        <div className="flex items-start gap-3 sm:gap-5 flex-1 w-full">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            className="relative flex-shrink-0"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl blur-lg opacity-50" />
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary via-accent to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                              <PackageOpen
                                className="sm:w-8 sm:h-8 text-primary-foreground"
                                aria-hidden="true"
                              />
                            </div>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h2
                                id="item-detail-title"
                                className="font-bold text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-card-foreground to-card-foreground/70 bg-clip-text text-transparent"
                              >
                                {isEditing ? "Editar Item" : "Detalhes do Item"}
                              </h2>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                                  isEditing
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                                }`}
                              >
                                {isEditing ? "Modo Edição" : "Visualização"}
                              </motion.div>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground font-medium truncate">
                              {line.itemName ?? "Sem descrição"}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                              Código:{" "}
                              <span className="font-mono font-semibold">
                                {line.itemCode ?? line.ItemCode ?? "N/A"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseView}
                          className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300 self-end sm:self-start"
                          aria-label="Fechar detalhes"
                        >
                          <X
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-green-500/20 backdrop-blur-sm"
                        >
                          <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">
                            Unidade de Medida
                          </p>
                          <p className="text-base sm:text-lg font-bold text-card-foreground">
                            {line.unMedida ?? "Caixa c/20"}
                          </p>
                        </motion.div>
                      </div>

                      <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border/50 mb-6 sm:mb-8">
                        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
                          <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
                          Informações Detalhadas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2 sm:space-y-3 group">
                            <Label
                              htmlFor={`item-code-${index}`}
                              className="text-xs sm:text-sm font-bold flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              Código do Item
                            </Label>
                            <Input
                              id={`item-code-${index}`}
                              value={line.itemCode ?? line.ItemCode ?? ""}
                              className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-primary/5 backdrop-blur-sm cursor-not-allowed"
                              placeholder="Ex: PROD-001"
                              readOnly
                              aria-readonly="true"
                            />
                          </div>

                          <div className="space-y-2 sm:space-y-3 group">
                            <Label
                              htmlFor={`item-name-${index}`}
                              className="text-xs sm:text-sm font-bold flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-accent" />
                              Nome do Item
                            </Label>
                            <Input
                              id={`item-name-${index}`}
                              value={line.itemName ?? ""}
                              className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-primary/5 backdrop-blur-sm cursor-not-allowed"
                              placeholder="Ex: Avental Cirúrgico"
                              readOnly
                              aria-readonly="true"
                            />
                          </div>

                          <NumberInput
                            value={line.preco ?? 0}
                            onUpdate={() => {}}
                            label="Preço Unitário"
                            readOnly
                            docCurrency={quotation.DocCurrency}
                          />

                          <div className="space-y-2 sm:space-y-3 group">
                            <Label
                              htmlFor={`item-unit-${index}`}
                              className="text-xs sm:text-sm font-bold flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-secondary" />
                              Unidade
                            </Label>
                            <Input
                              id={`item-unit-${index}`}
                              value={line.UoMCode || line.unidade || "UN"}
                              className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-primary/5 backdrop-blur-sm cursor-not-allowed"
                              placeholder="Ex: CX"
                              readOnly
                              aria-readonly="true"
                            />
                          </div>

                          <NumberInput
                            value={line.Quantity ?? 0}
                            onUpdate={(val) =>
                              isEditing && updateTempEditData("Quantity", val)
                            }
                            label="Quantidade"
                            readOnly={!isEditing}
                            formatMode="quantity"
                          />

                          <NumberInput
                            value={line.DiscountPercent ?? 0}
                            onUpdate={(val) =>
                              isEditing &&
                              updateTempEditData("DiscountPercent", val)
                            }
                            label="Desconto (%)"
                            readOnly={!isEditing}
                            docCurrency={quotation.DocCurrency}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 sm:gap-6">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="relative w-full"
                        >
                          <div className="relative p-5 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-primary/30 backdrop-blur-sm shadow-2xl">
                            <p className="text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 font-bold uppercase tracking-wider">
                              <CircleDollarSign
                                className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
                                aria-hidden="true"
                              />
                              Total do Item
                            </p>
                            <p
                              className="text-2xl sm:text-3xl md:text-4xl font-black"
                              aria-live="polite"
                            >
                              {formatCurrency(itemTotal, quotation.DocCurrency)}
                            </p>
                            {(line.DiscountPercent ?? 0) > 0 && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-bold mt-2 flex items-center gap-1"
                              >
                                <span className="text-xs">💰</span>
                                Desconto de{" "}
                                {(line.DiscountPercent ?? 0).toFixed(2)}%
                                aplicado
                              </motion.p>
                            )}
                          </div>
                        </motion.div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full justify-stretch sm:justify-end">
                          {isEditing ? (
                            <>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                              >
                                <Button
                                  type="button"
                                  size="lg"
                                  onClick={handleSaveEdit}
                                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all h-12 sm:h-11"
                                  aria-label="Atualizar item"
                                >
                                  <PackageCheck
                                    className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                                    aria-hidden="true"
                                  />
                                  Atualizar
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                              >
                                <Button
                                  type="button"
                                  size="lg"
                                  variant="outline"
                                  onClick={handleCloseView}
                                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all border-2 hover:border-primary bg-background/80 backdrop-blur-sm h-12 sm:h-11"
                                  aria-label="Cancelar edição"
                                >
                                  <X
                                    className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                                    aria-hidden="true"
                                  />
                                  Fechar
                                </Button>
                              </motion.div>
                            </>
                          ) : (
                            <>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                              >
                                <Button
                                  type="button"
                                  size="lg"
                                  onClick={() => handleEditItem(index)}
                                  className="w-full sm:w-auto bg-primary text-white shadow-lg hover:shadow-xl transition-all h-12 sm:h-11"
                                  aria-label="Editar este item"
                                >
                                  <Edit3
                                    className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                                    aria-hidden="true"
                                  />
                                  Editar Item
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                              >
                                <Button
                                  type="button"
                                  size="lg"
                                  variant="outline"
                                  onClick={handleCloseView}
                                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all border-2 hover:border-primary bg-background/80 backdrop-blur-sm h-12 sm:h-11"
                                  aria-label="Fechar e voltar"
                                >
                                  <X
                                    className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                                    aria-hidden="true"
                                  />
                                  Fechar
                                </Button>
                              </motion.div>
                            </>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto"
                          >
                            <Button
                              type="button"
                              size="lg"
                              variant="destructive"
                              onClick={() => {
                                removeDocumentLine(index);
                                handleCloseView();
                              }}
                              className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 h-12 sm:h-11"
                              aria-label="Remover este item"
                            >
                              <TrashIcon
                                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                                aria-hidden="true"
                              />
                              Remover
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
