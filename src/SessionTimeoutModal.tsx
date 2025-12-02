// components/auth/SessionTimeoutModal.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface SessionTimeoutModalProps {
  open: boolean;
  remainingSeconds: number;
  onRenew: () => Promise<void>;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  open,
  remainingSeconds,
  onRenew,
  onLogout,
}: SessionTimeoutModalProps) {
  const [renewing, setRenewing] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
      <DialogContent className="sm:max-w-md" >
        <DialogHeader>
          <DialogTitle className="text-xl">Sessão prestes a expirar</DialogTitle>
          <DialogDescription className="text-base">
            Sua sessão expira em <strong>{formatTime(remainingSeconds)}</strong>.
            <br />
            Deseja continuar conectado?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onLogout} disabled={renewing}>
            Sair agora
          </Button>
          <Button onClick={handleRenew} disabled={renewing} className="min-w-32">
            {renewing ? "Renovando..." : "Continuar conectado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}