import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiasVencidosCellProps {
  dias: number;
}

const getBadgeStyle = (dias: number) => {
  if (dias <= 30) {
    return {
      className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
      iconColor: "text-amber-500 dark:text-amber-400",
      emoji: "⚠️",
    };
  } else if (dias <= 60) {
    return {
      className: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700",
      iconColor: "text-orange-500 dark:text-orange-400",
      emoji: "🟠",
    };
  } else if (dias <= 90) {
    return {
      className: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
      iconColor: "text-red-500 dark:text-red-400",
      emoji: "🔴",
    };
  }
  return {
    className: "bg-red-600 text-white border-red-600 shadow-lg animate-pulse",
    iconColor: "text-white",
    emoji: "🚨",
  };
};

export function DiasVencidosCell({ dias }: DiasVencidosCellProps) {
  const style = getBadgeStyle(dias);
  
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center space-x-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
        <Badge
          className={`font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 px-3 py-2 ${style.className}`}
          variant="outline"
        >
          <span className="mr-1.5">{style.emoji}</span>
          {dias} dia{dias !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  );
}