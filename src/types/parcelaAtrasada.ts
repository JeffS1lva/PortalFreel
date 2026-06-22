export interface ParcelaAtrasada {
  transportadora: string;
  codigoVendedor: number;
  tipoDocumento: string;
  idDocumento: string;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  codigoParceiroNegocio: string;
  nomeParceiroNegocio: string;
  valorTotal: number;
  saldoDevido: number;
  diasAtraso: number;
  chaveNFe: string;
  filial: string;
  internalCode: number;
  idRegistro: number;
  pedidosCompra: string;
}

// src/types/pdf-viewer.ts
export interface ViewState {
  scale: number;
  rotation: number;
  viewMode: "scroll" | "grid";
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  focusMode: boolean;
  activeTab: "danfe" | "canhoto";
}

export interface PageData {
  id: number;
  canvas: HTMLCanvasElement;
}

export interface PDFViewerProps {
  danfeUrl: string;
  notaId: string;
  onClose: () => void;
  companyCode: string;
  chaveNFe: string;
  filial: string | number;
  transportadora?: string;
}



