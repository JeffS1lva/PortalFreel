"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EmailFormFieldsProps {
  to: string
  setTo: (value: string) => void
  cc: string
  setCc: (value: string) => void
  bcc: string
  setBcc: (value: string) => void
  showCc: boolean
  setShowCc: (value: boolean) => void
  showBcc: boolean
  setShowBcc: (value: boolean) => void
  subject: string
  setSubject: (value: string) => void
}

export function EmailFormFields({
  to,
  setTo,
  cc,
  setCc,
  bcc,
  setBcc,
  showCc,
  setShowCc,
  showBcc,
  setShowBcc,
  subject,
  setSubject,
}: EmailFormFieldsProps) {
  return (
    <div className="px-6 py-4 space-y-3 bg-white border-b">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-gray-600 w-12">Para</Label>
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="destinatario@exemplo.com"
          className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
        />
        <div className="flex gap-2">
          {!showCc && (
            <Button variant="ghost" size="sm" onClick={() => setShowCc(true)}>
              Cc
            </Button>
          )}
          {!showBcc && (
            <Button variant="ghost" size="sm" onClick={() => setShowBcc(true)}>
              Cco
            </Button>
          )}
        </div>
      </div>

      {showCc && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-gray-600 w-12">Cc</Label>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowCc(false)
              setCc("")
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {showBcc && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-gray-600 w-12">Cco</Label>
          <Input
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowBcc(false)
              setBcc("")
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-gray-600 w-12">Assunto</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 font-medium transition-colors"
        />
      </div>
    </div>
  )
}
