// src/hooks/useParcelasAtrasadasColumns.tsx
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ParcelaAtrasada } from "@/types/parcelaAtrasada";
import { User, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { SortableHeader } from "@/components/pages/Inadimplentes/parcelas-atrasadas/headers/SortableHeader";
import { ClienteCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/ClienteCell";
import { CodigoClienteCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/CodigoClienteCell";
import { PedidosCompraCell as PedidosCompraCellComponent } from "@/components/pages/Pedidos/PedidosCompra/PedidosModal";
import { DocumentoCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/DocumentoCell";
import { DataCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/DataCell";
import { ValorAbertoCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/ValorAbertoCell";
import { DiasVencidosCell } from "@/components/pages/Inadimplentes/parcelas-atrasadas/cells/DiasVencidosCell";

export const useParcelasAtrasadasColumns = () => {
  const columns = useMemo<ColumnDef<ParcelaAtrasada>[]>(
    () => [
      {
        accessorKey: "nomeParceiroNegocio",
        header: ({ column }) => (
          <SortableHeader 
            column={column} 
            title="Cliente" 
            icon={User} 
            iconClassName="text-blue-600 dark:text-blue-400" 
          />
        ),
        cell: ({ row }) => <ClienteCell nome={row.getValue("nomeParceiroNegocio")} />,
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "codigoParceiroNegocio",
        header: ({ column }) => <SortableHeader column={column} title="Código Cliente" />,
        cell: ({ row }) => <CodigoClienteCell codigo={row.getValue("codigoParceiroNegocio")} />,
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "pedidosCompra",
        header: ({ column }) => <SortableHeader column={column} title="Pedidos Compra" />,
        cell: ({ row }) => (
          <div className="flex items-center justify-center py-2">
            <PedidosCompraCellComponent pedidos={row.getValue("pedidosCompra")} />
          </div>
        ),
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      {
        accessorKey: "numeroDocumento",
        header: ({ column }) => (
          <SortableHeader 
            column={column} 
            title="Documento" 
            icon={FileText} 
            iconClassName="text-green-600 dark:text-green-400" 
          />
        ),
        cell: ({ row }) => (
          <DocumentoCell
            numeroDocumento={row.getValue("numeroDocumento")}
            tipoDocumento={row.original.tipoDocumento}
            companyCode={row.original.filial || ""}
            chaveNFe={row.original.chaveNFe || ""}
            filial={row.original.filial || ""}
            transportadora={row.original.transportadora}
          />
        ),
        enableSorting: true,
        sortingFn: "alphanumeric",
        size: 180,
      },
      // ... resto das colunas (data, valor, dias) permanece igual
      {
        accessorKey: "dataEmissao",
        header: ({ column }) => <SortableHeader column={column} title="Data Lançamento" />,
        cell: ({ row }) => <DataCell dateValue={row.getValue("dataEmissao")} type="emissao" />,
        enableSorting: true,
        sortingFn: "datetime",
        size: 160,
      },
      {
        accessorKey: "dataVencimento",
        header: ({ column }) => <SortableHeader column={column} title="Vencimento" />,
        cell: ({ row }) => <DataCell dateValue={row.getValue("dataVencimento")} type="vencimento" />,
        enableSorting: true,
        sortingFn: "datetime",
        size: 160,
      },
      {
        accessorKey: "saldoDevido",
        header: ({ column }) => (
          <SortableHeader 
            column={column} 
            title="Valor Aberto" 
            icon={DollarSign} 
            iconClassName="text-red-600 dark:text-red-400" 
          />
        ),
        cell: ({ row }) => <ValorAbertoCell valor={row.getValue("saldoDevido")} />,
        enableSorting: true,
        sortingFn: "basic",
        size: 150,
      },
      {
        accessorKey: "diasAtraso",
        header: ({ column }) => (
          <SortableHeader 
            column={column} 
            title="Dias Vencidos" 
            icon={AlertTriangle} 
            iconClassName="text-amber-600 dark:text-amber-400" 
          />
        ),
        cell: ({ row }) => <DiasVencidosCell dias={row.getValue("diasAtraso")} />,
        enableSorting: true,
        sortingFn: "basic",
        size: 160,
      },
    ],
    []
  );

  return columns;
};