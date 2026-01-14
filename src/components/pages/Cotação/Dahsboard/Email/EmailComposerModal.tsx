"use client";

import { useEffect, useState, useRef } from "react";
import {
  X,
  Paperclip,
  Send,
  Loader2,
  Minimize2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  Link2,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContentSendEmail,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { UserData } from "@/components/auth/types/auth.types";
import Picker from "emoji-picker-react"; // ← Biblioteca de emoji

interface EmailComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: {
    docNum: string | number;
    cardName: string;
    cardCode: string;
    cardEmail?: string;
    docTotal: number;
  };
  generatingPdf?: boolean;
  pdfUrl?: string;
}

export function EmailComposerModal({
  open,
  onOpenChange,
  quotation,
  generatingPdf = false,
  pdfUrl,
}: EmailComposerModalProps) {
  const [to, setTo] = useState(quotation.cardEmail || "");
  const [cc, setCc] = useState("");
  const [bcc, setBbcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(
    `Cotação nº ${quotation.docNum} - ${quotation.cardName}`
  );
  const [body, setBody] = useState(
    `Olá ${quotation.cardName},

Segue em anexo a cotação nº ${quotation.docNum}.

Valor total: R$ ${quotation.docTotal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}

Em caso de dúvidas, estamos à disposição!

Atenciosamente,
Equipe Comercial`.trim()
  );

  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [representativeName, setRepresentativeName] = useState("Carregando...");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Carrega nome do representante
  useEffect(() => {
    if (open) {
      const authData = localStorage.getItem("authData");
      if (authData) {
        try {
          const user: UserData = JSON.parse(authData);
          const nome = `${user.firstName} ${user.lastName}`.trim();
          setRepresentativeName(nome || "Representante");
          setRepresentativeEmail(user.email || "");
        } catch {
          setRepresentativeName("Representante");
        }
      }
    }
  }, [open]);

  // Comandos de formatação
  const format = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Inserir emoji
  const onEmojiClick = (emojiData: any) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      if (range) {
        range.deleteContents();
        range.insertNode(document.createTextNode(emojiData.emoji));
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      editorRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  // Atualiza o estado body sempre que o conteúdo mudar
  const handleInput = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  const handleSend = async () => {
    if (!to.trim()) return toast.error("Preencha o campo Para");
    if (!representativeEmail) return toast.error("Usuário não identificado");

    setSending(true);
    const formData = new FormData();

    formData.append("to", to);
    if (cc.trim()) formData.append("cc", cc.trim());
    if (bcc.trim()) formData.append("bcc", bcc.trim());
    formData.append("subject", subject);
    formData.append("body", body);
    formData.append("quotation", JSON.stringify(quotation));
    formData.append("representativeName", representativeName);
    formData.append("representativeEmail", representativeEmail);

    if (pdfUrl && !generatingPdf) {
      try {
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        formData.append("attachments", blob, `Cotação_${quotation.docNum}.pdf`);
      } catch (e) {
        console.warn("PDF não anexado", e);
      }
    }

    try {
      const res = await fetch(
        process.env.NODE_ENV === "production"
          ? "https://api.polarfix.com.br/send-quotation"
          : "http://localhost:3000/send-quotation",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (res.ok && data.sucesso) {
        toast.success("Enviado com sucesso!");
        onOpenChange(false);
      } else {
        toast.error(data.erro || "Erro ao enviar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentSendEmail className="max-w-4xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Nova Mensagem
              </DialogTitle>
              <p className="text-xs text-gray-500">
                Cotação #{quotation.docNum} • Enviando como:{" "}
                <strong>{representativeName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/60"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-red-600/60"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col h-[620px]">
            {/* Recipients */}
            <div className="px-6 py-4 space-y-3 bg-white border-b">
              {/* Para */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-600 w-12">
                  Para
                </Label>
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="destinatario@exemplo.com"
                  className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
                />
                <div className="flex gap-2">
                  {!showCc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCc(true)}
                    >
                      Cc
                    </Button>
                  )}
                  {!showBcc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBcc(true)}
                    >
                      Cco
                    </Button>
                  )}
                </div>
              </div>

              {showCc && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-gray-600 w-12">
                    Cc
                  </Label>
                  <Input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCc(false);
                      setCc("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {showBcc && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-gray-600 w-12">
                    Cco
                  </Label>
                  <Input
                    value={bcc}
                    onChange={(e) => setBbcc(e.target.value)}
                    className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 transition-colors text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowBcc(false);
                      setBbcc("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-600 w-12">
                  Assunto
                </Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 border-0 border-b border-transparent focus:border-blue-500 rounded-none px-2 focus-visible:ring-0 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Toolbar com formatação real */}
            <div className="relative px-6 py-2 border-b bg-gray-50/50 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white"
                title="Negrito"
                onClick={() => format("bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white"
                title="Itálico"
                onClick={() => format("italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white"
                title="Sublinhado"
                onClick={() => format("underline")}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white"
                title="Link"
                onClick={() => {
                  const url = prompt("Insira o URL:");
                  if (url) format("createLink", url);
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>

              {/* Emoji Picker */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white"
                  title="Emoji"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <Picker
                      onEmojiClick={onEmojiClick}
                      autoFocusSearch={false}
                      lazyLoadEmojis={true}
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editor Rico */}
            <div className="flex-1 px-6 py-4 overflow-y-auto bg-white">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: body }}
                className="w-full h-full min-h-0 outline-none text-sm leading-relaxed prose max-w-none"
                style={{
                  minHeight: "300px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              />
            </div>

            {/* Anexo PDF */}
            {(generatingPdf || pdfUrl) && (
              <div className="px-6 py-3 bg-blue-50/50 border-t border-blue-100">
                {generatingPdf ? (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Gerando PDF...</p>
                      <p className="text-xs text-gray-500">
                        Aguarde enquanto preparamos o anexo
                      </p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={() => window.open(pdfUrl, "_blank")}
                      className="flex items-center gap-3 flex-1 hover:bg-blue-100/50 rounded-lg p-2 -ml-2 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                        <Paperclip className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          Cotação_{quotation.docNum}.pdf
                        </p>
                        <p className="text-xs text-gray-500">
                          Clique para visualizar • Pronto para envio
                        </p>
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50/50 flex items-center justify-end">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || generatingPdf}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar E-mail
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            E-mail minimizado — clique em expandir para continuar
          </div>
        )}
      </DialogContentSendEmail>
    </Dialog>
  );
}
