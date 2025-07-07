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
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordProps {
  closeModal: () => void;
  userEmail?: string;
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

  // Estados para visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  // Estados para animações
  const [currentPasswordFocused, setCurrentPasswordFocused] =
    useState<boolean>(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState<boolean>(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] =
    useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value;
    if (value.length <= 8) {
      setter(value);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 4)
      return { strength: 25, label: "Fraca", color: "bg-red-500" };
    if (password.length < 6)
      return { strength: 50, label: "Regular", color: "bg-yellow-500" };
    if (password.length < 8)
      return { strength: 75, label: "Boa", color: "bg-blue-500" };
    return { strength: 100, label: "Forte", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSaveChanges = async () => {
    if (!email || !currentPassword || !newPassword) {
      toast.error("Email, senha atual e nova senha são obrigatórios.", {
        style: {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    if (newPassword === confirmPassword && newPassword.length === 8) {
      try {
        setIsLoading(true);

        const payload = {
          currentPassword,
          newPassword,
          email,
        };

        const response = await fetch("/api/external/Auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

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
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          },
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        toast.error(
          `Erro ao redefinir a senha: ${
            error instanceof Error
              ? error.message
              : "Tente novamente mais tarde."
          }`,
          {
            style: {
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        },
      });
    } else if (newPassword.length !== 8) {
      toast.error("A senha deve ter exatamente 8 caracteres.", {
        style: {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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

  const getButtonTitle = () => {
    if (isLoading) return "Processando sua solicitação";
    if (!email) return "Informe seu email";
    if (currentPassword.length === 0) return "Preencha sua senha atual";
    if (newPassword.length === 0 || confirmPassword.length === 0)
      return "Preencha todos os campos de senha";
    if (newPassword.length !== 8)
      return "A senha deve ter exatamente 8 caracteres";
    if (isPasswordMismatch) return "As senhas não coincidem";
    return "Clique para salvar as alterações";
  };

  const InputField = ({
    id,
    label,
    type,
    placeholder,
    value,
    onChange,
    disabled,
    icon: Icon,
    showPassword,
    togglePassword,
    onFocus,
    onBlur,
    focused,
    maxLength,
    className = "",
  }: any) => (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 flex items-center gap-2"
      >
        <Icon size={16} className="text-gray-500" />
        {label}
      </Label>
      <div className="relative group">
        <Input
          id={id}
          type={
            showPassword !== undefined
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          className={`
            w-full pl-4 pr-12 py-3 rounded-xl border-2 transition-all duration-300
            ${
              focused
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : "border-gray-200"
            }
            ${className}
            hover:border-gray-300 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20
            disabled:bg-gray-50 disabled:text-gray-500
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={maxLength}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
          <DialogHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              Preencha as informações para redefinir sua senha com segurança.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-8">
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              disabled={isLoading || !!userEmail}
              icon={Mail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              focused={emailFocused}
            />

            <InputField
              id="current-password"
              label="Senha Atual"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e: any) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              icon={Lock}
              showPassword={showCurrentPassword}
              togglePassword={() =>
                setShowCurrentPassword(!showCurrentPassword)
              }
              onFocus={() => setCurrentPasswordFocused(true)}
              onBlur={() => setCurrentPasswordFocused(false)}
              focused={currentPasswordFocused}
            />

            <div className="space-y-3">
              <InputField
                id="new-password"
                label="Nova Senha"
                placeholder="Digite sua nova senha (8 caracteres)"
                value={newPassword}
                onChange={(e: any) => handlePasswordChange(e, setNewPassword)}
                disabled={isLoading}
                icon={Lock}
                showPassword={showNewPassword}
                togglePassword={() => setShowNewPassword(!showNewPassword)}
                onFocus={() => setNewPasswordFocused(true)}
                onBlur={() => setNewPasswordFocused(false)}
                focused={newPasswordFocused}
                maxLength={8}
                className={
                  newPassword.length > 0 && newPassword.length !== 8
                    ? "border-red-300"
                    : ""
                }
              />

              {newPassword.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Força da senha:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength.strength === 100
                          ? "text-green-600"
                          : passwordStrength.strength >= 75
                          ? "text-blue-600"
                          : passwordStrength.strength >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <InputField
              id="confirm-password"
              label="Confirmar Senha"
              placeholder="Confirme sua nova senha (8 caracteres)"
              value={confirmPassword}
              onChange={(e: any) => handlePasswordChange(e, setConfirmPassword)}
              disabled={isLoading}
              icon={Lock}
              showPassword={showConfirmPassword}
              togglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
              focused={confirmPasswordFocused}
              maxLength={8}
              className={isPasswordMismatch ? "border-red-300" : ""}
            />
          </div>

          <div className="mt-6 space-y-3">
            {newPassword.length > 0 && newPassword.length !== 8 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top-1 duration-300">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  A senha precisa ter exatamente 8 caracteres.
                </span>
              </div>
            )}

            {isPasswordMismatch && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top-1 duration-300">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  As senhas não coincidem.
                </span>
              </div>
            )}

            {isPasswordValid &&
              !isPasswordMismatch &&
              confirmPassword.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-in slide-in-from-top-1 duration-300">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">
                    Perfeito! A senha tem 8 caracteres.
                  </span>
                </div>
              )}
          </div>

          {apiResponse && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <details className="text-sm">
                <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Resposta da API (debug)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                  {apiResponse}
                </pre>
              </details>
            </div>
          )}

          <DialogFooter className="mt-8 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl border-2 hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={isButtonDisabled}
              title={getButtonTitle()}
              className={`
                px-6 py-3 rounded-xl font-medium transition-all duration-200
                ${
                  isButtonDisabled
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </div>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
