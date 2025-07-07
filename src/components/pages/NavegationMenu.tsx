import { useState, useEffect } from "react";
import {
  Home,
  ShoppingBag,
  ScanBarcode,
  Settings,
  ChevronDown,
  User2,
  LogOut,
  Edit,
  Truck,
  AlertTriangle,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import LogoDark from "@/assets/logo.png";
import LogoLight from "@/assets/logoBranco.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Button } from "../ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ResetPassword } from "../auth/ResetPassword";
import { ProfileSelector } from "./NavegationMenu/ProfileSelector";

// Hook para gerenciar tema simples (claro/escuro)
const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
};

// Hook para detectar tamanho da tela
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLargeScreen: screenSize.width >= 1280,
    isXLarge: screenSize.width >= 1536,
  };
};

// Função utilitária para obter a chave do localStorage
const getUserStorageKey = (email: string) => `userProfile_${email}`;

// Componente de logo que muda com o tema e se adapta ao tamanho da tela
const ThemeAwareLogo = () => {
  const { isMobile, isTablet } = useScreenSize();
  
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex-shrink-0">
        <img
          src={LogoDark}
          alt="logo polar fix"
          className={`${
            isMobile ? 'h-8' : isTablet ? 'h-9' : 'h-10'
          } w-auto dark:hidden transition-all duration-300`}
        />
        <img
          src={LogoLight}
          alt="logo polar fix"
          className={`${
            isMobile ? 'h-8' : isTablet ? 'h-9' : 'h-10'
          } w-auto hidden dark:block transition-all duration-300`}
        />
      </div>
      <div className="hidden sm:block lg:block xl:block">
        <h1 className={`${
          isTablet ? 'text-lg' : 'text-xl'
        } font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent`}>
          {/* Título pode ser adicionado aqui se necessário */}
        </h1>
      </div>
    </div>
  );
};

