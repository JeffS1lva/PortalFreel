// src/features/auth/components/ThemeAwareLogo.tsx

import React from "react";
import LogoDark from "@/assets/logo.png";
import LogoLight from "@/assets/logoBranco.png";

const ThemeAwareLogo: React.FC = () => {
  return (
    <div className="relative flex justify-center">
      <img src={LogoLight} alt="logo-login" className="max-w-72 dark:hidden" />
      <img
        src={LogoDark}
        alt="logo-login"
        className="max-w-72 hidden dark:block"
      />
    </div>
  );
};

export default ThemeAwareLogo;