
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  // 4xx - Erros do Cliente
  400: "Requisição inválida. Verifique os dados informados e tente novamente.",
  401: "Sessão expirada. Faça login novamente para continuar.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Cotação não encontrada. Pode ter sido excluída ou o número está incorreto.",
  408: "Tempo esgotado. A operação demorou muito. Tente novamente.",
  409: "Conflito: esta cotação foi alterada por outro usuário. Recarregue a página.",
  410: "Esta cotação não está mais disponível.",
  422: "Dados inválidos. Verifique códigos de itens, quantidades, preços ou campos obrigatórios.",

  // 5xx - Erros do Servidor / SAP
  500: "Erro interno no servidor SAP. Tente novamente em alguns minutos.",
  501: "Funcionalidade não implementada no momento.",
  502: "Serviço SAP indisponível no momento. Estamos aguardando resposta do sistema.",
  503: "SAP em manutenção ou sobrecarregado. Tente novamente em alguns minutos.",
  504: "Tempo esgotado ao comunicar com o SAP. Verifique sua conexão.",
  505: "Versão HTTP não suportada pelo servidor.",
};

/**
 * Extrai a mensagem de erro do Service Layer do SAP B1
 * O SAP retorna de várias formas possíveis... essa função cobre todas.
 */
const extractSapErrorMessage = (error: any): string | null => {
  if (!error?.response?.data) return null;

  const data = error.response.data;

  // Padrões mais comuns do Service Layer
  return (
    data?.error?.message?.value ||
    data?.error?.message ||
    data?.error?.code ||
    data?.message ||
    data?.Message ||
    data?.error ||
    JSON.stringify(data)
  );
};

/**
 * Converte qualquer erro (Axios, fetch, etc.) em uma mensagem amigável para o usuário
 */
export const getFriendlyErrorMessage = (error: any): string => {
  const status = error?.response?.status || error?.status;

  // 1. Erros HTTP conhecidos
  if (status && HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  const sapMessage = extractSapErrorMessage(error);
  if (!sapMessage) {
    return "Ocorreu um erro inesperado. Tente novamente ou contate o suporte.";
  }

  const msg = sapMessage.toString().toLowerCase().trim();

  // 2. Mensagens comuns do SAP B1 (Service Layer)
  if (msg.includes("not found") || msg.includes("does not exist") || msg.includes("invalid item")) {
    return "Um ou mais códigos de itens não existem ou estão inválidos no SAP.";
  }

  if (msg.includes("quantity") && (msg.includes("greater") || msg.includes("positive"))) {
    return "A quantidade deve ser maior que zero em todos os itens.";
  }

  if (msg.includes("price") || msg.includes("unit price") || msg.includes("rate")) {
    return "O preço unitário está inválido, zerado ou ausente em um dos itens.";
  }

  if (msg.includes("business partner") || msg.includes("cardcode") || msg.includes("card code")) {
    return "Cliente inválido ou não encontrado no SAP.";
  }

  if (
    msg.includes("closed") ||
    msg.includes("cancelled") ||
    msg.includes("already") ||
    msg.includes("cannot be updated")
  ) {
    return "Esta cotação já foi fechada, cancelada ou convertida em pedido. Não é mais possível editá-la.";
  }

  if (msg.includes("line") && msg.includes("already exists")) {
    return "Conflito nas linhas do documento. Recarregue a cotação e tente novamente.";
  }

  if (msg.includes("mainusage") || msg.includes("usage") || msg.includes("tax")) {
    return "Erro de configuração fiscal. O tipo de operação não é compatível com a filial selecionada.";
  }

  if (msg.includes("bplid") || msg.includes("branch") || msg.includes("business place")) {
    return "Filial inválida ou não permitida para este cliente/documento.";
  }

  if (msg.includes("currency") || msg.includes("doccurrency")) {
    return "Moeda inválida ou incompatível com a lista de preços do cliente.";
  }

  if (msg.includes("duplicate") || msg.includes("already exists")) {
    return "Já existe um documento com essas informações. Verifique os dados.";
  }

  if (msg.includes("login") || msg.includes("session") || msg.includes("authentication")) {
    return "Sessão expirada ou inválida. Faça login novamente.";
  }

  // 3. Fallback final com mensagem genérica mas profissional
  return "Ocorreu um erro ao salvar no SAP. Tente novamente ou contate o administrador do sistema.";
};