// Componente do toggle de tema responsivo
const ThemeToggle = () => {
  const { toggleTheme } = useTheme();
  const { isMobile } = useScreenSize();

  return (
    <Button
      variant="ghost"
      size={isMobile ? "sm" : "sm"}
      onClick={toggleTheme}
      className={`${
        isMobile ? 'h-8 w-8' : 'h-9 w-9'
      } rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95`}
    >
      <Sun className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
      <Moon className={`absolute ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};

const items = [
  {
    title: "Início",
    url: "/inicio",
    icon: Home,
    notificationKey: "home" as const,
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ShoppingBag,
    notificationKey: "orders" as const,
  },
  {
    title: "Boletos",
    url: "/boletos",
    icon: ScanBarcode,
    notificationKey: "tickets" as const,
  },
  {
    title: "Inadimplentes",
    url: "/inadimplentes",
    icon: AlertTriangle,
    notificationKey: "defaulters" as const,
  },
  {
    title: "Rastrear Pedidos",
    url: "/rastreio-pedidos",
    icon: Truck,
    notificationKey: "tracking" as const,
  },
];

export function NavegationMenu({
  onLogout,
  authData,
}: {
  onLogout?: () => void;
  authData?: {
    firstName: string;
    lastName: string;
    login?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
}) {
  const [userLogin, setUserLogin] = useState("");
  const [userEmail, setUserEmail] = useState("users@test.com");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isResetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [isUserProfileOpen, setUserProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isLargeScreen } = useScreenSize();

  const loadUserData = () => {
    if (authData?.email) {
      const storageKey = getUserStorageKey(authData.email);
      const storedUserData = localStorage.getItem(storageKey);

      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUserLogin(userData.name);
          setAvatarUrl(userData.avatarUrl);
        } catch (error) {
          setDefaultUserData();
        }
      } else {
        setDefaultUserData();
      }

      setUserEmail(authData.email || "default@example.com");
    }
  };

  const setDefaultUserData = () => {
    if (authData) {
      if (authData.firstName && authData.lastName) {
        setUserLogin(`${authData.firstName} ${authData.lastName}`);
      } else if (authData.email) {
        setUserLogin(authData.email.split("@")[0]);
      } else if (authData.login) {
        setUserLogin(authData.login);
      }

      if (authData.avatarUrl) {
        setAvatarUrl(authData.avatarUrl);
      }
    }
  };

  useEffect(() => {
    loadUserData();

    const handleProfileUpdate = (event: CustomEvent) => {
      const { email, name, avatarUrl } = event.detail;

      if (email === authData?.email) {
        setUserLogin(name);
        setAvatarUrl(avatarUrl);
      }
    };

    window.addEventListener(
      "userProfileUpdated",
      handleProfileUpdate as EventListener
    );

    // Fechar menu mobile quando redimensionar para desktop
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(
        "userProfileUpdated",
        handleProfileUpdate as EventListener
      );
      window.removeEventListener('resize', handleResize);
    };
  }, [authData, isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const response = await fetch("/api/external/Auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao fazer logout");
      }

      if (onLogout) {
        onLogout();
      }

      navigate("/login");
    } catch (error) {
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePasswordReset = () => {
    setResetPasswordOpen(true);
  };

  const openUserProfileModal = () => {
    setUserProfileOpen(true);
  };

  const closeUserProfileModal = () => {
    setUserProfileOpen(false);
  };

  const handleSaveUserChanges = async (userData: {
    name: string;
    avatarUrl: string | null;
  }) => {
    try {
      setUserLogin(userData.name);
      setAvatarUrl(userData.avatarUrl);

      if (authData?.email) {
        const storageKey = getUserStorageKey(authData.email);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            name: userData.name,
            avatarUrl: userData.avatarUrl,
          })
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      return true;
    } catch (error) {
      return false;
    }
  };

  const closeModal = () => {
    setResetPasswordOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveRoute = (url: string) => {
    return location.pathname === url;
  };

  // Calcular tamanhos responsivos para diferentes elementos
  const getHeaderHeight = () => {
    if (isMobile) return 'h-14 ';
    if (isTablet) return 'h-15 ';
    return 'h-16 ';
  };

  const getAvatarSize = () => {
    if (isMobile) return 'h-7 w-7';
    if (isTablet) return 'h-8 w-8';
    return 'h-8 w-8';
  };

  const getAvatarSizeLarge = () => {
    if (isMobile) return 'h-10 w-10';
    if (isTablet) return 'h-11 w-11';
    return 'h-12 w-12';
  };

  const getContainerPadding = () => {
    if (isMobile) return 'px-3 ';
    if (isTablet) return 'px-4';
    if (isLargeScreen) return 'px-8';
    return 'px-6 ';
  };

  return (
    <>
      {/* Header Principal */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className={`container mx-auto   ${getContainerPadding()}`}>
          <div className={`flex items-center justify-between ${getHeaderHeight()}`}>
            {/* Logo */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <ThemeAwareLogo />
            </div>

            {/* Navegação Desktop - Oculta em telas menores que lg */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {items.map((item) => {
                const isActive = isActiveRoute(item.url);

                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`relative flex items-center gap-2 ${
                      isLargeScreen ? 'px-4 py-2.5' : 'px-3 py-2'
                    } text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:scale-105"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 ${isActive ? "animate-pulse" : ""}`}
                    />
                    <span className={isLargeScreen ? 'block' : 'hidden xl:block'}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Controles do Header */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Toggle de Tema */}
              <ThemeToggle />

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-1 sm:gap-2 ${
                      isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
                    } rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105 active:scale-95 min-w-0`}
                  >
                    <div className={`${getAvatarSize()} overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0`}>
                      <Avatar className="h-full w-full">
                        {avatarUrl ? (
                          <AvatarImage
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                            <User2 className={`text-white ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <span className={`hidden sm:block ${
                      isMobile ? 'text-xs' : 'text-sm'
                    } font-medium text-gray-700 dark:text-gray-200 truncate ${
                      isMobile ? 'max-w-16' : isTablet ? 'max-w-24' : 'max-w-32'
                    }`}>
                      {userLogin || "Usuário"}
                    </span>
                    <ChevronDown className={`${
                      isMobile ? 'w-3 h-3' : 'w-4 h-4'
                    } text-gray-500 transition-transform duration-200 hidden sm:block flex-shrink-0`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  className={`${
                    isMobile ? 'w-64' : isTablet ? 'w-68' : 'w-72'
                  } bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl p-2 mt-2`}
                >
                  {/* Perfil do Usuário */}
                  <DropdownMenuItem
                    className={`flex items-center gap-3 ${
                      isMobile ? 'p-3' : 'p-4'
                    } rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer outline-none transition-all duration-200`}
                    onClick={openUserProfileModal}
                  >
                    <div className={`${getAvatarSizeLarge()} overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-600 flex-shrink-0`}>
                      <Avatar className="h-full w-full">
                        {avatarUrl ? (
                          <AvatarImage
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                            <User2 className={`text-white ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`${
                        isMobile ? 'text-sm' : 'text-base'
                      } font-semibold text-gray-900 dark:text-gray-100 truncate`}>
                        {userLogin || "Usuário Desconhecido"}
                      </span>
                      <span className={`${
                        isMobile ? 'text-xs' : 'text-sm'
                      } text-gray-500 dark:text-gray-400 truncate`}>
                        {userEmail}
                      </span>
                      <span className={`${
                        isMobile ? 'text-xs' : 'text-xs'
                      } text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1`}>
                        Editar Perfil <Edit size={isMobile ? 10 : 12} />
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-2"></div>

                  {/* Alterar Senha */}
                  <DropdownMenuItem
                    className={`flex items-center gap-3 ${
                      isMobile ? 'p-2.5' : 'p-3'
                    } rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer outline-none transition-all duration-200`}
                    onClick={handlePasswordReset}
                  >
                    <div className={`${
                      isMobile ? 'p-1' : 'p-1.5'
                    } rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0`}>
                      <Settings className={`${
                        isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
                      } text-gray-600 dark:text-gray-300`} />
                    </div>
                    <span className={`${
                      isMobile ? 'text-sm' : 'text-base'
                    } text-gray-700 dark:text-gray-200 font-medium`}>
                      Alterar senha
                    </span>
                  </DropdownMenuItem>

                  <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-2"></div>

                  {/* Logout */}
                  <DropdownMenuItem className="p-0 outline-none">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`w-full justify-start gap-3 ${
                        isMobile ? 'p-2.5' : 'p-3'
                      } text-red-600 hover:text-red-700 hover:bg-red-50/80 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200`}
                    >
                      <div className={`${
                        isMobile ? 'p-1' : 'p-1.5'
                      } rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0`}>
                        <LogOut className={`${
                          isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
                        }`} />
                      </div>
                      <span className={`${
                        isMobile ? 'text-sm' : 'text-base'
                      } font-medium`}>
                        {isLoggingOut ? "Saindo..." : "Sair"}
                      </span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Toggle Mobile Menu - Visível apenas em telas menores que lg */}
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden ${
                  isMobile ? 'p-1.5' : 'p-2'
                } rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 active:scale-95`}
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className={`${
                    isMobile ? 'w-4 h-4' : 'w-5 h-5'
                  } transition-transform duration-200 rotate-90`} />
                ) : (
                  <Menu className={`${
                    isMobile ? 'w-4 h-4' : 'w-5 h-5'
                  } transition-transform duration-200`} />
                )}
              </Button>
            </div>
          </div>

          {/* Menu Mobile - Responsivo para diferentes tamanhos de tela */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 dark:border-gray-700/50 py-3 sm:py-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <nav className="flex flex-col space-y-1">
                {items.map((item) => {
                  const isActive = isActiveRoute(item.url);

                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`relative flex items-center gap-3 ${
                        isMobile ? 'px-3 py-2.5' : 'px-4 py-3'
                      } rounded-xl transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-[1.02]"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:scale-[1.02]"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={`${
                          isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        } flex-shrink-0 ${isActive ? "animate-pulse" : ""}`}
                      />
                      <span className={`${
                        isMobile ? 'text-sm' : 'text-base'
                      } font-medium`}>
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Modal de Redefinição de Senha */}
      {isResetPasswordOpen && <ResetPassword closeModal={closeModal} />}

      {/* Modal de Perfil do Usuário */}
      <ProfileSelector
        isOpen={isUserProfileOpen}
        onClose={closeUserProfileModal}
        currentUser={{
          name: userLogin,
          email: userEmail,
          avatarUrl: avatarUrl,
        }}
        onSaveChanges={handleSaveUserChanges}
      />
    </>
  );
}