"use client";

import * as React from "react";
import { ColumnDef, type FilterFn } from "@tanstack/react-table";
import {
  AlertCircle,
  Ban,
  Check,
  Circle,
  Eye,
  Package,
  PackageOpen,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Pedido {
  duplicateCount: React.ReactNode;
  hasDuplicates: any;
  status: any;
  grupo: string;
  filial: string;
  codigoTransportadora: string;
  nomeTransportadora: string | null;
  estado: string;
  codigoDoCliente: string;
  nomeCliente: string;
  numeroPedido: string;
  dataLancamentoPedido: string;
  dataParaEntrega: string;
  statusDoPedido: string;
  dataPicking: string;
  statusPicking: string;
  notaFiscal: string;
  chaveNFe: string;
  internalCode: number;
  statusNotaFiscal?: string; // Nova propriedade adicionada
}

// Função getStatusConfig atualizada
export const getStatusConfig = (status: string) => {
  const config: {
    classes: string;
    icon: JSX.Element;
    text: string;
  } = {
    classes: "",
    icon: <Circle className="h-3 w-3 mr-1" />,
    text: status, // Valor padrão é o próprio status recebido
  };

  switch (status) {
    case "Aberto":
      config.classes = "w-32 bg-yellow-100 text-yellow-800";
      config.icon = <PackageOpen className="h-3 w-3 mr-1" />;
      config.text = "Aberto";
      break;
    case "Fechado":
      config.classes = "w-32 bg-green-100 text-green-800";
      config.icon = <Package className="h-3 w-3 mr-1" />;
      config.text = "Fechado";
      break;
    case "Cancelado":
      config.classes = "w-32 bg-red-100 text-red-800";
      config.icon = <Ban className="h-3 w-3 mr-1" />;
      config.text = "Cancelado";
      break;
    case "Liberado":
      config.classes = "w-32 bg-blue-100 text-blue-800";
      config.icon = <Check className="h-3 w-3 mr-1" />;
      config.text = "Liberado";
      break;
    case "Picking eft.":
      config.classes = "w-32 bg-purple-100 text-purple-800";
      config.icon = <ShoppingCart className="h-3 w-3 mr-1" />;
      config.text = "Picking eft.";
      break;
    case "Indisponível":
      config.classes = "w-32 bg-red-200 text-gray-800";
      config.icon = <AlertCircle className="h-3 w-3 mr-1" />;
      config.text = "Indisponível";
      break;
    default:
      config.classes = "w-32 bg-amber-200 text-gray-800";
      config.icon = <PackageSearch className="h-3 w-3 mr-1" />;
      config.text = status || "Pendente";
  }

  return config;
};

export const numericFilter: FilterFn<Pedido> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (typeof value === "number") {
    return value.toString().includes(filterValue);
  }
  return false;
};

