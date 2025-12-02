"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  Calculator,
  Sparkles,
  Eye,
  Plus,
  ArrowUpFromLine as ChartNoAxesCombined,
} from "lucide-react"
import LogoDark from "@/assets/logo.png"
import LogoLight from "@/assets/logoBranco.png"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Button } from "../ui/button"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { ResetPassword } from "../auth/ResetPassword"
import { ProfileSelector } from "./NavegationMenu/ProfileSelector"

type NavItemChild = {
  title: string
  url: string
  icon?: React.ComponentType<any>
  target?: string
}

type NavItem = {
  title: string
  url?: string
  icon: React.ComponentType<any>
  notificationKey: "home" | "orders" | "quotes" | "tickets" | "defaulters"
  gradient: string
  children?: NavItemChild[]
  target?: string
}

const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark"
    }
    return false
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)
  return { isDark, toggleTheme }
}

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    ...screenSize,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLargeScreen: screenSize.width >= 1280,
    isXLarge: screenSize.width >= 1536,
  }
}

const getUserStorageKey = (email: string) => `userProfile_${email}`

const ThemeAwareLogo = () => {
  const { isMobile, isTablet } = useScreenSize()

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex-shrink-0">
        <img
          src={LogoDark || "/placeholder.svg"}
          alt="logo polar fix"
          className={`${isMobile ? "h-8" : isTablet ? "h-9" : "h-10"} w-auto dark:hidden transition-all duration-300`}
        />
        <img
          src={LogoLight || "/placeholder.svg"}
          alt="logo polar fix"
          className={`${isMobile ? "h-8" : isTablet ? "h-9" : "h-10"} w-auto hidden dark:block transition-all duration-300`}
        />
      </div>
      <div className="hidden sm:block lg:block xl:block">
        <h1
          className={`${isTablet ? "text-lg" : "text-xl"} font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent`}
        >
        </h1>
      </div>
    </div>
  )
}

