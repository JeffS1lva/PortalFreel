import { ColumnDef } from "@tanstack/react-table";
import {
  formatCNPJ,
  formatCurrency,
  formatDatePtBr,
} from "@/utils/boletos/formatters";
import { numericFilter, dateRangeFilter } from "@/utils/boletos/filters";

import { PaymentDate } from "@/components/pages/BoletosColumns/PaymentDate";
import { BoletoButton } from "@/components/pages/BoletosColumns/BoletoButton";
import { StatusBadge } from "@/components/pages/BoletosColumns/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { PedidosCompraCell } from "@/components/pages/Pedidos/PedidosCompra/PedidosModal";

interface Parcela {
  codigoBoleto: number;
  codigoPN: string;
  nomePN: string;
  cnpj: string;
  numNF: string;
  notaFiscal: string;
  parcela: string;
  valorParcela: number;
  dataVencimento: string;
  dataPagamento: string;
  status: string;
  filial: string;
  chaveNFe: string;
  statusNotaFiscal?: string;
  id: number;
  pedidosCompra: string;
}

export const useBoletosColumns = () => {
  const navigate = useNavigate();

  // Função para criar o modal de loading
  const createLoadingModal = useCallback((notaId: string) => {
    const loadingId = `loading-danfe-${notaId}`;
    const loadingEl = document.createElement("div");
    loadingEl.id = loadingId;
    loadingEl.className =
      "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
    loadingEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
        <div class="relative mb-4">
          <div class="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
        </div>
        <p class="font-medium text-gray-900 dark:text-white">Carregando sua Danfe</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
      </div>
    `;
    document.body.appendChild(loadingEl);
    return loadingId;
  }, []);

  // Função para remover o modal de loading
  const removeLoadingModal = useCallback((loadingId: string) => {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
  }, []);

  // Função para criar o modal de erro
  const createErrorModal = useCallback((message: string) => {
    const errorEl = document.createElement("div");
    errorEl.className =
      "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50";
    errorEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center max-w-md">
        <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-red-500">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Não foi possível carregar a DANFE
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
          ${message}
        </p>
        <button id="close-error" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
          Fechar
        </button>
      </div>
    `;

    document.body.appendChild(errorEl);

    const closeButton = document.getElementById("close-error");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        errorEl.remove();
      });
    }
  }, []);

  // Função para criar o viewer do PDF
  const createPDFViewer = useCallback((fileUrl: string, notaId: string) => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    const viewerContainer = document.createElement("div");
    viewerContainer.id = `danfe-viewer-${notaId}`;
    viewerContainer.className =
      "fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50";

    viewerContainer.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95" id="viewer-container-${notaId}">
        <div class="bg-gradient-to-r from-sky-900 to-zinc-800 p-5 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="bg-white/20 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold">DANFE - Nota Fiscal #${notaId}</h3>
                <div class="flex items-center text-sm text-white/80">
                  <span>Documento oficial</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <a href="${fileUrl}" download="danfe-${notaId}.pdf" 
                class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-sky-800 hover:bg-blue-50 shadow-sm gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </a>
              <button id="close-viewer-${notaId}" 
                class="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative" id="iframe-container-${notaId}">
          <div class="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-400 dark:from-gray-800 to-transparent z-10"></div>
          
          <div class="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10">
            <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2 text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
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

    const iframeContainer = document.getElementById(
      `iframe-container-${notaId}`
    );

    if (iframeContainer) {
      if (isAndroid) {
        // Para Android: usar object com fallback
        const objectElement = document.createElement("object");
        objectElement.setAttribute("data", fileUrl);
        objectElement.setAttribute("type", "application/pdf");
        objectElement.className = "w-full h-full";
        objectElement.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-6">
            <div class="text-center max-w-md">
              <p class="text-lg font-semibold mb-2">Este navegador não suporta PDFs embutidos</p>
              <p class="text-gray-600 dark:text-gray-300 mb-4">Clique no botão abaixo para baixar o documento.</p>
              <a href="${fileUrl}" download="danfe-${notaId}.pdf" class="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                Baixar PDF
              </a>
            </div>
          </div>
        `;
        iframeContainer.appendChild(objectElement);
      } else {
        // Para outros navegadores: usar iframe
        const iframeElement = document.createElement("iframe");
        iframeElement.setAttribute("src", fileUrl);
        iframeElement.setAttribute("frameborder", "0");
        iframeElement.setAttribute("allow", "fullscreen");
        iframeElement.className = "w-full h-full";
        iframeContainer.appendChild(iframeElement);
      }
    }

    // Animar entrada
    setTimeout(() => {
      const viewerEl = document.getElementById(`viewer-container-${notaId}`);
      if (viewerEl) {
        viewerEl.classList.remove("opacity-0", "scale-95");
        viewerEl.classList.add("opacity-100", "scale-100");
      }
    }, 50);

    // Evento de fechamento
    const closeButton = document.getElementById(`close-viewer-${notaId}`);
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        const viewerElement = document.getElementById(
          `viewer-container-${notaId}`
        );
        if (viewerElement) {
          viewerElement.classList.remove("opacity-100", "scale-100");
          viewerElement.classList.add("opacity-0", "scale-95");

          setTimeout(() => {
            const containerElement = document.getElementById(
              `danfe-viewer-${notaId}`
            );
            if (containerElement) {
              containerElement.remove();
            }
            URL.revokeObjectURL(fileUrl);
          }, 300);
        }
      });
    }
  }, []);

  // Função para fazer o download do PDF
  const handleViewDANFE = useCallback(
    async (
      companyCode: string,
      chaveNFe: string,
      notaId: string,
      isNotaCancelled: boolean
    ) => {
      if (isNotaCancelled) return;

      const loadingId = createLoadingModal(notaId);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          removeLoadingModal(loadingId);
          navigate("/login");
          return;
        }

        const response = await axios.get(`/api/external/Danfe/gerar`, {
          params: {
            companyCode,
            chaveNF: chaveNFe,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          responseType: "blob",
          timeout: 30000, // 30 segundos de timeout
        });

        removeLoadingModal(loadingId);

        const contentType = response.headers["content-type"];
        if (!contentType || !contentType.includes("application/pdf")) {
          throw new Error("Resposta não é um PDF válido");
        }

        const blob = new Blob([response.data], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(blob);

        createPDFViewer(fileUrl, notaId);
      } catch (error) {
        removeLoadingModal(loadingId);

        let errorMessage =
          "Estamos com dificuldades para acessar este documento no momento. Por favor, tente novamente mais tarde.";

        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            errorMessage = "Tempo limite esgotado. Tente novamente.";
          } else if (error.response?.status === 401) {
            errorMessage = "Sessão expirada. Faça login novamente.";
            navigate("/login");
            return;
          } else if (error.response?.status === 404) {
            errorMessage = "Documento não encontrado.";
          }
        }

        createErrorModal(errorMessage);
      }
    },
    [
      navigate,
      createLoadingModal,
      removeLoadingModal,
      createErrorModal,
      createPDFViewer,
    ]
  );

  const columns: ColumnDef<Parcela, any>[] = useMemo(
    () => [
      {
        accessorKey: "codigoBoleto",
        header: "Código",
        filterFn: numericFilter,
        cell: ({ row }) => {
          const codigoBoleto = row.getValue("codigoBoleto") as
            | string
            | number
            | null
            | undefined;
          const id = row.original.id;
          const dataVencimento = row.getValue("dataVencimento") as string;
          const status = row.getValue("status") as string;

          return (
            <div className="flex items-center gap-1">
              <span className="block text-center font-medium min-w-[50px]">
                {codigoBoleto ? String(codigoBoleto) : "-"}
              </span>
              <div className="flex gap-1">
                <BoletoButton
                  boletoId={codigoBoleto}
                  parcelaId={id}
                  dataVencimento={dataVencimento}
                  status={status}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "nomePN",
        header: "Nome",
        cell: ({ row }) => {
          const nome = row.getValue("nomePN");

          return (
            <div
              className="whitespace-nowrap overflow-hidden text-ellipsis flex w-56 dark:text-gray-200"
              title={nome ? String(nome) : undefined}
            >
              {/* Nome completo no desktop */}
              <span className="hidden sm:inline">{String(nome)}</span>

              {/* Nome cortado no mobile */}
              <span className="sm:hidden">
                {String(nome).length > 15
                  ? String(nome).slice(0, 15) + "..."
                  : String(nome)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "cnpj",
        header: "CNPJ",
        cell: ({ row }) => (
          <span className="dark:text-gray-200">
            {formatCNPJ(row.getValue("cnpj"))}
          </span>
        ),
      },
      {
        accessorKey: "pedidosCompra",
        header: "Pedidos Compra",
        cell: ({ row }) => {
          const pedidos = row.getValue("pedidosCompra") as string;
          return <PedidosCompraCell pedidos={pedidos} />;
        },
      },

      {
        accessorKey: "numNF",
        header: "Nota Fiscal",
        filterFn: "includesString",
        cell: ({ row }) => {
          const numNF = row.getValue("numNF") as string | number | null;
          const notaFiscal = row.original.notaFiscal;
          const companyCode = row.original.filial || "";
          const chaveNFe = row.original.chaveNFe || "";
          const status =
            row.original.status || row.original.statusNotaFiscal || "";

          // Verificar status cancelado da mesma forma que o BoletoButton
          const isNotaCancelled = ["cancelado", "cancelada"].some((s) =>
            status.toLowerCase().includes(s)
          );

          // Verificar se temos os dados necessários para a DANFE
          const hasDANFEData = Boolean(
            (notaFiscal || numNF) &&
              companyCode &&
              companyCode.trim() !== "" &&
              chaveNFe &&
              chaveNFe.trim() !== ""
          );

          // Debug para acompanhar os dados

          const textClass = isNotaCancelled
            ? "text-center font-medium min-w-[50px] text-red-500 line-through"
            : "text-center font-medium min-w-[50px] dark:text-gray-200";

          // Definir tooltip específico para cada situação
          const getTooltipText = () => {
            if (isNotaCancelled) {
              return "Esta nota fiscal está indisponível, por isso, não está disponível para visualização.";
            }

            if (!hasDANFEData) {
              return "DANFE não disponível para boletos";
            }

            return "Visualizar DANFE";
          };

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Não executar ação se cancelado ou sem dados
            if (isNotaCancelled || !hasDANFEData) {
              return;
            }

            const notaId = (notaFiscal || numNF || "").toString();
            handleViewDANFE(companyCode, chaveNFe, notaId, isNotaCancelled);
          };

          return (
            <div className="flex items-center justify-center gap-2 min-h-[2rem]">
              {/* Número da nota fiscal */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={textClass}>
                    {numNF ? numNF.toString() : "-"}
                  </span>
                </TooltipTrigger>
                {isNotaCancelled && (
                  <TooltipContent className="bg-white text-red-800 border border-red-200 shadow-md px-3 py-1.5 rounded-md text-sm">
                    <p>Nota fiscal indisponível.</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Botão DANFE - só mostrar se tiver numNF */}
              {numNF && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className={`h-8 w-8 ${
                        isNotaCancelled
                          ? "bg-red-600 hover:bg-red-800 text-white cursor-not-allowed opacity-80"
                          : !hasDANFEData
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onClick={handleClick}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">
                        {isNotaCancelled
                          ? "DANFE indisponível: foi cancelada"
                          : !hasDANFEData
                          ? "DANFE indisponível"
                          : "Visualizar DANFE"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getTooltipText()}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "parcela",
        header: "Parcela",
        cell: ({ row }) => (
          <span className="dark:text-gray-200">{row.getValue("parcela")}</span>
        ),
      },
      {
        accessorKey: "valorParcela",
        header: "Valor",
        cell: ({ row }) => (
          <span className="dark:text-gray-200">
            {formatCurrency(row.getValue("valorParcela"))}
          </span>
        ),
      },
      {
        accessorKey: "dataVencimento",
        header: "Vencimento",
        cell: ({ row }) => {
          const value = row.getValue("dataVencimento") as string;
          return (
            <span className="dark:text-gray-200">{formatDatePtBr(value)}</span>
          );
        },
        filterFn: dateRangeFilter,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const dataVencimento = row.getValue("dataVencimento") as string;
          const dataPagamento = row.getValue("dataPagamento") as string;

          return (
            <StatusBadge
              status={status}
              dataPagamento={dataPagamento}
              dataVencimento={dataVencimento}
            />
          );
        },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const status = String(row.getValue(columnId)).toLowerCase();
          return filterValue.toLowerCase() === status;
        },
      },
      {
        accessorKey: "dataPagamento",
        header: "Data Pagamento",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const dataPagamento = row.getValue("dataPagamento") as string;

          return <PaymentDate status={status} dataPagamento={dataPagamento} />;
        },
        filterFn: dateRangeFilter,
      },
    ],
    [handleViewDANFE]
  );

  return columns;
};
