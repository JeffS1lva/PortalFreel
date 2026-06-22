"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import type { Editor } from "@tiptap/react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Link2,
  Paperclip,
  ImageIcon,
  FileText,
  FileArchive,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface EmailEditorToolbarProps {
  editor: Editor;
  showColorPicker: boolean;
  setShowColorPicker: (value: boolean) => void;
  colorPresets: string[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFiles: (files: FileList | null) => void;
  attachType: "all" | "image" | "pdf" | "docs" | "archive";
  setAttachType: (value: "all" | "image" | "pdf" | "docs" | "archive") => void;
  getAcceptFor: (type: string) => string;
}

export function EmailEditorToolbar({
  editor,
  showColorPicker,
  setShowColorPicker,
  fileInputRef,
  handleFiles,
  setAttachType,
  getAcceptFor,
}: EmailEditorToolbarProps) {
  const triggerFilePicker = (
    type: "all" | "image" | "pdf" | "docs" | "archive"
  ) => {
    setAttachType(type);
    const accept = getAcceptFor(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  // Botão com tooltip reutilizável
  const ToolbarButton = ({
    icon: Icon,
    onClick,
    disabled = false,
    active = false,
    label,
    shortcut = "",
  }: {
    icon: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    label: string;
    shortcut?: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`
              h-8 w-8 transition-all duration-200
              hover:bg-white hover:shadow-sm hover:scale-105
              active:scale-95
              ${active ? "bg-blue-100 text-blue-700 shadow-sm" : ""}
            `}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="
            bg-gradient-to-b from-gray-800 to-gray-900 
            text-white text-sm font-medium
            px-3 py-1.5 rounded-md
            shadow-xl border border-gray-700/70
            backdrop-blur-sm
          "
          sideOffset={6}
        >
          {label}
          {shortcut && (
            <span className="ml-2 opacity-70 text-xs">({shortcut})</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-gray-100/80 flex flex-wrap items-center gap-1">
      {/* Undo/Redo */}
      <ToolbarButton
        icon={Undo}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Desfazer"
        shortcut="Ctrl+Z"
      />
      <ToolbarButton
        icon={Redo}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Refazer"
        shortcut="Ctrl+Y"
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <ToolbarButton
        icon={Bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Negrito"
        shortcut="Ctrl+B"
      />
      <ToolbarButton
        icon={Italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Itálico"
        shortcut="Ctrl+I"
      />
      <ToolbarButton
        icon={UnderlineIcon}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="Sublinhado"
        shortcut="Ctrl+U"
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Alignment */}
      <ToolbarButton
        icon={AlignLeft}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        label="Alinhar à esquerda"
      />
      <ToolbarButton
        icon={AlignCenter}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        label="Centralizar"
      />
      <ToolbarButton
        icon={AlignRight}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        label="Alinhar à direita"
      />
      <ToolbarButton
        icon={AlignJustify}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        label="Justificar"
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Highlight */}
      <ToolbarButton
        icon={Highlighter}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        label="Destacar texto"
      />

      {/* Color picker */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white hover:shadow-sm hover:scale-105 transition-all duration-200"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="
              bg-gradient-to-b from-gray-800 to-gray-900 
              text-white text-sm font-medium
              px-3 py-1.5 rounded-md
              shadow-xl border border-gray-700/70
              backdrop-blur-sm
            "
            sideOffset={6}
          >
            Cor do texto
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Link */}
      <ToolbarButton
        icon={Link2}
        onClick={() => {
          const url = prompt("Insira o URL:");
          if (url) {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }
        }}
        active={editor.isActive("link")}
        label="Inserir link"
      />

      {/* Anexo com Dropdown */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8hover:bg-white hover:shadow-sm hover:scale-105 transition-all duration-200"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem
            className="cursor-pointer text-sm gap-2"
            onClick={() => triggerFilePicker("all")}
          >
            <Paperclip className="h-4 w-4" />
            <span>Anexar qualquer arquivo</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-sm gap-2"
            onClick={() => triggerFilePicker("image")}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Imagem</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-sm gap-2"
            onClick={() => triggerFilePicker("pdf")}
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-sm gap-2"
            onClick={() => triggerFilePicker("docs")}
          >
            <FileText className="h-4 w-4" />
            <span>Documentos</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-sm gap-2"
            onClick={() => triggerFilePicker("archive")}
          >
            <FileArchive className="h-4 w-4" />
            <span>Compactados</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
