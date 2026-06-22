export interface Parcela {
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

export type CellProps<T> = {
  value: T;
  row: Parcela;
};

export interface CodigoBoletoCellProps {
  codigoBoleto: string | number | null | undefined;
  parcelaId: number;
  dataVencimento: string;
  status: string;
}

export interface NomeCellProps {
  nome: string;
  maxMobileLength?: number;
  className?: string;
}

export interface CNPJCellProps {
  cnpj: string;
  className?: string;
}

export interface PedidosCompraCellProps {
  pedidos: string;
}

export interface NotaFiscalData {
  numNF: string | number | null;
  notaFiscal: string;
  companyCode: string;
  chaveNFe: string;
  status: string;
}

export interface NotaFiscalCellProps extends NotaFiscalData {
  onViewDanfe?: (data: NotaFiscalData) => void;
}