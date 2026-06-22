import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DanfeButtonProps {
  isDisabled: boolean;
  isCancelled: boolean;
  tooltipText: string;
  onClick: () => void;
}

export const DanfeButton: React.FC<DanfeButtonProps> = ({
  isDisabled,
  isCancelled,
  tooltipText,
  onClick,
}) => {
  const buttonClass = isCancelled
    ? "bg-red-600 hover:bg-red-800 text-white cursor-not-allowed opacity-80"
    : isDisabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={`h-8 w-8 ${buttonClass}`}
          onClick={onClick}
          disabled={isDisabled}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">{tooltipText}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};