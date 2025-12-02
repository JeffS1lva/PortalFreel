"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { InputCotacao } from "@/components/ui/input";
import {
  Search,
  AlertCircle,
  WifiOff,
  ShieldAlert,
  ServerCrash,
  UserX,
  Building2,
  Mail,
  FileText,
  FileChartColumn,
  ArrowDown10,
} from "lucide-react";
import type { Quotation } from "@/components/pages/Cotação/type";

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

interface Client {
  cardCode: string;
  cardName: string;
  cnpj?: string;
  cardType?: string;
  salesPersonCode?: number;
  priceListNum?: number;
  email?: string;
  creditLimit?: number;
  currentAccountBalance?: number;
  paymentGroupCode?: number;
  billtoDefault?: string;
  upslpCd2?: string;
  upslpCd3?: string;
  upslpCd4?: string;
  shipToDefault?: string;
  bpAddresses: BPAddress[];
  U_SKILL_FormaPagto?: string;
  U_Portal?: string;
  BPL_IDAssignedToInvoice?: number;
  DocCurrency?: string;
  DocRate?: number;
  Confirmed?: string;
  Cancelled?: string;
}

interface ClientSearchProps {
  quotation: Quotation;
  updateQuotation: (field: keyof Quotation, value: any) => void;
  stepRef: (el: HTMLDivElement | null) => void;
  onClientSelected?: () => void;
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

function ErrorAlert({ type, message }: ErrorAlertProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "auth":
        return {
          icon: ShieldAlert,
          bgColor: "bg-amber-500/5",
          borderColor: "border-amber-500/20",
          textColor: "text-amber-900 dark:text-amber-200",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "permission":
        return {
          icon: UserX,
          bgColor: "bg-red-500/5",
          borderColor: "border-red-500/20",
          textColor: "text-red-900 dark:text-red-200",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "server":
        return {
          icon: ServerCrash,
          bgColor: "bg-purple-500/5",
          borderColor: "border-purple-500/20",
          textColor: "text-purple-900 dark:text-purple-200",
          iconColor: "text-purple-600 dark:text-purple-400",
        };
      case "connection":
        return {
          icon: WifiOff,
          bgColor: "bg-orange-500/5",
          borderColor: "border-orange-500/20",
          textColor: "text-orange-900 dark:text-orange-200",
          iconColor: "text-orange-600 dark:text-orange-400",
        };
      case "not-found":
        return {
          icon: AlertCircle,
          bgColor: "bg-slate-500/5",
          borderColor: "border-slate-500/20",
          textColor: "text-slate-900 dark:text-slate-200",
          iconColor: "text-slate-600 dark:text-slate-400",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-slate-500/5",
          borderColor: "border-slate-500/20",
          textColor: "text-slate-900 dark:text-slate-200",
          iconColor: "text-slate-600 dark:text-slate-400",
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
      className={`mt-3 p-4 rounded-xl border ${config.bgColor} ${config.borderColor} backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <p
          className={`text-sm font-medium leading-relaxed ${config.textColor}`}
        >
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
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const getUserInternalCode = (): string | null => {
    const authData = localStorage.getItem("authData");
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
        index === self.findIndex((c) => c.cardCode === client.cardCode)
    );
  };

  const fetchClientQuotations = async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
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
        localStorage.removeItem("token");
        localStorage.removeItem("authData");
        navigate("/login");
        return;
      }

      const params = { filtro: term };

      const response = await axios.get("/api/external/Clientes", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Status da resposta:", response.status);
      console.log("Headers completos:", response.headers);
      console.log("Dados brutos retornados (response.data):", response.data);

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
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError({
            type: "auth",
            message: "Sessão expirada. Faça login novamente.",
          });
          localStorage.removeItem("token");
          localStorage.removeItem("authData");
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
      selectedClient.currentAccountBalance
    );
    updateQuotation("PaymentGroupCode", selectedClient.paymentGroupCode);
    updateQuotation("BilltoDefault", selectedClient.billtoDefault);
    updateQuotation("U_UPSlpCd2", selectedClient.upslpCd2);
    updateQuotation("U_UPSlpCd3", selectedClient.upslpCd3);
    updateQuotation("U_UPSlpCd4", selectedClient.upslpCd4);
    updateQuotation("ShipToDefault", selectedClient.shipToDefault);
    updateQuotation("BPAddresses", selectedClient.bpAddresses);

    const deliveryAddr = selectedClient.bpAddresses.find(
      (addr: BPAddress) => addr.addressName === selectedClient.shipToDefault
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
      selectedClient.U_SKILL_FormaPagto || ""
    );
    updateQuotation("U_Portal", selectedClient.U_Portal || "");
    updateQuotation(
      "BPL_IDAssignedToInvoice",
      selectedClient.BPL_IDAssignedToInvoice || 1
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

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      className="min-h-[70vh] flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 focus:outline-none relative"
      role="region"
      aria-label="Buscar cliente"
    >
      {/* Fundo decorativo sutil - com overflow-hidden isolado */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl mt-16 mb-20"
      >
        <div className="text-center mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-block"
          >
            <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent blur-sm opacity-50">
                Encontre seu cliente
              </span>
              <span className="relative bg-gradient-to-r from-foreground via-primary/90 to-foreground bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Encontre seu cliente
              </span>
              <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent bg-clip-text text-transparent">
                Encontre seu cliente
              </span>
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-[3px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-shimmer" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-pretty"
          >
            Digite o código ou nome para iniciar uma nova cotação
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-4 bg-background border border-border rounded-2xl p-5 shadow-lg hover:shadow-xl focus-within:shadow-xl transition-all duration-300">
              <Search className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <InputCotacao
                value={searchTerm.toUpperCase()}
                onChange={handleSearchChange}
                placeholder="Ex: C35646 ou Nome da Empresa"
                className="border-0 text-xl sm:text-2xl h-12 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground/50 flex-1 font-medium"
                aria-label="Buscar cliente"
                disabled={loading}
              />
              {loading && (
                <div className="relative h-6 w-6 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Caixa de Sugestões - CORRIGIDA */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 right-0 top-full mt-3 mx-auto w-full max-w-4xl bg-background border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden"
              >
                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="p-2 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={suggestion.cardCode || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={`w-full p-4 rounded-xl transition-all duration-200 text-left group ${
                          focusedIndex === index
                            ? "bg-accent/50 shadow-md"
                            : "hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                              <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                {suggestion.cardCode}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-foreground/90 line-clamp-1">
                              {suggestion.cardName}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {suggestion.cnpj || "Não informado"}
                              </span>
                              {suggestion.email && (
                                <span className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5" />
                                  {suggestion.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Search className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erro */}
          <AnimatePresence>
            {error && <ErrorAlert type={error.type} message={error.message} />}
          </AnimatePresence>
        </motion.div>

        {/* Conteúdo de apoio */}
        <AnimatePresence>
          {!showSuggestions && !error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-7 w-full mx-auto space-y-22"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Digite pelo menos{" "}
                  <span className="font-semibold text-foreground">
                    3 caracteres
                  </span>{" "}
                  para iniciar a busca
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "Código",
                    example: "C35646",
                    icon: <ArrowDown10 />,
                    gradient: "from-blue-500/10 via-cyan-500/10 to-blue-500/5",
                  },
                  {
                    label: "Nome",
                    example: "Indústria XYZ Ltda",
                    icon: <Building2 />,
                    gradient:
                      "from-violet-500/10 via-purple-500/10 to-violet-500/5",
                  },
                  {
                    label: "CNPJ",
                    example: "12.345.678/0001-99",
                    icon: <FileChartColumn />,
                    gradient:
                      "from-emerald-500/10 via-teal-500/10 to-emerald-500/5",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="group relative cursor-default"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:duration-200" />
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-background via-background to-muted/30 border border-border/50 hover:border-primary/30 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                            backgroundSize: "24px 24px",
                          }}
                        />
                      </div>
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                      />
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150" />
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                      <div className="relative z-10">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary/20">
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest group-hover:text-primary transition-colors duration-300">
                                {item.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-75" />
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-150" />
                          </div>
                        </div>
                        <div className="relative pl-1">
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                          <p className="text-base font-mono font-semibold text-foreground/80 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300 line-clamp-1">
                            {item.example}
                          </p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                      </div>
                      <div
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"
                        style={{ transition: "all 0.8s ease" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
