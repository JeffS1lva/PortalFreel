import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Info, Target, Shield, Sparkles, ArrowRight, ChartLine } from "lucide-react";
import ThemeAwareScreen from "./ThemeAwareScreen";
import { ModeToggle } from "@/components/Dark-Mode/ModeToggle";
import { Button } from "@/components/ui/button";

interface LargeScreenLayoutProps {
  children: React.ReactNode;
  isFirstAccess: boolean;
  handleFirstAccessToggle: (value: boolean) => void;
  loading: boolean;
}

export const LargeScreenLayout: React.FC<LargeScreenLayoutProps> = ({
  children,
  loading,
}) => {
  const [activeInfo, setActiveInfo] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const modeToggleRef = useRef<HTMLDivElement>(null);

  // Auto-rotate through company info
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInfo((prev) => (prev + 1) % companyInfo.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Company information with corresponding icons
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
        "Produzir, distribuir e inovar uma linha completa de alta qualidade; Promover a garantia da qualidade de seus produtos destinados ao setor médico-hospitalar; Atender aos mais rigorosos padrões de exigências, igualando-se ao que existe de melhor no mercado internacional.",
      icon: <Target className="h-6 w-6" />,
      gradient: "from-emerald-400 to-teal-400",
    },
    {
      title: "Nossa Visão",
      description:
        "Ser referência nacional de empresa competitiva e com qualidade; Ultrapassar desafios através de contínuos investimentos em tecnologia e profissionais especializados.",
      icon: <ChartLine  className="h-6 w-6" />,
      gradient: "from-emerald-400 to-teal-400",
    },
    {
      title: "Nossos Valores",
      description:
        "Manter uma equipe de colaboradores motivada e qualificada; Estabelecer sólidas parcerias com fornecedores; Garantir a satisfação dos Clientes.",
      icon: <Shield className="h-6 w-6" />,
      gradient: "from-amber-400 to-orange-400",
    },
  ];

  // Company info section for large screens
  const renderCompanyInfo = () => (
    <div className="space-y-8 text-white/90 relative min-h-[250px]">
      {companyInfo.map((info, index) => (
        <AnimatePresence key={index} mode="wait">
          {activeInfo === index && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-full"
            >
              <div className="flex items-start space-x-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-r ${info.gradient} flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm`}
                >
                  {info.icon}
                </motion.div>
                <div className="flex-1">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-bold text-2xl text-white mb-3 flex items-center gap-2"
                  >
                    {info.title}
                    <ArrowRight className="h-5 w-5 opacity-70" />
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg leading-relaxed text-white/90"
                  >
                    {info.description}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-background via-background to-background/95 ">
      {/* Enhanced mode toggle with improved tooltip */}
      <div className="absolute right-6 top-6 z-50" ref={modeToggleRef}>
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className=" "
          >
            <ModeToggle />
          </motion.div>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 top-14 w-64 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl  "
              >
                <div className="absolute -top-2 right-6 w-4 h-4 bg-background border-t border-l border-border/50 transform rotate-45"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div className="text-base font-semibold">Alternar Tema</div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Personalize sua experiência alternando entre os temas claro e escuro.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTooltip(false)}
                  className="ml-auto block"
                >
                  Entendi
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-7xl flex rounded-3xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-yellow-400 transition-all duration-500 relative backdrop-blur-sm ${
          loading ? "opacity-70 pointer-events-none" : ""
        }`}
        style={{
          transform: `perspective(1000px) rotateY(${mousePosition.x * 0.1}deg) rotateX(${mousePosition.y * 0.1}deg)`,
        }}
      >
        {/* Enhanced company information section */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-1/2 bg-gradient-to-br from-primary/90 to-primary dark:from-primary/20 dark:to-primary/90 p-12 flex-col justify-between relative overflow-hidden"
        >
          {/* Enhanced background animations */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-r from-white/10 to-white/5 blur-sm"
          />

          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-white/15 to-white/5 blur-sm"
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute w-2 h-2 bg-white/40 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
            />
          ))}

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <ThemeAwareScreen />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Bem-vindo à
                <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Nossa Plataforma
                </span>
              </h1>
              <p className="text-xl text-white/80 font-light">
                Transformando processos, conectando pessoas
              </p>
            </motion.div>

            {renderCompanyInfo()}

            {/* Enhanced navigation indicators */}
            <div className="flex space-x-3 mt-40">
              {companyInfo.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveInfo(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-3 rounded-full transition-all duration-500 ${
                    activeInfo === index
                      ? "w-12 bg-white shadow-lg"
                      : "w-3 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Ver informação ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Enhanced floating image */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            whileHover={{ scale: 1.1, rotate: 3, y: -10 }}
            className="absolute bottom-16 right-16 border-4 border-white/40 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm"
          >
            <div className="w-48 h-32 bg-gradient-to-br from-white/20 to-white/10 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                <div className="p-4 text-white">
                  <p className="font-semibold text-sm">Interface Intuitiva</p>
                  <div className="flex items-center text-xs mt-1 opacity-80">
                    <span>Explore agora</span>
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced login form section */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-1/2 bg-background/95 backdrop-blur-sm flex flex-col justify-center items-center relative"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10"></div>
          </div>

          {/* Enhanced form container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className=" w-full max-w-md  relative z-10"
          >
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {children}
            </motion.div>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-lg"></div>
        </motion.div>
      </motion.div>
    </div>
  );
};