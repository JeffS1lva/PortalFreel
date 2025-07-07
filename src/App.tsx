import { useEffect, useState } from "react";
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

// Define a interface para os dados do usuário
interface UserData {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string;
}

export function App() {
  const [authData, setAuthData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem("token");
    const authFlag = localStorage.getItem("isAuthenticated");
    return token !== null && authFlag === "true";
  });

  const handleLoginSuccess = (userData: UserData) => {
    setIsAuthenticated(true);
    setAuthData(userData);

    if (!localStorage.getItem("isAuthenticated")) {
      localStorage.setItem("isAuthenticated", "true");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authData");
    localStorage.removeItem("token");
    sessionStorage.clear();
    setIsAuthenticated(false);
    setAuthData(null);
  };

  // Carrega os dados de autenticação uma vez no início
  useEffect(() => {
    const storedAuthData = localStorage.getItem("authData");
    const token = localStorage.getItem("token");
    const authFlag = localStorage.getItem("isAuthenticated");

    if (storedAuthData && token && authFlag === "true") {
      try {
        const userData = JSON.parse(storedAuthData);
        setAuthData(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao carregar dados de autenticação:", error);
        handleLogout();
      }
    } else {
      if (storedAuthData || token || authFlag) {
        handleLogout();
      }
    }
  }, []);

  // Callback para quando o consentimento for dado
  const handleCookieConsent = (preferences: Record<string, boolean>) => {
    console.log("Cookie consent given with preferences:", preferences);
    
    // Você pode usar as preferências para configurar analytics, marketing, etc.
    if (preferences.analytics) {
      // Inicializar Google Analytics, por exemplo
      console.log("Analytics cookies aceitos");
    }
    
    if (preferences.marketing) {
      // Inicializar pixels de marketing, por exemplo
      console.log("Marketing cookies aceitos");
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        {/* 
          Configuração do CookieConsent:
          - validityDays: 30 dias de validade (padrão)
          - policyVersion: versão da política (força novo consentimento se mudar)
          - onConsent: callback quando consentimento é dado
        */}
        <CookieConsent 
          validityDays={30}
          policyVersion="1.0"
          onConsent={handleCookieConsent}
        >
          <Routes>
            {/* Rota pública do login */}
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
                      <Route path="/boletos" element={<Boletos />} />
                      <Route path="/inadimplentes" element={<ParcelasAtrasadas />} />
                      <Route path="/rastreio-pedidos" element={<PedidoTruck />} />
                      <Route path="*" element={<Navigate to="/inicio" replace />} />
                    </Routes>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Redireciona a rota raiz */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  <Navigate to="/inicio" replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
          </Routes>
          
          <Toaster />
        </CookieConsent>
      </Router>
    </ThemeProvider>
  );
}

// Componente para o layout após autenticação (LAYOUT DE HEADER)
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

    if (!token || !isAuth) {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [onLogout, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Navigation */}
      <NavegationMenu
        onLogout={() => {
          onLogout();
          navigate("/login", { replace: true });
        }}
        authData={authData}
      />
      
      {/* Main Content */}
      <main className="relative">
        {/* Page Content */}
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}