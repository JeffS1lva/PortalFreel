export interface ParcelaAtrasada {
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

