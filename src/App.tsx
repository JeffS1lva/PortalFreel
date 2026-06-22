"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import { NavegationMenu } from "@/components/pages/NavegationMenu";
import { Boletos } from "./components/pages/Boletos";
import { Pedidos } from "./components/pages/Pedidos";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Init } from "./components/pages/Home";
import { LoginForm } from "./components/auth/LoginForm";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/Dark-Mode/ThemeProvider";
import CookieConsent from "./components/auth/cookies/CookieConsent";
import { PedidoTruck } from "./components/pages/Rastreio-Pedidos/PedidoTruck";
import { ParcelasAtrasadas } from "./components/pages/ParcelAtrasada";
import { QuotationForm } from "./components/pages/Cotacao";
import { QuotationDashboard } from "./components/pages/Cotação/CotacaoDash";
import { RelatorioPage } from "./components/pages/Report";
import { SessionTimer } from "./SessionTime";
import { tokenStore } from "@/utils/tokenStore";
//import { MaintenancePage } from "@/MaintenancePage"; // ← IMPORTAÇÃO DO COMPONENTE

interface UserData {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string;
}

// 🚨 CONTROLE DE MANUTENÇÃO - Altere para true para ativar a tela de manutenção
//const IS_MAINTENANCE_MODE = true;

export function App() {
  // Se estiver em manutenção, renderiza apenas a tela de manutenção
  {
    /*if (IS_MAINTENANCE_MODE) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <MaintenancePage />
      </ThemeProvider>
    );
  }*/
  }

  // Código original do App continua abaixo...
  const APP_VERSION = "1.0.4";

  const [authData, setAuthData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = tokenStore.getToken();
    return !!token && tokenStore.isAuthenticated() && token !== "undefined" && token !== "null";
  });

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [_remainingSeconds, setRemainingSeconds] = useState(0);

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const WARNING_TIME_SECONDS = 5 * 60;
  const CHECK_INTERVAL_MS = 10_000;
  const STORAGE_KEY = "session-expiration-time-v2";

  const getTokenExpiration = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const startSessionMonitoring = () => {
    if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    const checkToken = () => {
      const token = tokenStore.getToken();
      if (!token || token === "undefined" || token === "null") {
        handleLogout();
        return;
      }

      const exp = getTokenExpiration(token);
      if (!exp) {
        console.warn("Token sem campo 'exp', logout forçado");
        handleLogout();
        return;
      }

      const now = Date.now();
      const timeLeftMs = exp - now;

      if (timeLeftMs <= 0) {
        handleLogout();
        return;
      }

      const timeLeftSeconds = Math.floor(timeLeftMs / 1000);

      if (timeLeftSeconds <= WARNING_TIME_SECONDS && !showTimeoutModal) {
        setRemainingSeconds(timeLeftSeconds);
        setShowTimeoutModal(true);
      }

      if (showTimeoutModal) {
        setRemainingSeconds(timeLeftSeconds);
      }

      checkIntervalRef.current = setTimeout(checkToken, CHECK_INTERVAL_MS);
    };

    checkToken();
  };

  useEffect(() => {
    if (!showTimeoutModal) {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [showTimeoutModal]);

  useEffect(() => {
    if (isAuthenticated) {
      startSessionMonitoring();
    }

    return () => {
      if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const currentVersion = localStorage.getItem("appVersion");
    if (currentVersion !== APP_VERSION) {
      sessionStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("appVersion", APP_VERSION);
      console.warn("Cache limpo automaticamente por nova versão do sistema");
    }
  }, []);

  useEffect(() => {
    const storedAuthData = tokenStore.getAuthData();
    const token = tokenStore.getToken();
    const tokenInvalido = !token || token === "undefined" || token === "null" || token.trim() === "";

    if (storedAuthData && !tokenInvalido && tokenStore.isAuthenticated()) {
      try {
        const userData = JSON.parse(storedAuthData);
        setAuthData(userData);
        setIsAuthenticated(true);
      } catch {
        handleLogout();
      }
    } else if (storedAuthData || token) {
      handleLogout();
    }
  }, []);

  const handleLoginSuccess = (userData: UserData) => {
    tokenStore.setToken(userData.token || "");
    tokenStore.setAuthData(JSON.stringify(userData));
    tokenStore.setAuthenticated(true);

    setAuthData(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    tokenStore.clear();
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    setIsAuthenticated(false);
    setAuthData(null);
    setShowTimeoutModal(false);

    if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
  };

  const handleCookieConsent = (preferences: Record<string, boolean>) => {
    if (preferences.analytics) {
    }
    if (preferences.marketing) {
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <CookieConsent
          validityDays={30}
          policyVersion="1.0"
          onConsent={handleCookieConsent}
        >
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/inicio" replace />
                ) : (
                  <LoginForm onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <AuthenticatedLayout
                    authData={authData}
                    onLogout={handleLogout}
                  >
                    <Routes>
                      <Route path="/inicio" element={<Init />} />
                      <Route path="/pedidos" element={<Pedidos />} />
                      <Route
                        path="/cotacoes"
                        element={<QuotationDashboard />}
                      />
                      <Route
                        path="/cotacao/create"
                        element={<QuotationForm />}
                      />
                      <Route path="/boletos" element={<Boletos />} />
                      <Route
                        path="/inadimplentes"
                        element={<ParcelasAtrasadas />}
                      />
                      <Route path="/relatorio" element={<RelatorioPage />} />
                      <Route
                        path="/pedidos/rastrear-pedidos"
                        element={<PedidoTruck />}
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/inicio" replace />}
                      />
                    </Routes>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/inicio" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>

          <Toaster position="top-right" />
        </CookieConsent>
      </Router>
    </ThemeProvider>
  );
}

function AuthenticatedLayout({
  children,
  onLogout,
  authData,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  authData: UserData | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get("embed") === "true";

  useEffect(() => {
    const token = tokenStore.getToken();
    const isAuth = tokenStore.isAuthenticated() ? "true" : null === "true";

    if (!token || token === "undefined" || token === "null" || !isAuth) {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [onLogout, navigate]);

  const handleSessionExpire = () => {
    onLogout();
  };

  const handleRenewSession = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-[48px]">
      <SessionTimer
        onSessionExpire={handleSessionExpire}
        onRenewSession={handleRenewSession}
      />

      {!isEmbedded && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <NavegationMenu onLogout={onLogout} authData={authData} />
        </div>
      )}

      <main className={isEmbedded ? "" : "pt-16"}>
        <div className="w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
