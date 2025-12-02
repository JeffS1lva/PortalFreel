"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Edit3,
  X,
  TrashIcon,
  PackageCheck,
  CircleDollarSign,
  ShoppingBag,
  Search,
} from "lucide-react";
import {
  formatCurrency,
  formatQuantity,
  roundTo2,
} from "@/components/pages/Cotação/utils/currency";
import { useNumberInput } from "@/components/pages/Cotação/utils/useNumberInput";
import axios from "axios";

interface DocumentLine {
  LineNum: number;
  ItemCode: string;
  Quantity: number;
  Price: number;
  Currency: string;
  DiscountPercent: number;
  MeasureUnit: string;
  Usage: number;
  UoMEntry: number;
  UoMCode: string;
  ShipDate: string;
  U_SKILL_NP: string | null;
  itemName?: string;
  preco?: number;
}

interface ItemsEditableProps {
  lines: DocumentLine[];
  docCurrency: string;
  docEntry?: number;
  mainUsage?: number;
  priceListNum?: number;
  onUpdateLine: (index: number, updates: Partial<DocumentLine>) => void;
  onAddLine: (line: Partial<DocumentLine>) => void;
  onRemoveLine?: (index: number) => void;
}

interface PriceItem {
  itemCode: string;
  itemName: string;
  preco: number;
  moeda: string;
  idUn: number;
  unMedida: string;
  UoMCode?: string;
  UoMEntry?: number;
  Usage?: number;
}

const calculateItemTotal = (line: DocumentLine): number => {
  return roundTo2(
    line.Quantity * line.Price * (1 - line.DiscountPercent / 100)
  );
};

