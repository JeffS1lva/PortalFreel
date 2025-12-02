"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContentEditModal,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, BadgeEditModal } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  X,
  User,
  FileText,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ItemsEditable } from "./ItemsView";
import type { BPAddress, DocumentLine, QuotationSummary } from "../../type";
import axios from "axios";

interface EditQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationSummary | null;
  formatCurrency: (value: number, currency?: string) => string;
  onSave: (updated: QuotationSummary) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Funções auxiliares                                                        */
/* -------------------------------------------------------------------------- */
const formatAddressWithoutName = (addr: BPAddress): string => {
  if (!addr) return "";
  const parts = [
    addr.street && addr.streetNo
      ? `${addr.street}, ${addr.streetNo}`
      : addr.street || addr.streetNo,
    addr.block,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,
  ].filter(Boolean);
  return parts.join(" - ") || "Endereço não informado";
};

const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

const toSAPDate = (date: string | undefined): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

const fetchAddressesFromClientEndpoint = async (
  cardCode: string
): Promise<BPAddress[]> => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token não encontrado");
    return [];
  }

  console.log(
    "%c[ENDEREÇOS] BUSCANDO ENDEREÇOS DO CLIENTE:",
    "color: #8b5cf6; font-weight: bold",
    cardCode
  );

  try {
    // FORÇA O PARÂMETRO filtro= EXATAMENTE COMO O ClientSearch FAZ
    const response = await fetch(
      `/api/external/Clientes?filtro=${encodeURIComponent(cardCode)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Erro na API Clientes:",
        response.status,
        response.statusText
      );
      return [];
    }

    const data = await response.json();
    console.log(
      "%c[ENDEREÇOS] Resposta completa da API:",
      "color: #10b981",
      data
    );

    const clientsData = data.value || data.data || data || [];

    if (!Array.isArray(clientsData) || clientsData.length === 0) {
      console.warn("Nenhum cliente encontrado com o cardCode:", cardCode);
      return [];
    }

    // Agora pega o cliente exato (pelo cardCode)
    const client = clientsData.find(
      (c: any) =>
        String(c.CardCode || c.cardCode || "")
          .trim()
          .toUpperCase() === cardCode.trim().toUpperCase()
    );

    if (!client) {
      console.warn(
        "Cliente não encontrado na resposta (cardCode não bate):",
        cardCode
      );
      return [];
    }

    console.log(
      "%c[ENDEREÇOS] CLIENTE ENCONTRADO!",
      "color: #f59e0b; font-weight: bold",
      {
        CardCode: client.CardCode || client.cardCode,
        CardName: client.CardName || client.cardName,
        TotalEndereços: (client.BPAddresses || client.bpAddresses || []).length,
      }
    );

    const addresses = client.BPAddresses || client.bpAddresses || [];

    return addresses.map((a: any) => ({
      addressName:
        a.AddressName || a.addressName || a.AddressName2 || "(sem nome)",
      street: a.Street || a.street || "",
      streetNo: a.StreetNo || a.streetNo || "",
      block: a.Block || a.block || "",
      city: a.City || a.city || "",
      state: a.State || a.state || "",
      zipCode: a.ZipCode || a.zipCode || "",
      country: a.Country || a.country || "",
    }));
  } catch (err) {
    console.error("Erro fatal ao buscar endereços:", err);
    return [];
  }
};

const fetchItemName = async (
  itemCode: string,
  priceListNum: number
): Promise<string> => {
  const token = localStorage.getItem("token");
  if (!token) return itemCode;

  const listNum = priceListNum || 1;

  try {
    const response = await fetch(
      `/api/external/ListaPrecos?VFiltro=${itemCode}&VLista=${listNum}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ).then((res) => res.json());

    const data = response.value || response.data || response || [];
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return (
        item.ItemName ||
        item.itemName ||
        item.NomeItem ||
        item.Descricao ||
        itemCode
      );
    }
    return itemCode;
  } catch (err: any) {
    console.error("[fetchItemName] ERRO:", err.message, itemCode);
    return itemCode;
  }
};

