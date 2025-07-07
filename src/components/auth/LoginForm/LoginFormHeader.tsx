import React, { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LogIn,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  Info,
  Star,
} from "lucide-react";

interface LoginFormHeaderProps {
  isFirstAccess: boolean;
  onToggleAccess?: (isFirstAccess: boolean) => void;
}

export const LoginFormHeader: React.FC<LoginFormHeaderProps> = ({
  isFirstAccess,
  onToggleAccess,
}) => {
  const [showProcessSteps, setShowProcessSteps] = useState(false);

  // Features destacadas para primeiro acesso

  // Processo de primeiro acesso
  const accessProcess = [
    {
      step: 1,
      title: "Solicitar Acesso",
      description: "Digite seu e-mail corporativo",
      icon: <UserPlus className="h-4 w-4" />,
      status: "current",
    },
    {
      step: 2,
      title: "Verificação",
      description: "Análise automática dos dados",
      icon: <Shield className="h-4 w-4" />,
      status: "pending",
    },
    {
      step: 3,
      title: "Aprovação",
      description: "Notificação por e-mail",
      icon: <CheckCircle className="h-4 w-4" />,
      status: "pending",
    },
    {
      step: 4,
      title: "Primeiro Login",
      description: "Acesse com suas credenciais",
      icon: <LogIn className="h-4 w-4" />,
      status: "pending",
    },
  ];

  const tabs = [
    {
      id: "login" as const,
      label: "Fazer Login",
      shortLabel: "Login",
      icon: <LogIn className="h-4 w-4" />,
      gradient: "from-blue-500 to-cyan-500",
      glowColor: "blue",
      description: "Acesse sua conta existente",
      welcome: "Bem-vindo de volta",
      subtitle: "Continue de onde parou",
      benefits: ["Acesso instantâneo", "Dados sincronizados"],
    },
    {
      id: "first-access" as const,
      label: "Primeiro Acesso",
      shortLabel: "Cadastro",
      icon: <UserPlus className="h-4 w-4" />,
      gradient: "from-emerald-500 to-teal-500",
      glowColor: "emerald",
      description: "Solicite acesso à plataforma",
      welcome: "Novo por aqui?",
      subtitle: "Junte-se a milhares de usuários",
      benefits: [
        "Processo simplificado",
        "Aprovação rápida",
        "Suporte completo",
      ],
    },
  ];

  const activeTab = isFirstAccess ? "first-access" : "login";
  const currentTabData =
    tabs.find(
      (tab) =>
        (tab.id === "first-access" && isFirstAccess) ||
        (tab.id === "login" && !isFirstAccess)
    ) || tabs[0];

  useEffect(() => {
    if (isFirstAccess) {
      const timer = setTimeout(() => setShowProcessSteps(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowProcessSteps(false);
    }
  }, [isFirstAccess]);

  const handleTabClick = (tabId: "login" | "first-access") => {
    if (onToggleAccess) {
      onToggleAccess(tabId === "first-access");
    }
  };

  return (
    <CardHeader className="text-center space-y-6 pb-8 ">
      {/* Enhanced Tab Navigation */}
      {onToggleAccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative -mx-6 -mt-6 mb-8"
        >
          <div className="relative bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 backdrop-blur-xl border border-border/30 rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 overflow-hidden ">
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 "
              animate={{
                background: [
                  "linear-gradient(90deg, rgba(var(--primary), 0.05) 0%, transparent 50%, rgba(var(--primary), 0.05) 100%)",
                  "linear-gradient(90deg, transparent 0%, rgba(var(--primary), 0.1) 50%, transparent 100%)",
                  "linear-gradient(90deg, rgba(var(--primary), 0.05) 0%, transparent 50%, rgba(var(--primary), 0.05) 100%)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative flex p-1.5">
              {/* Enhanced floating active indicator */}
              <motion.div
                layoutId="activeAuthTabBackground"
                className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r ${
                  activeTab === "login"
                    ? "from-blue-500/90 to-cyan-500/90 shadow-blue-500/25"
                    : "from-emerald-500/90 to-teal-500/90 shadow-emerald-500/25"
                } rounded-xl shadow-lg backdrop-blur-sm border border-white/20`}
                style={{
                  left: activeTab === "login" ? "6px" : "50%",
                  width: "calc(50% - 6px)",
                }}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 35,
                  mass: 0.8,
                }}
              />
              

               {/* mx-1 faz separação para não atrapalhar o hover*/}
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex-1 px-6 py-4 flex text-sm font-semibold transition-all duration-300 rounded-xl z-10 group g${
                    activeTab === tab.id
                      ? "text-white shadow-sm "
                      : "text-muted-foreground hover:text-foreground "
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="flex items-center gap-3 justify-center">
                    <motion.div
                      animate={
                        activeTab === tab.id
                          ? {
                              scale: 1.1,
                              rotate: [0, -3, 3, 0],
                              filter:
                                "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
                            }
                          : {
                              scale: 1,
                              rotate: 0,
                              filter:
                                "drop-shadow(0 0 0px rgba(255,255,255,0))",
                            }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        rotate: { duration: 0.6 },
                      }}
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {tab.icon}
                    </motion.div>

                    <motion.span
                      className="hidden sm:inline "
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tab.label}
                    </motion.span>
                    <motion.span
                      className="sm:hidden"
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tab.shortLabel}
                    </motion.span>
                  </div>

                  {/* Enhanced hover effect */}
                  {activeTab !== tab.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />
                  )}

                  {/* Active glow effect */}
                  {activeTab === tab.id && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-10 rounded-xl blur-sm `}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Enhanced bottom glow indicator */}
            <motion.div
              layoutId="activeAuthTabGlow"
              className={`absolute  bottom-0 h-0.5 bg-gradient-to-r ${
                activeTab === "login"
                  ? "from-blue-400 via-cyan-400 to-blue-400"
                  : "from-emerald-400 via-teal-400 to-emerald-400"
              } rounded-full shadow-lg`}
              style={{
                left: activeTab === "login" ? "6px" : "50%",
                width: "calc(50% - 6px)",
              }}
              initial={false}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 35,
                mass: 0.5,
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Enhanced Header Content with Smart Information */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Enhanced welcome badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            type: "spring",
            stiffness: 300,
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${
            isFirstAccess
              ? "from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/30 shadow-emerald-500/10"
              : "from-blue-500/15 via-cyan-500/10 to-blue-500/15 border-blue-500/30 shadow-cyan-500/10"
          } rounded-2xl border backdrop-blur-sm shadow-lg mx-auto relative overflow-hidden`}
        >
          <motion.div
            animate={{
              background: [
                "linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)",
                "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                "linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0"
          />

          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-5 w-5 text-primary relative z-10" />
          </motion.div>
          <div className="relative z-10">
            <span className="text-sm font-semibold text-primary tracking-wide block">
              {currentTabData.welcome}
            </span>
            <span className="text-xs text-primary/70">
              {currentTabData.subtitle}
            </span>
          </div>
        </motion.div>

        {/* Enhanced title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <CardTitle className="text-3xl lg:text-4xl lg:pb-1 font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-3 tracking-tight">
            {currentTabData.label}
          </CardTitle>
        </motion.div>

        {/* Smart description based on context */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <CardDescription className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            {isFirstAccess ? "" : ""}
          </CardDescription>
        </motion.div>

        {/* Smart features for first access */}

        {/* Smart process steps for first access */}
        <AnimatePresence>
          {isFirstAccess && showProcessSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground justify-center">
                <Info className="h-4 w-4" />
                <span>Como funciona o processo</span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {accessProcess.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                    className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                      step.status === "current"
                        ? "bg-primary/10 border-primary/30 shadow-lg"
                        : "bg-muted/30 border-border/50"
                    }`}
                  >
                    <div
                      className={`flex justify-center mb-2 ${
                        step.status === "current"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="text-xs font-medium mb-1">{step.title}</div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {step.description}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.3 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <Clock className="h-3 w-3" />
                <span>Processo completo em até 24 horas</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Benefits for returning users */}
        {!isFirstAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center justify-center gap-4 text-sm"
          >
            {currentTabData.benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <Star className="h-3 w-3 text-primary" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </CardHeader>
  );
};
