import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CustomCard } from "@/components/ui/card";
import { ModeToggle } from "@/components/Dark-Mode/ModeToggle";
import { motion, AnimatePresence } from "framer-motion";
import ThemeAwareLogo from "@/components/auth/ThemeAwareLogo";
import { Sparkles } from "lucide-react";

interface LoginFormLayoutProps {
  loading: boolean;
  isFirstAccess: boolean;
  showOnboarding: boolean;
  email: string;
  setEmail: (email: string) => void;
  handleFirstAccessToggle: (value: boolean) => void;
  handleCloseTooltip: () => void;
  navigateToLoginWithFirstAccess: (email: string) => void;
  children: React.ReactNode;
  headerComponent: React.ReactNode;
  [key: string]: any;
}

export const LoginFormLayout: React.FC<LoginFormLayoutProps> = ({
  loading,
  isFirstAccess,
  showOnboarding,
  email,
  setEmail,
  handleFirstAccessToggle,
  handleCloseTooltip,
  navigateToLoginWithFirstAccess,
  children,
  headerComponent,
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const modeToggleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`flex flex-col gap-8 w-auto px-8 sm:px-16 lg:px-96 py-12 min-h-screen bg-gradient-to-br from-background via-background to-background/95 ${
        loading ? "opacity-70 pointer-events-none" : ""
      }`}
      {...props}
    >
      {/* Enhanced mode toggle */}
      <div className="absolute right-6 top-6 z-50" ref={modeToggleRef}>
        <div className="relative">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ModeToggle />
          </motion.div>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 top-14 w-64 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl"
              >
                <div className="absolute -top-2 right-6 w-4 h-4 bg-background border-t border-l border-border/50 transform rotate-45"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div className="text-base font-semibold">Alternar Tema</div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Personalize sua experiência alternando entre os temas claro e
                  escuro.
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

      {/* Enhanced logo section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-center mt-20"
      >
        <div className="relative">
          <ThemeAwareLogo />
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-full blur-xl opacity-60"></div>
        </div>
      </motion.div>

      {/* Enhanced card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        <CustomCard className="backdrop-blur-sm bg-background/95 border-2 border-border/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Enhanced FirstAccess toggle */}

          {/* Header */}
          {headerComponent}

          <CardContent className="p-8 pt-0">{children}</CardContent>
        </CustomCard>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-sm"></div>
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-sm"></div>
      </motion.div>
    </div>
  );
};
