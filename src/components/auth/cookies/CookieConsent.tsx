import React, { useState, useEffect, type ReactNode, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Cookie, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Definir período de validade do consentimento (em dias)
const DEFAULT_CONSENT_VALIDITY_DAYS = 30;

// Interface para dados de consentimento
interface ConsentData {
  accepted: boolean;
  expiry: string;
  preferences?: Record<string, boolean>;
  version?: string; // Para controle de versão da política
}

// Cookie Consent Context
interface CookieConsentContextType {
  consentGiven: boolean;
  setConsentGiven: (value: boolean) => void;
  preferences: Record<string, boolean>;
  setPreferences: (preferences: Record<string, boolean>) => void;
  isLoading: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  consentGiven: false,
  setConsentGiven: () => {},
  preferences: {},
  setPreferences: () => {},
  isLoading: true,
});

interface CookieConsentProviderProps {
  children: ReactNode;
  validityDays?: number;
  policyVersion?: string;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ 
  children, 
  validityDays = DEFAULT_CONSENT_VALIDITY_DAYS,
  policyVersion = "1.0"
}) => {
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Função para verificar e carregar consentimento armazenado
  const checkStoredConsent = (): boolean => {
    try {
      const storedConsent = localStorage.getItem("cookieConsent");
      
      if (!storedConsent) {
        console.log("Cookie Consent: Nenhum consentimento encontrado");
        return false;
      }

      const consentData: ConsentData = JSON.parse(storedConsent);
      const expiryDate = new Date(consentData.expiry);
      const currentDate = new Date();

      // Verificar se o consentimento expirou
      if (expiryDate <= currentDate) {
        console.log("Cookie Consent: Consentimento expirado, removendo");
        localStorage.removeItem("cookieConsent");
        return false;
      }

      // Verificar se a versão da política mudou
      if (consentData.version && consentData.version !== policyVersion) {
        console.log("Cookie Consent: Versão da política mudou, solicitando novo consentimento");
        localStorage.removeItem("cookieConsent");
        return false;
      }

      // Consentimento válido encontrado
      console.log("Cookie Consent: Consentimento válido encontrado");
      setPreferences(consentData.preferences || { necessary: true });
      return consentData.accepted;

    } catch (error) {
      console.error("Cookie Consent: Erro ao verificar consentimento armazenado:", error);
      localStorage.removeItem("cookieConsent");
      return false;
    }
  };

  // Função para salvar consentimento
  const saveConsent = (accepted: boolean, userPreferences?: Record<string, boolean>) => {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + validityDays);

      const consentData: ConsentData = {
        accepted,
        expiry: expiryDate.toISOString(),
        preferences: userPreferences || preferences,
        version: policyVersion
      };

      localStorage.setItem("cookieConsent", JSON.stringify(consentData));
      console.log(`Cookie Consent: Consentimento salvo por ${validityDays} dias`);
    } catch (error) {
      console.error("Cookie Consent: Erro ao salvar consentimento:", error);
    }
  };

  // Verificar consentimento na inicialização
  useEffect(() => {
    const hasValidConsent = checkStoredConsent();
    setConsentGiven(hasValidConsent);
    setIsLoading(false);
  }, [policyVersion]);

  // Salvar consentimento quando houver mudanças
  useEffect(() => {
    if (!isLoading && consentGiven) {
      saveConsent(true, preferences);
    }
  }, [consentGiven, preferences, isLoading, validityDays, policyVersion]);

  // Função para atualizar consentimento
  const updateConsentGiven = (value: boolean) => {
    setConsentGiven(value);
    if (!value) {
      localStorage.removeItem("cookieConsent");
      setPreferences({ necessary: true });
    }
  };

  // Função para atualizar preferências
  const updatePreferences = (newPreferences: Record<string, boolean>) => {
    setPreferences(newPreferences);
    if (consentGiven) {
      saveConsent(true, newPreferences);
    }
  };

  return (
    <CookieConsentContext.Provider 
      value={{ 
        consentGiven, 
        setConsentGiven: updateConsentGiven,
        preferences,
        setPreferences: updatePreferences,
        isLoading
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent deve ser usado dentro de CookieConsentProvider");
  }
  return context;
};

// Cookie Types Definition
const cookieTypes = [
  {
    id: "necessary",
    title: "Cookies Necessários",
    description: "Estes cookies são essenciais para o funcionamento básico do site. Eles permitem recursos fundamentais como autenticação, segurança e preferências de uso.",
    required: true
  },
  {
    id: "analytics",
    title: "Cookies Analíticos",
    description: "Ajudam a entender como você interage com o site, permitindo melhorar a experiência do usuário. Coletam informações anônimas sobre páginas visitadas e interações.",
    required: false
  },
  {
    id: "marketing",
    title: "Cookies de Marketing",
    description: "Usados para rastrear visitantes em diferentes sites para exibir anúncios relevantes. Estes cookies podem compartilhar informações com terceiros para este propósito.",
    required: false
  }
];

interface CookieConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
  onOpenSettings: () => void;
}

