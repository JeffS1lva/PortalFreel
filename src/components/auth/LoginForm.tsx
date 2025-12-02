import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeoutErrorModal } from "./TimeoutErrorModal";
import { LoginFormProps } from "./types/auth.types";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "next-themes";
import { LargeScreenLayout } from "./Screen/LargeScreen";

// Importando os componentes separados
import { LoginFormFields } from "./LoginForm/LoginFormFields";
import { LoginFormHeader } from "./LoginForm/LoginFormHeader";
import { LoginFormLayout } from "./LoginForm/LoginFormLayout";

export const LoginForm: React.FC<LoginFormProps> = ({
  className,
  onLoginSuccess,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);
  useTheme();
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const seenTooltip = localStorage.getItem("seen-onboarding-tooltip");
    if (seenTooltip) {
      setShowOnboarding(false);
    }
  }, []);

  const handleCloseTooltip = () => {
    localStorage.setItem("seen-onboarding-tooltip", "true");
    setShowOnboarding(false);
  };

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1800);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    isFirstAccess,
    forgotPasswordOpen,
    setForgotPasswordOpen,
    showTimeoutModal,
    handleLogin,
    handleRequestAccess,
    handleFirstAccessToggle,
    handleCloseTimeoutModal,
    handleRequestAccessFromModal,
    handleForgotPasswordFromModal,
    navigateToLoginWithFirstAccess,
  } = useAuth(onLoginSuccess);

  // Enhanced form content for large screen
  const renderFormContent = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={isFirstAccess ? "first-access-form" : "login-form"}
        initial={{ opacity: 0, x: isFirstAccess ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isFirstAccess ? 50 : -50 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full "
      >
        <LoginFormFields
          isFirstAccess={isFirstAccess}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
          forgotPasswordOpen={forgotPasswordOpen}
          setForgotPasswordOpen={setForgotPasswordOpen}
          handleLogin={handleLogin}
          handleRequestAccess={handleRequestAccess}
        />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {/* Enhanced Timeout Error Modal */}
      <TimeoutErrorModal
        isOpen={showTimeoutModal}
        onClose={handleCloseTimeoutModal}
        email={email}
        onEmailChange={setEmail}
        onRequestAccess={handleRequestAccessFromModal}
        onForgotPassword={handleForgotPasswordFromModal}
        loading={loading}
        navigateToLoginWithFirstAccess={navigateToLoginWithFirstAccess}
      />

      {/* Render layout based on screen size */}
      {!isLargeScreen ? (
        <LoginFormLayout
          loading={loading}
          isFirstAccess={isFirstAccess}
          showOnboarding={showOnboarding}
          email={email}
          setEmail={setEmail}
          handleFirstAccessToggle={handleFirstAccessToggle}
          handleCloseTooltip={handleCloseTooltip}
          navigateToLoginWithFirstAccess={navigateToLoginWithFirstAccess}
          headerComponent={
            <LoginFormHeader
              isFirstAccess={isFirstAccess}
              onToggleAccess={handleFirstAccessToggle}
            />
          }
          {...props}
        >
          <LoginFormFields
            isFirstAccess={isFirstAccess}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            forgotPasswordOpen={forgotPasswordOpen}
            setForgotPasswordOpen={setForgotPasswordOpen}
            handleLogin={handleLogin}
            handleRequestAccess={handleRequestAccess}
          />
        </LoginFormLayout>
      ) : (
        <LargeScreenLayout
          isFirstAccess={isFirstAccess}
          handleFirstAccessToggle={handleFirstAccessToggle}
          loading={loading}
        >
          <div className="relative flex flex-col space-y-6 ">
            {/* Header with tabs for large screen */}
            <LoginFormHeader
              isFirstAccess={isFirstAccess}
              onToggleAccess={handleFirstAccessToggle}
            />

            {renderFormContent()}
          </div>
        </LargeScreenLayout>
      )}
    </>
  );
};
