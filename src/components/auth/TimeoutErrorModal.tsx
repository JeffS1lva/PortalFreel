import React, { useEffect } from "react";
import { X, AlertCircle, Wifi, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface TimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  onRequestAccess: () => void;
  onForgotPassword: () => void;
  loading: boolean;
  // Novo prop para redirecionar para login com primeiro acesso ativado
  navigateToLoginWithFirstAccess: (email: string) => void;
}

export const TimeoutErrorModal: React.FC<TimeoutModalProps> = ({
  isOpen,
  onClose,
  email,
  onEmailChange,
  onForgotPassword,
  loading,
  navigateToLoginWithFirstAccess
}) => {
  // Disable scroll on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleFirstAccessClick = () => {
    // Fecha o modal e navega para tela de login com primeiro acesso ativado
    onClose();
    navigateToLoginWithFirstAccess(email);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-background rounded-lg shadow-xl border border-border overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Problema de Conexão
                    </h3>
                    <p className="text-white/90 text-sm mt-1">
                      Estamos com dificuldade para encontrar seu cadastro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Issue Description */}
                  <div className="bg-muted/50 rounded-lg p-4 dark:bg-gray-800/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-muted p-2 rounded-full mt-0.5 dark:bg-gray-700">
                        <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-300" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground dark:text-gray-200">
                          E-mail e Senha
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 dark:text-gray-300">
                          O servidor não respondeu dentro do tempo esperado. Isso pode ocorrer devido a problemas com e-mail e senha inválida.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="timeout-email" className="text-sm font-medium dark:text-gray-200">
                      Seu email
                    </label>
                    <Input
                      id="timeout-email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <h4 className="text-sm font-medium dark:text-gray-200">O que você deseja fazer?</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Primeiro Acesso Button */}
                      <Button
                        onClick={handleFirstAccessClick}
                        disabled={loading}
                        variant="outline"
                        className="justify-start p-4 h-auto text-left flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all group dark:border-gray-700 dark:hover:border-primary/40 dark:hover:bg-primary/10 dark:text-gray-200"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="bg-primary/10 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors dark:bg-primary/20 flex-shrink-0">
                            <RefreshCw className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">Primeiro Acesso</span>
                        </div>
                        <span className="text-xs text-muted-foreground pl-8 dark:text-gray-400 w-full break-words">
                          Solicite acesso ao sistema
                        </span>
                      </Button>

                      {/* Recuperar Senha Button - Fixed width issues */}
                      <Button
                        onClick={onForgotPassword}
                        disabled={loading}
                        variant="outline"
                        className="justify-start p-4 h-auto text-left flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all group dark:border-gray-700 dark:hover:border-primary/40 dark:hover:bg-primary/10 dark:text-gray-200"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="bg-primary/10 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors dark:bg-primary/20 flex-shrink-0">
                            <Wifi className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">Recuperar Senha</span>
                        </div>
                        <div className="w-full pl-8">
                          <span className="text-xs text-muted-foreground dark:text-gray-400 break-words inline-block w-full">
                            Solicite uma nova senha
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t dark:border-gray-800">
                    <Button 
                      variant="ghost" 
                      onClick={onClose}
                      className="dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Fechar
                    </Button>
                    <Button 
                      onClick={onClose}
                      disabled={loading}
                      className="relative dark:bg-primary dark:hover:bg-primary/90"
                    >
                      {loading ? (
                        <>
                          <span className="opacity-0">Tentar Novamente</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        </>
                      ) : (
                        "Tentar Novamente"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};