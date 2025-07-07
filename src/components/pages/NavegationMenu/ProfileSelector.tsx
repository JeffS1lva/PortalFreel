import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User2, Upload, CheckCircle, Edit2, 
  Save, AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomCard
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Interface para armazenar o estado do usuário
interface UserState {
  name: string;
  avatarUrl: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  onSaveChanges: (userData: {
    name: string;
    avatarUrl: string | null;
  }) => Promise<boolean>;
}

// Chave padronizada para localStorage
const getUserStorageKey = (email: string) => `userProfile_${email}`;

export function ProfileSelector({ 
  isOpen, 
  onClose, 
  currentUser,
  onSaveChanges
}: UserProfileModalProps) {
  // Estados para dados do usuário
  const [userName, setUserName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do usuário do localStorage ao iniciar
  useEffect(() => {
    const storageKey = getUserStorageKey(currentUser.email);
    const storedUserData = localStorage.getItem(storageKey);
    
    if (storedUserData) {
      try {
        const userData: UserState = JSON.parse(storedUserData);
        setUserName(userData.name);
        setAvatarUrl(userData.avatarUrl);
        setAvatarPreview(userData.avatarUrl);
      } catch (error) {
      }
    }
  }, [currentUser.email]);

  // Resetar estados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      // Carregar dados atualizados do localStorage quando o modal abrir
      const storageKey = getUserStorageKey(currentUser.email);
      const storedUserData = localStorage.getItem(storageKey);
      
      if (storedUserData) {
        try {
          const userData: UserState = JSON.parse(storedUserData);
          setUserName(userData.name);
          setAvatarUrl(userData.avatarUrl);
          setAvatarPreview(userData.avatarUrl);
        } catch (error) {
        }
      } else {
        // Se não houver dados no localStorage, use os dados atuais
        setUserName(currentUser.name);
        setAvatarUrl(currentUser.avatarUrl);
        setAvatarPreview(currentUser.avatarUrl);
      }
      
      setIsEditing(false);
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [isOpen, currentUser]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      // Simular upload - em produção, isto seria uma chamada API real
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const preview = reader.result as string;
          setAvatarPreview(preview);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }, 800);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Salvar o estado do usuário no localStorage
  const saveUserStateToStorage = (name: string, avatarUrl: string | null) => {
    const userState: UserState = {
      name,
      avatarUrl
    };
    
    const storageKey = getUserStorageKey(currentUser.email);
    localStorage.setItem(storageKey, JSON.stringify(userState));
    
    // Dispara um evento personalizado para notificar outras partes da aplicação
    const event = new CustomEvent('userProfileUpdated', { 
      detail: { email: currentUser.email, name, avatarUrl } 
    });
    window.dispatchEvent(event);
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const success = await onSaveChanges({
        name: userName,
        avatarUrl: avatarPreview
      });
      
      if (success) {
        setAvatarUrl(avatarPreview);
        setSaveSuccess(true);
        setIsEditing(false);
        
        // Salvar no localStorage
        saveUserStateToStorage(userName, avatarPreview);
        
        // Reset success message after delay
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setSaveError("Não foi possível salvar as alterações. Tente novamente.");
      }
    } catch (error) {
      setSaveError("Erro ao salvar as alterações: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
  };

  // Opções de avatar pré-definidas
  const avatarOptions = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
    "https://i.pravatar.cc/150?img=6",
    "https://i.pravatar.cc/150?img=7",
    "https://i.pravatar.cc/150?img=8"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Gerenciar Perfil</DialogTitle>
            </DialogHeader>
            
            <CustomCard>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative h-24 w-24 cursor-pointer group"
                    >
                      <Avatar className="h-24 w-24 border-2 border-primary">
                        {avatarPreview ? (
                          <AvatarImage
                            src={avatarPreview}
                            alt="Avatar"
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10">
                            <User2 className="h-12 w-12 text-primary" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {isEditing && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"
                          onClick={triggerFileInput}
                        >
                          <Upload className="h-8 w-8 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    
                    {isUploading && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full"
                      >
                        <span className="animate-spin block">
                          <Upload size={16} />
                        </span>
                      </motion.div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={!isEditing}
                  />
                  
                  {isEditing && (
                    <div className="w-full">
                      <p className="text-sm text-center mb-2 text-muted-foreground">
                        Escolha um avatar predefinido:
                      </p>
                      <div className="grid grid-cols-4 gap-2 justify-center">
                        {avatarOptions.map((avatar, i) => (
                          <Avatar 
                            key={i} 
                            className={`h-12 w-12 cursor-pointer transition-all duration-200 ${
                              avatarPreview === avatar ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                            }`}
                            onClick={() => setAvatarPreview(avatar)}
                          >
                            <AvatarImage src={avatar} alt={`Avatar opção ${i+1}`} />
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="name" className="text-right w-20">
                        Nome:
                      </Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="flex-1"
                        />
                      ) : (
                        <p className="text-base">{userName}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Label htmlFor="email" className="text-right w-20">
                        Email:
                      </Label>
                      <p className="text-base text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full"
                    >
                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Sucesso!</AlertTitle>
                        <AlertDescription>
                          Suas alterações foram salvas com sucesso.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  
                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full"
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{saveError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </CustomCard>
            
            <DialogFooter className="mt-4 gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setUserName(avatarUrl ? userName : currentUser.name);
                      setAvatarPreview(avatarUrl);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={saveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}