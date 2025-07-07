import axios from "axios";
import { toast } from "sonner";
import { useNavigate, type NavigateFunction } from "react-router-dom";

// Funções de formatação
export const formatCNPJ = (cnpj: string) => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

// Fixed: Proper type definition for a value with toLocaleString method
export const formatCurrency = (value: { toLocaleString: (locale: string, options: { style: string; currency: string }) => string }) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatDatePtBr = (dateStr: string | number | Date) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
};

// Fixed: Proper type definition for string with includes and split methods
export const parseDate = (str: string) => {
  if (!str) return new Date(0);
 
  // Aceita dd/MM/yyyy ou yyyy-MM-dd
  if (str.includes("/")) {
    const [day, month, year] = str.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  } else {
    const [year, month, day] = str.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
};

// Fixed: Better type handling for formatarValorMoeda function
export const formatarValorMoeda = (valor: string | number | null | { toLocaleString: Function }) => {
  // Verifica se o valor é número
  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Se for string, tenta converter para número primeiro
  if (typeof valor === 'string') {
    const num = parseFloat(valor.replace(/[^\d,.]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }
  
  // Se for um objeto com toLocaleString, utiliza o formatCurrency
  if (typeof valor === 'object' && valor !== null && typeof valor.toLocaleString === 'function') {
    return formatCurrency({
      toLocaleString: (locale: string, options: { style: string; currency: string }) => 
        valor.toLocaleString(locale, options)
    }).replace("R$", "").trim();
  }
  
  // Fallback para casos onde o valor não é reconhecido
  return valor?.toString() || "0,00";
};

export const useBoletoViewer = () => {
  const navigate = useNavigate();

  const showBoletoViewer = async (id: string | number, parcelaId: string | number, parcela: any = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const loadingId = `loading-boleto-${id}`;

      // Remover qualquer visualizador existente para evitar duplicações
      const existingViewer = document.getElementById(
        `boleto-viewer-${id}`
      );
      if (existingViewer) {
        existingViewer.remove();
      }

      // Mostrar loading com design aprimorado
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
          <p class="font-medium text-gray-900 dark:text-white">Carregando seu boleto...</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento</p>
        </div>
      `;
      document.body.appendChild(loadingEl);

      const apiUrl = `/api/external/Boletos/${id}/pdf`;

      try {
        // Configurar cabeçalhos
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf, application/octet-stream",
        };

        const response = await axios.get(apiUrl, {
          headers,
          responseType: "blob",
        });

        // Remover o loading
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        // Verificar o content-type retornado
        const contentType =
          response.headers["content-type"] || "application/pdf";

        // Criar blob
        const blob = new Blob([response.data], {
          type: contentType.includes("pdf")
            ? "application/pdf"
            : contentType,
        });

        // Criar objeto URL para uso no iframe e download
        const fileUrl = URL.createObjectURL(blob);

        // Se não temos as informações da parcela, tentaremos buscá-las
        let parcelaData = parcela;
        
        if (!parcelaData && parcelaId) {
          try {
            // Tenta buscar os dados da parcela para mostrar info correta
            const parcelaResponse = await axios.get(`/api/external/Parcelas/${parcelaId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            parcelaData = parcelaResponse.data;
          } catch (error) {
            // Continua mesmo se não conseguir a parcela
          }
        }

        // Detectar sistema operacional do usuário
        const isAndroid = /Android/i.test(navigator.userAgent);

        // Criar container do visualizador com design moderno
        createBoletoViewerDOM(id, parcelaId, fileUrl, parcelaData, isAndroid);
      } catch (error) {
        // Remover loading
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        handleBoletoError(error, navigate);
      }
    } catch (error) {
      const loadingId = `loading-boleto-${id || "-"}`;
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();

      toast.error("Erro ao visualizar boleto", {
        description:
          "Não foi possível carregar o boleto. Tente novamente mais tarde.",
      });
    }
  };

  return { showBoletoViewer };
};

