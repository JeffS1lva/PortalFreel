"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  ChevronRight,
  ChevronLeft,
  User,
  FileText,
  MapPin,
  ShoppingCart,
  ClipboardCheck,
  Sparkles,
  Menu,
  X,
  ChevronUp,
  CheckIcon,
} from "lucide-react";

import {
  initialQuotation,
  type DocumentLine,
  type Quotation,
} from "@/components/pages/Cotação/type";
import Logo from "@/assets/logo.png";
import { ClientSearch } from "@/components/pages/Cotação/Create/ClientSearch";
import { GeneralInformation } from "@/components/pages/Cotação/Create/InfoGeneral";
import { Addresses } from "@/components/pages/Cotação/Create/Addresses";
import { Items } from "@/components/pages/Cotação/Create/Items";
import { Review } from "@/components/pages/Cotação/Create/Review";
import { Button } from "../ui/button";
import { StepperControls } from "@/components/Steps/StepperControls"; // ✅ IMPORTADO

// ==========================================
// 1. Hook useReducedMotion para acessibilidade
// ==========================================
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ==========================================
// 2. Tipo StepData definido antes do uso
// ==========================================
interface StepData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  lightColor: string;
  textColor: string;
  ariaLabel: string;
}

// ==========================================
// 3. Componente StepIndicator
// ==========================================
interface StepIndicatorProps {
  step: StepData;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}

