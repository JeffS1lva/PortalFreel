"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  Search,
  FileTextIcon,
  MapPinIcon,
  PackageIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
} from "lucide-react";

import { CustomStepper, CustomStep } from "@/components/Steps/CustomStepper";
import { StepperControls } from "@/components/Steps/StepperControls";
import {
  initialQuotation,
  type DocumentLine,
  type Quotation,
} from "@/components/pages/Cotação/type";
import Logo from "@/assets/logoBrowser.png";

import { ClientSearch } from "@/components/pages/Cotação/Pages/ClientSearch";
import { GeneralInformation } from "@/components/pages/Cotação/Pages/InfoGeneral";
import { Addresses } from "@/components/pages/Cotação/Pages/Addresses";
import { Items } from "@/components/pages/Cotação/Pages/Items";
import { Review } from "@/components/pages/Cotação/Pages/Review";
import { Button } from "../ui/button";

export function QuotationForm() {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation>(initialQuotation);
  const [isSubmitting, _setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = stepRefs.current[currentStep - 1];
    if (el) el.focus();
  }, [currentStep]);

  // Escuta evento de sucesso para limpar o formulário
  useEffect(() => {
    const handleSaved = () => {
      setQuotation(initialQuotation);
      setCurrentStep(1);
    };
    window.addEventListener("quotation-saved", handleSaved);
    return () => window.removeEventListener("quotation-saved", handleSaved);
  }, []);

  const updateQuotation = (field: keyof Quotation, value: any) => {
    setQuotation((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentLine = (index: number, field: string, value: any) => {
    setQuotation((prev) => {
      const lines = [...prev.DocumentLines];
      const line = { ...lines[index] };
      (line as any)[field] = value;
      lines[index] = line;
      return { ...prev, DocumentLines: lines };
    });
  };

  const addDocumentLine = (data?: any) => {
    const bplId = quotation.BPL_IDAssignedToInvoice || 1;
    const usage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40; // 1→40, 2→90

    const baseLine: DocumentLine = {
      LineNum: quotation.DocumentLines.length,
      ItemCode: data?.ItemCode || "",
      U_SKILL_NP: data?.U_SKILL_NP || "",
      Price: data?.Price || 0,
      MeasureUnit: data?.MeasureUnit || "UN",
      Quantity: data?.Quantity || 1,
      DiscountPercent: data?.DiscountPercent || 0,
      ShipDate: data?.ShipDate || new Date().toISOString().split("T")[0],
      Currency: quotation.DocCurrency,
      Usage: usage, // APLICADO AQUI
      UoMEntry: data?.idUn || 0,
      UoMCode: data?.unidade || "",
      preco: data?.preco ?? 0,
      listCode: data?.listCode,
    };

    setQuotation((prev) => ({
      ...prev,
      DocumentLines: [...prev.DocumentLines, baseLine],
    }));
  };

  const removeDocumentLine = (index: number) => {
    const updatedLines = quotation.DocumentLines.filter((_, i) => i !== index);
    updatedLines.forEach((line, i) => {
      line.LineNum = i;
    });
    setQuotation((prev) => ({ ...prev, DocumentLines: updatedLines }));
  };

  const calculateTotal = () => {
    return quotation.DocumentLines.reduce((total, line) => {
      const lineTotal =
        line.Quantity * (line.preco ?? 0) * (1 - line.DiscountPercent / 100);
      return total + lineTotal;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return quotation.DocumentLines.reduce((total, line) => {
      const discount =
        line.Quantity * line.Price * (line.DiscountPercent / 100);
      return total + discount;
    }, 0);
  };

  const totalValue = calculateTotal();
  const totalDiscount = calculateTotalDiscount();
  const subtotal = totalValue + totalDiscount;

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!quotation.CardCode;
      case 2:
        return !!(quotation.TaxDate && quotation.DocDueDate);
      case 3:
        return true;
      case 4:
        return quotation.DocumentLines.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < 5)
      setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;
    if (e.key === "ArrowRight" && validateCurrentStep() && currentStep < 5) {
      e.preventDefault();
      nextStep();
    } else if (e.key === "ArrowLeft" && currentStep > 1) {
      e.preventDefault();
      prevStep();
    }
  };

  const handleViewQuotations = () => {
    navigate("/cotacoes?embed=true", { state: { direction: "backward" } });
  };

  const handleBackToPortal = () => {
    navigate("/");
  };

  const handleChangeClient = () => {
    setQuotation(initialQuotation);
    setCurrentStep(1);
    setTimeout(() => {
      const firstStep = stepRefs.current[0];
      if (firstStep) firstStep.focus();
    }, 0);
  };

  // Função para montar o payload completo
  function buildQuotationPayload(
    header: {
      PriceList: number;
      DocDate: any;
      DocDueDate: any;
      TaxDate: any;
      NumAtCard: any;
      CardCode: any;
      Comments: any;
      PaymentGroupCode: any;
      U_SKILL_FormaPagto: any;
      U_Portal: any;
      U_UPSlpCd2: any;
      U_UPSlpCd3: any;
      U_UPSlpCd4: any;
      OpeningRemarks: any;
      U_SKILL_ENDENT: any;
      U_POL_EnderEntrega: any;
      ShipDate: any;
    },
    items: {
      listCode: any;
      itemCode: any;
      Quantity: any;
      preco: any;
      unMedida: any;
      idUn: any;
      unidade: any;
      itemName: any;
      DiscountPercent: number;
    }[]
  ) {
    const bplId = quotation.BPL_IDAssignedToInvoice || 1;
    const mainUsage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40; // 1→40, 2→90

    return {
      DocObjectCode: "oQuotations",
      DocType: "dDocument_Items",
      PriceList: header.PriceList || 1,
      BPL_IDAssignedToInvoice: bplId,
      DocDate: header.DocDate,
      DocDueDate: header.DocDueDate,
      TaxDate: header.TaxDate,
      NumAtCard: header.NumAtCard,
      CardCode: header.CardCode,
      DocCurrency: "R$",
      DocRate: 1.0,
      Comments: header.Comments || "PEDIDO DE VENDA REPRESENTANTE",
      PaymentGroupCode: header.PaymentGroupCode || 233,
      Confirmed: "tYES",
      Cancelled: "tNO",
      U_SKILL_FormaPagto: header.U_SKILL_FormaPagto || "15",
      U_Portal: header.U_Portal || "44",
      U_UPSlpCd2: header.U_UPSlpCd2 || 129,
      U_UPSlpCd3: header.U_UPSlpCd3 || 7,
      U_UPSlpCd4: header.U_UPSlpCd4 || 65,
      OpeningRemarks: header.OpeningRemarks,
      U_SKILL_ENDENT: header.U_SKILL_ENDENT,
      U_POL_EnderEntrega: header.U_POL_EnderEntrega,

      DocumentLines: items.map((item, index) => ({
        LineNum: index,
        ItemCode: item.itemCode,
        Quantity: item.Quantity || 1,
        Price: item.preco,
        Currency: "R$",
        DiscountPercent: item.DiscountPercent,
        MeasureUnit: item.unMedida,
        Usage: mainUsage, // TODAS AS LINHAS COM USAGE CORRETO
        UoMEntry: item.idUn || 0,
        UoMCode: item.unidade,
        ShipDate: header.ShipDate || new Date().toISOString().split("T")[0],
        U_SKILL_NP: item.itemName,
        ListNum: item.listCode ? Number(item.listCode) : undefined,
      })),

      DocumentSpecialLines: [],
      TaxExtension: {
        MainUsage: mainUsage, // MAINUSAGE CORRETO
      },
    };
  }

  const steps = [
    {
      title: "Cliente",
      icon: Search,
      content: (
        <ClientSearch
          quotation={quotation}
          updateQuotation={updateQuotation}
          stepRef={(el) => (stepRefs.current[0] = el)}
          onClientSelected={() => setCurrentStep(2)}
        />
      ),
    },
    {
      title: "Informações",
      icon: FileTextIcon,
      content: (
        <GeneralInformation
          quotation={quotation}
          updateQuotation={updateQuotation}
          stepRef={(el) => (stepRefs.current[1] = el)}
          onChangeClient={handleChangeClient}
        />
      ),
    },
    {
      title: "Endereços",
      icon: MapPinIcon,
      content: (
        <Addresses
          quotation={quotation}
          updateQuotation={updateQuotation}
          stepRef={(el) => (stepRefs.current[2] = el)}
        />
      ),
    },
    {
      title: "Itens",
      icon: PackageIcon,
      content: (
        <Items
          quotation={quotation}
          updateDocumentLine={updateDocumentLine}
          addDocumentLine={addDocumentLine}
          removeDocumentLine={removeDocumentLine}
          stepRef={(el) => (stepRefs.current[3] = el)}
        />
      ),
    },
    {
      title: "Revisão",
      icon: CheckCircleIcon,
      content: (
        <Review
          quotation={quotation}
          totalValue={totalValue}
          totalDiscount={totalDiscount}
          subtotal={subtotal}
          stepRef={(el) => (stepRefs.current[4] = el)}
          isSubmitting={isSubmitting}
        />
      ),
    },
  ];

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header fixo com logo, título e dois botões lado a lado */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm flex items-center px-6">
        <div className="w-full flex items-center justify-between">
          {/* Esquerda: Logo + Título */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              <img
                src={Logo || "/placeholder.svg"}
                alt="Logo"
                className="w-9 h-9 object-contain drop-shadow-sm"
              />
            </motion.div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              Sistema de Cotações
            </h1>
          </div>

          {/* Direita: Dois botões lado a lado */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBackToPortal}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-slate-700 hover:text-primary border-slate-300 rounded-md"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Portal</span>
            </Button>

            <Button
              onClick={handleViewQuotations}
              variant="default"
              size="sm"
              className="flex items-center gap-2 hover:text-primary border-slate-300 rounded-md"
            >
              <EyeIcon className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">
                Visualizar Cotações
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal: ocupa todo o espaço */}
      <main className="flex-1 pt-16 w-full h-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full flex flex-col"
        >
          {/* Área do passo com scroll */}
          <div className="flex-1 overflow-y-auto p-6">
            <CustomStepper
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              variant="default"
              allowClickNavigation={true}
            >
              {steps.map(({ title, icon: Icon, content }) => (
                <CustomStep
                  key={title}
                  label={title}
                  icon={<Icon className="h-5 w-5" />}
                >
                  <div className="h-full">{content}</div>
                </CustomStep>
              ))}
            </CustomStepper>
          </div>

          {/* Controles fixos na base */}
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-lg">
            <StepperControls
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={nextStep}
              onPrevious={prevStep}
              canGoNext={validateCurrentStep()}
              canGoPrevious={currentStep > 1}
              isLoading={isSubmitting}
              nextLabel="Próximo"
              previousLabel="Voltar"
              completeLabel="Finalizar Cotação"
              quotation={quotation}
              buildPayload={() => {
                const payload = buildQuotationPayload(
                  {
                    DocDate:
                      quotation.DocDate ||
                      new Date().toISOString().split("T")[0],
                    DocDueDate:
                      quotation.DocDueDate ||
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                    TaxDate:
                      quotation.TaxDate ||
                      quotation.DocDate ||
                      new Date().toISOString().split("T")[0],
                    PriceList: quotation.PriceListNum,
                    NumAtCard: quotation.NumAtCard || "",
                    CardCode: quotation.CardCode || "",
                    Comments: quotation.Comments || "",
                    PaymentGroupCode: quotation.PaymentGroupCode || 233,
                    U_SKILL_FormaPagto: quotation.U_SKILL_FormaPagto || "15",
                    U_Portal: quotation.U_Portal || "44",
                    U_UPSlpCd2: quotation.U_UPSlpCd2 || 129,
                    U_UPSlpCd3: quotation.U_UPSlpCd3 || 7,
                    U_UPSlpCd4: quotation.U_UPSlpCd4 || 65,
                    OpeningRemarks: quotation.OpeningRemarks || "",
                    U_SKILL_ENDENT: quotation.U_SKILL_ENDENT || "",
                    U_POL_EnderEntrega: quotation.U_POL_EnderEntrega || "",
                    ShipDate:
                      quotation.DocumentLines[0]?.ShipDate ||
                      new Date().toISOString().split("T")[0],
                  },
                  quotation.DocumentLines.map((line) => ({
                    itemCode: line.ItemCode || "",
                    Quantity: line.Quantity || 1,
                    preco: line.preco ?? 0,
                    unMedida: line.MeasureUnit || "",
                    idUn: line.UoMEntry || 0,
                    unidade: line.UoMCode || "",
                    itemName: line.U_SKILL_NP || "",
                    listCode: line.listCode,
                    DiscountPercent: line.DiscountPercent || 0,
                  }))
                );

                console.log(
                  "Payload Final (Corrigido):",
                  JSON.stringify(payload, null, 2)
                );
                return payload;
              }}
            />
          </div>
        </motion.div>
      </main>

      <div className="sr-only" role="status" aria-live="polite">
        Use as setas do teclado para navegar entre as etapas.
      </div>
    </div>
  );
}