/* -------------------------------------------------------------------------- */
/*  Modal Principal                                                           */
/* -------------------------------------------------------------------------- */
export function EditQuotationModal({
  open,
  onOpenChange,
  quotation,
  formatCurrency,
  onSave,
}: EditQuotationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<QuotationSummary | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedAddressName, setSelectedAddressName] = useState<string>("");
  const [_loadingAddresses, _setLoadingAddresses] = useState(false);
  const [_showAddressSelect, setShowAddressSelect] = useState(false);
  const [tempSelectedAddressName, setTempSelectedAddressName] = useState("");
  const [tempFormattedAddress, setTempFormattedAddress] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [_isAddressChanged, setIsAddressChanged] = useState(false);
  const [priceListNum, setPriceListNum] = useState<number | null>(null);

  /*  INICIALIZA formData com endereço preenchido automaticamente   */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (!quotation || !open) return;

    const initializeFormData = async () => {
      // 1. Busca lista de preços do cliente (você já faz isso)
      let priceList = 1;
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await axios.get("/api/external/Clientes", {
            params: { filtro: quotation.cardCode },
            headers: { Authorization: `Bearer ${token}` },
          });
          const clients = res.data.value || res.data.data || res.data || [];
          const client = clients.find(
            (c: any) =>
              String(c.CardCode || c.cardCode).trim() ===
              quotation.cardCode.trim()
          );
          if (client?.priceListNum) priceList = client.priceListNum;
        }
      } catch (e) {
        console.warn("Erro ao carregar priceListNum", e);
      }
      setPriceListNum(priceList);

      // 2. Monta base do formData
      const safeBplId =
        quotation.BPL_IDAssignedToInvoice > 0
          ? quotation.BPL_IDAssignedToInvoice
          : 1;
      const mainUsage =
        quotation.TaxExtension?.MainUsage ?? (safeBplId === 2 ? 90 : 40);

      let addresses: BPAddress[] = quotation.BPAddresses || [];
      let shipToDefault = quotation.ShipToDefault || quotation.shipToDefault;

      // 3. Se não veio endereço, busca agora (garante que sempre tenha)
      if (!addresses.length) {
        addresses = await fetchAddressesFromClientEndpoint(quotation.cardCode);
        shipToDefault =
          quotation.ShipToDefault || addresses[0]?.addressName || "";
      }

      // 4. Determina endereço de entrega (a mágica acontece aqui)
      let deliveryAddress = quotation.u_POL_EnderEntrega?.trim();

      if (
        !deliveryAddress ||
        deliveryAddress === "Endereço não informado" ||
        deliveryAddress.length < 10
      ) {
        // Prioridade 1: endereço com nome ShipToDefault
        let addr = addresses.find((a) => a.addressName === shipToDefault);

        // Prioridade 2: primeiro bo_ShipTo
        if (!addr) {
          addr = addresses.find(
            (a) =>
              a.addressType === "bo_ShipTo" ||
              String(a.addressType || "")
                .toLowerCase()
                .includes("shipto")
          );
        }

        // Prioridade 3: qualquer endereço
        if (!addr && addresses.length > 0) {
          addr = addresses[0];
        }

        if (addr) {
          deliveryAddress = formatAddressWithoutName(addr);
          console.log(
            "%c[ENDEREÇO] Preenchido automaticamente na abertura do modal",
            "color: #10b981; font-weight: bold",
            deliveryAddress
          );
        } else {
          deliveryAddress = "Endereço não informado";
        }
      }

      // 5. Monta o formData final com endereço já correto
      const initialFormData: QuotationSummary = {
        ...quotation,
        BPAddresses: addresses,
        ShipToDefault: shipToDefault,
        u_POL_EnderEntrega: deliveryAddress,
        BPL_IDAssignedToInvoice: safeBplId,
        u_Portal: "44",
        TaxExtension: { MainUsage: mainUsage },
      };

      setFormData(initialFormData);
    };

    initializeFormData();
  }, [quotation, open]); // ← só roda quando abre o modal ou troca a cotação

  // Dentro do EditQuotationModal, após inicializar formData
  const mainUsage = useMemo(() => {
    if (!formData) return 40;
    const bplId = formData.BPL_IDAssignedToInvoice || 1;
    return formData.TaxExtension?.MainUsage ?? (bplId === 2 ? 90 : 40);
  }, [formData?.BPL_IDAssignedToInvoice, formData?.TaxExtension?.MainUsage]);

  /* --------------------------------------------------------------- */
  /*  PREENCHE AUTOMATICAMENTE u_POL_EnderEntrega SE ESTIVER VAZIO   */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (!formData || !formData.BPAddresses || formData.BPAddresses.length === 0)
      return;

    const currentDeliveryAddress = (formData.u_POL_EnderEntrega || "").trim();
    const isEmptyOrDefault =
      !currentDeliveryAddress ||
      currentDeliveryAddress === "Endereço não informado" ||
      currentDeliveryAddress.length < 10; // segurança

    if (!isEmptyOrDefault) return;

    // 1. Tenta usar o ShipToDefault (nome do endereço padrão de entrega)
    const defaultShipToName = formData.ShipToDefault || formData.shipToDefault;
    let selectedAddress: BPAddress | undefined;

    if (defaultShipToName) {
      selectedAddress = formData.BPAddresses.find(
        (a) => a.addressName === defaultShipToName
      );
    }

    // 2. Se não encontrou pelo nome padrão, pega o primeiro bo_ShipTo
    if (!selectedAddress) {
      selectedAddress = formData.BPAddresses.find(
        (a) =>
          a.addressType === "bo_ShipTo" ||
          String(a.addressType).toLowerCase().includes("shipto")
      );
    }

    // 3. Último recurso: primeiro endereço qualquer
    if (!selectedAddress && formData.BPAddresses.length > 0) {
      selectedAddress = formData.BPAddresses[0];
    }

    if (selectedAddress) {
      const formatted = formatAddressWithoutName(selectedAddress);
      console.log(
        "%c[ENDEREÇO] Preenchendo automaticamente u_POL_EnderEntrega",
        "color: #10b981; font-weight: bold",
        {
          addressName: selectedAddress.addressName,
          formatted,
        }
      );

      setFormData((prev) =>
        prev
          ? {
              ...prev,
              u_POL_EnderEntrega: formatted,
            }
          : null
      );
    }
  }, [
    formData?.BPAddresses,
    formData?.u_POL_EnderEntrega,
    formData?.ShipToDefault,
  ]);

  /* --------------------------------------------------------------- */
  /*  PREENCHE itemName nas linhas                                   */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (!formData || !open) return;

    const linesWithoutName = formData.documentLines.filter(
      (l) => !l.itemName?.trim()
    );
    if (linesWithoutName.length === 0) return;

    const priceList = formData.PriceListNum || 1;

    const loadNames = async () => {
      const updatedLines = await Promise.all(
        formData.documentLines.map(async (line) => {
          if (line.itemName?.trim()) return line;
          const name = await fetchItemName(line.ItemCode, priceList);
          return { ...line, itemName: name };
        })
      );

      setFormData((prev) =>
        prev ? { ...prev, documentLines: updatedLines } : null
      );
    };

    loadNames();
  }, [formData?.documentLines, formData?.PriceListNum, open]);

  /* --------------------------------------------------------------- */
  /*  SINCRONIZA select com u_POL_EnderEntrega                       */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (
      !formData?.u_POL_EnderEntrega ||
      !formData?.BPAddresses ||
      selectedAddressName
    )
      return;

    const formatted = formData.u_POL_EnderEntrega.trim();
    const match = formData.BPAddresses.find(
      (a) => formatAddressWithoutName(a).trim() === formatted
    );

    if (match) setSelectedAddressName(match.addressName);
  }, [
    formData?.u_POL_EnderEntrega,
    formData?.BPAddresses,
    selectedAddressName,
  ]);

  /* --------------------------------------------------------------- */
  /*  Handlers                                                       */
  /* --------------------------------------------------------------- */
  const handleSave = async () => {
    if (!formData) return;

    setIsLoading(true);
    try {
      const bplId = formData.BPL_IDAssignedToInvoice || 1;
      const mainUsage =
        formData.TaxExtension?.MainUsage ?? (bplId === 2 ? 90 : 40);

      const reindexedLines = formData.documentLines
        .filter((l) => l.ItemCode?.trim())
        .map((line, index) => {
          const rawPrice = Number(line.preco || line.Price || 0);

          // ARREDONDAMENTO FORÇADO PARA 4 CASAS DECIMAIS (OBRIGATÓRIO NO SAP B1)
          const Price = Number(rawPrice.toFixed(4));

          return {
            ...line,
            LineNum: index,
            Quantity: Math.max(0.01, Number(line.Quantity) || 1),
            Price, // ← PREÇO CORRIGIDO AQUI
            DiscountPercent: Number(line.DiscountPercent) || 0,
            ShipDate: toSAPDate(line.ShipDate) || formData.docDueDate,
            Usage: mainUsage,
          };
        });

      const cleanData: QuotationSummary = {
        ...formData,
        docDueDate: toSAPDate(formData.docDueDate) || formData.docDueDate,
        taxDate: toSAPDate(formData.taxDate) || formData.taxDate,
        u_POL_EnderEntrega: (formData.u_POL_EnderEntrega || "").substring(
          0,
          100
        ),
        u_Portal: "44",
        BPL_IDAssignedToInvoice: bplId,
        TaxExtension: { MainUsage: mainUsage },
        documentLines: reindexedLines, // USA AS LINHAS REINDEXADAS
      };

      // LOGS DETALHADOS
      console.groupCollapsed("EDIT QUOTATION - SAVE");
      console.log(
        "[v0] LineNums corrigidos:",
        reindexedLines.map((l) => ({
          ItemCode: l.ItemCode,
          LineNum: l.LineNum,
        }))
      );
      console.log("formData (antes):", {
        docEntry: formData.docEntry,
        docNum: formData.docNum,
        BPL_ID: formData.BPL_IDAssignedToInvoice,
        MainUsage: formData.TaxExtension?.MainUsage,
        u_POL_EnderEntrega: formData.u_POL_EnderEntrega,
        docTotal: formData.docTotal,
        documentLines: formData.documentLines.length,
      });

      console.log("cleanData (enviado ao SAP):", {
        DocEntry: cleanData.docEntry,
        BPL_IDAssignedToInvoice: cleanData.BPL_IDAssignedToInvoice,
        TaxExtension: cleanData.TaxExtension,
        u_POL_EnderEntrega: cleanData.u_POL_EnderEntrega,
        DocumentLines: cleanData.documentLines.map((l) => ({
          LineNum: l.LineNum,
          ItemCode: l.ItemCode,
          Quantity: l.Quantity,
          Price: l.Price,
          Usage: l.Usage,
        })),
      });
      console.groupEnd();

      await onSave(cleanData);
      onOpenChange(false);
    } catch (error: any) {
      console.error("FALHA AO SALVAR COTAÇÃO:", error);
      console.error("Erro completo:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof QuotationSummary, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const confirmAddressChange = () => {
    handleInputChange("u_POL_EnderEntrega", tempFormattedAddress);
    setSelectedAddressName(tempSelectedAddressName);
    setShowAddressSelect(false);
    setTempSelectedAddressName("");
    setTempFormattedAddress("");
    setAlertOpen(false);
    setIsAddressChanged(true);
  };

  if (!formData) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "bost_open":
        return "bg-green-500";
      case "closed":
      case "bost_close":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentEditModal className="max-w-11/12 max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex justify-between items-center gap-2">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Cotação #{formData.docNum}
              </DialogTitle>
              <DialogDescription className="text-base">
                Edite as informações da cotação
              </DialogDescription>
            </div>
            <BadgeEditModal
              className={`${getStatusColor(
                formData.docStatus
              )} text-white px-4 py-1 text-sm mt-8`}
            >
              {formData.docStatus === "bost_Open"
                ? "Cotação em Aberto"
                : formData.docStatus === "bost_Close"
                ? "Cotação Fechada"
                : formData.docStatus}
            </BadgeEditModal>
          </div>
        </DialogHeader>

        {/* TABS */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-4 border-b">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Itens</span>
                <Badge variant="secondary" className="ml-1">
                  {formData.documentLines?.length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-[600px]">
            {/* TAB GERAL */}
            <TabsContent value="general" className="mt-0 space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === "general" && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Informações do Cliente
                        </CardTitle>
                        <CardDescription>
                          Dados cadastrais do cliente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardName" className="font-semibold">
                              Nome do Cliente
                            </Label>
                            <Input
                              id="cardName"
                              value={formData.cardName}
                              disabled
                              className="bg-muted h-11 font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardCode" className="font-semibold">
                              Código do Cliente
                            </Label>
                            <Input
                              id="cardCode"
                              value={formData.cardCode}
                              disabled
                              className="bg-muted h-11 font-medium"
                            />
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-muted-foreground">
                            <strong>Nota:</strong> Os dados do cliente não podem
                            ser editados nesta tela. Para alterações, acesse o
                            cadastro de clientes.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          Dados da Cotação
                        </CardTitle>
                        <CardDescription>
                          Datas e informações do documento
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="docDate" className="font-semibold">
                              Data do Documento
                            </Label>
                            <Input
                              id="docDate"
                              type="date"
                              value={formatDateForInput(formData.docDate)}
                              onChange={(e) =>
                                handleInputChange("docDate", e.target.value)
                              }
                              className="h-11 bg-primary/5"
                              readOnly
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="docDueDate"
                              className="font-semibold"
                            >
                              Data de Entrega
                            </Label>
                            <Input
                              id="docDueDate"
                              type="date"
                              value={formatDateForInput(formData.docDueDate)}
                              onChange={(e) =>
                                handleInputChange("docDueDate", e.target.value)
                              }
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxDate" className="font-semibold">
                              Data de Picking
                            </Label>
                            <Input
                              id="taxDate"
                              type="date"
                              value={formatDateForInput(formData.taxDate)}
                              onChange={(e) =>
                                handleInputChange("taxDate", e.target.value)
                              }
                              className="h-11"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="numAtCard"
                              className="font-semibold"
                            >
                              Número do Cliente
                            </Label>
                            <Input
                              id="numAtCard"
                              value={formData.numAtCard}
                              onChange={(e) =>
                                handleInputChange("numAtCard", e.target.value)
                              }
                              placeholder="Ref. do cliente"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="text-sm text-muted-foreground font-medium">
                                  Valor Total
                                </p>
                                <p className="text-3xl font-bold text-foreground">
                                  {formatCurrency(formData.docTotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Observações</CardTitle>
                          <CardDescription>
                            Comentários e observações sobre a cotação
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="comments" className="font-semibold">
                              Comentários
                            </Label>
                            <Textarea
                              id="comments"
                              value={formData.comments}
                              onChange={(e) =>
                                handleInputChange("comments", e.target.value)
                              }
                              rows={4}
                              placeholder="Adicione comentários sobre a cotação..."
                              className="resize-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="openingRemarks"
                              className="font-semibold"
                            >
                              Observações de Abertura
                            </Label>
                            <Textarea
                              id="openingRemarks"
                              value={formData.openingRemarks}
                              onChange={(e) =>
                                handleInputChange(
                                  "openingRemarks",
                                  e.target.value
                                )
                              }
                              rows={4}
                              placeholder="Observações iniciais..."
                              className="resize-none"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* ENDEREÇO DE ENTREGA */}
                      {/* ENDEREÇO DE ENTREGA - FIXO E NÃO EDITÁVEL (BASEADO NO DOCENTRY) */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            Endereço de Entrega
                          </CardTitle>
                          <CardDescription>
                            Endereço registrado na cotação (não editável nesta
                            tela)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="space-y-2">
                            <Label className="font-semibold">
                              Endereço de Entrega
                            </Label>
                            <Textarea
                              value={
                                formData.u_POL_EnderEntrega?.trim() ||
                                "Endereço não informado"
                              }
                              readOnly
                              rows={5}
                              className="resize-none font-medium text-sm bg-muted cursor-default select-none"
                              placeholder="Endereço não informado"
                            />
                          </div>

                          {/* Mensagem informativa opcional */}
                          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>
                                O endereço de entrega foi definido no momento da
                                criação da cotação e não pode ser alterado aqui.
                                Caso precise mudar, crie uma nova cotação ou
                                entre em contato com o vendedor.
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* TAB ITENS */}
            <TabsContent value="items" className="mt-0">
              <AnimatePresence mode="wait">
                {activeTab === "items" && (
                  <motion.div
                    key="items"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          Itens da Cotação
                        </CardTitle>
                        <CardDescription>
                          Lista completa de produtos e serviços (
                          {formData.documentLines?.length || 0}{" "}
                          {formData.documentLines?.length === 1
                            ? "item"
                            : "itens"}
                          )
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ItemsEditable
                          lines={formData.documentLines}
                          docCurrency={formData.DocCurrency || "R$"}
                          priceListNum={
                            priceListNum ?? formData.PriceListNum ?? 1
                          } // ← PRIORIDADE CORRETA
                          onUpdateLine={(index, updates) => {
                            const newLines = [...formData.documentLines];
                            newLines[index] = {
                              ...newLines[index],
                              ...updates,
                            };
                            handleInputChange("documentLines", newLines);
                          }}
                          onAddLine={(newLine) => {
                            const newLines = [
                              ...formData.documentLines,
                              {
                                ...newLine,
                                LineNum: formData.documentLines.length,
                                Quantity: newLine.Quantity || 1,
                                Price: newLine.Price || 0,
                                DiscountPercent: newLine.DiscountPercent || 0,
                                Currency: newLine.Currency || "R$",
                                MeasureUnit: newLine.MeasureUnit || "UN",
                              } as DocumentLine,
                            ];
                            handleInputChange("documentLines", newLines);
                          }}
                          onRemoveLine={(index) => {
                            const newLines = formData.documentLines
                              .filter((_, i) => i !== index)
                              .map((l, i) => ({ ...l, LineNum: i }));
                            handleInputChange("documentLines", newLines);
                          }}
                          mainUsage={mainUsage}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </div>
        </Tabs>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="min-w-[160px] h-11 px-6 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Alert de confirmação */}
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirmar alteração de endereço?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a alterar o endereço de entrega da cotação.
                Esta ação será salva ao clicar em "Salvar Alterações".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAddressChange}>
                Sim, alterar endereço
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContentEditModal>
    </Dialog>
  );
}