const StepIndicator = ({
  step,
  isActive,
  isCompleted,
  isDisabled,
  onClick,
  reducedMotion,
}: StepIndicatorProps) => {
  const Icon = step.icon;

  return (
    <motion.button
      whileHover={
        !isDisabled && !reducedMotion ? { scale: 1.05, y: -2 } : undefined
      }
      whileTap={!isDisabled && !reducedMotion ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={isDisabled}
      className={`group relative flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
        isActive ? "bg-slate-50" : "hover:bg-slate-50/50"
      } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      aria-current={isActive ? "step" : undefined}
      aria-disabled={isDisabled}
      role="tab"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isDisabled) onClick();
        }
      }}
    >
      <div className="relative">
        <motion.div
          className={`
            w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center 
            transition-all duration-300 border-2 relative z-10
            ${
              isActive
                ? `bg-gradient-to-br ${step.gradient} text-white border-transparent shadow-lg shadow-blue-500/25 scale-110`
                : isCompleted
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }
          `}
          animate={
            isActive && !reducedMotion
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(59, 130, 246, 0)",
                    "0 0 0 8px rgba(59, 130, 246, 0.1)",
                    "0 0 0 0 rgba(59, 130, 246, 0)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircleIcon className="w-5 h-5 lg:w-6 lg:h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isActive && !reducedMotion && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.gradient} opacity-30`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      <span
        className={`
        text-[10px] lg:text-xs mt-2 font-semibold transition-colors text-center
        ${isActive ? "text-slate-900" : isCompleted ? "text-emerald-600" : "text-slate-400"}
      `}
      >
        {step.title}
      </span>

      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl z-20 hidden lg:block">
        {step.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </motion.button>
  );
};

// ==========================================
// 4. Componente de Progresso Circular
// ==========================================
const CircularProgress = ({
  progress,
  currentStep,
  totalSteps,
}: {
  progress: number;
  currentStep: number;
  totalSteps: number;
}) => {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="transform -rotate-90 w-14 h-14">
        <circle
          cx="28"
          cy="28"
          r="18"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-slate-200"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="18"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-600"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 50 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-slate-900">{currentStep}</span>
        <span className="text-[8px] text-slate-400">/{totalSteps}</span>
      </div>
    </div>
  );
};

// ==========================================
// 5. COMPONENTE PRINCIPAL
// ==========================================
export function QuotationForm() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  const [quotation, setQuotation] = useState<Quotation>(initialQuotation);
  const [isSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [showStepDrawer, setShowStepDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [direction, setDirection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstMount(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Escuta evento de sucesso para limpar o formulário
  useEffect(() => {
    const handleSaved = () => {
      setQuotation(initialQuotation);
      setCurrentStep(1);
    };
    window.addEventListener("quotation-saved", handleSaved);
    return () => window.removeEventListener("quotation-saved", handleSaved);
  }, []);

  // Auto-save simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (quotation.CardCode) {
        setSaveStatus("saving");
        setTimeout(() => setSaveStatus("saved"), 800);
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [quotation, currentStep]);

  const setClientSearchRef = useCallback(
    (_el: HTMLDivElement | null) => {},
    [],
  );
  const setGeneralInfoRef = useCallback((_el: HTMLDivElement | null) => {}, []);
  const setAddressesRef = useCallback((_el: HTMLDivElement | null) => {}, []);
  const setItemsRef = useCallback((_el: HTMLDivElement | null) => {}, []);
  const setReviewRef = useCallback((_el: HTMLDivElement | null) => {}, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled((contentRef.current?.scrollTop || 0) > 20);
    };
    const ref = contentRef.current;
    ref?.addEventListener("scroll", handleScroll);
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  const steps: StepData[] = useMemo(
    () => [
      {
        id: 1,
        title: "Cliente",
        subtitle: "Identificação",
        description: "Selecione o cliente",
        icon: User,
        gradient: "from-blue-500 via-blue-600 to-indigo-600",
        lightColor: "bg-blue-50",
        textColor: "text-blue-600",
        ariaLabel: "Etapa 1: Seleção do Cliente",
      },
      {
        id: 2,
        title: "Informações",
        subtitle: "Dados Gerais",
        description: "Configure datas e informações",
        icon: FileText,
        gradient: "from-indigo-500 via-indigo-600 to-violet-600",
        lightColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        ariaLabel: "Etapa 2: Informações Gerais",
      },
      {
        id: 3,
        title: "Endereços",
        subtitle: "Entrega",
        description: "Defina local de entrega",
        icon: MapPin,
        gradient: "from-violet-500 via-violet-600 to-purple-600",
        lightColor: "bg-violet-50",
        textColor: "text-violet-600",
        ariaLabel: "Etapa 3: Endereço de Entrega",
      },
      {
        id: 4,
        title: "Itens",
        subtitle: "Produtos",
        description: "Adicione produtos ao pedido",
        icon: ShoppingCart,
        gradient: "from-purple-500 via-purple-600 to-fuchsia-600",
        lightColor: "bg-purple-50",
        textColor: "text-purple-600",
        ariaLabel: "Etapa 4: Itens do Pedido",
      },
      {
        id: 5,
        title: "Revisão",
        subtitle: "Finalização",
        description: "Revise e confirme a cotação",
        icon: ClipboardCheck,
        gradient: "from-emerald-500 via-emerald-600 to-teal-600",
        lightColor: "bg-emerald-50",
        textColor: "text-emerald-600",
        ariaLabel: "Etapa 5: Revisão e Finalização",
      },
    ],
    [],
  );

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
    const usage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40;
    setQuotation((prev) => ({
      ...prev,
      DocumentLines: [
        ...prev.DocumentLines,
        {
          LineNum: prev.DocumentLines.length,
          ItemCode: data?.ItemCode || "",
          Price: data?.Price || 0,
          MeasureUnit: data?.MeasureUnit || "UN",
          Quantity: data?.Quantity || 1,
          DiscountPercent: data?.DiscountPercent || 0,
          ShipDate: data?.ShipDate || new Date().toISOString().split("T")[0],
          Currency: quotation.DocCurrency,
          Usage: usage,
          UoMEntry: data?.idUn || 0,
          UoMCode: data?.unidade || "",
          preco: data?.preco ?? 0,
          listCode: data?.listCode,
          U_SKILL_NP: data?.U_SKILL_NP || "",
        } as DocumentLine,
      ],
    }));
  };

  const removeDocumentLine = (index: number) => {
    const updatedLines = quotation.DocumentLines.filter((_, i) => i !== index);
    updatedLines.forEach((line, i) => (line.LineNum = i));
    setQuotation((prev) => ({ ...prev, DocumentLines: updatedLines }));
  };

  const calculateTotal = () => {
    return quotation.DocumentLines.reduce((total, line) => {
      const lineTotal =
        line.Quantity * (line.preco ?? 0) * (1 - line.DiscountPercent / 100);
      return total + lineTotal;
    }, 0);
  };

  const validateStep = useCallback(
    (stepId: number): boolean => {
      switch (stepId) {
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
    },
    [
      quotation.CardCode,
      quotation.TaxDate,
      quotation.DocDueDate,
      quotation.DocumentLines.length,
    ],
  );

  const canNavigateToStep = useCallback(
    (stepId: number) => {
      if (stepId === currentStep) return true;
      if (stepId < currentStep) return true;
      return validateStep(currentStep);
    },
    [currentStep, validateStep],
  );

  const handleStepChange = useCallback(
    (newStep: number) => {
      if (canNavigateToStep(newStep)) {
        setCurrentStep(newStep);
        setShowStepDrawer(false);
        contentRef.current?.scrollTo({
          top: 0,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    },
    [canNavigateToStep, reducedMotion],
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep) && currentStep < 5) {
      setDirection(1);
      setCurrentStep((p) => p + 1);
      contentRef.current?.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }, [validateStep, currentStep, reducedMotion]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((p) => p - 1);
      contentRef.current?.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }, [currentStep, reducedMotion]);

  // ==========================================
  // ✅ FUNÇÃO BUILD PAYLOAD (mesma do código antigo)
  // ==========================================
  const buildPayload = useCallback(() => {
    const bplId = quotation.BPL_IDAssignedToInvoice || 1;
    const mainUsage = bplId === 1 ? 40 : bplId === 2 ? 90 : 40;

    return {
      DocObjectCode: "oQuotations",
      DocType: "dDocument_Items",
      PriceList: quotation.PriceListNum || 1,
      BPL_IDAssignedToInvoice: bplId,
      DocDate: quotation.DocDate || new Date().toISOString().split("T")[0],
      DocDueDate:
        quotation.DocDueDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      TaxDate:
        quotation.TaxDate ||
        quotation.DocDate ||
        new Date().toISOString().split("T")[0],
      NumAtCard: quotation.NumAtCard || "",
      CardCode: quotation.CardCode || "",
      DocCurrency: "R$",
      DocRate: 1.0,
      Comments: quotation.Comments || "PEDIDO DE VENDA REPRESENTANTE",
      PaymentGroupCode: quotation.PaymentGroupCode || 233,
      Confirmed: "tYES",
      Cancelled: "tNO",
      U_SKILL_FormaPagto: quotation.U_SKILL_FormaPagto || "15",
      U_Portal: quotation.U_Portal || "44",
      U_UPSlpCd2: quotation.U_UPSlpCd2 || 129,
      U_UPSlpCd3: quotation.U_UPSlpCd3 || 7,
      U_UPSlpCd4: quotation.U_UPSlpCd4 || 65,
      OpeningRemarks: quotation.OpeningRemarks || "",
      U_SKILL_ENDENT: quotation.U_SKILL_ENDENT || "",
      U_POL_EnderEntrega: quotation.U_POL_EnderEntrega || "",
      DocumentLines: quotation.DocumentLines.map((line, index) => ({
        LineNum: index,
        ItemCode: line.ItemCode,
        Quantity: line.Quantity || 1,
        Price: line.preco,
        Currency: "R$",
        DiscountPercent: line.DiscountPercent,
        MeasureUnit: line.MeasureUnit,
        Usage: mainUsage,
        UoMEntry: line.UoMEntry || 0,
        UoMCode: line.UoMCode,
        ShipDate: line.ShipDate || new Date().toISOString().split("T")[0],
        ListNum: line.listCode ? Number(line.listCode) : undefined,
      })),
      TaxExtension: { MainUsage: mainUsage },
    };
  }, [quotation]);

  const currentStepData = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;

  // ==========================================
  // HEADER RESPONSIVO OTIMIZADO
  // ==========================================
  const InnovativeHeader = (
    <motion.header
      initial={reducedMotion ? false : { y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ${
        scrolled ? "py-1 md:py-2" : "py-2 md:py-4"
      }`}
      role="banner"
    >
      <div className="mx-2 sm:mx-4 lg:mx-8 shadow-2xl shadow-blue-500/20 rounded-2xl md:rounded-3xl lg:rounded-4xl border">
        <motion.div
          className={`
            relative overflow-hidden rounded-xl md:rounded-3xl lg:rounded-[2rem] 
            ${
              scrolled
                ? "bg-white/90 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 border border-white/40"
                : "bg-white/70 backdrop-blur-xl border border-white/30"
            }
          `}
          style={{
            boxShadow: scrolled
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.6)"
              : "0 8px 32px rgba(31, 38, 135, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
          layout
        >
          {/* Efeito de brilho animado */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative px-3 sm:px-4 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2">
            
            {/* LADO ESQUERDO: Logo - Responsivo */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <motion.button
                onClick={() => navigate("/")}
                className="relative group focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl p-1"
                aria-label="Voltar para página inicial"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Logo responsivo com transição suave */}
                <div className="relative overflow-hidden">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-6 sm:h-8 lg:h-10 w-auto max-w-[100px] sm:max-w-[120px] lg:max-w-[160px] object-contain transition-all duration-300"
                  />
                </div>
              </motion.button>

              {/* Separador - escondido em mobile muito pequeno */}
              <div className="hidden sm:block h-8 lg:h-14 w-px bg-gradient-to-b from-transparent via-slate-400 to-transparent flex-shrink-0" />
            </div>

            {/* CENTRO: Informações da Etapa - OCULTO EM MOBILE */}
            <div className="hidden md:flex flex-1 items-center justify-center min-w-0 px-2">
              <div className="text-center">
                {/* Badge do sistema - visível apenas md+ */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
                  <span className="w-2 h-2 bg-[#f4c430] rounded-full animate-pulse flex-shrink-0"></span>
                  <span className="text-slate-600 text-sm font-medium whitespace-nowrap">
                    Sistema de <span className="text-[#1e3a5f] font-semibold">Cotações</span>
                  </span>
                </div>
                
                {/* Subtítulo */}
                <p className="mt-2 text-slate-500 text-sm">
                  Agilidade • Controle • Resultados
                </p>
              </div>
            </div>

            {/* LADO DIREITO: Ações - Responsivo */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              
              {/* Status de salvamento - ajustado para mobile */}
              <AnimatePresence mode="wait">
                {saveStatus !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    className={`
                      hidden sm:flex items-center gap-1.5 lg:gap-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-full
                      ${
                        saveStatus === "saving"
                          ? "bg-amber-50/80 text-amber-600 border border-amber-200/50"
                          : "bg-emerald-50/80 text-emerald-600 border border-emerald-200/50"
                      }
                      backdrop-blur-sm shadow-sm
                    `}
                  >
                    {saveStatus === "saving" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <CheckIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </motion.div>
                    )}
                    <span className="text-[10px] lg:text-xs font-semibold hidden lg:inline">
                      {saveStatus === "saving" ? "Salvando..." : "Salvo"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botões de ação desktop - ajustados */}
              <div className="hidden md:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="group relative px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/50 group-hover:bg-slate-200/80 transition-colors" />
                  <div className="relative flex items-center gap-1.5 lg:gap-2 text-slate-600 group-hover:text-slate-900 font-medium text-xs lg:text-sm">
                    <ArrowLeftIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:-translate-x-0.5" />
                    <span className="hidden lg:inline">Voltar</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/cotacoes?embed=true")}
                  className="group relative px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 group-hover:border-slate-300/50 transition-colors shadow-sm" />
                  <div className="relative flex items-center gap-1.5 lg:gap-2 text-slate-600 group-hover:text-slate-900 font-medium text-xs lg:text-sm">
                    <EyeIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">Visualizar</span>
                  </div>
                </motion.button>
              </div>

              {/* Menu mobile - sempre visível em mobile */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(true)}
                className="md:hidden relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg border border-white/50"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5 text-slate-700" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </motion.button>
            </div>
          </div>

          {/* Barra de progresso mobile - otimizada */}
          <div className="md:hidden h-1 bg-slate-100/50 relative overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentStepData.gradient}`}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/50 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    </motion.header>
  );

  // ==========================================
  // FOOTER - MANTIDO EXATAMENTE COMO NO CÓDIGO NOVO
  // ==========================================
  const SophisticatedFooter = useMemo(() => {
    const isValid = validateStep(currentStep);

    // Só anima na primeira montagem
    const footerAnimationProps =
      isFirstMount && !reducedMotion
        ? { initial: { y: 100 }, animate: { y: 0 } }
        : { initial: false, animate: { y: 0 } };

    return (
      <motion.footer
        {...footerAnimationProps}
        className={`fixed left-0 right-0 z-40 transition-all duration-300  pb-12 ${
          isMobile ? "bottom-0" : "bottom-0 lg:bottom-6"
        }`}
        role="contentinfo"
      >
        <div
          className={`mx-auto transition-all duration-300 ${
            isMobile ? "w-full" : "w-full lg:max-w-6xl lg:px-4"
          }`}
        >
          <div
            className={`
            bg-white/98 backdrop-blur-xl border-t lg:border border-slate-200/60 shadow-2xl shadow-slate-900/10
            ${isMobile ? "rounded-t-3xl lg:rounded-2xl" : "lg:rounded-2xl"}
            overflow-hidden
          `}
          >
            <AnimatePresence>
              {showStepDrawer && isMobile && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowStepDrawer(false)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      reducedMotion
                        ? undefined
                        : { type: "spring", damping: 25, stiffness: 300 }
                    }
                    className="border-b border-slate-100 bg-slate-50/50"
                    role="dialog"
                    aria-label="Navegação de etapas"
                  >
                    <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                      <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                        Etapas da Cotação
                      </h3>
                      {steps.map((step, idx) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const canAccess = canNavigateToStep(step.id);
                        const Icon = step.icon;

                        return (
                          <motion.button
                            key={step.id}
                            initial={
                              reducedMotion ? false : { x: -20, opacity: 0 }
                            }
                            animate={{ x: 0, opacity: 1 }}
                            transition={
                              reducedMotion ? undefined : { delay: idx * 0.05 }
                            }
                            onClick={() => handleStepChange(step.id)}
                            disabled={!canAccess}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                              isCurrent
                                ? `bg-gradient-to-r ${step.gradient} text-white shadow-lg`
                                : isCompleted
                                  ? "bg-white text-slate-700 shadow-sm border border-slate-200"
                                  : "bg-transparent text-slate-400"
                            } ${!canAccess && "opacity-40"}`}
                            aria-current={isCurrent ? "step" : undefined}
                            aria-disabled={!canAccess}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isCurrent
                                  ? "bg-white/20"
                                  : isCompleted
                                    ? step.lightColor + " " + step.textColor
                                    : "bg-slate-100"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircleIcon className="w-5 h-5" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-sm">
                                {step.title}
                              </p>
                              <p
                                className={`text-xs ${isCurrent ? "text-white/70" : "text-slate-500"}`}
                              >
                                {step.description}
                              </p>
                            </div>
                            {isCurrent && (
                              <motion.div
                                layoutId="currentIndicator"
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="px-3 py-3 lg:px-6 lg:py-4">
              <div className="flex items-center gap-2 lg:gap-4">
                <motion.div
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0"
                >
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className="gap-1 lg:gap-2 h-11 lg:h-12 px-3 lg:px-6 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 text-sm lg:text-base transition-all"
                    aria-label="Voltar para etapa anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">
                      Anterior
                    </span>
                  </Button>
                </motion.div>

                <div className="flex-1 flex items-center justify-center min-w-0">
                  {isMobile ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowStepDrawer(true)}
                      className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-100/80 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Etapa ${currentStep} de ${steps.length}. Toque para navegar entre etapas`}
                      aria-expanded={showStepDrawer}
                    >
                      <CircularProgress
                        progress={progress}
                        currentStep={currentStep}
                        totalSteps={steps.length}
                      />
                      <div className="text-left min-w-0">
                        <p className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {currentStepData.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {currentStepData.subtitle}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: showStepDrawer ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      </motion.div>
                    </motion.button>
                  ) : (
                    <nav
                      className="flex items-center gap-1 lg:gap-2"
                      aria-label="Progresso do formulário"
                    >
                      {steps.map((step, idx) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const canAccess = canNavigateToStep(step.id);

                        return (
                          <React.Fragment key={step.id}>
                            <StepIndicator
                              step={step}
                              isActive={isCurrent}
                              isCompleted={isCompleted}
                              isDisabled={!canAccess}
                              onClick={() => handleStepChange(step.id)}
                              reducedMotion={reducedMotion}
                            />

                            {idx < steps.length - 1 && (
                              <div
                                className="w-3 lg:w-6 h-0.5 bg-slate-200 relative mx-0.5 lg:mx-1 flex-shrink-0"
                                aria-hidden="true"
                              >
                                <motion.div
                                  className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: isCompleted ? "100%" : "0%",
                                  }}
                                  transition={
                                    reducedMotion
                                      ? undefined
                                      : { duration: 0.4, delay: 0.1 }
                                  }
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </nav>
                  )}
                </div>

                <motion.div
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 relative"
                >
                  {currentStep === steps.length ? (
                    // ✅ CORREÇÃO: Botão Finalizar agora usa StepperControls via ref ou callback
                    <StepperControls
                      currentStep={currentStep}
                      totalSteps={steps.length}
                      onNext={nextStep}
                      onPrevious={prevStep}
                      canGoNext={isValid && !isSubmitting}
                      canGoPrevious={currentStep > 1 && !isSubmitting}
                      isLoading={isSubmitting}
                      nextLabel="Próximo"
                      previousLabel="Voltar"
                      completeLabel="Finalizar Cotação"
                      quotation={quotation}
                      buildPayload={buildPayload}
                      // ✅ Props visuais customizadas para manter o design
                      className="!bg-transparent !shadow-none !border-0 !p-0"
                    />
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!isValid || isSubmitting}
                      className={`gap-1 lg:gap-2 h-11 lg:h-12 px-4 lg:px-6 rounded-xl bg-gradient-to-r ${currentStepData.gradient} text-white shadow-lg shadow-blue-500/25 font-semibold disabled:opacity-40 text-sm lg:text-base whitespace-nowrap transition-all ${
                        !isValid ? "grayscale" : ""
                      }`}
                      aria-label={`Avançar para ${steps[currentStep]?.title || "próxima etapa"}`}
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <span className="sm:hidden">Próx</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    );
  }, [
    isFirstMount,
    reducedMotion,
    isMobile,
    currentStep,
    validateStep,
    steps,
    progress,
    currentStepData,
    canNavigateToStep,
    handleStepChange,
    prevStep,
    nextStep,
    isSubmitting,
    showStepDrawer,
    quotation,
    buildPayload,
  ]);

  // ==========================================
  // MENU MOBILE
  // ==========================================
  const RefinedMobileMenu = useMemo(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return (
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={
                reducedMotion
                  ? undefined
                  : { type: "spring", damping: 25, stiffness: 200 }
              }
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl md:hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <img src={Logo} alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="font-bold text-slate-900">Menu</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMenu(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <motion.button
                  initial={reducedMotion ? false : { x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => {
                    navigate("/cotacoes?embed=true");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <EyeIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Visualizar Cotações</p>
                    <p className="text-xs text-slate-500">
                      Ver todas as cotações
                    </p>
                  </div>
                </motion.button>

                <div className="pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                    Progresso Atual
                  </p>
                  <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                    {steps.map((step) => {
                      const isDone = currentStep > step.id;
                      const isActive = currentStep === step.id;
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 text-sm p-2 rounded-lg"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isDone
                                ? "bg-emerald-100 text-emerald-600"
                                : isActive
                                  ? `bg-gradient-to-r ${step.gradient} text-white shadow-md`
                                  : "bg-white text-slate-400 border border-slate-200"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              step.id
                            )}
                          </div>
                          <span
                            className={
                              isActive
                                ? "font-semibold text-slate-900"
                                : "text-slate-600"
                            }
                          >
                            {step.title}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {quotation.CardCode && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                      Resumo Atual
                    </p>
                    <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Cliente:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[120px]">
                          {quotation.CardCode}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Itens:</span>
                        <span className="font-medium text-slate-900">
                          {quotation.DocumentLines.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-bold text-emerald-600">
                          R${" "}
                          {calculateTotal().toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate("/");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Sair da Cotação
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }, [
    showMenu,
    reducedMotion,
    steps,
    currentStep,
    quotation.CardCode,
    quotation.DocumentLines.length,
    navigate,
    calculateTotal,
  ]);

  // ==========================================
  // VARIANTES DE ANIMAÇÃO
  // ==========================================
  const pageVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 50 : -50,
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -50 : 50,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    }),
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-hidden ">
      {InnovativeHeader}
      {RefinedMobileMenu}

      <main
        ref={contentRef}
        className={`flex-1 overflow-y-auto  ${isMobile ? "pt-16 pb-24" : "pt-16 lg:pt-20 pb-20 lg:pb-28"}`}
        role="main"
        aria-live="polite"
      >
        <div className="w-full min-h-full p-4 lg:p-8 xl:p-12 ">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full "
            >
              {currentStep === 1 && (
                <ClientSearch
                  quotation={quotation}
                  updateQuotation={updateQuotation}
                  onClientSelected={() => {
                    setDirection(1);
                    setCurrentStep(2);
                  }}
                  stepRef={setClientSearchRef}
                />
              )}
              {currentStep === 2 && (
                <GeneralInformation
                  quotation={quotation}
                  updateQuotation={updateQuotation}
                  onChangeClient={() => {
                    setQuotation(initialQuotation);
                    setCurrentStep(1);
                  }}
                  stepRef={setGeneralInfoRef}
                />
              )}
              {currentStep === 3 && (
                <Addresses
                  quotation={quotation}
                  updateQuotation={updateQuotation}
                  stepRef={setAddressesRef}
                />
              )}
              {currentStep === 4 && (
                <Items
                  quotation={quotation}
                  updateDocumentLine={updateDocumentLine}
                  addDocumentLine={addDocumentLine}
                  removeDocumentLine={removeDocumentLine}
                  stepRef={setItemsRef}
                />
              )}
              {currentStep === 5 && (
                <Review
                  quotation={quotation}
                  totalValue={calculateTotal()}
                  totalDiscount={0}
                  subtotal={calculateTotal()}
                  isSubmitting={isSubmitting}
                  stepRef={setReviewRef}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {SophisticatedFooter}
    </div>
  );
}