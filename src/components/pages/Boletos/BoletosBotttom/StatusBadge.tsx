import { parseDate } from "@/utils/boletos/formatters";
import { ReactNode } from "react";

interface StatusBadgeProps {
  status: string;
  dataPagamento?: string | Date | null;
  dataVencimento: string;
}

interface StatusConfig {
  color: string;
  label: string;
  icon: ReactNode | null;
  priority: number; // Para ordenação
}

export const StatusBadge = ({ status, dataPagamento, dataVencimento }: StatusBadgeProps) => {
  const statusConfig = getStatusConfig(status, dataPagamento, dataVencimento);
  
  return (
    <div className="flex justify-start">
      <span
        className={`w-24 py-1 pl-3 rounded-md text-xs font-medium flex items-center justify-start ${statusConfig.color}`}
      >
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    </div>
  );
};

// Função para obter a prioridade de ordenação do status
export const getStatusPriority = (status: string, dataPagamento: string | Date | null | undefined, dataVencimento: string): number => {
  const config = getStatusConfig(status, dataPagamento, dataVencimento);
  return config.priority;
};

// Função para ordenar array de boletos por status
export const sortByStatusPriority = (boletos: any[]) => {
  return boletos.sort((a, b) => {
    const priorityA = getStatusPriority(a.status, a.dataPagamento, a.dataVencimento);
    const priorityB = getStatusPriority(b.status, b.dataPagamento, b.dataVencimento);
    return priorityA - priorityB;
  });
};

const getStatusConfig = (
  status: string, 
  dataPagamento: string | Date | null | undefined, 
  dataVencimento: string
): StatusConfig => {
  const statusLower = status?.toLowerCase() || "";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = parseDate(dataVencimento);
  
  // Verifica se está atrasado (vencimento passou e não foi pago)
  const isAtrasado = vencimento < hoje && !dataPagamento;
  
  let config: StatusConfig = {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    label: status || "N/A",
    icon: null,
    priority: 99 // Prioridade baixa para status desconhecidos
  };

  // PRIMEIRA VERIFICAÇÃO: Se foi pago, sempre mostrar como "Pago"
  if (dataPagamento) {
    config = {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      label: "Pago",
      priority: 3, // Prioridade 3 - Pagos aparecem por último
      icon: (
        <svg
          className="w-4 h-4 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          ></path>
        </svg>
      )
    };
    return config;
  }

  // SEGUNDA VERIFICAÇÃO: Se não foi pago e está atrasado, sempre mostrar como "Atrasado"
  if (isAtrasado) {
    config = {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Atrasado",
      priority: 1, // Prioridade 1 - Atrasados aparecem primeiro
      icon: (
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      )
    };
    return config;
  }

  // TERCEIRA VERIFICAÇÃO: Se não foi pago e não está atrasado, verificar status específico
  switch (statusLower) {
    case "baixado":
    case "pago":
    case "baixa em cartório":
      // Esse caso não deveria acontecer pois já verificamos dataPagamento acima
      // Mas mantemos por segurança
      config = {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        label: "Pago",
        priority: 3,
        icon: (
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        )
      };
      break;
    case "gerado":
    case "rejeitado":
    case "confirmado":
    case "remessa":
    case "pendente":
      config = {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
        label: "Pendente",
        priority: 2, // Prioridade 2 - Pendentes no meio
        icon: (
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        )
      };
      break;
    case "atrasado":
      // Este caso não deveria acontecer pois já verificamos isAtrasado acima
      // Mas mantemos por segurança
      config = {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        label: "Atrasado",
        priority: 1,
        icon: (
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        )
      };
      break;
    case "cancelado":
      config = {
        color: "bg-red-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        label: "Cancelado",
        priority: 4, // Prioridade 4 - Cancelados aparecem depois dos pagos
        icon: (
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        )
      };
      break;
  }
  
  return config;
};