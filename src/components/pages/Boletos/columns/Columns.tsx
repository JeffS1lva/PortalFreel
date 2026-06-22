import { ColumnDef } from "@tanstack/react-table";
import { numericFilter, dateRangeFilter } from "@/utils/boletos/filters";
import { Parcela } from "./types";

// Import factories
import { createCodigoBoletoCell } from "./cells/CodigoBoletoCell";
import { createNomeCell } from "./cells/NomeCell";
import { createCNPJCell } from "./cells/CNPJCell";
import { createPedidosCompraCell } from "./cells/PedidosCompraCell";
import { createNotaFiscalCell } from "./cells/NotaFiscalCell";
import { createParcelaCell } from "./cells/ParcelaCell";
import { createValorCell } from "./cells/ValorCell";
import { createVencimentoCell } from "./cells/VencimentoCell";
import { createStatusCell } from "./cells/StatusCell";
import { createDataPagamentoCell } from "./cells/DataPagamentoCell";

export const boletosColumns: ColumnDef<Parcela, any>[] = [
  {
    accessorKey: "codigoBoleto",
    header: "Código",
    filterFn: numericFilter,
    cell: ({ row }) => createCodigoBoletoCell(row),
  },
  {
    accessorKey: "nomePN",
    header: "Nome",
    cell: ({ row }) => createNomeCell(row),
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
    cell: ({ row }) => createCNPJCell(row),
  },
  {
    accessorKey: "pedidosCompra",
    header: "Pedidos Compra",
    cell: ({ row }) => createPedidosCompraCell(row),
  },
  {
    accessorKey: "numNF",
    header: "Nota Fiscal",
    filterFn: "includesString",
    cell: ({ row }) => createNotaFiscalCell(row),
  },
  {
    accessorKey: "parcela",
    header: "Parcela",
    cell: ({ row }) => createParcelaCell(row),
  },
  {
    accessorKey: "valorParcela",
    header: "Valor",
    cell: ({ row }) => createValorCell(row),
  },
  {
    accessorKey: "dataVencimento",
    header: "Vencimento",
    cell: ({ row }) => createVencimentoCell(row),
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => createStatusCell(row),
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const status = String(row.getValue(columnId)).toLowerCase();
      return filterValue.toLowerCase() === status;
    },
  },
  {
    accessorKey: "dataPagamento",
    header: "Data Pagamento",
    cell: ({ row }) => createDataPagamentoCell(row),
    filterFn: dateRangeFilter,
  },
];
