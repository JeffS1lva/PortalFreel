"use client"

import { Button } from "@/components/ui/button"
import { Edit2Icon, Loader2Icon } from "lucide-react"

interface EditQuotationButtonProps {
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean
  isLoading?: boolean
}

export function EditQuotationButton({ onEdit, disabled = false, isLoading = false }: EditQuotationButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      className="h-10 w-full transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
      onClick={onEdit}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <Edit2Icon className="h-3.5 w-3.5" />
          Editar
        </>
      )}
    </Button>
  )
}