const NumberInput = ({
  value,
  onUpdate,
  label,
  placeholder = "0,00",
  disabled = false,
  readOnly = false,
  docCurrency = "R$",
  formatMode = "currency",
}: {
  value: number;
  onUpdate: (value: number) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  docCurrency?: string;
  formatMode?: "currency" | "quantity";
}) => {
  const input = useNumberInput(value, 2);

  const getDisplayValue = (val: number): string => {
    if (formatMode === "quantity") return formatQuantity(val);
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
        className="h-14 border-2 focus:border-primary transition-all text-lg group-hover:border-primary/50 "
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export function ItemsEditable({
  lines,
  docCurrency,
  priceListNum,
  mainUsage,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
}: ItemsEditableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempData, setTempData] = useState<Partial<DocumentLine>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PriceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  console.log("🔥 Lines recebidas no ItemsEditable:", lines);


  const listNum = priceListNum;

  const fetchPriceList = async (filtro: string) => {
    if (!filtro.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearching(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const response = await axios.get("/api/external/ListaPrecos", {
        params: { VFiltro: filtro, VLista: listNum },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: PriceItem[] = response.data || [];
      setSearchResults(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error("Erro ao buscar lista de preços:", error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => fetchPriceList(searchTerm), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, listNum]);

  const selectItem = (item: PriceItem) => {

    const newLine: Partial<DocumentLine> = {
      ItemCode: item.itemCode,
      U_SKILL_NP: item.itemName,
      itemName: item.itemName,
      Quantity: 1,
      Price: roundTo2(item.preco),
      preco: roundTo2(item.preco),
      Currency: item.moeda || docCurrency,
      DiscountPercent: 0,
      MeasureUnit: item.unMedida || "UN",
      UoMCode: item.UoMCode,
      UoMEntry: item.idUn ?? item.UoMEntry ?? 0,
      Usage: mainUsage, // ← PRIORIDADE: do item > mainUsage da cotação
      ShipDate: "",
    };

    onAddLine(newLine);
    setSearchTerm("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const groupedResults = useMemo(() => {
    return searchResults.reduce((acc, item) => {
      if (!acc[item.itemCode]) {
        acc[item.itemCode] = { name: item.itemName, options: [] };
      }
      acc[item.itemCode].options.push(item);
      return acc;
    }, {} as Record<string, { name: string; options: PriceItem[] }>);
  }, [searchResults]);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setTempData({ ...lines[index] });
  };

  const handleCloseModal = () => {
    setEditingIndex(null);
    setTempData({});
  };

  const updateTemp = (field: keyof DocumentLine, value: any) => {
    const num = Number.parseFloat(value) || 0;
    const safeValue = isNaN(num) ? value : roundTo2(num);
    setTempData((prev) => ({ ...prev, [field]: safeValue }));
  };

  const handleSave = () => {
    if (editingIndex === null) return;

    const updates: Partial<DocumentLine> = { ...tempData };
    if (updates.itemName !== undefined || updates.U_SKILL_NP !== undefined) {
      const finalName =
        updates.itemName ??
        updates.U_SKILL_NP ??
        lines[editingIndex].itemName ??
        "";
      updates.itemName = finalName;
      updates.U_SKILL_NP = finalName;
    }

    onUpdateLine(editingIndex, updates);
    handleCloseModal();
  };

  const displayName = (line: DocumentLine) =>
    line.itemName?.trim() ? line.itemName : `Sem nome (${line.ItemCode})`;

  const totalGeral = lines.reduce(
    (sum, line) => sum + calculateItemTotal(line),
    0
  );

  return (
    <>
      {/* CAMPO DE BUSCA PARA ADICIONAR NOVO ITEM */}
      <div className="mb-6">
        <div className="relative">
          <div className="flex items-center gap-3 bg-card border-2 rounded-xl p-3 shadow-lg">
            <Search className="h-6 w-6 text-muted-foreground ml-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produto para adicionar..."
              className="border-0 text-lg h-14 focus-visible:ring-0 bg-transparent"
            />
            {isSearching && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-4" />
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-card border-2 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="max-h-96 overflow-y-auto">
                  {Object.entries(groupedResults).map(([code, group]) => (
                    <div key={code} className="border-b last:border-b-0">
                      <div className="p-3 bg-muted/50 sticky top-0">
                        <p className="font-semibold text-sm">{group.name}</p>
                      </div>
                      {group.options.map((opt) => (
                        <button
                          key={opt.itemCode + opt.preco}
                          onClick={() => selectItem(opt)}
                          className="w-full px-4 py-3 hover:bg-primary/10 flex justify-between items-center text-left"
                        >
                          <div>
                            <p className="font-medium">Cód: {opt.itemCode}</p>
                            <p className="text-sm text-muted-foreground">
                              {opt.unMedida}
                            </p>
                          </div>
                          <p className="font-bold text-primary">
                            {formatCurrency(opt.preco, opt.moeda)}
                          </p>
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

      {/* LISTA DE ITENS */}
      {lines.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Use a busca acima para adicionar itens</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-4 py-3 bg-muted/50 rounded-lg font-semibold text-sm">
            <div className="w-8"></div>
            <div>Item</div>
            <div className="text-right">Qtd.</div>
            <div className="text-right">Preço Unit.</div>
            <div className="text-right">Desc.</div>
            <div className="text-right">Total</div>
            <div className="text-center">Ações</div>
          </div>

          <AnimatePresence>
            {lines.map((line, index) => {
              const itemTotal = calculateItemTotal(line);
              return (
                <motion.div
                  key={line.LineNum}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                >
                  <div className="grid md:grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-4 py-3 items-center">
                    <ShoppingBag className="hidden md:block" />

                    <div className="min-w-0">
                      <div className="font-semibold truncate text-sm">
                        {displayName(line)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate md:hidden">
                        {formatQuantity(line.Quantity)} ×{" "}
                        {formatCurrency(
                          line.Price,
                          line.Currency || docCurrency
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground hidden md:block">
                        Cód: {line.ItemCode}
                      </div>
                    </div>

                    <div className="text-right text-sm hidden md:block">
                      {formatQuantity(line.Quantity)} {line.MeasureUnit}
                    </div>

                    <div className="text-right text-sm hidden md:block">
                      {formatCurrency(line.Price, line.Currency || docCurrency)}
                    </div>

                    <div className="text-right text-sm hidden md:block">
                      {line.DiscountPercent > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {line.DiscountPercent}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="text-right font-bold text-sm md:text-base">
                      {formatCurrency(itemTotal, line.Currency || docCurrency)}
                    </div>

                    <div className="flex justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(index)}
                        className="h-8 px-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {onRemoveLine && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveLine(index)}
                          className="h-8 px-2 text-destructive hover:bg-destructive/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="mt-6 flex justify-end">
            <div className="bg-primary/10 rounded-lg px-6 py-3 min-w-[200px]">
              <div className="text-sm text-muted-foreground mb-1">
                Total Geral
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalGeral, docCurrency)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {lines.length} {lines.length === 1 ? "item" : "itens"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO (igual antes) */}
      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-card via-card to-card/95 rounded-3xl shadow-2xl border-2 border-primary/30 max-w-7xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-primary/20 p-6 md:p-8 lg:p-10">
                {(() => {
                  const line = { ...lines[editingIndex], ...tempData };
                  const itemTotal = calculateItemTotal(line as DocumentLine);

                  return (
                    <div>
                      <div className="flex items-start justify-between mb-8 gap-4">
                        <div className="flex items-start gap-5 flex-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-50" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-primary via-accent to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                              <PackageCheck className="w-8 h-8 text-primary-foreground" />
                            </div>
                          </div>
                          <div>
                            <h2 className="font-bold text-3xl bg-gradient-to-r from-card-foreground to-card-foreground/70 bg-clip-text text-transparent">
                              Editar Item
                            </h2>
                            <p className="text-base text-muted-foreground font-medium truncate">
                              {displayName(line)}
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              Código:{" "}
                              <span className="font-mono font-semibold">
                                {line.ItemCode}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseModal}
                          className="h-11 w-11 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 bg-gradient-to-br from-muted/30 to-muted/10 p-6 rounded-2xl border">
                        <NumberInput
                          value={line.Quantity}
                          onUpdate={(val) => updateTemp("Quantity", val)}
                          label="Quantidade"
                          formatMode="quantity"
                        />
                        <NumberInput
                          value={line.Price}
                          onUpdate={(val) => updateTemp("Price", val)}
                          label="Preço Unitário"
                          docCurrency={line.Currency || docCurrency}
                        />
                        <NumberInput
                          value={line.DiscountPercent}
                          onUpdate={(val) => updateTemp("DiscountPercent", val)}
                          label="Desconto (%)"
                        />
                      </div>

                      <div className="flex flex-col gap-6">
                        <div className="p-8 rounded-2xl border-2 border-primary/30 backdrop-blur-sm shadow-2xl">
                          <p className="text-sm mb-3 flex items-center gap-2 font-bold uppercase tracking-wider">
                            <CircleDollarSign className="h-5 w-5 text-primary" />
                            Total do Item
                          </p>
                          <p className="text-4xl font-black">
                            {formatCurrency(
                              itemTotal,
                              line.Currency || docCurrency
                            )}
                          </p>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button
                            size="lg"
                            onClick={handleSave}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <PackageCheck className="h-5 w-5 mr-2" />
                            Atualizar Item
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={handleCloseModal}
                          >
                            <X className="h-5 w-5 mr-2" />
                            Cancelar
                          </Button>
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
    </>
  );
}
