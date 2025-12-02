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

// Componente do Modal (adicionado aqui para ficar tudo em um arquivo só, mas pode separar)
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string;
}

// Modal de expiração de sessão
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Sessão prestes a expirar</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Sua sessão expira em <strong className="text-red-600">{formatTime(remainingSeconds)}</strong>.
            <br />
            Deseja continuar conectado?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-4 sm:justify-end mt-6">
          <Button variant="outline" onClick={onLogout} disabled={renewing}>
            Sair agora
          </Button>
          <Button onClick={handleRenew} disabled={renewing}>
            {renewing ? "Renovando..." : "Continuar conectado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function App() {
  // Controle de versão da aplicação
  const APP_VERSION = "1.0.4"; // aumentado para forçar limpeza se necessário

  // Estado de autenticação
  const [authData, setAuthData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem("token");
    const authFlag = localStorage.getItem("isAuthenticated");
    return !!token && authFlag === "true" && token !== "undefined" && token !== "null";
  });

  // Estado do modal de expiração
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Refs para controle de timers
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configurações
  const WARNING_TIME_SECONDS = 5 * 60; // 5 minutos antes
  const CHECK_INTERVAL_MS = 10_000; // checa a cada 10s
  const REFRESH_ENDPOINT = "/api/auth/refresh-token"; // ajuste conforme seu backend

  // Decodifica JWT e retorna timestamp de expiração (em milissegundos)
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

  // Monitora expiração do token
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

      // Token já expirado
      if (timeLeftMs <= 0) {
        handleLogout();
        return;
      }

      const timeLeftSeconds = Math.floor(timeLeftMs / 1000);

      // Mostrar modal 5 minutos antes
      if (timeLeftSeconds <= WARNING_TIME_SECONDS && !showTimeoutModal) {
        setRemainingSeconds(timeLeftSeconds);
        setShowTimeoutModal(true);
      }

      // Atualiza contador quando modal está aberto
      if (showTimeoutModal) {
        setRemainingSeconds(timeLeftSeconds);
      }

      // Reagendar próxima checagem
      checkIntervalRef.current = setTimeout(checkToken, CHECK_INTERVAL_MS);
    };

    checkToken();
  };

  // Contador regressivo em tempo real quando modal está aberto
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

  // Inicia monitoramento ao autenticar
  useEffect(() => {
    if (isAuthenticated) {
      startSessionMonitoring();
    }

    return () => {
      if (checkIntervalRef.current) clearTimeout(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated]);

  // Limpeza automática de cache em novas versões
  useEffect(() => {
    const currentVersion = localStorage.getItem("appVersion");
    if (currentVersion !== APP_VERSION) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("appVersion", APP_VERSION);
      console.warn("Cache limpo automaticamente por nova versão do sistema");
    }
  }, []);

  // Carrega dados de autenticação ao iniciar
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

  // Funções de auth
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
      // analytics
    }
    if (preferences.marketing) {
      // pixels
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
            {/* Login público */}
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

            {/* Rotas protegidas */}
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

            {/* Redireciona raiz */}
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

          {/* Modal de expiração de sessão */}
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

// Layout autenticado (inalterado)
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