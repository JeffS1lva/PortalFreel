"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimerProps {
  totalTime?: number;
  warningTime?: number;
  onSessionExpire?: () => void;
  onRenewSession?: () => void;
}

// ⏳ 2 HORAS
const TWO_HOURS = 2 * 60 * 60;
// ⚠️ AVISO 15 MIN
const FIFTEEN_MINUTES = 15 * 60;

const STORAGE_KEY = "session-expiration-time-v2";

export function SessionTimer({
  totalTime = TWO_HOURS,
  warningTime = FIFTEEN_MINUTES,
  onSessionExpire,
}: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalTime);
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSessionExpire = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    onSessionExpire?.();
  }, [onSessionExpire]);

  const calculateRemainingTime = () => {
    const expiration = sessionStorage.getItem(STORAGE_KEY);
    if (!expiration) return 0;
    const diff = Math.floor((Number(expiration) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  };

  useEffect(() => {
    const savedExpiration = sessionStorage.getItem(STORAGE_KEY);

    if (!savedExpiration) {
      const expirationTime = Date.now() + totalTime * 1000;
      sessionStorage.setItem(STORAGE_KEY, expirationTime.toString());
      setRemainingSeconds(totalTime);
    } else {
      setRemainingSeconds(calculateRemainingTime());
    }
  }, [totalTime]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleSessionExpire();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSessionExpire]);

  useEffect(() => {
    if (
      remainingSeconds <= warningTime &&
      remainingSeconds > 0 &&
      !hasShownWarning
    ) {
      setShowWarning(true);
      setHasShownWarning(true);
    }
  }, [remainingSeconds, warningTime, hasShownWarning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString(),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const isWarning = remainingSeconds <= warningTime;
  const getProgressPercentage = () => (remainingSeconds / totalTime) * 100;
  const handleContinueSession = () => setShowWarning(false);
  const time = formatTime(remainingSeconds);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (getProgressPercentage() / 100) * circumference;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[60]">
        <div
          className={`
            flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl
            border backdrop-blur-xl shadow-xl cursor-default select-none
            transition-colors duration-500
            ${isWarning
              ? "bg-red-950/95 border-red-500/50 shadow-red-950/60"
              : "bg-slate-900/95 border-slate-700/70 shadow-black/50"
            }
          `}
        >
          {/* Anel de progresso */}
          <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="2"
                className={isWarning ? "stroke-red-900/50" : "stroke-slate-700"}
              />
              <circle
                cx="18" cy="18" r={radius} fill="none" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-1000 ease-linear ${
                  isWarning ? "stroke-red-400" : "stroke-emerald-400"
                }`}
              />
            </svg>
            <Shield className={`w-3.5 h-3.5 relative z-10 ${isWarning ? "text-red-400" : "text-emerald-400"}`} />
            {isWarning && <span className="absolute inset-0 rounded-full animate-ping bg-red-500/15" />}
          </div>

          {/* Label + timer */}
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest leading-none mb-1 ${
              isWarning ? "text-red-400" : "text-slate-500"
            }`}>
              {isWarning ? "Sessão expirando" : "Tempo restante"}
            </p>
            <p className={`font-mono text-sm font-bold leading-none tabular-nums ${
              isWarning ? "text-red-300" : "text-slate-100"
            }`}>
              {Number(time.hours) > 0 ? `${time.hours}:` : ""}
              {time.minutes}
              <span className={isWarning ? "animate-pulse" : ""}>:</span>
              {time.seconds}
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ ALERT */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="max-w-md border-0 bg-slate-900 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex flex-col items-center text-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-xl shadow-orange-500/30">
                    <AlertTriangle className="h-10 w-10 text-white" />
                  </div>
                </div>

                <AlertDialogTitle className="text-2xl font-bold text-slate-100">
                  Sessão Expirando
                </AlertDialogTitle>

                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <p className="text-base text-slate-400 leading-relaxed">
                      Sua sessão está prestes a expirar. Para manter seus dados
                      protegidos, renove sua sessão agora.
                    </p>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center justify-center gap-3">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span className="text-slate-400">Tempo restante:</span>
                        <span className="font-mono text-2xl font-bold text-amber-400">
                          {Number(time.hours) > 0 ? `${time.hours}:` : ""}
                          {time.minutes}:{time.seconds}
                        </span>
                      </div>
                    </div>
                  </div>
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-6 flex-col gap-3 sm:flex-col">
              <AlertDialogAction asChild>
                <Button
                  onClick={handleContinueSession}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-0 gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Continuar na sessão
                </Button>
              </AlertDialogAction>

              <p className="text-xs text-slate-500 text-center">
                A contagem continuará normalmente após fechar este aviso
              </p>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}