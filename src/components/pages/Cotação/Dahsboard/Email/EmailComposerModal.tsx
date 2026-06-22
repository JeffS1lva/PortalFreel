"use client";

import { useEffect, useState, useRef, type DragEvent } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import sanitizeHtml from "sanitize-html";
import { toast } from "sonner";

import {
  Dialog,
  DialogContentSendEmail,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailEditorToolbar } from "@/components/pages/Cotação/Dahsboard/Email/EmailEditorToolbar";

import {
  X,
  Paperclip,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  ExternalLink,
  Trash2,
  Ellipsis,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tokenStore } from "@/utils/tokenStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface EmailComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: {
    docNum: number;
    cardEmail?: string;
    cardName: string;
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
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(
    `Cotação nº ${quotation.docNum} - ${quotation.cardName}`
  );
  const [body, setBody] = useState("");

  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [representativeName, setRepresentativeName] = useState("Carregando...");
  const [representativeEmail, setRepresentativeEmail] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdObjectUrls = useRef<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentsUrls = useRef<Record<string, string>>({});

  const [includePdf, setIncludePdf] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [attachType, setAttachType] = useState<
    "all" | "image" | "pdf" | "docs" | "archive"
  >("all");


  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const colorPresets = [
    "#000000",
    "#374151",
    "#6B7280",
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#FFFFFF",
  ];

  const getAttachmentKey = (file: File) =>
    `${file.name}_${file.size}_${file.lastModified}`;

  const getAttachmentUrl = (file: File) => {
    const key = getAttachmentKey(file);
    if (!attachmentsUrls.current[key]) {
      const url = URL.createObjectURL(file);
      attachmentsUrls.current[key] = url;
      createdObjectUrls.current.push(url);
    }
    return attachmentsUrls.current[key];
  };

  // ADICIONE logo após os states e antes dos useEffects
  const resetForm = () => {
    setTo(quotation.cardEmail || "");
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
    setSubject(`Cotação nº ${quotation.docNum} - ${quotation.cardName}`);
    setBody("");
    setIncludePdf(true);
    setAttachments([]);
    setAttachType("all");

    // limpa editor visualmente e internamente
    if (editor) {
      editor.commands.clearContent(true);
    }

    // limpa URLs criadas
    try {
      createdObjectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    } catch {}
    createdObjectUrls.current = [];
    attachmentsUrls.current = {};
  };

  const handleRemoveAttachment = (idx: number) => {
    const file = attachments[idx];
    if (!file) return;
    const key = getAttachmentKey(file);
    const url = attachmentsUrls.current[key];
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      delete attachmentsUrls.current[key];
      createdObjectUrls.current = createdObjectUrls.current.filter(
        (u) => u !== url
      );
    }
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const openInNewTab = (url?: string | null) => {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800 cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: {
        style: `
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
      `,
      },
    },
    content: body,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setBody(editor.getHTML());
    },
  });

  useEffect(() => {
    if (open) {
      const authData = tokenStore.getAuthData();
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

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const getAcceptFor = (type: string) => {
    switch (type) {
      case "image":
        return "image/*";
      case "pdf":
        return ".pdf,application/pdf";
      case "docs":
        return ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "archive":
        return ".zip,.rar,.7z,.tar,.gz";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm(); // 💥 limpa TUDO sempre que o modal fecha
    }
  }, [open]);

  useEffect(() => {
    if (open && editor) {
      const current = editor.getHTML();
      if (!current || current === "<p></p>" || current === "<p><br></p>") {
        editor.commands.setContent(body);
      }
    }
  }, [open, editor, body]);

  const handleSend = async () => {
    if (!representativeEmail) {
      toast.error("Usuário não identificado");
      return;
    }

    setSending(true);
    const formData = new FormData();

    formData.append("to", to);
    if (cc.trim()) formData.append("cc", cc.trim());
    if (bcc.trim()) formData.append("bcc", bcc.trim());
    formData.append("subject", subject);

    const editorHtml = editor ? editor.getHTML() : body;
    const sanitizedBody = sanitizeHtml(editorHtml || "", {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "title"],
        a: ["href", "name", "target", "rel"],
      },
    });

    formData.append("body", sanitizedBody);
    formData.append("quotation", JSON.stringify(quotation));
    formData.append("representativeName", representativeName);
    formData.append("representativeEmail", representativeEmail);

    try {
      attachments.forEach((f) => formData.append("attachments", f, f.name));
    } catch (e) {
      console.warn("Erro anexar arquivo", e);
    }

    if (pdfUrl && includePdf && !generatingPdf) {
      try {
        const res = await fetch(pdfUrl);
        const blob = await res.blob();
        formData.append("attachments", blob, `Cotação_${quotation.docNum}.pdf`);
      } catch (e) {
        console.warn("PDF não anexado", e);
      }
    }

    try {
      const res = await fetch(`${API_URL}/send-quotation`, {
        method: "POST",
        body: formData,
      });

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

  if (!editor) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContentSendEmail className=" p-0 gap-0 overflow-hidden ">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Nova Mensagem
                </DialogTitle>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span>Cotação #{quotation.docNum}</span>
                  <span className="ml-2">
                    • Enviando como: <strong>{representativeName}</strong>
                  </span>
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
              {/* Email Form Fields */}
              <div className="px-6 py-3 space-y-2 border-b bg-white">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium w-12 text-gray-700">
                    Para:
                  </Label>
                  <Input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="flex-1 text-sm"
                    placeholder="destinatario@exemplo.com"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(!showCc)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cc
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(!showBcc)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cco
                  </Button>
                </div>

                {showCc && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium w-12 text-gray-700">
                      Cc:
                    </Label>
                    <Input
                      type="email"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      className="flex-1 text-sm"
                      placeholder="copia@exemplo.com"
                    />
                  </div>
                )}

                {showBcc && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium w-12 text-gray-700">
                      Cco:
                    </Label>
                    <Input
                      type="email"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      className="flex-1 text-sm"
                      placeholder="copia.oculta@exemplo.com"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium w-12 text-gray-700">
                    Assunto:
                  </Label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 text-sm"
                    placeholder="Assunto do email"
                  />
                </div>
              </div>

              {/* Toolbar */}
              <EmailEditorToolbar
                editor={editor}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                colorPresets={colorPresets}
                fileInputRef={fileInputRef}
                handleFiles={handleFiles}
                attachType={attachType}
                setAttachType={setAttachType}
                getAcceptFor={getAcceptFor}
              />

              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="relative min-h-[300px]">
                  {editor && editor.getText().trim().length === 0 && (
                    <div
                      className="absolute inset-0 p-4 text-sm text-gray-400 flex items-start cursor-text pointer-events-none"
                      style={{ zIndex: 1 }}
                    >
                      Insira sua mensagem aqui...
                    </div>
                  )}
                  <EditorContent
                    editor={editor}
                    onDragOver={(e: DragEvent) => e.preventDefault()}
                    className="[&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:break-words [&_.ProseMirror]:overflow-wrap-anywhere [&_.ProseMirror:focus]:outline-none p-4"
                  />
                </div>
              </div>

              {/* Attachments */}
              {(pdfUrl || attachments.length > 0) && (
                <div className="px-6 py-3 border-t bg-gray-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* PDF gerado */}
                    {pdfUrl && includePdf && (
                      <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md min-w-[200px] group">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded">
                          <Paperclip className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-xs flex-1 min-w-0">
                          <div className="font-medium truncate">
                            Cotação_{quotation.docNum}.pdf
                          </div>
                          {generatingPdf && (
                            <div className="text-gray-500 text-[10px]">
                              Gerando...
                            </div>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <Popover>
                              <PopoverTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    className="h-5 w-5 bg-blue-800/70 cursor-pointer hover:bg-blue-800/90"
                                  >
                                    <Ellipsis className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-44 p-1.5"
                                align="end"
                              >
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    className="justify-start text-left px-3 py-1.5 text-sm"
                                    disabled={generatingPdf}
                                    onClick={() => openInNewTab(pdfUrl)}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Visualizar PDF
                                  </Button>
                                  {
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="justify-start text-left px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setIncludePdf(false)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remover PDF
                                    </Button>
                                  }
                                </div>
                              </PopoverContent>
                              <TooltipContent>Opções do anexo</TooltipContent>
                            </Popover>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    {/* Anexos */}
                    {attachments.map((file, i) => {
                      const url = getAttachmentUrl(file);
                      const isImage = file.type.startsWith("image/");
                      const isPdf =
                        file.type === "application/pdf" ||
                        file.name.toLowerCase().endsWith(".pdf");

                      return (
                        <div
                          key={getAttachmentKey(file)}
                          className="flex items-center gap-2 bg-slate-500/40 p-2 rounded-md min-w-[200px] group hover:bg-slate-500/30 transition-colors"
                        >
                          {/* Preview / ícone */}
                          {isImage ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded flex-shrink-0">
                              <Paperclip className="h-4 w-4" />
                            </div>
                          )}

                          {/* Nome */}
                          <div className="text-xs flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {file.name}
                            </div>
                          </div>

                          {/* Botão ⋮ */}
                          <TooltipProvider>
                            <Tooltip>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      className="h-5 w-5 bg-zinc-800 cursor-pointer"
                                    >
                                      <Ellipsis className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                </PopoverTrigger>

                                <PopoverContent
                                  className="w-44 p-1.5"
                                  align="end"
                                >
                                  <div className="flex flex-col">
                                    <Button
                                      variant="ghost"
                                      className="justify-start text-left px-3 py-1.5 text-sm"
                                      onClick={() =>
                                        window.open(
                                          url,
                                          "_blank",
                                          "noopener,noreferrer"
                                        )
                                      }
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      {isImage
                                        ? "Visualizar imagem"
                                        : isPdf
                                        ? "Visualizar PDF"
                                        : "Visualizar arquivo"}
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      className="justify-start text-left px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleRemoveAttachment(i)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remover anexo
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>

                              <TooltipContent>Opções do anexo</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {attachments.length > 0 && (
                    <span>{attachments.length} anexo(s)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={sending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending || !to.trim() || generatingPdf}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContentSendEmail>
      </Dialog>
    </TooltipProvider>
  );
}