interface CookieConsentProps {
  children: ReactNode;
  validityDays?: number;
  policyVersion?: string;
  onConsent?: (preferences: Record<string, boolean>) => void;
}

// Componente de modal de aviso
interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, onContinueAnyway }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center text-center p-2">
          <AlertCircle className="text-destructive w-16 h-16 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Atenção!</h2>
          <p className="text-muted-foreground mb-6">
            Se não aceitar os cookies, não será possível acessar o site. 
            Os cookies são necessários para fornecer uma experiência completa.
          </p>
          <div className="flex flex-wrap gap-3 w-full justify-center">
            <Button onClick={onClose} variant="default" className="flex-1">
              Tentar novamente
            </Button>
            <Button 
              onClick={onContinueAnyway} 
              variant="outline" 
              className="flex-1"
            >
              Continuar mesmo assim
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onReject, onOpenSettings }) => {
  return (
    <motion.div 
      className="fixed bottom-4 left-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 max-w-xl mx-auto" 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex items-start mb-3">
        <Cookie className="text-primary mr-2 flex-shrink-0 mt-1" size={20} />
        <h3 className="text-lg font-semibold">Este site utiliza cookies</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar tráfego. 
        Ao continuar navegando, você concorda com nossa política de privacidade e uso de cookies.
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onReject} className="flex-1 sm:flex-none">
          Rejeitar não essenciais
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenSettings} className="flex-1 sm:flex-none">
          Personalizar
        </Button>
        <Button size="sm" onClick={onAccept} className="flex-1 sm:flex-none">
          Aceitar todos
        </Button>
      </div>
    </motion.div>
  );
};

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (preferences: Record<string, boolean>) => void;
  validityDays: number;
}

