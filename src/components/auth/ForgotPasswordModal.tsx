// src/features/auth/components/ForgotPasswordModal.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ForgotPasswordModalProps } from "./types/auth.types";
import { validateEmail } from "./utils/validation.utils";
import { makeApiCallWithFallback } from "./utils/api.utils";
import { handleFirstAccessError } from "./utils/error.utils";
import { showErrorToast, showSuccessToast } from "@/utils/toast.utils";

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onClose,
  defaultEmail = "",
}) => {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleForgotPassword = async (): Promise<void> => {
    let emailToReset = email;
    setError(""); // Limpar erro anterior

    // Validate email
    if (!emailToReset || !validateEmail(emailToReset)) {
      setError("Por favor, insira um e-mail válido para continuar");
      showErrorToast(
        "E-mail inválido",
        "Por favor, insira um e-mail válido para continuar"
      );
      return;
    }

    setIsProcessing(true);

    try {
      const response = await makeApiCallWithFallback(
        "/api/internal/Auth/reset-password",
        "/api/external/Auth/reset-password",
        { email: emailToReset },
        30000
      );

      if (response.status === 200) {
        showSuccessToast(
          "Solicitação enviada",
          "Link de acesso enviado com sucesso. Verifique seu e-mail."
        );
        onClose();
      } else {
        throw new Error("Resposta inesperada do servidor");
      }
    } catch (error: any) {
      const errorMessage = handleFirstAccessError(error);
      setError(errorMessage);
      showErrorToast("Falha na solicitação", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Recuperar Senha</DialogTitle>
        <DialogDescription>
          Digite seu e-mail para receber uma senha provisória.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            placeholder="m@example.com"
            onChange={(e) => setEmail(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        
        {/* Exibir mensagem de erro dentro do modal */}
        {error && (
          <p className="text-red-500 text-sm animate-pulse">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant={"bottomPassword"}
          onClick={handleForgotPassword}
          disabled={isProcessing}
          className="relative"
        >
          {isProcessing ? (
            <>
              <span className="opacity-0">Enviar</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            </>
          ) : (
            "Enviar Solicitação"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ForgotPasswordModal;