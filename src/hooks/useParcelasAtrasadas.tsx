import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  FileText,
  DollarSign,
  AlertTriangle,
  User,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";
import { PedidosCompraCell } from "@/components/pages/Pedidos/PedidosCompra/PedidosModal";

export const useParcelasAtrasadasColumns = () => {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<ParcelaAtrasada>[]>(
    () => [
      {
        accessorKey: "nomeParceiroNegocio",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Cliente
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const codigo = row.getValue("nomeParceiroNegocio") as string;
          const displayText =
            codigo.length > 12 ? `${codigo.slice(0, 15)}...` : codigo;
          return (
            <div className="flex items-center justify-center py-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-md bg-blue-50 dark:bg-blue-900/20 dark:text-blue-200 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 cursor-default">
                      {displayText}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{codigo}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "codigoParceiroNegocio",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                Código Cliente
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const codigo = row.getValue("codigoParceiroNegocio") as string;
          return (
            <div className="flex items-center justify-center py-2">
              <span className="font-mono text-md bg-blue-50 dark:bg-blue-900/20  dark:text-blue-200 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700">
                {codigo}
              </span>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "pedidosCompra",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                Pedidos Compra
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const pedidos = row.getValue("pedidosCompra") as string;
          return (
            <div className="flex items-center justify-center py-2">
              <PedidosCompraCell pedidos={pedidos} />
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },

      {
        accessorKey: "numeroDocumento",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                <FileText className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                Documento
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const numeroDocumento = row.getValue("numeroDocumento") as string;
          const tipoDocumento = row.original.tipoDocumento;
          const companyCode = row.original.filial || "";
          const chaveNFe = row.original.chaveNFe || "";

          const hasDownloadAccess = numeroDocumento && companyCode && chaveNFe;

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

              const documentoId = numeroDocumento.toString();
              const loadingId = `loading-danfe-${documentoId}`;

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
            <p class="font-medium text-gray-900 dark:text-white">Carregando seu Documento</p>
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

              const blob = new Blob([response.data], {
                type: "application/pdf",
              });
              const fileUrl = URL.createObjectURL(blob);

              // Detectar se é um dispositivo móvel Android
              const isAndroid = /Android/i.test(navigator.userAgent);

              // Interface do visualizador
              const viewerContainer = document.createElement("div");
              viewerContainer.id = `documento-viewer-${documentoId}`;
              viewerContainer.className =
                "fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50";

              viewerContainer.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95" id="viewer-container-${documentoId}">
            <!-- Cabeçalho com gradiente -->
            <div class="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="bg-white/20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold">Documento #${documentoId}</h3>
                    <div class="flex items-center text-sm text-white/80">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span>Documento oficial</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <a href="${fileUrl}" download="documento-${documentoId}.pdf" 
                    class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-sky-800 hover:bg-blue-50 shadow-sm gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                  </a>
                  <button id="close-viewer-${documentoId}" 
                    class="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Área do conteúdo -->
            <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative" id="iframe-container-${documentoId}">
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
                  Doc: ${documentoId}
                </div>
              </div>
            </div>
          </div>
        `;

              document.body.appendChild(viewerContainer);

              // Obter o container onde será inserido o conteúdo do PDF
              const iframeContainer = document.getElementById(
                `iframe-container-${documentoId}`
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
                  <a href="${fileUrl}" download="documento-${documentoId}.pdf" class="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
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
                  `viewer-container-${documentoId}`
                );
                if (viewerEl) {
                  viewerEl.classList.remove("opacity-0", "scale-95");
                  viewerEl.classList.add("opacity-100", "scale-100");
                }
              }, 50);

              // Adicionar evento de fechamento com animação de saída
              document
                .getElementById(`close-viewer-${documentoId}`)
                ?.addEventListener("click", () => {
                  const viewerElement = document.getElementById(
                    `viewer-container-${documentoId}`
                  );
                  if (viewerElement) {
                    // Animar saída
                    viewerElement.classList.remove("opacity-100", "scale-100");
                    viewerElement.classList.add("opacity-0", "scale-95");

                    // Remover após animação
                    setTimeout(() => {
                      const containerElement = document.getElementById(
                        `documento-viewer-${documentoId}`
                      );
                      if (containerElement) {
                        containerElement.remove();
                      }
                      URL.revokeObjectURL(fileUrl);
                    }, 300);
                  } else {
                    // Fallback se o elemento não for encontrado
                    const containerElement = document.getElementById(
                      `documento-viewer-${documentoId}`
                    );
                    if (containerElement) {
                      containerElement.remove();
                    }
                    URL.revokeObjectURL(fileUrl);
                  }
                });
            } catch (error) {
              const loadingId = `loading-danfe-${numeroDocumento.toString()}`;
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
              Não foi possível carregar o documento
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
            <div className="flex justify-center items-center gap-2 py-2">
              <Badge
                variant="outline"
                className="text-md font-mono bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 py-1"
              >
                {tipoDocumento || "DOC"}
              </Badge>
              <span className="font-medium text-md text-gray-900 dark:text-gray-100">
                {numeroDocumento}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleViewDANFE}
                    variant="bottomPassword"
                    disabled={!hasDownloadAccess}
                    className={` h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background  p-0 ${
                      !hasDownloadAccess
                        ? "bg-red-500 p-1 gap-1 text-primary-foreground opacity-50 cursor-not-allowed"
                        : "bg-primary p-1 gap-1 text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {hasDownloadAccess
                      ? "Visualizar documento"
                      : " Documento não disponível!"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "dataEmissao",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                Data Lançamento
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const dataEmissao = row.getValue("dataEmissao") as string;

          const formatDate = (dateString: string) => {
            if (!dateString) return "Data inválida";

            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                return "Data inválida";
              }
              return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            } catch (error) {
              return "Data inválida";
            }
          };

          return (
            <div className="flex items-center justify-center py-2">
              <span className="dark:text-gray-200">
                {formatDate(dataEmissao)}
              </span>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "datetime",
        size: 160,
      },
      {
        accessorKey: "dataVencimento",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-base"
              >
                Vencimento
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const dataVencimento = row.getValue("dataVencimento") as string;

          const formatDate = (dateString: string) => {
            if (!dateString) return "Data inválida";

            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                return "Data inválida";
              }
              return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            } catch (error) {
              return "Data inválida";
            }
          };

          const isOverdue = () => {
            try {
              const vencimento = new Date(dataVencimento);
              const hoje = new Date();
              return vencimento < hoje;
            } catch {
              return false;
            }
          };

          return (
            <div className="flex items-center justify-center py-2">
              <span
                className={`text-base font-mono px-3 py-2 rounded-md border ${
                  isOverdue()
                    ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700"
                    : "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700"
                }`}
              >
                {formatDate(dataVencimento)}
              </span>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "datetime",
        size: 160,
      },
      {
        accessorKey: "saldoDevido",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                <DollarSign className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                Valor Aberto
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const saldoDevido = row.getValue("saldoDevido") as number;

          const formatCurrency = (value: number) => {
            try {
              return new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value || 0);
            } catch (error) {
              return "R$ 0,00";
            }
          };

          return (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="font-semibold text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-700 shadow-sm">
                  {formatCurrency(saldoDevido)}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "basic",
        size: 150,
      },
      {
        accessorKey: "diasAtraso",
        header: ({ column }) => {
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-base"
              >
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                Dias Vencidos
                <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const diasAtraso = row.getValue("diasAtraso") as number;

          const getBadgeStyle = (dias: number) => {
            if (dias <= 30) {
              return {
                className:
                  "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700 shadow-sm",
                icon: "⚠️",
                iconColor: "text-amber-500 dark:text-amber-400",
              };
            } else if (dias <= 60) {
              return {
                className:
                  "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700 shadow-sm",
                icon: "🟠",
                iconColor: "text-orange-500 dark:text-orange-400",
              };
            } else if (dias <= 90) {
              return {
                className:
                  "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700 shadow-sm",
                icon: "🔴",
                iconColor: "text-red-500 dark:text-red-400",
              };
            } else {
              return {
                className:
                  "bg-red-600 text-white border-red-600 shadow-lg animate-pulse",
                icon: "🚨",
                iconColor: "text-white",
              };
            }
          };

          const badgeStyle = getBadgeStyle(diasAtraso);

          return (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-3">
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 ${badgeStyle.iconColor}`}
                />
                <Badge
                  className={`font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 px-3 py-2 ${badgeStyle.className}`}
                  variant="outline"
                >
                  <span className="mr-1.5">{badgeStyle.icon}</span>
                  {diasAtraso} dia{diasAtraso !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "basic",
        size: 160,
      },
    ],
    []
  );

  return columns;
};
