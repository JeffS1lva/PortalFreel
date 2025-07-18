import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, BadgeAlert } from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordProps {
  closeModal: () => void;
  userEmail?: string; // Email do usuário atual
}

export function ResetPassword({
  closeModal,
  userEmail = "",
}: ResetPasswordProps) {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [email, setEmail] = useState<string>(userEmail || "");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<string>("");

  // Atualiza o estado do email se a prop mudar
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Função para limitar entrada a exatamente 8 caracteres
  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    // Limita a entrada a 8 caracteres
    if (value.length <= 8) {
      setter(value);
    }
  };

  const handleSaveChanges = async () => {
    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!email || !currentPassword || !newPassword) {
      toast.error("Email, senha atual e nova senha são obrigatórios.", {
        style: {
          backgroundColor: "white",
          color: "red",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
      return;
    }

    if (newPassword === confirmPassword && newPassword.length === 8) {
      try {
        setIsLoading(true);

        // Definindo o payload de acordo com o formato esperado pela API
        const payload = {
          currentPassword,
          newPassword,
          email,
        };

        // Log para debug

        const response = await fetch("/api/external/Auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        // Armazena a resposta para debug
        const responseData = await response.text();
        setApiResponse(responseData);

        if (!response.ok) {
          throw new Error(
            `Falha ao alterar a senha: ${response.status} - ${responseData}`
          );
        }

        closeModal();
        toast.success("Sua senha foi alterada com sucesso!", {
          style: {
            backgroundColor: "white",
            color: "green",
            boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
          },
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        // Mensagem de erro mais informativa
        toast.error(
          `Erro ao redefinir a senha: ${
            error instanceof Error
              ? error.message
              : "Tente novamente mais tarde."
          }`,
          {
            style: {
              backgroundColor: "white",
              color: "red",
              boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
            },
            duration: 5000,
          }
        );
      } finally {
        setIsLoading(false);
      }
    } else if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem. Tente novamente.", {
        style: {
          backgroundColor: "white",
          color: "red",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
    } else if (newPassword.length !== 8) {
      toast.error("A senha deve ter exatamente 8 caracteres.", {
        style: {
          backgroundColor: "white",
          color: "red",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
        },
      });
    }
  };

  const isPasswordValid = newPassword.length === 8;
  const isPasswordMismatch =
    newPassword !== confirmPassword && confirmPassword.length > 0;
  const isButtonDisabled =
    !email ||
    currentPassword.length === 0 ||
    newPassword.length !== 8 ||
    confirmPassword.length !== 8 ||
    newPassword !== confirmPassword ||
    isLoading;

  // Determina o texto do botão com base no estado
  const buttonText = isLoading
    ? "Processando..."
    : isButtonDisabled
    ? "Bloqueado"
    : "Salvar Alterações";

  // Determina a mensagem de título para o botão
  const getButtonTitle = () => {
    if (isLoading) {
      return "Processando sua solicitação";
    } else if (!email) {
      return "Informe seu email";
    } else if (currentPassword.length === 0) {
      return "Preencha sua senha atual";
    } else if (newPassword.length === 0 || confirmPassword.length === 0) {
      return "Preencha todos os campos de senha";
    } else if (newPassword.length !== 8) {
      return "A senha deve ter exatamente 8 caracteres";
    } else if (isPasswordMismatch) {
      return "As senhas não coincidem";
    }
    return "Clique para salvar as alterações";
  };

  // Define o estilo do cursor e opacidade com base no estado
  const buttonStyle = isButtonDisabled
    ? "cursor-not-allowed opacity-50"
    : "cursor-pointer opacity-100";

  return (
    <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            Preencha as informações para redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="col-span-3"
              placeholder="Digite seu email"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!userEmail}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-password" className="text-right">
              Senha Atual
            </Label>
            <Input
              id="current-password"
              type="password"
              className="col-span-3"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              autoComplete="off"
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              Nova Senha
            </Label>
            <div className="col-span-3 relative">
              <Input
                id="new-password"
                type="password"
                autoComplete="off"
                className={`w-full ${
                  newPassword.length > 0 && newPassword.length !== 8
                    ? "border-red-500"
                    : ""
                }`}
                placeholder="Digite sua nova senha (8 caracteres)"
                value={newPassword}
                onChange={(e) => handlePasswordChange(e, setNewPassword)}
                disabled={isLoading}
                maxLength={8}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-end">
              Confirmar Senha
            </Label>
            <div className="col-span-3 relative">
              <Input
                id="confirm-password"
                type="password"
                className={`w-full ${
                  isPasswordMismatch ? "border-red-500" : ""
                }`}
                placeholder="Confirme sua nova senha (8 caracteres)"
                value={confirmPassword}
                onChange={(e) => handlePasswordChange(e, setConfirmPassword)}
                disabled={isLoading}
                autoComplete="off"
                maxLength={8}
              />
            </div>
          </div>
        </div>
        <hr />

        {newPassword.length > 0 && newPassword.length !== 8 && (
          <div className="flex items-center gap-2 text-[0.8rem] text-red-600">
            <BadgeAlert size={16} />
            <span>A senha precisa ter exatamente 8 caracteres.</span>
          </div>
        )}

        {isPasswordMismatch && (
          <div className="flex items-center gap-2 text-[0.8rem] text-red-600">
            <BadgeAlert size={16} />
            <span>As senhas não coincidem.</span>
          </div>
        )}

        {isPasswordValid &&
          !isPasswordMismatch &&
          confirmPassword.length > 0 && (
            <div className="flex items-center gap-2 text-[0.8rem] text-green-600">
              <BadgeCheck size={16} />
              <span>A senha tem 8 caracteres.</span>
            </div>
          )}

        {apiResponse && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-24">
            <strong>Resposta API (debug):</strong> {apiResponse}
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={closeModal} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={isButtonDisabled}
            className={buttonStyle}
            title={getButtonTitle()}
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
