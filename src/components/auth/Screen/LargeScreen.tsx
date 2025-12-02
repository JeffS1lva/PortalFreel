import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  Target,
  Shield,
  Sparkles,
  ArrowRight,
  ChartLine,
} from "lucide-react";
import ThemeAwareScreen from "./ThemeAwareScreen";
import { ModeToggle } from "@/components/Dark-Mode/ModeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LargeScreenLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  isFirstAccess: boolean;
  handleFirstAccessToggle: (value: boolean) => void;
}

export const LargeScreenLayout: React.FC<LargeScreenLayoutProps> = ({
  children,
  loading = false,
  
}) => {
  const [activeInfo, setActiveInfo] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const modeToggleRef = useRef<HTMLDivElement>(null);

  // Auto-rotate das informações da empresa
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInfo((prev) => (prev + 1) % companyInfo.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const companyInfo = [
    {
      title: "Sobre Nós",
      description:
        "A Polar Fix situa-se hoje como uma das melhores fabricantes de produtos hospitalares no Brasil. Produzindo e distribuindo uma linha completa de alta qualidade, atende aos mais rigorosos padrões de exigências, igualando-se ao que existe de melhor no mercado internacional.",
      icon: <Info className="h-6 w-6" />,
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      title: "Nossa Missão",
      description:
        "Produzir, distribuir e inovar uma linha completa de alta qualidade; Promover a garantia da qualidade de seus produtos destinados ao setor médico-hospitalar; Atender aos mais rigorosos padrões de exigências.",
      icon: <Target className="h-6 w-6" />,
      gradient: "from-emerald-400 to-teal-400",
    },
    {
      title: "Nossa Visão",
      description:
        "Ser referência nacional de empresa competitiva e com qualidade; Ultrapassar desafios através de contínuos investimentos em tecnologia e profissionais especializados.",
      icon: <ChartLine className="h-6 w-6" />,
      gradient: "from-emerald-400 to-teal-400",
    },
    {
      title: "Nossos Valores",
      description:
        "Manter uma equipe motivada e qualificada; Estabelecer sólidas parcerias com fornecedores; Garantir a satisfação dos Clientes.",
      icon: <Shield className="h-6 w-6" />,
      gradient: "from-amber-400 to-orange-400",
    },
  ];

  const renderCompanyInfo = () => (
    <div className="relative h-[280px] flex items-center">
      <AnimatePresence mode="wait">
        {companyInfo.map(
          (info, index) =>
            activeInfo === index && (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center"
              >
                <div className="flex items-start gap-6">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${info.gradient} shadow-xl`}
                  >
                    {info.icon}
                  </div>
                  <div className="max-w-2xl">
                    <h3 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                      {info.title}
                      <ArrowRight className="h-6 w-6 text-white/70" />
                    </h3>
                    <p className="text-lg text-white/90 leading-relaxed">
                      {info.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="hidden lg:flex min-h-screen w-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Mode Toggle - canto superior direito */}
      <div className="absolute right-8 top-8 z-50" ref={modeToggleRef}>
        <div className="relative">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ModeToggle />
          </motion.div>

          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-14 w-64 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-2xl"
              >
                <div className="absolute -top-2 right-6 w-4 h-4 bg-background border-t border-l border-border/50 rotate-45"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Alternar Tema</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Mude entre tema claro e escuro quando quiser.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTooltip(false)}
                >
                  Entendi
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Layout principal - duas colunas */}
      <div className="flex w-full h-screen">
        {/* ESQUERDA - Informações da empresa (bem larga, colada na borda) */}
        <div className="flex-1 bg-gradient-to-br from-primary/90 to-primary dark:from-primary/30 dark:to-primary/90 relative overflow-hidden flex flex-col justify-center px-16 xl:px-24  ">
          {/* Efeitos de fundo */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <ThemeAwareScreen />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Separator
                className="absolute bottom-110 ml-1"
                
                style={{
                  width: "575px",
                }}
              />
              <h1 className="text-5xl xl:text-6xl font-bold text-white mb-2 leading-tight">
                Bem-vindo ao Portal
              </h1>
              <p className="text-xl text-white/80">
                Inovação e qualidade em produtos hospitalares
              </p>
            </motion.div>

            {/* Informações rotativas */}
            <div className="mt-16">{renderCompanyInfo()}</div>

            {/* Indicadores */}
            <div className="flex gap-3 mt-12">
              {companyInfo.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveInfo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeInfo === i
                      ? "w-12 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* DIREITA - Formulário de login (largura controlada, centralizado) */}
        <div className="w-96 xl:w-[480px] 2xl:w-[720px] bg-background/95 backdrop-blur-sm flex items-center justify-center relative shadow-2xl">
          {/* Fundo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>

          {/* Bolhas decorativas */}
          <div className="absolute top-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-10 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>

          {/* Formulário - largura fixa e confortável */}
          <div className="w-full px-10 py-8">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className={loading ? "opacity-70 pointer-events-none" : ""}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