export const usePedidosColumns = (): ColumnDef<Pedido>[] => {
  const navigate = useNavigate();

  return [
    {
      accessorKey: "numeroPedido",
      header: "Nº Pedido",
      filterFn: numericFilter,
      cell: ({ row }) => {
        const numeroPedido = row.getValue("numeroPedido");

        const hasNotaFiscal =
          numeroPedido !== null &&
          numeroPedido !== undefined &&
          numeroPedido !== "";

        const handleViewPedido = async (e: React.MouseEvent) => {
          e.preventDefault();

          if (!hasNotaFiscal) return;

          try {
            const token = localStorage.getItem("token");
            if (!token) {
              navigate("/login");
              return;
            }

            const pedidoId = numeroPedido.toString();
            const loadingId = `loading-pedido-${pedidoId}`;

            // Loading aprimorado com o mesmo estilo do boleto
            const loadingEl = document.createElement("div");
            loadingEl.id = loadingId;
            loadingEl.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
            loadingEl.innerHTML = `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
                <div class="relative mb-4">
                  <div class="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                </div>
                <p class="font-medium text-gray-900 dark:text-white">Carregando Pedido de Venda... </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
              </div>
            `;
            document.body.appendChild(loadingEl);

            const response = await axios.get(
              `/api/external/Pedidos/imprime-pedido/${numeroPedido}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/pdf",
                },
                responseType: "blob",
              }
            );

            document.getElementById(loadingId)?.remove();

            const contentType = response.headers["content-type"];
            if (!contentType || !contentType.includes("application/pdf")) {
              throw new Error("Resposta não é um PDF válido");
            }

            const blob = new Blob([response.data], { type: "application/pdf" });
            const fileUrl = URL.createObjectURL(blob);

            // Detectar dispositivo móvel e especialmente Android
            const isMobile =
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              );
            const isAndroid = /Android/i.test(navigator.userAgent);

            // Nova interface do visualizador seguindo o padrão dos boletos
            const viewerContainer = document.createElement("div");
            viewerContainer.id = `pedido-viewer-${pedidoId}`;
            viewerContainer.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50";

            // Criar conteúdo do visualizador adaptado para diferentes dispositivos
            viewerContainer.innerHTML = `
              <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95" id="viewer-container-${pedidoId}">
                <!-- Cabeçalho com gradiente -->
                <div class="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <div class="bg-white/20 p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-bold">Pedido de Venda #${pedidoId}</h3>
                        <div class="flex items-center text-sm text-white/80">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>Documento oficial</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <a href="${fileUrl}" download="pedido-${pedidoId}.pdf" 
                        class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-sky-800 hover:bg-blue-50 shadow-sm gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                      </a>
                      <button id="close-viewer-${pedidoId}" 
                        class="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Área do conteúdo -->
                <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative" id="iframe-container-${pedidoId}">
                  <!-- Gradiente superior -->
                  <div class="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-400 dark:from-gray-800 to-transparent z-10"></div>
                  
                  <!-- O iframe ou embed será inserido aqui via JavaScript -->
                  <div id="pdf-content-${pedidoId}" class="w-full h-full">
                    <!-- Conteúdo inserido via JavaScript -->
                  </div>
                  
                  <!-- Barra de informações inferior -->
                  <div class="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10">
                    <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <span>Documento oficial • Válido para operações</span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ID: ${pedidoId}
                    </div>
                  </div>
                </div>
              </div>
            `;

            document.body.appendChild(viewerContainer);

            // Renderizar o PDF baseado no dispositivo
            const pdfContentElement = document.getElementById(
              `pdf-content-${pedidoId}`
            );

            if (pdfContentElement) {
              if (isAndroid) {
                // Para Android: use object tag em vez de iframe
                pdfContentElement.innerHTML = `
                  <object 
                    data="${fileUrl}" 
                    type="application/pdf" 
                    class="w-full h-full">
                    <div class="w-full h-full flex flex-col items-center justify-center">
                      <p class="text-gray-600 dark:text-gray-300 mb-3">
                        Não foi possível exibir o PDF diretamente.
                      </p>
                      <a href="${fileUrl}" target="_blank" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                        Abrir em nova aba
                      </a>
                    </div>
                  </object>
                `;
              } else if (isMobile) {
                // Para outros dispositivos móveis: embed tag
                pdfContentElement.innerHTML = `
                  <embed 
                    src="${fileUrl}" 
                    type="application/pdf" 
                    class="w-full h-full">
                `;
              } else {
                // Para desktop: iframe padrão
                pdfContentElement.innerHTML = `
                  <iframe 
                    src="${fileUrl}" 
                    class="w-full h-full" 
                    frameborder="0"
                    allow="fullscreen">
                  </iframe>
                `;
              }
            }

            // Animar a entrada após um pequeno delay
            setTimeout(() => {
              const viewerEl = document.getElementById(
                `viewer-container-${pedidoId}`
              );
              if (viewerEl) {
                viewerEl.classList.remove("opacity-0", "scale-95");
                viewerEl.classList.add("opacity-100", "scale-100");
              }
            }, 50);

            // Adicionar evento de fechamento com animação de saída
            document
              .getElementById(`close-viewer-${pedidoId}`)
              ?.addEventListener("click", () => {
                const viewerElement = document.getElementById(
                  `viewer-container-${pedidoId}`
                );
                if (viewerElement) {
                  // Animar saída
                  viewerElement.classList.remove("opacity-100", "scale-100");
                  viewerElement.classList.add("opacity-0", "scale-95");

                  // Remover após animação
                  setTimeout(() => {
                    const containerElement = document.getElementById(
                      `pedido-viewer-${pedidoId}`
                    );
                    if (containerElement) {
                      containerElement.remove();
                    }
                    URL.revokeObjectURL(fileUrl);
                  }, 300);
                } else {
                  // Fallback se o elemento não for encontrado
                  const containerElement = document.getElementById(
                    `pedido-viewer-${pedidoId}`
                  );
                  if (containerElement) {
                    containerElement.remove();
                  }
                  URL.revokeObjectURL(fileUrl);
                }
              });
          } catch (error) {
            const loadingId = `loading-pedido-${numeroPedido}`;
            document.getElementById(loadingId)?.remove();

            // Mensagem de erro aprimorada
            const errorEl = document.createElement("div");
            errorEl.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
            errorEl.innerHTML = `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
                <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Não foi possível carregar o pedido
                </h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Estamos com dificuldades para acessar este documento no momento. 
                  Por favor, tente novamente mais tarde ou contate o suporte.
                </p>
                <button id="close-error" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  Fechar
                </button>
              </div>
            `;

            document.body.appendChild(errorEl);

            document
              .getElementById("close-error")
              ?.addEventListener("click", () => {
                errorEl.remove();
              });
          }
        };

        return (
          <div className="flex items-center gap-2">
            <span className="block text-center font-medium min-w-[50px]">
              {hasNotaFiscal ? numeroPedido.toString() : "N/A"}
            </span>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleViewPedido}
                      disabled={!hasNotaFiscal}
                      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0 cursor-pointer ${
                        !hasNotaFiscal ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {hasNotaFiscal
                        ? "Visualizar Pedido"
                        : "Pedido não disponível"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "dataLancamentoPedido",
      header: "Data Lanç.",
      cell: ({ row }) => {
        const dateValue = row.getValue("dataLancamentoPedido");
        if (!dateValue) return "";
        // Usar split para preservar a data exata sem ajuste de timezone
        const dateString = String(dateValue);
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
      },
      filterFn: (row, columnId, filterValue) => {
        // Se não temos valores de filtro, mostrar todos os resultados
        if (!filterValue?.start || !filterValue?.end) return true;

        const dateValue = row.getValue(columnId);
        if (!dateValue) return false;

        // Garantir que estamos trabalhando com uma string
        const dateString = String(dateValue);

        // Parse direto da string de data no formato YYYY-MM-DD
        const [cellYear, cellMonth, cellDay] = dateString
          .split("-")
          .map(Number);

        // Parse direto das strings de filtro no formato YYYY-MM-DD
        const [startYear, startMonth, startDay] = filterValue.start
          .split("-")
          .map(Number);

        const [endYear, endMonth, endDay] = filterValue.end
          .split("-")
          .map(Number);

        // Verificar se a data da célula está entre as datas de filtro
        // YYYY comparação
        if (cellYear < startYear || cellYear > endYear) return false;

        // Mesmo ano, verificar mês
        if (cellYear === startYear && cellMonth < startMonth) return false;
        if (cellYear === endYear && cellMonth > endMonth) return false;

        // Mesmo ano e mês, verificar dia
        if (
          cellYear === startYear &&
          cellMonth === startMonth &&
          cellDay < startDay
        )
          return false;
        if (cellYear === endYear && cellMonth === endMonth && cellDay > endDay)
          return false;

        return true;
      },
    },
    {
      accessorKey: "dataParaEntrega",
      header: "Data Entre.",
      cell: ({ row }) => {
        const dateValue = row.getValue("dataParaEntrega");
        if (!dateValue) return "";

        // Garantir que estamos trabalhando com uma string
        const dateString = String(dateValue);
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
      },
      filterFn: (row, columnId, filterValue) => {
        // Se não temos valores de filtro, mostrar todos os resultados
        if (!filterValue?.start || !filterValue?.end) return true;

        const dateValue = row.getValue(columnId);
        if (!dateValue) return false;

        // Garantir que estamos trabalhando com uma string
        const dateString = String(dateValue);

        // Parse direto da string de data no formato YYYY-MM-DD
        const [cellYear, cellMonth, cellDay] = dateString
          .split("-")
          .map(Number);

        // Parse direto das strings de filtro no formato YYYY-MM-DD
        const [startYear, startMonth, startDay] = filterValue.start
          .split("-")
          .map(Number);

        const [endYear, endMonth, endDay] = filterValue.end
          .split("-")
          .map(Number);

        // Verificar se a data da célula está entre as datas de filtro
        // YYYY comparação
        if (cellYear < startYear || cellYear > endYear) return false;

        // Mesmo ano, verificar mês
        if (cellYear === startYear && cellMonth < startMonth) return false;
        if (cellYear === endYear && cellMonth > endMonth) return false;

        // Mesmo ano e mês, verificar dia
        if (
          cellYear === startYear &&
          cellMonth === startMonth &&
          cellDay < startDay
        )
          return false;
        if (cellYear === endYear && cellMonth === endMonth && cellDay > endDay)
          return false;

        return true;
      },
    },
    {
      accessorKey: "statusDoPedido",
      header: "Status Pedido",
      cell: ({ row }) => {
        const { classes, icon, text } = getStatusConfig(
          row.getValue("statusDoPedido")
        );
        return (
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}
          >
            {icon}
            {text || row.getValue("statusDoPedido")}
          </div>
        );
      },
    },
    {
      accessorKey: "statusPicking",
      header: "Status Picking",
      cell: ({ row }) => {
        const { classes, icon, text } = getStatusConfig(
          row.getValue("statusPicking")
        );
        return (
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}
          >
            {icon}
            {text || row.getValue("statusDoPedido")}
          </div>
        );
      },
    },
    {
      accessorKey: "notaFiscal",
      header: "Nota Fiscal",
      filterFn: numericFilter,
      cell: ({ row }) => {
        const notaFiscal = row.getValue("notaFiscal");
        const companyCode = row.original.filial || "";
        const chaveNFe = row.original.chaveNFe || "";
        const statusNotaFiscal = row.original.statusNotaFiscal || "";

        // Verifica se a nota fiscal foi cancelada
        // Corrigindo a verificação para aceitar tanto "Cancelada" quanto "Cancelado"
        const isNotaCancelled =
          statusNotaFiscal === "Cancelada" || statusNotaFiscal === "Cancelado";

        // Log para debug
       

        // Verificamos se temos acesso aos dados para download/visualização
        const hasDownloadAccess =
          notaFiscal && companyCode && chaveNFe && !isNotaCancelled;

        const handleDownloadXML = async (e: {
          preventDefault: () => void;
          stopPropagation: () => void;
        }) => {
          e.preventDefault();
          e.stopPropagation();

          if (!hasDownloadAccess) return;

          try {
            const token = localStorage.getItem("token");
            if (!token) {
              navigate("/login");
              return;
            }

            const response = await axios.get(
              `/api/external/FileXML/download/${companyCode}/NFe${chaveNFe}.xml`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/zip",
                },
                responseType: "blob",
              }
            );

            const blob = new Blob([response.data], { type: "application/xml" });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `nota-${notaFiscal}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
            toast.success(`Download da nota ${notaFiscal} concluído!`, {
              description: "Arquivo .zip salvo com sucesso.",
              duration: 5000,
              style: {
                backgroundColor: "white",
                color: "green",
                boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
              },
            });
          } catch (error) {
            toast.error("Erro ao baixar XML", {
              description: "Verifique os dados da nota ou tente novamente.",
              style: {
                backgroundColor: "white",
                color: "red",
                boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
              },
            });
          }
        };

        const handleViewDANFE = async (e: {
          preventDefault: () => void;
          stopPropagation: () => void;
        }) => {
          e.preventDefault();
          e.stopPropagation();

          if (!hasDownloadAccess) return;

          try {
            const token = localStorage.getItem("token");
            if (!token) {
              navigate("/login");
              return;
            }

            const notaId = notaFiscal.toString();
            const loadingId = `loading-danfe-${notaId}`;

            // Loading aprimorado
            const loadingEl = document.createElement("div");
            loadingEl.id = loadingId;
            loadingEl.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
            loadingEl.innerHTML = `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
                <div class="relative mb-4">
                  <div class="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                </div>
                <p class="font-medium text-gray-900 dark:text-white">Carregando sua Danfe</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
              </div>
            `;
            document.body.appendChild(loadingEl);

            const response = await axios.get(`/api/external/Danfe/gerar`, {
              params: {
                companyCode: companyCode,
                chaveNF: chaveNFe,
              },
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/pdf",
              },
              responseType: "blob",
            });

            document.getElementById(loadingId)?.remove();

            const contentType = response.headers["content-type"];
            if (!contentType || !contentType.includes("application/pdf")) {
              throw new Error("Resposta não é um PDF válido");
            }

            const blob = new Blob([response.data], { type: "application/pdf" });
            const fileUrl = URL.createObjectURL(blob);

            // Detectar se é um dispositivo móvel Android
            const isAndroid = /Android/i.test(navigator.userAgent);

            // Interface do visualizador
            const viewerContainer = document.createElement("div");
            viewerContainer.id = `danfe-viewer-${notaId}`;
            viewerContainer.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50";

            viewerContainer.innerHTML = `
              <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95" id="viewer-container-${notaId}">
                <!-- Cabeçalho com gradiente -->
                <div class="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <div class="bg-white/20 p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-bold">DANFE - Nota Fiscal #${notaId}</h3>
                        <div class="flex items-center text-sm text-white/80">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>Documento oficial</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <a href="${fileUrl}" download="danfe-${notaId}.pdf" 
                        class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-sky-800 hover:bg-blue-50 shadow-sm gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                      </a>
                      <button id="close-viewer-${notaId}" 
                        class="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Área do conteúdo -->
                <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative" id="iframe-container-${notaId}">
                  <!-- Gradiente superior -->
                  <div class="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-400 dark:from-gray-800 to-transparent z-10"></div>
                  
                  <!-- O conteúdo do PDF será inserido aqui via JavaScript -->
                  
                  <!-- Barra de informações inferior -->
                  <div class="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10">
                    <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <span>Documento fiscal • Válido para operações</span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Chave: ${notaId}
                    </div>
                  </div>
                </div>
              </div>
            `;

            document.body.appendChild(viewerContainer);

            // Obter o container onde será inserido o conteúdo do PDF
            const iframeContainer = document.getElementById(
              `iframe-container-${notaId}`
            );

            if (iframeContainer) {
              // Criar elemento para exibir o PDF baseado no dispositivo
              if (isAndroid) {
                // Para Android: usar object em vez de iframe
                const objectElement = document.createElement("object");
                objectElement.setAttribute("data", fileUrl);
                objectElement.setAttribute("type", "application/pdf");
                objectElement.className = "w-full h-full";

                // Mensagem para navegadores que não suportam PDF embutido
                objectElement.innerHTML = `
                  <div class="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-6">
                    <div class="text-center max-w-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <p class="text-lg font-semibold mb-2">Este navegador não suporta PDFs embutidos</p>
                      <p class="text-gray-600 dark:text-gray-300 mb-4">Clique no botão abaixo para baixar o documento e visualizá-lo.</p>
                      <a href="${fileUrl}" download="danfe-${notaId}.pdf" class="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Baixar PDF
                      </a>
                    </div>
                  </div>
                `;

                iframeContainer.appendChild(objectElement);

                // Fallback adicional para Android: adicionar link direto para abrir em nova guia
                const fallbackLink = document.createElement("div");
                fallbackLink.className = "absolute top-0 right-0 p-2 z-20";
                fallbackLink.innerHTML = `
                  <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" 
                     class="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    Abrir em nova guia
                  </a>
                `;
                iframeContainer.appendChild(fallbackLink);
              } else {
                // Para outros dispositivos: usar o iframe padrão
                const iframeElement = document.createElement("iframe");
                iframeElement.setAttribute("src", fileUrl);
                iframeElement.setAttribute("frameborder", "0");
                iframeElement.setAttribute("allow", "fullscreen");
                iframeElement.className = "w-full h-full";
                iframeContainer.appendChild(iframeElement);
              }
            }

            // Animar a entrada após um pequeno delay
            setTimeout(() => {
              const viewerEl = document.getElementById(
                `viewer-container-${notaId}`
              );
              if (viewerEl) {
                viewerEl.classList.remove("opacity-0", "scale-95");
                viewerEl.classList.add("opacity-100", "scale-100");
              }
            }, 50);

            // Adicionar evento de fechamento com animação de saída
            document
              .getElementById(`close-viewer-${notaId}`)
              ?.addEventListener("click", () => {
                const viewerElement = document.getElementById(
                  `viewer-container-${notaId}`
                );
                if (viewerElement) {
                  // Animar saída
                  viewerElement.classList.remove("opacity-100", "scale-100");
                  viewerElement.classList.add("opacity-0", "scale-95");

                  // Remover após animação
                  setTimeout(() => {
                    const containerElement = document.getElementById(
                      `danfe-viewer-${notaId}`
                    );
                    if (containerElement) {
                      containerElement.remove();
                    }
                    URL.revokeObjectURL(fileUrl);
                  }, 300);
                } else {
                  // Fallback se o elemento não for encontrado
                  const containerElement = document.getElementById(
                    `danfe-viewer-${notaId}`
                  );
                  if (containerElement) {
                    containerElement.remove();
                  }
                  URL.revokeObjectURL(fileUrl);
                }
              });
          } catch (error) {
            const loadingId = `loading-danfe-${notaFiscal.toString()}`;
            document.getElementById(loadingId)?.remove();

            // Mensagem de erro aprimorada
            const errorEl = document.createElement("div");
            errorEl.className =
              "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
            errorEl.innerHTML = `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
                <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Não foi possível carregar a DANFE
                </h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  Estamos com dificuldades para acessar este documento no momento. 
                  Por favor, tente novamente mais tarde ou contate o suporte.
                </p>
                <button id="close-error" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  Fechar
                </button>
              </div>
            `;

            document.body.appendChild(errorEl);

            document
              .getElementById("close-error")
              ?.addEventListener("click", () => {
                errorEl.remove();
              });

          }
        };

        // Definir estilos diretamente como objetos para garantir aplicação correta
        const textClass = isNotaCancelled
          ? "block text-center font-medium min-w-[50px] text-red-500 "
          : "block text-center font-medium min-w-[50px]";

        const buttonClass = (disabled: boolean) => {
          let baseClass =
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-8 w-8 p-0 ";

          if (isNotaCancelled) {
            return baseClass + "bg-red-500 hover:bg-red-600 text-white";
          } else if (disabled) {
            return (
              baseClass +
              "bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
            );
          } else {
            return (
              baseClass +
              "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            );
          }
        };

        // Determinar as mensagens para os tooltips
        // Garantindo que o tooltip da nota fiscal sempre apareça quando estiver cancelada
        const notaTooltipMessage = isNotaCancelled
          ? "Nota fiscal cancelada"
          : !notaFiscal || !companyCode || !chaveNFe
          ? ""
          : "";

        const danfeTooltipMessage = isNotaCancelled
          ? "DANFE cancelada"
          : hasDownloadAccess
          ? "Visualizar DANFE"
          : "DANFE não disponível";

        const xmlTooltipMessage = isNotaCancelled
          ? "XML cancelado"
          : hasDownloadAccess
          ? "Baixar XML"
          : "XML não disponível";

        // Importamos os componentes do shadcn/ui necessários
        return (
          <div className="flex items-center gap-1">
            {/* Usando o componente Tooltip do shadcn/ui */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={textClass}
                  data-status={isNotaCancelled ? "cancelada" : ""}
                >
                  {notaFiscal ? notaFiscal.toString() : "-"}
                </span>
              </TooltipTrigger>
              {(isNotaCancelled || notaTooltipMessage) && (
                <TooltipContent className="bg-white text-red-800 border border-red-200 shadow-md px-3 py-1.5 rounded-md text-sm">
                  <p>
                    {isNotaCancelled
                      ? "Nota fiscal cancelada"
                      : notaTooltipMessage}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>

            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleViewDANFE}
                    disabled={!hasDownloadAccess}
                    className={buttonClass(!hasDownloadAccess)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar DANFE</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className={
                    isNotaCancelled
                      ? "bg-white text-red-800 border border-red-200"
                      : ""
                  }
                >
                  <p>{danfeTooltipMessage}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDownloadXML}
                    disabled={!hasDownloadAccess}
                    className={buttonClass(!hasDownloadAccess)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                      />
                    </svg>
                    <span className="sr-only">Download XML</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className={
                    isNotaCancelled
                      ? "bg-white text-red-800 border border-red-200"
                      : ""
                  }
                >
                  <p>{xmlTooltipMessage}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    // Adicione esta nova coluna ao array de colunas (columns) depois da coluna "notaFiscal"
    {
      accessorKey: "nomeCliente",
      header: "Cliente",
      cell: ({ row }) => (
        <div
          className="whitespace-nowrap overflow-hidden text-ellipsis flex w-56"
          title={row.getValue("nomeCliente")}
        >
          {row.getValue("nomeCliente")}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
    },

    {
      accessorKey: "nomeTransportadora",
      header: "Nome Transp.",
      cell: ({ row }) => {
        const nome: string | null = row.getValue("nomeTransportadora");
        if (!nome) return <>-</>;

        const displayName = nome.length > 10 ? `${nome.slice(0, 23)}...` : nome;
        return <>{displayName}</>;
      },
    },
  ];
};

export type { Pedido };
