"use client";

import type React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardHeader, CardTitle, CustomCardCotacao } from "@/components/ui/card";
import { Input, InputCotacao } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TrashIcon,
  PackageIcon,
  CalculatorIcon,
  PackageCheck,
  PackageOpen,
  Search,
  Plus,
  Sparkles,
  Activity,
  Hand,
  Package,
  ShieldCheck,
  Trash2,
  Eye,
  Edit3,
  X,
  CircleDollarSign,
} from "lucide-react";
import axios from "axios";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<ExtendedDocumentLine>>(
    {}
  );
  const [searchResults, setSearchResults] = useState<PriceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      shield: ShieldCheck,
      package: Package,
      bed: PackageIcon,
      syringe: Activity,
      hand: Hand,
      "shield-check": ShieldCheck,
    };
    return iconMap[iconName] || PackageIcon;
  };

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
    [propsUpdateDocumentLine]
  );

  const fetchPriceList = async (filtro: string) => {
    try {
      setIsSearching(true);
      setSearchResults([]);

      if (!filtro.trim()) {
        setShowSuggestions(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get("/api/external/ListaPrecos", {
        params: { VFiltro: filtro, VLista: quotation.PriceListNum || "" },
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredData: PriceItem[] = response.data;
      setSearchResults(filteredData);
      setShowSuggestions(filteredData.length > 0);
    } catch (error) {
      console.error("Error fetching price list:", error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const groupedResults = useMemo(() => {
    return searchResults.reduce((acc, item) => {
      if (!acc[item.itemCode]) {
        acc[item.itemCode] = {
          name: item.itemName,
          options: [] as PriceItem[],
        };
      }
      acc[item.itemCode].options.push(item);
      return acc;
    }, {} as Record<string, { name: string; options: PriceItem[] }>);
  }, [searchResults]);

  const selectItemFromSearch = useCallback(
    (item: PriceItem) => {
      const bplId = quotation.BPL_IDAssignedToInvoice || 1;
      const correctUsage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40;

      const preco = roundTo2(item.preco ?? 0);
      const unidade = item.UoMCode || item.unidade || item.unMedida || "UN";
      const unMedida = item.unMedida || "Caixa c/20";

      const newData: Partial<ExtendedDocumentLine> = {
        ItemCode: item.itemCode ?? "",
        U_SKILL_NP: item.itemName ?? "",
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
        Usage: correctUsage, // SOBRESCREVE API
        preco: preco,
      };

      console.log("%c[APP] Dados que serão adicionados ao item:", "color: #3b82f6; font-weight: bold;", {
    ...newData,
    correctUsage,
    bplId,
  });

      setNewItemData(newData);
      setShowSuggestions(false);
      setSearchResults([]);
      setSearchTerm("");
      setIsAddingNewItem(true);
    },
    [quotation.BPL_IDAssignedToInvoice]
  );

  const handleQuickSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => fetchPriceList(searchTerm), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
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
    U_SKILL_NP: newItemData.itemName ?? newItemData.U_SKILL_NP ?? "",
    itemCode: newItemData.itemCode ?? newItemData.ItemCode ?? "",
    itemName: newItemData.itemName ?? newItemData.U_SKILL_NP ?? "",
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
    Usage: correctUsage, // GARANTIDO
    preco: preco,
  };

  addDocumentLine(finalData);
  setIsAddingNewItem(false);
  setNewItemData({});
  setSearchTerm("");
  setSearchResults([]);
  setShowSuggestions(false);
};

  const handleCancelNewItem = () => {
    setIsAddingNewItem(false);
    setNewItemData({});
    setSearchTerm("");
    setSearchResults([]);
    setShowSuggestions(false);
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

  const documentLines = quotation.DocumentLines as ExtendedDocumentLine[];

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

    // Função de formatação condicional
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

  /* -------------------------------------------------
     CÁLCULO DO TOTAL DO NOVO ITEM (usando calculateItemTotal)
     ------------------------------------------------- */
  const newItemTotal = calculateItemTotal(newItemData);

  const showHeroSearch =
    quotation.DocumentLines.length === 0 && !isAddingNewItem;

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      className="animate-bounce-in focus:outline-none py-5"
      role="region"
      aria-label="Itens da cotação"
    >
      {/* HERO SEARCH */}
      {showHeroSearch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10 px-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-amber-200 to-blue-500 bg-clip-text text-transparent">
            Busque seus produtos
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg md:text-xl">
            Digite o nome ou código do produto para começar a adicionar itens à
            sua cotação
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative flex items-center gap-3 bg-card border-2 border-border rounded-3xl p-3 shadow-2xl hover:shadow-3xl transition-all">
                  <Search
                    className="h-6 w-6 text-muted-foreground ml-4"
                    aria-hidden="true"
                  />
                  <InputCotacao
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Digite o nome ou código do produto..."
                    className="border-0 text-xl h-16 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground/60"
                    aria-label="Buscar produtos"
                    role="searchbox"
                  />
                  {isSearching && (
                    <div className="mr-4" role="status" aria-live="polite">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="sr-only">Buscando produtos...</span>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showSuggestions && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-card border-2 border-border rounded-2xl shadow-2xl z-[100] left-0"
                    role="listbox"
                    aria-label="Resultados da busca"
                  >
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
                      {Object.entries(groupedResults).map(([code, group]) => (
                        <div
                          key={code}
                          className="border-b border-border last:border-b-0"
                          role="group"
                          aria-label={group.name}
                        >
                          <div className="p-3 bg-muted/30 sticky top-0 z-10">
                            <p className="font-semibold text-sm text-card-foreground">
                              {group.name}
                            </p>
                          </div>
                          {group.options.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => selectItemFromSearch(opt)}
                              className="w-full px-4 py-3 hover:bg-primary/10 transition-colors flex items-center justify-between group text-left"
                              role="option"
                              aria-label={`Selecionar ${
                                opt.itemName
                              } - ${formatCurrency(opt.preco, opt.moeda)}`}
                            >
                              <div className="flex-1">
                                <p className="text-sm text-primary font-semibold mt-1">
                                  Código: {opt.itemCode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {opt.unMedida}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-base text-primary group-hover:scale-110 transition-transform">
                                  {formatCurrency(opt.preco, opt.moeda)}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isAddingNewItem &&
                searchTerm.length === 0 &&
                !showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-12"
                  >
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <Sparkles
                        className="h-5 w-5 text-primary animate-pulse"
                        aria-hidden="true"
                      />
                      <p className="text-base font-semibold text-muted-foreground">
                        Produtos populares
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                      {quickSuggestions.map((suggestion, idx) => {
                        const IconComponent = getIconComponent(suggestion.icon);
                        return (
                          <motion.div
                            key={suggestion.name}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              delay: idx * 0.1,
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                            }}
                            whileHover={{ y: -8, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <button
                              onClick={() =>
                                handleQuickSuggestion(suggestion.name)
                              }
                              className="group relative w-full h-32 aspect-square rounded-3xl overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-500 bg-card shadow-lg hover:shadow-2xl"
                              aria-label={`Buscar ${suggestion.name}`}
                            >
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${suggestion.color} opacity-5 group-hover:opacity-15 transition-opacity duration-500`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 group-hover:animate-shimmer" />
                              <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
                                <div
                                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}
                                >
                                  <IconComponent
                                    className="h-7 w-7 text-white"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="text-center">
                                  <p className="font-bold text-sm text-card-foreground group-hover:text-primary transition-colors duration-300">
                                    {suggestion.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Clique para buscar
                                  </p>
                                </div>
                              </div>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* HEADER COM BUSCA */}
      {(quotation.DocumentLines.length > 0 || isAddingNewItem) && (
        <CustomCardCotacao className="overflow-visible mb-6">
          <CardHeader className="bg-gradient-to-br from-accent/5 to-transparent pb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-lg">
                  <PackageIcon
                    className="h-6 w-6 text-primary-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    Itens da Cotação
                  </CardTitle>
                  <p
                    className="text-muted-foreground text-sm mt-1"
                    role="status"
                    aria-live="polite"
                  >
                    {quotation.DocumentLines.length}{" "}
                    {quotation.DocumentLines.length === 1
                      ? "item adicionado"
                      : "itens adicionados"}
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-2xl relative">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10"
                    aria-hidden="true"
                  />
                  <Input
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar mais produtos..."
                    className="pl-12 h-12 border-2 focus:border-primary transition-all"
                    aria-label="Buscar mais produtos"
                    role="searchbox"
                  />
                  {isSearching && (
                    <div
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="sr-only">Buscando...</span>
                    </div>
                  )}
                </div>
                <AnimatePresence>
                  {showSuggestions && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-full bg-card border-2 border-border rounded-2xl shadow-2xl z-[100] left-0"
                      role="listbox"
                      aria-label="Resultados da busca"
                    >
                      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
                        {Object.entries(groupedResults).map(([code, group]) => (
                          <div
                            key={code}
                            className="border-b border-border last:border-b-0"
                            role="group"
                            aria-label={group.name}
                          >
                            <div className="p-3 bg-muted/30 sticky top-0 z-10">
                              <p className="font-semibold text-sm text-card-foreground">
                                {group.name}
                              </p>
                            </div>
                            {group.options.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => selectItemFromSearch(opt)}
                                className="w-full px-4 py-3 hover:bg-primary/10 transition-colors flex items-center justify-between group text-left"
                                role="option"
                                aria-label={`Selecionar ${
                                  opt.itemName
                                } - ${formatCurrency(opt.preco, opt.moeda)}`}
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">
                                    Código: {opt.itemCode}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {opt.unMedida}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-base text-primary group-hover:scale-110 transition-transform">
                                    {formatCurrency(opt.preco, opt.moeda)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardHeader>
        </CustomCardCotacao>
      )}

      {/* NOVO ITEM */}
      <AnimatePresence>
        {isAddingNewItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card backdrop-blur-md rounded-3xl shadow-2xl border-2 border-primary/50 overflow-hidden mb-6"
            role="dialog"
            aria-labelledby="new-item-title"
            aria-modal="true"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                    <Plus
                      className="text-primary-foreground"
                      size={28}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h4
                      id="new-item-title"
                      className="font-bold text-2xl text-card-foreground"
                    >
                      Novo Item
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados do produto
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 group">
                  <Label htmlFor="new-item-code" className="text-sm font-bold">
                    Código do Item
                  </Label>
                  <Input
                    id="new-item-code"
                    value={newItemData.itemCode ?? ""}
                    onChange={(e) =>
                      updateNewItemData("itemCode", e.target.value)
                    }
                    className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                    placeholder="Ex: PROD-001"
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="new-item-name" className="text-sm font-bold">
                    Nome do Item
                  </Label>
                  <Input
                    id="new-item-name"
                    value={newItemData.itemName ?? ""}
                    onChange={(e) =>
                      updateNewItemData("itemName", e.target.value)
                    }
                    className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
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
                    onChange={(e) => updateNewItemData("moeda", e.target.value)}
                    className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
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
                    className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
                    placeholder="Ex: Caixa c/20"
                    readOnly
                    aria-readonly="true"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="new-item-unit" className="text-sm font-bold">
                    Unidade
                  </Label>
                  <Input
                    id="new-item-unit"
                    value={newItemData.UoMCode || newItemData.unidade || "UN"}
                    onChange={(e) =>
                      updateNewItemData("UoMCode", e.target.value)
                    }
                    className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 bg-muted/50 cursor-not-allowed"
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
                  onUpdate={(val) => updateNewItemData("DiscountPercent", val)}
                  label="Desconto (%)"
                  docCurrency={quotation.DocCurrency}
                />
              </div>

              <Separator className="my-8" />

              <div className="flex justify-between items-center">
                <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 rounded-2xl border-2 border-primary/20 shadow-lg">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 font-semibold">
                    <CalculatorIcon className="h-5 w-5" aria-hidden="true" />
                    Total do Item
                  </p>
                  <p className="text-3xl font-bold" aria-live="polite">
                    {formatCurrency(
                      newItemTotal,
                      quotation.DocCurrency || "R$"
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleAddNewItem}
                    className="bg-primary hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    aria-label="Adicionar item à cotação"
                  >
                    <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                    Adicionar Item
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleCancelNewItem}
                    className="hover:bg-destructive text-red-50 transition-all w-full bg-red-500"
                    aria-label="Cancelar adição de item"
                  >
                    <Trash2 className="h-5 w-5 mr-2" aria-hidden="true" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA DE ITENS */}
      {quotation.DocumentLines.length > 0 && (
        <div className="space-y-6">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label="Lista de itens da cotação"
          >
            {documentLines.map((line, index) => {
              const itemTotal = calculateItemTotal(line);

              if (viewingItemIndex === index || editingItemIndex === index) {
                return null;
              }

              return (
                <motion.article
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card backdrop-blur-md rounded-2xl border-2 border-border/50 overflow-hidden hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
                  role="listitem"
                  aria-label={`Item ${index + 1}: ${
                    line.itemName ?? line.U_SKILL_NP
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <PackageCheck
                          className="text-primary-foreground"
                          size={24}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-card-foreground truncate">
                          {line.itemName ?? line.U_SKILL_NP ?? "Sem nome"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Cód: {line.itemCode ?? line.ItemCode ?? "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Preço Unitário:
                        </span>
                        <span className="font-semibold text-sm">
                          {formatCurrency(
                            line.preco ?? 0,
                            quotation.DocCurrency
                          )}
                        </span>
                      </div>

                      {(line.DiscountPercent ?? 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Desconto:
                          </span>
                          <span className="font-semibold text-sm text-green-600 dark:text-green-400">
                            {(line.DiscountPercent ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                        <span className="text-sm font-bold text-muted-foreground">
                          Total:
                        </span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(itemTotal, quotation.DocCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleViewItem(index)}
                        className="flex-1  transition-all cursor-pointer"
                        aria-label={`Visualizar detalhes do item ${
                          line.itemName ?? line.U_SKILL_NP
                        }`}
                      >
                        <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                        Visualizar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleEditItem(index)}
                        className="flex-1 transition-all"
                        aria-label={`Editar item ${
                          line.itemName ?? line.U_SKILL_NP
                        }`}
                      >
                        <Edit3 className="h-4 w-4 mr-2" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDocumentLine(index)}
                        className="hover:scale-105 transition-all"
                        aria-label={`Remover item ${
                          line.itemName ?? line.U_SKILL_NP
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

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
                  {/* Efeitos de fundo decorativos */}
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

                      const updateTempEditData = (
                        field: string,
                        value: any
                      ) => {
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
                        setTempEditData((prev) => ({
                          ...prev,
                          [field]: rounded,
                        }));
                      };

                      const handleSaveEdit = () => {
                        if (editingItemIndex === null) return;

                        Object.entries(tempEditData).forEach(
                          ([field, value]) => {
                            syncUpdateDocumentLine(
                              editingItemIndex,
                              field,
                              value
                            );
                          }
                        );

                        const updatedLine = documentLines[editingItemIndex];
                        setTempEditData({ ...updatedLine, ...tempEditData });

                        // Não chama handleCloseView() para manter o modal aberto
                      };

                      return (
                        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                          {/* Header com gradiente e badge de status */}
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
                                    size={24}
                                    className="sm:w-8 sm:h-8"
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
                                    {isEditing
                                      ? "Editar Item"
                                      : "Detalhes do Item"}
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
                                  {line.itemName ??
                                    line.U_SKILL_NP ??
                                    "Sem descrição"}
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
                              aria-label=" Fechar detalhes"
                            >
                              <X
                                className="h-5 w-5 sm:h-6 sm:w-6"
                                aria-hidden="true"
                              />
                            </Button>
                          </div>

                          {/* Informações do produto em cards destacados */}
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

                          {/* Grid de inputs com estilo aprimorado */}
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
                                  onChange={(e) =>
                                    isEditing &&
                                    syncUpdateDocumentLine(
                                      index,
                                      "itemCode",
                                      e.target.value
                                    )
                                  }
                                  className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-primary/5 backdrop-blur-sm  cursor-not-allowed"
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
                                  value={line.itemName ?? line.U_SKILL_NP ?? ""}
                                  onChange={(e) =>
                                    isEditing &&
                                    syncUpdateDocumentLine(
                                      index,
                                      "itemName",
                                      e.target.value
                                    )
                                  }
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
                                  onChange={(e) =>
                                    isEditing &&
                                    syncUpdateDocumentLine(
                                      index,
                                      "UoMCode",
                                      e.target.value
                                    )
                                  }
                                  className="h-12 sm:h-14 border-2 focus:border-primary transition-all text-base sm:text-lg group-hover:border-primary/50 bg-primary/5 backdrop-blur-sm cursor-not-allowed"
                                  placeholder="Ex: CX"
                                  readOnly
                                  aria-readonly="true"
                                />
                              </div>

                              <NumberInput
                                value={line.Quantity ?? 0}
                                onUpdate={(val) =>
                                  isEditing &&
                                  updateTempEditData("Quantity", val)
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

                          {/* Total e ações com design aprimorado */}
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
                                  {formatCurrency(
                                    itemTotal,
                                    quotation.DocCurrency
                                  )}
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
                                      aria-label=" Fechar e voltar"
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
      )}
    </div>
  );
}