const ThemeToggle = () => {
  const { toggleTheme } = useTheme()
  const { isMobile } = useScreenSize()

  return (
    <Button
      variant="ghost"
      size={isMobile ? "sm" : "sm"}
      onClick={toggleTheme}
      className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95`}
    >
      <Sun
        className={`${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`}
      />
      <Moon
        className={`absolute ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`}
      />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}

const items: NavItem[] = [
  {
    title: "Início",
    url: "/inicio",
    icon: Home,
    notificationKey: "home" as const,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ShoppingBag,
    notificationKey: "orders" as const,
    gradient: "from-purple-500 to-pink-500",
    children: [
      { title: "Visualizar Pedidos", url: "/pedidos" },
      { title: "Rastrear Pedidos", url: "/pedidos/rastrear-pedidos", icon: Truck },
    ],
  },
  {
    title: "Cotação",
    icon: Calculator,
    notificationKey: "quotes" as const,
    gradient: "from-blue-400 via-blue-500 to-violet-500",
    children: [
      { title: "Visualizar Cotações", url: "/cotacoes?embed=true" },
      { title: "Realizar Cotação", url: "/cotacao/create?embed=true" },
    ],
  },
  {
    title: "Boletos",
    url: "/boletos",
    icon: ScanBarcode,
    notificationKey: "tickets" as const,
    gradient: "from-orange-500 to-red-500",
  },
  {
    title: "Inadimplentes",
    url: "/inadimplentes",
    icon: AlertTriangle,
    notificationKey: "defaulters" as const,
    gradient: "from-red-500 to-rose-500",
  },
  {
    title: "Relatórios",
    url: "/relatorio",
    icon: ChartNoAxesCombined,
    notificationKey: "defaulters" as const,
    gradient: "from-violet-700 to-red-500",
  },
]

export function NavegationMenu({
  onLogout,
  authData,
}: {
  onLogout?: () => void
  authData?: {
    firstName: string
    lastName: string
    login?: string
    email?: string
    avatarUrl?: string
  } | null
}) {
  const location = useLocation()
  const navigate = useNavigate()
  useTheme()
  const { isMobile, isTablet, isLargeScreen } = useScreenSize()

  const [userLogin, setUserLogin] = useState("")
  const [userEmail, setUserEmail] = useState("users@test.com")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isResetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [isUserProfileOpen, setUserProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const loadUserData = () => {
      if (authData?.email) {
        const storageKey = getUserStorageKey(authData.email)
        const storedUserData = localStorage.getItem(storageKey)

        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            setUserLogin(userData.name)
            setAvatarUrl(userData.avatarUrl)
          } catch (error) {
            setDefaultUserData()
          }
        } else {
          setDefaultUserData()
        }

        setUserEmail(authData.email || "default@example.com")
      }
    }

    const setDefaultUserData = () => {
      if (authData) {
        if (authData.firstName && authData.lastName) {
          setUserLogin(`${authData.firstName} ${authData.lastName}`)
        } else if (authData.email) {
          setUserLogin(authData.email.split("@")[0])
        } else if (authData.login) {
          setUserLogin(authData.login)
        }

        if (authData.avatarUrl) {
          setAvatarUrl(authData.avatarUrl)
        }
      }
    }

    loadUserData()

    const handleProfileUpdate = (event: CustomEvent) => {
      const { email, name, avatarUrl } = event.detail
      if (email === authData?.email) {
        setUserLogin(name)
        setAvatarUrl(avatarUrl)
      }
    }

    window.addEventListener("userProfileUpdated", handleProfileUpdate as EventListener)

    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate as EventListener)
      window.removeEventListener("resize", handleResize)
    }
  }, [authData, isMobileMenuOpen])

  const searchParams = new URLSearchParams(location.search)
  const isEmbedded = searchParams.get("embed") === "true"

  if (isEmbedded) {
    return null
  }

  const handleNavigation = (url: string, target?: string) => {
    const finalUrl = url
    if (target === "_blank") {
      window.open(finalUrl, "_blank", "noopener,noreferrer")
    } else {
      navigate(finalUrl)
      if (isMobile) {
        setIsMobileMenuOpen(false)
      }
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/external/Auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) throw new Error("Falha ao fazer logout")

      if (onLogout) onLogout()
      navigate("/login")
    } catch (error) {
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handlePasswordReset = () => setResetPasswordOpen(true)
  const openUserProfileModal = () => setUserProfileOpen(true)
  const closeUserProfileModal = () => setUserProfileOpen(false)

  const handleSaveUserChanges = async (userData: { name: string; avatarUrl: string | null }) => {
    try {
      setUserLogin(userData.name)
      setAvatarUrl(userData.avatarUrl)

      if (authData?.email) {
        const storageKey = getUserStorageKey(authData.email)
        localStorage.setItem(storageKey, JSON.stringify({ name: userData.name, avatarUrl: userData.avatarUrl }))
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
      return true
    } catch (error) {
      return false
    }
  }

  const closeModal = () => setResetPasswordOpen(false)
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const isActiveRoute = (url: string | undefined) => {
    if (!url) return false
    return location.pathname === url
  }

  const getHeaderHeight = () => (isMobile ? "h-14" : isTablet ? "h-15" : "h-16")
  const getAvatarSize = () => (isMobile ? "h-7 w-7" : isTablet ? "h-8 w-8" : "h-8 w-8")
  const getAvatarSizeLarge = () => (isMobile ? "h-10 w-10" : isTablet ? "h-11 w-11" : "h-12 w-12")
  const getContainerPadding = () => (isMobile ? "px-3" : isTablet ? "px-4" : isLargeScreen ? "" : "px-6")

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className={`container mx-auto ${getContainerPadding()}`}>
          <div className={`flex items-center justify-between ${getHeaderHeight()}`}>
            <div className="flex items-center min-w-0 flex-shrink-0">
              <ThemeAwareLogo />
            </div>

            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {items.map((item) => {
                if (item.children) {
                  const isParentActive = isActiveRoute(item.url) || item.children.some((c) => isActiveRoute(c.url))

                  return (
                    <DropdownMenu key={item.title}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`group relative flex items-center gap-2 ${isLargeScreen ? "px-4 py-2.5" : "px-3 py-2"} text-sm font-medium rounded-2xl transition-all duration-300 whitespace-nowrap overflow-hidden ${isParentActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split("-")[1]}-500/25 transform scale-105` : `text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 hover:scale-105 hover:shadow-md`}`}
                        >
                          {!isParentActive && (
                            <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                          )}
                          <item.icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isParentActive ? "" : "group-hover:scale-110 transition-transform duration-300"}`} />
                          <span className={`${isLargeScreen ? "block" : "hidden xl:block"} relative z-10`}>{item.title}</span>
                          {isParentActive && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-white/80" />}
                          <ChevronDown className={`w-3 h-3 relative z-10 ${isParentActive ? "rotate-180" : "rotate-0"} transition-transform`} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="bottom"
                        align="start"
                        className={`${isMobile ? "w-64" : isTablet ? "w-68" : "w-72"} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl shadow-gray-200/40 dark:shadow-gray-900/40 p-2 mt-2`}
                      >
                        {item.children.map((sub) => {
                          const isActive = isActiveRoute(sub.url)
                          return (
                            <DropdownMenuItem key={sub.title} asChild>
                              <a
                                href={sub.url}
                                target={sub.target || "_self"}
                                rel={sub.target === "_blank" ? "noopener noreferrer" : undefined}
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleNavigation(sub.url, sub.target)
                                }}
                                className={`group flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-300 mb-1 ${isActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-[1.02]` : `hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:scale-[1.01] hover:shadow-md`} cursor-pointer block w-full`}
                              >
                                <div className="relative mr-3">
                                  {sub.icon ? (
                                    <sub.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-blue-600 dark:text-blue-400"} transition-all duration-300 group-hover:scale-110`} />
                                  ) : sub.title.includes("Visualizar") ? (
                                    <Eye className={`w-5 h-5 ${isActive ? "text-white" : "text-blue-600 dark:text-blue-400"} transition-all duration-300 group-hover:scale-110`} />
                                  ) : sub.title.includes("Realizar") ? (
                                    <Plus className={`w-5 h-5 ${isActive ? "text-white" : "text-green-600 dark:text-green-400"} transition-all duration-300 group-hover:scale-110 group-hover:rotate-90`} />
                                  ) : null}
                                </div>
                                <div className="flex-1">
                                  <div className={`font-medium ${isActive ? "text-white" : "text-gray-900 dark:text-gray-100"} transition-colors`}>
                                    {sub.title}
                                  </div>
                                  <div className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"} transition-colors`}>
                                    {sub.title.includes("Visualizar") && "Consulte e gerencie suas cotações"}
                                    {sub.title.includes("Realizar") && "Crie uma nova cotação rapidamente"}
                                    {sub.title.includes("Rastrear") && "Acompanhe o status dos seus pedidos"}
                                  </div>
                                </div>
                                <div className={`ml-2 transition-all duration-300 ${isActive ? "translate-x-1" : "translate-x-0 group-hover:translate-x-1"}`}>
                                  <ChevronDown className={`w-4 h-4 rotate-[-90deg] ${isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"} transition-colors`} />
                                </div>
                                {isActive && <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/30 rounded-full" />}
                              </a>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                const isActive = isActiveRoute(item.url)
                return (
                  <Link
                    key={item.title}
                    to={item.url!}
                    className={`group relative flex items-center gap-2 ${isLargeScreen ? "px-4 py-2.5" : "px-3 py-2"} text-sm font-medium rounded-2xl transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split("-")[1]}-500/25 transform scale-105` : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 hover:scale-105 hover:shadow-md"}`}
                  >
                    {!isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                    )}
                    <item.icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? "" : "group-hover:scale-110 transition-transform duration-300"}`} />
                    <span className={`${isLargeScreen ? "block" : "hidden xl:block"} relative z-10`}>{item.title}</span>
                    {isActive && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-white/80 animate-pulse" />}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-1 sm:gap-2 ${isMobile ? "px-2 py-1.5" : "px-3 py-5"} rounded-2xl bg-gray-200/30 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 transition-all duration-300 active:scale-95 min-w-0 shadow-sm border hover:shadow-md`}
                  >
                    <div className={`${getAvatarSize()} overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0 transition-all duration-300 hover:ring-4`}>
                      <Avatar className="h-full w-full">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <User2 className={`text-white ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <span className={`hidden sm:block ${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-700 dark:text-gray-200 truncate ${isMobile ? "max-w-16" : isTablet ? "max-w-24" : "max-w-32"}`}>
                      {userLogin || "Usuário"}
                    </span>
                    <ChevronDown className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-gray-500 transition-transform duration-300 hidden sm:block flex-shrink-0 group-hover:rotate-180`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  className={`${isMobile ? "w-64" : isTablet ? "w-68" : "w-72"} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl shadow-gray-200/40 dark:shadow-gray-900/40 p-2 mt-2`}
                >
                  <DropdownMenuItem
                    className={`flex items-center gap-3 ${isMobile ? "p-3" : "p-4"} rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer outline-none transition-all duration-200`}
                    onClick={openUserProfileModal}
                  >
                    <div className={`${getAvatarSizeLarge()} overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-600 flex-shrink-0`}>
                      <Avatar className="h-full w-full">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <User2 className={`text-white ${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-gray-900 dark:text-gray-100 truncate`}>
                        {userLogin || "Usuário Desconhecido"}
                      </span>
                      <span className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500 dark:text-gray-400 truncate`}>{userEmail}</span>
                      <span className={`${isMobile ? "text-xs" : "text-xs"} text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1`}>
                        Editar Perfil <Edit size={isMobile ? 10 : 12} />
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-2"></div>
                  <DropdownMenuItem
                    className={`flex items-center gap-3 ${isMobile ? "p-2.5" : "p-3"} rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer outline-none transition-all duration-200`}
                    onClick={handlePasswordReset}
                  >
                    <div className={`${isMobile ? "p-1" : "p-1.5"} rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0`}>
                      <Settings className={`${isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} text-gray-600 dark:text-gray-300`} />
                    </div>
                    <span className={`${isMobile ? "text-sm" : "text-base"} text-gray-700 dark:text-gray-200 font-medium`}>Alterar senha</span>
                  </DropdownMenuItem>
                  <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-2"></div>
                  <DropdownMenuItem className="p-0 outline-none">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`w-full justify-start gap-3 ${isMobile ? "p-2.5" : "p-3"} text-red-600 hover:text-red-700 hover:bg-red-50/80 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200`}
                    >
                      <div className={`${isMobile ? "p-1" : "p-1.5"} rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0`}>
                        <LogOut className={`${isMobile ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
                      </div>
                      <span className={`${isMobile ? "text-sm" : "text-base"} font-medium`}>{isLoggingOut ? "Saindo..." : "Sair"}</span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden ${isMobile ? "p-1.5" : "p-2"} rounded-2xl hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md`}
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} transition-transform duration-300 rotate-90`} />
                ) : (
                  <Menu className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} transition-transform duration-300`} />
                )}
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/60 dark:border-gray-700/60 py-3 sm:py-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
              <nav className="flex flex-col space-y-2">
                {items.map((item) => {
                  const isActive = isActiveRoute(item.url)
                  if (item.children) {
                    return (
                      <div key={item.title} className="flex flex-col">
                        <div
                          className={`group relative flex items-center gap-3 ${isMobile ? "px-3 py-3" : "px-4 py-3.5"} rounded-2xl transition-all duration-300 active:scale-95 overflow-hidden ${item.children.some((c) => isActiveRoute(c.url)) ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split("-")[1]}-500/25 transform scale-[1.02]` : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 hover:scale-[1.02] hover:shadow-md"}`}
                        >
                          {!item.children.some((c) => isActiveRoute(c.url)) && (
                            <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                          )}
                          <div className="relative">
                            <item.icon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} flex-shrink-0 relative z-10 ${item.children.some((c) => isActiveRoute(c.url)) ? "animate-pulse" : "group-hover:scale-110 transition-transform duration-300"}`} />
                          </div>
                          <span className={`${isMobile ? "text-sm" : "text-base"} font-medium relative z-10`}>{item.title}</span>
                          {item.children.some((c) => isActiveRoute(c.url)) && <Sparkles className="w-3 h-3 absolute top-2 right-2 text-white/80 animate-pulse" />}
                        </div>
                        <div className="ml-6 mt-1 flex flex-col space-y-1">
                          {item.children.map((sub) => {
                            const isSubActive = isActiveRoute(sub.url)
                            return (
                              <div
                                key={sub.title}
                                onClick={() => handleNavigation(sub.url, sub.target)}
                                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${isSubActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                              >
                                {sub.icon ? (
                                  <sub.icon className="w-4 h-4 mr-2" />
                                ) : sub.title.includes("Visualizar") ? (
                                  <Eye className="w-4 h-4 mr-2" />
                                ) : sub.title.includes("Realizar") ? (
                                  <Plus className="w-4 h-4 mr-2" />
                                ) : null}
                                {sub.title}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={item.title}
                      to={item.url!}
                      className={`group relative flex items-center gap-3 ${isMobile ? "px-3 py-3" : "px-4 py-3.5"} rounded-2xl transition-all duration-300 active:scale-95 overflow-hidden ${isActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split("-")[1]}-500/25 transform scale-[1.02]` : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 hover:scale-[1.02] hover:shadow-md"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {!isActive && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                      )}
                      <item.icon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} flex-shrink-0 relative z-10 ${isActive ? "animate-pulse" : "group/modal-hover:scale-110 transition-transform duration-300"}`} />
                      <span className={`${isMobile ? "text-sm" : "text-base"} font-medium relative z-10`}>{item.title}</span>
                      {isActive && <Sparkles className="w-3 h-3 absolute top-2 right-2 text-white/80" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {isResetPasswordOpen && <ResetPassword closeModal={closeModal} />}
      <ProfileSelector
        isOpen={isUserProfileOpen}
        onClose={closeUserProfileModal}
        currentUser={{ name: userLogin, email: userEmail, avatarUrl }}
        onSaveChanges={handleSaveUserChanges}
      />
    </>
  )
}