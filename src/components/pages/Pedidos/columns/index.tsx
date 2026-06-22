// src/components/pedidos/columns/index.tsx
import { ColumnDef, type FilterFn } from "@tanstack/react-table";
import { PedidosCompraCell } from "../PedidosCompra/PedidosModal";
import { NumeroPedidoCell } from "./NumeroPedidoCell";
import { DataCell, dateRangeFilter } from "./DataCell";
import { StatusCell } from "./StatusCell";
import { NotaFiscalCell } from "@/components/pages/Pedidos/columns/NotaFiscalCell";
import { ClienteCell } from "./ClienteCell";
import { TransportadoraCell } from "./TransportadoraCell";
import { MapPin } from "lucide-react";

export interface Pedido {
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
  statusNotaFiscal?: string;
  pedidosCompra: string;
  valorTotal: number;
}

export const numericFilter: FilterFn<Pedido> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (typeof value === "number") {
    return value.toString().includes(filterValue);
  }
  return false;
};

export const usePedidosColumns = (): ColumnDef<Pedido>[] => {
  return [
    {
      accessorKey: "numeroPedido",
      header: "Nº Pedido",
      filterFn: numericFilter,
      cell: ({ row }) => (
        <NumeroPedidoCell numeroPedido={row.getValue("numeroPedido")} />
      ),
    },
    {
      accessorKey: "pedidosCompra",
      header: "Pedidos Compra",
      cell: ({ row }) => (
        <PedidosCompraCell pedidos={row.getValue("pedidosCompra")} />
      ),
    },
    {
      accessorKey: "dataLancamentoPedido",
      header: "Data Lanç.",
      cell: ({ row }) => (
        <DataCell dateValue={row.getValue("dataLancamentoPedido")} />
      ),
      filterFn: dateRangeFilter, // ← just reference it (no arrow wrapper)
    },
    {
      accessorKey: "dataParaEntrega",
      header: "Data Entre.",
      cell: ({ row }) => (
        <DataCell dateValue={row.getValue("dataParaEntrega")} />
      ),
      filterFn: dateRangeFilter,
    },
    {
      accessorKey: "statusDoPedido",
      header: "Status Pedido",
      cell: ({ row }) => <StatusCell status={row.getValue("statusDoPedido")} />,
    },
    {
      accessorKey: "statusPicking",
      header: "Status Picking",
      cell: ({ row }) => <StatusCell status={row.getValue("statusPicking")} />,
    },
    {
      accessorKey: "notaFiscal",
      header: "Nota Fiscal",
      filterFn: numericFilter,
      cell: ({ row }) => {
        const pedido = row.original; // Pegue o objeto completo

        return (
          <NotaFiscalCell
            notaFiscal={row.getValue("notaFiscal")}
            companyCode={pedido.filial || ""} // Código da empresa (usando filial como companyCode)
            chaveNFe={pedido.chaveNFe || ""}
            statusNotaFiscal={pedido.statusNotaFiscal}
            filial={pedido.filial || ""} // ✅ ADICIONAR ESTA LINHA!
            transportadora={pedido.nomeTransportadora || ""} // Opcional: passar transportadora também
          />
        );
      },
    },
    {
      accessorKey: "nomeCliente",
      header: "Cliente",
      cell: ({ row }) => <ClienteCell nome={row.getValue("nomeCliente")} />,
    },
    {
  accessorKey: "estado",
  header: "UF",
  cell: ({ row }) => {
    const uf = (row.getValue("estado") as string)?.toUpperCase() || "—";
    
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span className="font-mono text-lg">{uf}</span>
      </div>
    );
  },
},
    {
      accessorKey: "nomeTransportadora",
      header: "Nome Transp.",
      cell: ({ row }) => (
        <TransportadoraCell nome={row.getValue("nomeTransportadora")} />
      ),
    },
  ];
};