const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  validityDays 
}) => {
  const { preferences: currentPreferences } = useCookieConsent();
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    // Inicializar com preferências atuais ou padrão
    const defaultPrefs = cookieTypes.reduce((acc, type) => {
      acc[type.id] = type.required;
      return acc;
    }, {} as Record<string, boolean>);

    return Object.keys(currentPreferences).length > 0 ? currentPreferences : defaultPrefs;
  });

  // Atualizar preferências quando o modal abrir
  useEffect(() => {
    if (isOpen && Object.keys(currentPreferences).length > 0) {
      setPreferences(currentPreferences);
    }
  }, [isOpen, currentPreferences]);

  const handleToggle = (id: string) => {
    if (id === "necessary") return; // Can't toggle necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleSave = () => {
    onAccept(preferences);
    onClose();
  };
  
  const handleAcceptAll = () => {
    const allAccepted = cookieTypes.reduce((acc, type) => {
      acc[type.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    onAccept(allAccepted);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Cookie className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Configurações de Cookies</h2>
          </div>
        </div>
        
        <Tabs defaultValue="cookies" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cookies" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione quais cookies você deseja aceitar. Cookies necessários não podem ser desativados pois são essenciais para o funcionamento do site.
            </p>
            
            <div className="space-y-4 mt-4">
              {cookieTypes.map((cookieType) => (
                <motion.div 
                  key={cookieType.id}
                  className="border border-border rounded-lg p-4"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium">{cookieType.title}</h3>
                      {cookieType.required && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Necessário
                        </span>
                      )}
                    </div>
                    <Button
                      variant={preferences[cookieType.id] ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggle(cookieType.id)}
                      disabled={cookieType.required}
                      className={`min-w-20 ${preferences[cookieType.id] ? "bg-primary" : ""}`}
                    >
                      {preferences[cookieType.id] ? (
                        <CheckCircle2 className="mr-1" size={16} />
                      ) : (
                        <XCircle className="mr-1" size={16} />
                      )}
                      {preferences[cookieType.id] ? "Ativo" : "Inativo"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{cookieType.description}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            <div className="flex items-start mb-3">
              <Shield className="text-primary mr-2 flex-shrink-0 mt-1" size={20} />
              <h3 className="text-lg font-semibold">Nossa política de privacidade</h3>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Estamos comprometidos em proteger sua privacidade e garantir que suas informações pessoais estejam seguras.
              </p>
              <p>
                Coletamos apenas os dados necessários para fornecer nossos serviços e melhorar sua experiência. Nunca compartilhamos suas informações pessoais com terceiros sem seu consentimento explícito.
              </p>
              <p>
                Ao utilizar nosso site, você tem direito a:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir informações imprecisas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar seu consentimento a qualquer momento</li>
              </ul>
              <p>
                Para mais informações sobre como processamos seus dados, consulte nossa política de privacidade completa.
              </p>
              <p className="text-xs mt-4 font-medium">
                Seu consentimento tem validade de {validityDays} dias e precisará ser renovado após esse período.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-wrap gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleSave} className="flex-1 sm:flex-none">
            Salvar preferências
          </Button>
          <Button onClick={handleAcceptAll} className="flex-1 sm:flex-none">
            Aceitar todos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente de layout protegido
const ProtectedContent: React.FC<{ 
  children: ReactNode; 
  onConsent?: (preferences: Record<string, boolean>) => void;
  validityDays: number;
}> = ({ children, onConsent, validityDays }) => {
  const { consentGiven, setConsentGiven, setPreferences, isLoading } = useCookieConsent();
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  
  useEffect(() => {
    // Apenas mostrar o banner se não estiver carregando e não tiver consentimento
    if (!isLoading && !consentGiven) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500); // Delay menor para melhor UX
      
      return () => clearTimeout(timer);
    }
  }, [consentGiven, isLoading]);
  
  const handleAccept = () => {
    const allAcceptedPreferences = cookieTypes.reduce((acc, type) => {
      acc[type.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setPreferences(allAcceptedPreferences);
    setConsentGiven(true);
    setShowBanner(false);
    
    onConsent?.(allAcceptedPreferences);
  };
  
  const handleReject = () => {
    setShowWarningModal(true);
    setShowBanner(false);
  };
  
  const handleSettingsAccept = (preferences: Record<string, boolean>) => {
    setPreferences(preferences);
    setConsentGiven(true);
    setShowBanner(false);
    
    onConsent?.(preferences);
  };

  const handleContinueAnyway = () => {
    window.location.href = "https://polarfix.com.br";
  };

  const handleRetryConsent = () => {
    setShowWarningModal(false);
    setShowBanner(true);
  };

  // Mostrar loading enquanto verifica o consentimento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="relative h-full">
      {/* Overlay to block interaction when consent not given */}
      {!consentGiven && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40" />
      )}
      
      {/* Content with blur effect when consent not given */}
      <div className={!consentGiven ? "filter blur-sm pointer-events-none h-full" : "h-full"}>
        {children}
      </div>
      
      {/* Cookie consent banner */}
      <AnimatePresence>
        {showBanner && (
          <CookieConsentBanner 
            onAccept={handleAccept}
            onReject={handleReject}
            onOpenSettings={() => {
              setShowBanner(false);
              setShowSettings(true);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Settings modal */}
      <CookieSettingsModal 
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          if (!consentGiven) setShowBanner(true);
        }}
        onAccept={handleSettingsAccept}
        validityDays={validityDays}
      />

      {/* Warning modal para quando o usuário rejeitar cookies */}
      <WarningModal 
        isOpen={showWarningModal}
        onClose={handleRetryConsent}
        onContinueAnyway={handleContinueAnyway}
      />
    </div>
  );
};

// Export default component that combines everything
export default function CookieConsent({ 
  children, 
  validityDays = DEFAULT_CONSENT_VALIDITY_DAYS,
  policyVersion = "1.0",
  onConsent 
}: CookieConsentProps) {
  return (
    <CookieConsentProvider validityDays={validityDays} policyVersion={policyVersion}>
      <ProtectedContent 
        onConsent={onConsent} 
        validityDays={validityDays}
      >
        {children}
      </ProtectedContent>
    </CookieConsentProvider>
  );
}