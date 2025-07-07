import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import { Mail, Lock, Sparkles, Send, LogIn, Eye, EyeOff } from "lucide-react";

interface LoginFormFieldsProps {
  isFirstAccess: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  error: string | null;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  forgotPasswordOpen: boolean;
  setForgotPasswordOpen: (open: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
  handleRequestAccess: (fromModal: boolean) => void;
}

export const LoginFormFields: React.FC<LoginFormFieldsProps> = ({
  isFirstAccess,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  showPassword,
  setShowPassword,
  focusedField,
  setFocusedField,
  forgotPasswordOpen,
  setForgotPasswordOpen,
  handleLogin,
  handleRequestAccess,
}) => {
  const renderForm = () => {
    if (isFirstAccess) {
      return (
        <motion.form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestAccess(false);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Email field with enhanced styling */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </Label>
            <motion.div
              className="relative"
              whileTap={{ scale: 0.99 }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            >
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="seu@email.com"
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={`pl-10 pr-4 py-3 text-base transition-all duration-300 border-2 rounded-xl
                  ${focusedField === 'email' 
                    ? 'border-primary ring-4 ring-primary/20 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${error ? 'border-red-500' : ''}
                `}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {focusedField === 'email' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Error message with better styling */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced submit button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  <span>Solicitar Acesso</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Button>
          </motion.div>
        </motion.form>
      );
    }

    return (
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Email
          </Label>
          <motion.div
            className="relative"
            whileTap={{ scale: 0.99 }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          >
            <Input
              id="email"
              type="email"
              value={email}
              placeholder="seu@email.com"
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`pl-10 pr-4 py-3 text-base transition-all duration-300 border-2 rounded-xl
                ${focusedField === 'email' 
                  ? 'border-primary ring-4 ring-primary/20 shadow-lg' 
                  : 'border-border hover:border-primary/50'
                }
                ${error ? 'border-red-500' : ''}
              `}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Senha
            </Label>
            <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="px-0 text-sm font-normal text-primary hover:text-primary/80 transition-colors"
                  type="button"
                >
                  Esqueceu a senha?
                </Button>
              </DialogTrigger>
              <ForgotPasswordModal
                isOpen={forgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
                defaultEmail={email}
              />
            </Dialog>
          </div>
          
          <motion.div
            className="relative"
            whileTap={{ scale: 0.99 }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Digite sua senha"
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`pl-10 pr-12 py-3 text-base transition-all duration-300 border-2 rounded-xl
                ${focusedField === 'password' 
                  ? 'border-primary ring-4 ring-primary/20 shadow-lg' 
                  : 'border-border hover:border-primary/50'
                }
                ${error ? 'border-red-500' : ''}
              `}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced login button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Fazer Login</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Button>
        </motion.div>
      </motion.form>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isFirstAccess ? "first-access-form" : "login-form"}
        initial={{ opacity: 0, x: isFirstAccess ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isFirstAccess ? 50 : -50 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {renderForm()}
      </motion.div>
    </AnimatePresence>
  );
};