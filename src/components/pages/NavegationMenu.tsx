"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Home,
  ShoppingBag,
  ScanBarcode,
  Settings,
  ChevronDown,
  LogOut,
  Edit,
  Truck,
  AlertTriangle,
  Menu,
  X,
  Sun,
  Moon,
  Calculator,
  Eye,
  Plus,
  ArrowUpFromLine as ChartNoAxesCombined,
} from "lucide-react"
import LogoDark from "@/assets/logo.png"
import LogoLight from "@/assets/logoBranco.png"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { ResetPassword } from "../auth/ResetPassword"
import { ProfileSelector } from "./NavegationMenu/ProfileSelector"
import { apiBase } from "@/lib/api";

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
    gradient: "from-blue-900 to-blue-900",
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ShoppingBag,
    notificationKey: "orders" as const,
    gradient: "from-blue-900 to-blue-900",
    children: [
      { title: "Visualizar Pedidos", url: "/pedidos" },
      { title: "Rastrear Pedidos", url: "/pedidos/rastrear-pedidos", icon: Truck },
    ],
  },
  {
    title: "Cotação",
    icon: Calculator,
    notificationKey: "quotes" as const,
    gradient: "from-blue-900 to-blue-900",
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
    gradient: "from-blue-900 to-blue-900",
  },
  {
    title: "Inadimplentes",
    url: "/inadimplentes",
    icon: AlertTriangle,
    notificationKey: "defaulters" as const,
    gradient: "from-blue-900 to-blue-900",
  },
  {
    title: "Relatórios",
    url: "/relatorio",
    icon: ChartNoAxesCombined,
    notificationKey: "defaulters" as const,
    gradient: "from-blue-900 to-blue-900",
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeMega, setActiveMega] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setActiveMega(null); setIsProfileOpen(false) } }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!activeMega) return
    const onMouseDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMega(null)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [activeMega])

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
      const response = await fetch(`${apiBase}/Auth/logout`, {
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
  const getContainerPadding = () => (isMobile ? "px-3" : isTablet ? "px-4" : isLargeScreen ? "" : "px-6")

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className={`container mx-auto ${getContainerPadding()}`}>
          <div className={`flex items-center justify-between ${getHeaderHeight()}`}>
            <div className="flex items-center min-w-0 flex-shrink-0">
              <ThemeAwareLogo />
            </div>

            <nav ref={navRef} className="hidden lg:flex items-center gap-1">
              {items.map((item) => {
                if (item.children) {
                  const isParentActive = item.children.some((c) => isActiveRoute(c.url))
                  const isOpen = activeMega === item.title

                  const subMeta: Record<string, { desc: string; Icon: React.ComponentType<any> }> = {
                    "Visualizar Pedidos":  { desc: "Consulte todos os seus pedidos",        Icon: Eye },
                    "Rastrear Pedidos":    { desc: "Acompanhe a entrega em tempo real",     Icon: Truck },
                    "Visualizar Cotações": { desc: "Veja e gerencie suas cotações",         Icon: Eye },
                    "Realizar Cotação":    { desc: "Crie uma nova cotação rapidamente",     Icon: Plus },
                  }

                  return (
                    <div key={item.title} className="relative">
                      <button
                        onClick={() => setActiveMega(isOpen ? null : item.title)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 outline-none
                          ${isParentActive || isOpen
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                            : "text-foreground/80 hover:text-foreground hover:bg-muted"}`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.title}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                            className="absolute top-[calc(100%+8px)] left-0 z-[200] w-80 rounded-2xl border border-border bg-background shadow-2xl shadow-black/12 dark:shadow-black/40 overflow-hidden"
                          >
                            {/* Faixa de cor no topo */}
                            <div className={`h-1 bg-gradient-to-r ${item.gradient}`} />

                            {/* Sub-itens */}
                            <div className="p-2 space-y-1">
                              {item.children.map((sub, i) => {
                                const isActive = isActiveRoute(sub.url)
                                const meta = subMeta[sub.title]
                                return (
                                  <motion.button
                                    key={sub.title}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => { handleNavigation(sub.url, sub.target); setActiveMega(null) }}
                                    className={`group w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98]
                                      ${isActive
                                        ? `bg-gradient-to-r ${item.gradient} shadow-sm`
                                        : "hover:bg-muted"}`}
                                  >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                      ${isActive ? "bg-white/20" : "bg-muted group-hover:bg-background border border-border group-hover:border-border group-hover:shadow-sm"}`}
                                    >
                                      {meta?.Icon && <meta.Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"} transition-colors`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-semibold leading-tight ${isActive ? "text-white" : "text-foreground"}`}>{sub.title}</p>
                                      <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-muted-foreground"}`}>{meta?.desc}</p>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 -rotate-90 shrink-0 transition-transform group-hover:translate-x-0.5 ${isActive ? "text-white/60" : "text-muted-foreground/40"}`} />
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                const isActive = isActiveRoute(item.url)
                return (
                  <Link
                    key={item.title}
                    to={item.url!}
                    onClick={() => setActiveMega(null)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${isActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-md` : "text-foreground/80 hover:text-foreground hover:bg-muted"}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />
              {/* Trigger do perfil — mobile: só avatar; desktop: pill com nome */}
              <button
                onClick={() => setIsProfileOpen(true)}
                aria-label="Perfil do usuário"
                className={`group relative flex items-center transition-all duration-200 active:scale-95 outline-none
                  ${isMobile
                    ? "w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 justify-center"
                    : "gap-2 pl-1 pr-3 py-1 rounded-full border border-border bg-background hover:shadow-md hover:border-primary/40"
                  }`}
              >
                <div className="relative shrink-0">
                  <div className="p-[2px] rounded-full bg-gradient-to-br from-primary via-blue-500 to-indigo-600">
                    <div className={`${getAvatarSize()} overflow-hidden rounded-full bg-background`}>
                      <Avatar className="h-full w-full">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback className="h-full w-full flex items-center justify-center bg-primary/10">
                            <span className="text-primary font-bold text-xs">
                              {(userLogin || "U").charAt(0).toUpperCase()}
                            </span>
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-[1.5px] border-background" />
                </div>
                <span className={`hidden sm:block text-sm font-semibold text-foreground truncate ${isTablet ? "max-w-20" : "max-w-28"}`}>
                  {userLogin || "Usuário"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground hidden sm:block shrink-0 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>
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

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="lg:hidden overflow-hidden border-t border-border/60"
              >
                <nav className="flex flex-col gap-1 p-3">
                  {items.map((item) => {
                    const isActive = isActiveRoute(item.url)

                    if (item.children) {
                      const isParentActive = item.children.some((c) => isActiveRoute(c.url))
                      const mobileOpen = activeMega === item.title

                      const subMeta: Record<string, { desc: string; Icon: React.ComponentType<any> }> = {
                        "Visualizar Pedidos":  { desc: "Consulte todos os pedidos",         Icon: Eye },
                        "Rastrear Pedidos":    { desc: "Rastreio em tempo real",            Icon: Truck },
                        "Visualizar Cotações": { desc: "Veja suas cotações",                Icon: Eye },
                        "Realizar Cotação":    { desc: "Nova cotação",                      Icon: Plus },
                      }

                      return (
                        <div key={item.title}>
                          <button
                            onClick={() => setActiveMega(mobileOpen ? null : item.title)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150 active:scale-[0.98]
                              ${isParentActive || mobileOpen
                                ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                                : "text-foreground hover:bg-muted"}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isParentActive || mobileOpen ? "bg-white/20" : "bg-muted"}`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <span className="flex-1 font-medium text-sm">{item.title}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {mobileOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 ml-3 pl-3 border-l-2 border-border space-y-1 pb-1">
                                  {item.children.map((sub) => {
                                    const isSubActive = isActiveRoute(sub.url)
                                    const meta = subMeta[sub.title]
                                    return (
                                      <button
                                        key={sub.title}
                                        onClick={() => { handleNavigation(sub.url, sub.target); setIsMobileMenuOpen(false); setActiveMega(null) }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98]
                                          ${isSubActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-sm` : "hover:bg-muted"}`}
                                      >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSubActive ? "bg-white/20" : "bg-muted"}`}>
                                          {meta?.Icon && <meta.Icon className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold leading-tight">{sub.title}</p>
                                          <p className={`text-xs mt-0.5 ${isSubActive ? "text-white/70" : "text-muted-foreground"}`}>{meta?.desc}</p>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={item.title}
                        to={item.url!}
                        onClick={() => { setIsMobileMenuOpen(false); setActiveMega(null) }}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-150 active:scale-[0.98]
                          ${isActive ? `bg-gradient-to-r ${item.gradient} text-white shadow-md` : "text-foreground hover:bg-muted"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : "bg-muted"}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{item.title}</span>
                      </Link>
                    )
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>


      {/* ── Spotlight de perfil ────────────────────────────────── */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            {/* Backdrop com blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-sm"
            />

            {/* Card central */}
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.92, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed left-1/2 top-[80px] -translate-x-1/2 z-[151] w-full max-w-sm"
            >
              <div className="rounded-3xl overflow-hidden border border-border/60 bg-background shadow-2xl shadow-black/20 dark:shadow-black/50">

                {/* Banner superior com identidade */}
                <div className="relative px-6 pt-8 pb-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

                  {/* Fechar */}
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative flex flex-col items-center text-center gap-3">
                    {/* Avatar grande */}
                    <div className="relative">
                      <div className="p-[3px] rounded-full bg-gradient-to-br from-primary via-blue-500 to-indigo-600 shadow-xl shadow-primary/30">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-background ring-2 ring-background">
                          <Avatar className="h-full w-full">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <AvatarFallback className="h-full w-full flex items-center justify-center bg-primary/10">
                                <span className="text-primary font-bold text-3xl">
                                  {(userLogin || "U").charAt(0).toUpperCase()}
                                </span>
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow" />
                    </div>

                    {/* Nome e email */}
                    <div>
                      <h2 className="text-lg font-bold text-foreground leading-tight">{userLogin || "Usuário"}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{userEmail}</p>
                    </div>

                    {/* Badge sessão */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Sessão ativa</span>
                    </div>
                  </div>
                </div>

                {/* Ações em grade */}
                <div className="px-4 pb-2 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => { openUserProfileModal(); setIsProfileOpen(false); }}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-muted/40 hover:bg-primary/8 border border-border hover:border-primary/25 transition-all duration-150 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background border border-border group-hover:border-primary/30 group-hover:shadow-md flex items-center justify-center transition-all">
                      <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">Editar perfil</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Nome e foto</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { handlePasswordReset(); setIsProfileOpen(false); }}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-muted/40 hover:bg-accent border border-border transition-all duration-150 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center transition-all group-hover:shadow-md">
                      <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">Alterar senha</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Credenciais</p>
                    </div>
                  </button>
                </div>

                {/* Logout */}
                <div className="px-4 pt-2 pb-4">
                  <button
                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                    disabled={isLoggingOut}
                    className="group w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isLoggingOut
                      ? <span className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                      : <LogOut className="w-4 h-4 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
                    }
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {isLoggingOut ? "Saindo..." : "Sair da conta"}
                    </span>
                  </button>
                </div>

                {/* Rodapé */}
                <div className="border-t border-border/50 px-4 py-2.5 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground/40 text-center tracking-wide">Portal Representantes · Polar Fix</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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