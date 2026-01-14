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
} from "react-router-dom";
import { Init } from "./components/pages/Home";
import { LoginForm } from "./components/auth/LoginForm";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/Dark-Mode/ThemeProvider";
import CookieConsent from "./components/auth/cookies/CookieConsent";
import PedidoTruck from "./components/pages/Pedidos/PedidoTruck";
import { ParcelasAtrasadas } from "./components/pages/ParcelAtrasada";
import { QuotationForm } from "./components/pages/Cotacao";
import { QuotationDashboard } from "./components/pages/Cotação/CotacaoDash";
import { RelatorioPage } from "./components/pages/Report";

// Componente do Modal
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, AlertTriangle, RefreshCw, LogOut } from "lucide-react";

interface UserData {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string;
}

function SessionTimeoutModal({
  open,
  remainingSeconds,
  onRenew,
  onLogout,
}: {
  open: boolean;
  remainingSeconds: number;
  onRenew: () => Promise<void>;
  onLogout: () => void;
}) {
  const [renewing, setRenewing] = useState(false);
  const [progress, setProgress] = useState(100);

  const WARNING_TIME = 5 * 60; 

  useEffect(() => {
    if (open) {
      const percentage = (remainingSeconds / WARNING_TIME) * 100;
      setProgress(Math.max(0, Math.min(100, percentage)));
    }
  }, [remainingSeconds, open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getUrgencyColor = () => {
    if (remainingSeconds <= 60) return "text-red-600 dark:text-red-400";
    if (remainingSeconds <= 180) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getProgressColor = () => {
    if (remainingSeconds <= 60) return "bg-red-500";
    if (remainingSeconds <= 180) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await onRenew();
    } finally {
      setRenewing(false);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent
        className="sm:max-w-[480px] gap-0 p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 dark:bg-yellow-500/10 rounded-full animate-ping" />
                <div className="relative bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold text-center">
              Sessão prestes a expirar
            </DialogTitle>

            <DialogDescription className="text-center text-base space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Por motivos de segurança, sua sessão será encerrada em breve.
              </p>

              <div className="flex items-center justify-center gap-3 py-4">
                <Clock className={`h-6 w-6 ${getUrgencyColor()}`} />
                <span
                  className={`text-5xl font-bold tabular-nums tracking-tight ${getUrgencyColor()}`}
                >
                  {formatTime(remainingSeconds)}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-500">
                Clique em "Continuar conectado" para renovar sua sessão
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={renewing}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair agora
            </Button>

            <Button
              onClick={handleRenew}
              disabled={renewing}
              className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {renewing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Renovando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Continuar conectado
                </>
              )}
            </Button>
          </DialogFooter>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-500">
              💡 Dica: Mantenha-se ativo no sistema para evitar desconexões automáticas
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function App() {
  const APP_VERSION = "1.0.4"; // aumentado para forçar limpeza se necessário

  const [authData, setAuthData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem("token");
    const authFlag = localStorage.getItem("isAuthenticated");
    return !!token && authFlag === "true" && token !== "undefined" && token !== "null";
  });

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const WARNING_TIME_SECONDS = 5 * 60; // 5 minutos antes
  const CHECK_INTERVAL_MS = 10_000; // checa a cada 10s
  const REFRESH_ENDPOINT = "/api/auth/refresh-token"; // ajuste conforme seu backend

  const getTokenExpiration = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  // Renova o token
  const renewToken = async (): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const response = await fetch(REFRESH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Refresh failed");

      const data = await response.json();
      const newToken = data.token || data.access_token || data.accessToken;

      if (newToken) {
        localStorage.setItem("token", newToken);
        console.log("Token renovado com sucesso");
        return true;
      }
    } catch (err) {
      console.warn("Falha ao renovar token:", err);
    }
    return false;
  };

  const startSessionMonitoring = () => {
    if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const checkToken = () => {
      const token = localStorage.getItem("token");
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
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showTimeoutModal]);

  useEffect(() => {
    if (isAuthenticated) {
      startSessionMonitoring();
    }

    return () => {
      if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const currentVersion = localStorage.getItem("appVersion");
    if (currentVersion !== APP_VERSION) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("appVersion", APP_VERSION);
      console.warn("Cache limpo automaticamente por nova versão do sistema");
    }
  }, []);

  useEffect(() => {
    const storedAuthData = localStorage.getItem("authData");
    const token = localStorage.getItem("token");
    const authFlag = localStorage.getItem("isAuthenticated");

    const tokenInvalido =
      !token || token === "undefined" || token === "null" || token.trim() === "";

    if (storedAuthData && !tokenInvalido && authFlag === "true") {
      try {
        const userData = JSON.parse(storedAuthData);
        setAuthData(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.warn("Erro ao carregar authData, limpando cache...");
        handleLogout();
      }
    } else {
      if (storedAuthData || token || authFlag) {
        handleLogout();
      }
    }
  }, []);

  const handleLoginSuccess = (userData: UserData) => {
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("authData", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");

    setAuthData(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authData");
    localStorage.removeItem("token");
    sessionStorage.clear();
    setIsAuthenticated(false);
    setAuthData(null);
    setShowTimeoutModal(false);

    if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleRenewSession = async () => {
    const success = await renewToken();
    if (success) {
      setShowTimeoutModal(false);
      startSessionMonitoring(); // reinicia monitoramento com novo token
    } else {
      handleLogout();
    }
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
                      <Route path="/cotacoes" element={<QuotationDashboard />} />
                      <Route path="/cotacao/create" element={<QuotationForm />} />
                      <Route path="/boletos" element={<Boletos />} />
                      <Route path="/inadimplentes" element={<ParcelasAtrasadas />} />
                      <Route path="/relatorio" element={<RelatorioPage />} />
                      <Route
                        path="/pedidos/rastrear-pedidos"
                        element={<PedidoTruck />}
                      />
                      <Route path="*" element={<Navigate to="/inicio" replace />} />
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

          <SessionTimeoutModal
            open={showTimeoutModal}
            remainingSeconds={remainingSeconds}
            onRenew={handleRenewSession}
            onLogout={handleLogout}
          />
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuth = localStorage.getItem("isAuthenticated") === "true";

    if (!token || token === "undefined" || token === "null" || !isAuth) {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [onLogout, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavegationMenu
        onLogout={() => {
          onLogout();
          navigate("/login", { replace: true });
        }}
        authData={authData}
      />
      <main className="relative">
        <div className="w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}