// Função modificada para suportar dispositivos Android
export const createBoletoViewerDOM = (
  boletoId: string | number, 
  parcelaId: string | number, 
  fileUrl: string, 
  parcela: any = null,
  isAndroid: boolean = false
) => {
  // INICIALIZAÇÃO DE VARIÁVEIS - SEM VALORES ALEATÓRIOS
  let formattedDueDate = "Não disponível";
  let numeroNF = "";
  let dataVencimentoObj: Date | null = null;
  
  // Flag para boleto cancelado
  let isCanceled = false;
  
  if (parcela) {
    // Verificar se o boleto está cancelado
    isCanceled = parcela.status === "Cancelado";
    
    // Formatação da data de vencimento
    if (parcela.dataVencimento) {
      try {
        dataVencimentoObj = new Date(parcela.dataVencimento);
        
        // Verificar se a data é válida
        if (!isNaN(dataVencimentoObj.getTime())) {
          formattedDueDate = formatDatePtBr(parcela.dataVencimento);
        } else {
          formattedDueDate = "Data inválida";
        }
      } catch (error) {
        formattedDueDate = "Erro na data";
      }
    } else {
    }
    
    // Número da nota fiscal
    numeroNF = parcela.numNF || "";
  } else {
    
    formattedDueDate = "Não disponível";
  }

  // Calcular dias restantes até vencimento se a data for válida
  let diasRestantes: number | null = null;
  let statusVencimento = "";
  
  if (dataVencimentoObj && !isNaN(dataVencimentoObj.getTime())) {
    const hoje = new Date();
    // Resetar as horas para comparar apenas as datas
    hoje.setHours(0, 0, 0, 0);
    const vencimentoSemHoras = new Date(dataVencimentoObj);
    vencimentoSemHoras.setHours(0, 0, 0, 0);
    
    // Calcular a diferença em dias
    const diferencaEmTempo = vencimentoSemHoras.getTime() - hoje.getTime();
    diasRestantes = Math.ceil(diferencaEmTempo / (1000 * 60 * 60 * 24));
    
    // Definir status e estilo baseado nos dias restantes
    if (diasRestantes < 0) {
      statusVencimento = "Vencido";
    } else if (diasRestantes === 0) {
      statusVencimento = "Vence hoje";
    } else if (diasRestantes === 1) {
      statusVencimento = "Vence amanhã";
    } else if (diasRestantes <= 5) {
      statusVencimento = `Vence em ${diasRestantes} dias`;
    }
  }

  // Badge para dias de vencimento
  let vencimentoBadge = "";
  if (statusVencimento) {
    let vencimentoColor = "bg-blue-100 text-blue-800"; // Padrão para vencimentos futuros
    
    if (statusVencimento === "Vencido") {
      vencimentoColor = "bg-red-100 text-red-800";
    } else if (statusVencimento === "Vence hoje") {
      vencimentoColor = "bg-orange-100 text-orange-800";
    } else if (statusVencimento === "Vence amanhã") {
      vencimentoColor = "bg-yellow-100 text-yellow-800";
    }
    
    vencimentoBadge = `<span class="${vencimentoColor} text-xs px-2 py-0.5 rounded-full ml-2">${statusVencimento}</span>`;
  }

  // Badge de cancelamento - novo
  let canceladoBadge = "";
  if (isCanceled) {
    canceladoBadge = `<span class="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2">Cancelado</span>`;
  }

  // Criar container do visualizador
  const viewerContainer = document.createElement("div");
  viewerContainer.id = `boleto-viewer-${boletoId}`;
  viewerContainer.className =
    "fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50";

  // Adicionar HTML para o visualizador com design aprimorado
  viewerContainer.innerHTML = `
    <div class="bg-gradient-to-r from-sky-900 to-zinc-800  dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 opacity-0 scale-95" id="viewer-container-${boletoId}">
      <!-- Cabeçalho com gradiente ${isCanceled ? 'bg-gradient-to-r from-red-900 to-red-800' : 'bg-gradient-to-r from-sky-900 to-zinc-800'} -->
      <div class="${isCanceled ? 'bg-gradient-to-r from-red-900 to-red-800' : 'dark:bg-gradient-to-r dark:from-sky-900 dark:to-slate-900'} p-5 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="bg-white/20 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold">Boleto #${boletoId || parcelaId}${numeroNF ? ` - NF ${numeroNF}` : ''}</h3>
              <div class="flex items-center text-sm text-white/80 flex-wrap gap-y-1">
                <div class="flex items-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>Vencimento: ${formattedDueDate}</span>
                  ${vencimentoBadge}
                  ${canceladoBadge}
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <!-- Botão de download com tooltip caso cancelado -->
            <div class="relative group">
              <a href="${fileUrl}" download="boleto-${boletoId || parcelaId}.pdf" 
                class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${isCanceled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-sky-800 hover:bg-blue-50'} shadow-sm gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download
              </a>
              ${isCanceled ? `
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                Este boleto foi cancelado
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-gray-900 border-l-transparent border-r-transparent"></div>
              </div>
              ` : ''}
            </div>
            <button id="close-viewer-${boletoId}" 
              class="inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Área do conteúdo -->
      <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative" id="iframe-container-${boletoId}">
        <!-- Gradiente superior -->
        <div class="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-400 dark:from-gray-800 to-transparent z-10"></div>
        
        ${isAndroid ? `
        <!-- Para Android: usar object em vez de iframe para melhor compatibilidade -->
        <object data="${fileUrl}" type="application/pdf" class="w-full h-full">
          <!-- Mensagem para navegadores que não suportam PDF embutido -->
          <div class="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 p-6">
            <div class="text-center max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <p class="text-lg font-semibold mb-2">Este navegador não suporta PDFs embutidos</p>
              <p class="text-gray-600 dark:text-gray-300 mb-4">Clique no botão abaixo para baixar o documento e visualizá-lo.</p>
              <a href="${fileUrl}" download="boleto-${boletoId || parcelaId}.pdf" class="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Baixar PDF
              </a>
            </div>
          </div>
        </object>
        
        <!-- Fallback adicional para Android: adicionar link direto para abrir em nova guia -->
        <div class="absolute top-0 right-0 p-2 z-20">
          <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center justify-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Abrir em nova guia
          </a>
        </div>
        ` : ''}
        
        <!-- Barra de informações inferior -->
        <div class="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-between backdrop-blur-sm z-10">
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isCanceled ? 'h-4 w-4 mr-2 text-red-500' : 'h-4 w-4 mr-2 text-green-500'}">
              ${isCanceled ? '<path d="M10 12l4 4m0 -4l-4 4M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z"></path>' : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'}
            </svg>
            <span>${isCanceled ? 'Documento cancelado • Não válido para pagamento' : 'Documento oficial • Válido para pagamento'}</span>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            ID: ${boletoId || parcelaId}
          </div>
        </div>
        
        ${isCanceled ? `
        <!-- Banner de cancelamento para boletos cancelados -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="transform rotate-45 bg-red-600/80 text-white py-2 px-24 text-2xl font-bold">
            CANCELADO
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  // Adicionar ao corpo do documento
  document.body.appendChild(viewerContainer);
  
  // Animar a entrada após um pequeno delay
  setTimeout(() => {
    const viewerEl = document.getElementById(`viewer-container-${boletoId}`);
    if (viewerEl) {
      viewerEl.classList.remove('opacity-0', 'scale-95');
      viewerEl.classList.add('opacity-100', 'scale-100');
    }
  }, 50);

  // Criar e adicionar o iframe apenas se não for Android
  const iframeContainer = document.getElementById(
    `iframe-container-${boletoId}`
  );
  
  if (iframeContainer && !isAndroid) {
    const iframe = document.createElement("iframe");
    iframe.src = fileUrl;
    iframe.className = "w-full h-full";
    iframe.frameBorder = "0";
    iframe.setAttribute("allow", "fullscreen");

    // Monitorar carregamento
    iframe.onload = () => {
    };
    iframe.onerror = () => {
      // Adicionar mensagem de erro no container com design aprimorado
      iframeContainer.innerHTML += `
        <div class="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-black/95 z-10 p-6">
          <div class="text-center max-w-md">
            <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Não foi possível carregar o boleto
            </h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              Estamos com dificuldades para acessar este documento no momento. 
              Você pode fazer o download do arquivo e visualizá-lo localmente.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="${fileUrl}" target="_blank" 
                 class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Abrir em Nova Aba
              </a>
              <a href="${fileUrl}" download="boleto-${boletoId || parcelaId}.pdf" 
                 class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Baixar Boleto
              </a>
            </div>
          </div>
        </div>
      `;
    };

    iframeContainer.appendChild(iframe);
  }

  // Adicionar evento de fechamento com animação de saída
  const closeButton = document.getElementById(`close-viewer-${boletoId}`);
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      const viewerElement = document.getElementById(
        `viewer-container-${boletoId}`
      );
      if (viewerElement) {
        // Animar saída
        viewerElement.classList.remove('opacity-100', 'scale-100');
        viewerElement.classList.add('opacity-0', 'scale-95');
        
        // Remover após animação
        setTimeout(() => {
          const containerElement = document.getElementById(
            `boleto-viewer-${boletoId}`
          );
          if (containerElement) {
            containerElement.remove();
          }
          URL.revokeObjectURL(fileUrl);
        }, 300);
      } else {
        // Fallback se o elemento não for encontrado
        const containerElement = document.getElementById(
          `boleto-viewer-${boletoId}`
        );
        if (containerElement) {
          containerElement.remove();
        }
        URL.revokeObjectURL(fileUrl);
      }
    });
  }
};

// Fixed: Proper error type handling
const handleBoletoError = (error: unknown, navigate: NavigateFunction) => {
  // Mostrar erro específico com base na resposta
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 404) {
      toast.error("Boleto não encontrado", {
        description:
          "Este Boleto não está disponível.",
          style: {
            backgroundColor: "white",
            color: "red",
            boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.4)",
          },
      });
    } else if (status === 401 || status === 403) {
      toast.error("Acesso não autorizado", {
        description:
          "Sua sessão pode ter expirado. Tente fazer login novamente.",
      });
      navigate("/login");
    } else {
      toast.error(
        `Erro ao acessar o boleto (${status || "desconhecido"})`,
        {
          description:
            "Houve um problema ao tentar acessar o boleto. Tente novamente mais tarde.",
        }
      );
    }
  } else {
    toast.error("Erro ao acessar o boleto", {
      description:
        "Houve um problema de conexão. Verifique sua internet e tente novamente.",
    });
  }
};