"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosConfig";
import { isAxiosError } from "axios";
import { InputCotacao } from "@/components/ui/input";
import {
  AlertCircle,
  WifiOff,
  ShieldAlert,
  ServerCrash,
  UserX,
  X,
  ChevronRight,
  Grid3X3,
  ArrowUpRight,
  Fingerprint,
  QrCode,
  Crown,
  Zap,
  ScanLine,
  Mic,
} from "lucide-react";
import type { Client, ClientSearchProps } from "@/components/pages/Cotação/type";
import { AllClientsModal } from "./AllClientModal";
import { apiBase } from "@/lib/api";
import { tokenStore } from "@/utils/tokenStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BPAddress {
  addressName: string;
  street?: string;
  streetNo?: string;
  block?: string;
  buildingFloorRoom?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface ErrorAlertProps {
  type:
    | "auth"
    | "permission"
    | "server"
    | "connection"
    | "not-found"
    | "generic";
  message: string;
}

// Componente de partículas flutuantes
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#1e3a5f]/20 rounded-full"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: 0,
          }}
          animate={{
            y: [null, Math.random() * -100 + "%"],
            scale: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Componente de onda sonora visual
const SoundWave = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-[#f4c430] rounded-full"
          animate={
            isActive
              ? {
                  height: [4, 16, 4],
                }
              : { height: 4 }
          }
          transition={{
            duration: 0.5,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Card 3D tilt effect - Desativado em mobile para performance
const TiltCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Desativa efeito 3D em telas touch
    if (window.matchMedia("(pointer: coarse)").matches) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};

// Modal de todos os clientes - Otimizado para mobile


function ErrorAlert({ type, message }: ErrorAlertProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "auth":
        return {
          icon: ShieldAlert,
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          textColor: "text-amber-200",
          iconColor: "text-amber-400",
        };
      case "permission":
        return {
          icon: UserX,
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-200",
          iconColor: "text-red-400",
        };
      case "server":
        return {
          icon: ServerCrash,
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-200",
          iconColor: "text-purple-400",
        };
      case "connection":
        return {
          icon: WifiOff,
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/30",
          textColor: "text-orange-200",
          iconColor: "text-orange-400",
        };
      case "not-found":
        return {
          icon: AlertCircle,
          bgColor: "bg-slate-500/10",
          borderColor: "border-slate-500/30",
          textColor: "text-slate-200",
          iconColor: "text-slate-400",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-slate-500/10",
          borderColor: "border-slate-500/30",
          textColor: "text-slate-200",
          iconColor: "text-slate-400",
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`p-3 md:p-4 rounded-lg md:rounded-xl border backdrop-blur-sm ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-2.5 md:gap-3">
        <Icon className={`h-4 w-4 md:h-5 md:w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <p className={`text-xs md:text-sm font-medium leading-relaxed ${config.textColor}`}>
          {message}
        </p>
      </div>
    </motion.div>
  );
}

export function ClientSearch({
  updateQuotation,
  stepRef,
  onClientSelected,
}: ClientSearchProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: ErrorAlertProps["type"];
    message: string;
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setFocusedIndex] = useState(-1);
  const [, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAllClients, setShowAllClients] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const toggleVoiceSearch = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setSearchTerm("INDÚSTRIA POLAR");
      }, 2000);
    }
  };

  const loadAllClients = async () => {
    setLoadingAll(true);
    setShowAllClients(true);

    try {
      const token = tokenStore.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${apiBase}/Clientes`, {
        params: { top: 1000, skip: 0 },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.value || response.data.data || response.data;
      setAllClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setAllClients([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const getUserInternalCode = (): string | null => {
    const authData = tokenStore.getAuthData();
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.internalCode || parsed.slpCode;
      } catch {
        return null;
      }
    }
    return null;
  };

  const removeDuplicateClients = (clients: Client[]): Client[] => {
    return clients.filter(
      (client, index, self) =>
        index === self.findIndex((c) => c.cardCode === client.cardCode),
    );
  };

  const fetchClientQuotations = async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = tokenStore.getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      if (isTokenExpired(token)) {
        tokenStore.setToken(null as unknown as string);
        navigate("/login");
        return;
      }

      const slpCode = getUserInternalCode();

      if (!slpCode) {
        setError({
          type: "auth",
          message:
            "Não foi possível identificar o código do usuário. Por favor, realize o login novamente.",
        });
        tokenStore.setToken(null as unknown as string);
        tokenStore.setAuthData(null as unknown as string);
        navigate("/login");
        return;
      }

      const params = { filtro: term };

      const response = await axios.get(`${apiBase}/Clientes`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      const clientsData =
        response.data.value || response.data.data || response.data;

      if (Array.isArray(clientsData)) {
        const uniqueClients = removeDuplicateClients(clientsData);
        setSuggestions(uniqueClients);
        setShowSuggestions(uniqueClients.length > 0);

        if (uniqueClients.length === 0) {
          setError({
            type: "not-found",
            message: "Nenhum cliente encontrado. Tente outro termo.",
          });
        } else {
          setError(null);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setError({
          type: "not-found",
          message: "Nenhum cliente encontrado.",
        });
      }
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError({
            type: "auth",
            message: "Sessão expirada. Faça login novamente.",
          });
          tokenStore.setToken(null as unknown as string);
          tokenStore.setAuthData(null as unknown as string);
          navigate("/login");
        } else if (status === 404) {
          setError({
            type: "not-found",
            message: "Cliente não encontrado ou sem permissão.",
          });
        } else if (status === 500) {
          setError({
            type: "server",
            message: "Erro no servidor. Tente novamente mais tarde.",
          });
        } else if (status === 403) {
          setError({
            type: "permission",
            message: "Acesso negado.",
          });
        } else {
          setError({
            type: "generic",
            message: `Erro: ${status || "Desconhecido"}`,
          });
        }
      } else {
        setError({
          type: "connection",
          message: "Sem conexão com a internet.",
        });
      }

      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        fetchClientQuotations(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setError(null);
    }
  }, [searchTerm]);

  const handleSelectSuggestion = (selectedClient: Client) => {
    updateQuotation("CardCode", selectedClient.cardCode);
    updateQuotation("CardName", selectedClient.cardName);
    updateQuotation("cnpj", selectedClient.cnpj);
    updateQuotation("CardType", selectedClient.cardType);
    updateQuotation("SalesPersonCode", selectedClient.salesPersonCode);
    updateQuotation("PriceListNum", selectedClient.priceListNum);
    updateQuotation("Email", selectedClient.email);
    updateQuotation("CreditLimit", selectedClient.creditLimit);
    updateQuotation(
      "CurrentAccountBalance",
      selectedClient.currentAccountBalance,
    );
    updateQuotation("PaymentGroupCode", selectedClient.paymentGroupCode);
    updateQuotation("BilltoDefault", selectedClient.billtoDefault);
    updateQuotation("U_UPSlpCd2", selectedClient.upslpCd2);
    updateQuotation("U_UPSlpCd3", selectedClient.upslpCd3);
    updateQuotation("U_UPSlpCd4", selectedClient.upslpCd4);
    updateQuotation("ShipToDefault", selectedClient.shipToDefault);
    updateQuotation("BPAddresses", selectedClient.bpAddresses);

    const deliveryAddr = selectedClient.bpAddresses.find(
      (addr: BPAddress) => addr.addressName === selectedClient.shipToDefault,
    );
    const uSkillEndEnt = deliveryAddr?.addressName || "";
    const uPolEnderEntrega = [
      deliveryAddr?.street || "",
      deliveryAddr?.streetNo ? `, ${deliveryAddr.streetNo}` : "",
      deliveryAddr?.block || "",
      deliveryAddr?.buildingFloorRoom
        ? `, ${deliveryAddr.buildingFloorRoom}`
        : "",
      deliveryAddr?.city || "",
      deliveryAddr?.state ? ` - ${deliveryAddr.state}` : "",
      deliveryAddr?.zipCode ? `, ${deliveryAddr.zipCode}` : "",
    ]
      .filter(Boolean)
      .join("");

    updateQuotation("U_SKILL_ENDENT", uSkillEndEnt);
    updateQuotation("U_POL_EnderEntrega", uPolEnderEntrega);
    updateQuotation(
      "U_SKILL_FormaPagto",
      selectedClient.U_SKILL_FormaPagto || "",
    );
    updateQuotation("U_Portal", selectedClient.U_Portal || "");
    updateQuotation(
      "BPL_IDAssignedToInvoice",
      selectedClient.BPL_IDAssignedToInvoice || 1,
    );
    updateQuotation("DocCurrency", selectedClient.DocCurrency || "R$");
    updateQuotation("DocRate", selectedClient.DocRate || 1);
    updateQuotation("Confirmed", selectedClient.Confirmed || "tNO");
    updateQuotation("Cancelled", selectedClient.Cancelled || "tNO");

    setSearchTerm(selectedClient.cardCode || "");
    setShowSuggestions(false);
    setFocusedIndex(-1);
    onClientSelected?.();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperValue = e.target.value.toUpperCase();
    setSearchTerm(upperValue);
    setError(null);
    setFocusedIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAllClients) {
          setShowAllClients(false);
        } else {
          clearSearch();
        }
      }
      if (
        e.key === "Enter" &&
        searchTerm.length >= 3 &&
        !loading &&
        !showAllClients
      ) {
        fetchClientQuotations(searchTerm);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, loading, showAllClients]);

  return (
    <TooltipProvider>
      <div
        ref={stepRef}
        onMouseMove={handleMouseMove}
        className="relative w-full  overflow-hidden flex flex-col  py-15 md:py-50 lg:py-40"
      >
        {/* Gradiente base */}
        <div className="absolute inset-0 z-0" />

        {/* Grid animado - Menos opaco em mobile */}
        <div className="absolute inset-0 opacity-10 md:opacity-20 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(244,196,48,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,196,48,0.1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              animation: "gridMove 20s linear infinite",
            }}
          />
        </div>

        <FloatingParticles />

        {/* Conteúdo principal - AJUSTADO: Desktop mais compacto, mobile com espaçamento */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 w-full  py-8 md:py-4 lg:py-0 ">
          
          {/* Título - Desktop: margens menores, Mobile: margens maiores */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-4 md:mb-3 lg:mb-4 shrink-0"
          >
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-[#1e3a5f] mb-2 md:mb-1 lg:mb-2 tracking-tight leading-tight">
              <span className="relative inline-block">
                Encontre
                <motion.span
                  className="absolute -inset-1 bg-[#f4c430]/20 -skew-x-6 rounded blur-sm"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
              <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4c430] via-[#1e3a5f] to-[#f4c430] animate-gradient bg-[length:200%_auto]">
                {" "}
                seu cliente
              </span>
            </h2>
            <p className="text-slate-500 text-sm md:text-sm max-w-md mx-auto px-4 sm:px-0 mt-1 md:mt-0">
              Busca inteligente com visualização completa da base
            </p>
          </motion.div>

          {/* Interface de busca - Centralizada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl relative px-2 sm:px-0"
          >
            {/* Container principal - Estilo mobile otimizado */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-900/10 overflow-hidden">
              {/* Input */}
              <div className="relative flex items-center p-2 md:p-3">
                <TiltCard className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#0d2137] text-white mr-2 md:mr-3 shadow-lg">
                  {isListening ? (
                    <SoundWave isActive={true} />
                  ) : (
                    <Fingerprint className="w-6 h-6 md:w-7 md:h-7" />
                  )}
                </TiltCard>

                <div className="flex-1 relative min-w-0">
                  <InputCotacao
                    ref={inputRef}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Código, nome ou CNPJ..."
                    className="w-full bg-transparent border-0 text-[#1e3a5f] text-base md:text-lg placeholder:text-slate-400 focus-visible:ring-0 h-12 md:h-14 font-medium truncate px-0"
                    disabled={loading || isListening}
                  />
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f4c430] text-xs md:text-sm font-medium"
                    >
                      Ouvindo...
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2">
                  {/* Botão de voz - Visível apenas em tablets/desktop com tooltip */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleVoiceSearch}
                        className={`hidden md:flex w-10 h-10 md:w-12 md:h-12 rounded-xl items-center justify-center transition-colors ${
                          isListening
                            ? "bg-red-500/20 text-red-400 animate-pulse"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1e3a5f]"
                        }`}
                      >
                        {isListening ? (
                          <ScanLine className="w-5 h-5 " />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      <p className="text-xs font-medium">Busca por áudio</p>
                    </TooltipContent>
                  </Tooltip>

                  {searchTerm ? (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={clearSearch}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1e3a5f] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  ) : null}

                  {loading ? (
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#f4c430] flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        searchTerm.length >= 3 &&
                        fetchClientQuotations(searchTerm)
                      }
                      disabled={searchTerm.length < 3}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#f4c430] to-[#d4a820] text-[#1e3a5f] font-bold flex items-center justify-center shadow-lg shadow-[#f4c430]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Resultados - Altura adaptativa */}
              <AnimatePresence mode="wait">
                {showSuggestions && suggestions.length > 0 ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 max-h-[40vh] md:max-h-[35vh] overflow-y-auto"
                  >
                    <div className="p-2">
                      {suggestions.map((client, idx) => (
                        <motion.button
                          key={client.cardCode}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{
                            x: 4,
                            backgroundColor: "rgba(30, 58, 95, 0.05)",
                          }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSelectSuggestion(client)}
                          onMouseEnter={() => setFocusedIndex(idx)}
                          className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl text-left group transition-colors"
                        >
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#0d2137]/10 border border-[#1e3a5f]/10 flex items-center justify-center text-[#1e3a5f] font-bold text-base md:text-lg group-hover:from-[#f4c430] group-hover:to-[#d4a820] group-hover:text-[#1e3a5f] transition-all flex-shrink-0">
                            {client.cardName?.charAt(0) || "C"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#1e3a5f] font-semibold truncate group-hover:text-[#f4c430] transition-colors text-sm md:text-base">
                              {client.cardName}
                            </h4>
                            <div className="flex items-center gap-2 md:gap-3 text-xs text-slate-500">
                              <span className="font-mono text-[#f4c430] font-medium">
                                {client.cardCode}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:inline" />
                              <span className="truncate hidden sm:inline">
                                {client.cnpj || "Sem CNPJ"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Botão de visualizar todos - Desktop: margem menor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-3 md:mt-2 lg:mt-3 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadAllClients}
                className="group inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-white hover:border-[#f4c430]/30 transition-all text-sm md:text-base shadow-sm cursor-pointer"
              >
                <Grid3X3 className="w-4 h-4 md:w-5 md:h-5 text-[#f4c430]" />
                <span className="font-medium text-[#1e3a5f]">
                  Ver todos os clientes
                </span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#1e3a5f]" />
                </motion.span>
              </motion.button>
            </motion.div>

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-3 md:mt-4"
                >
                  <ErrorAlert type={error.type} message={error.message} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Features - Grid responsivo - Desktop: margem menor e mais compacto */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 md:mt-4 lg:mt-15 grid grid-cols-3 gap-4 md:gap-6 max-w-lg md:max-w-xl w-full px-4"
          >
            {[
              { icon: Zap, label: "Instantâneo", color: "#f4c430" },
              { icon: Crown, label: "Preciso", color: "#1e3a5f" },
              { icon: QrCode, label: "Moderno", color: "#f4c430" },
            ].map((feat, idx) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-center gap-2 md:gap-2 text-center"
              >
                <div
                  className="w-12 h-12 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: feat.color }}
                >
                  <feat.icon className="w-6 h-6 md:w-6 md:h-6" />
                </div>
                <span className="text-slate-500 text-xs md:text-xs font-medium">
                  {feat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Modal de todos os clientes */}
        <AllClientsModal
          isOpen={showAllClients}
          onClose={() => setShowAllClients(false)}
          onSelect={handleSelectSuggestion}
          clients={allClients}
          loading={loadingAll}
        />

        {/* Estilos globais otimizados */}
        <style>{`
          @keyframes gridMove {
            0% { transform: translateY(0); }
            100% { transform: translateY(40px); }
          }
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
          
          /* Scrollbar estilizada */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(30, 58, 95, 0.2);
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(30, 58, 95, 0.4);
          }
          
          /* Prevenir zoom em inputs no iOS */
          @supports (-webkit-touch-callout: none) {
            input, textarea, select {
              font-size: 16px;
            }
          }
          
          /* Animações suaves em dispositivos que suportam */
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}