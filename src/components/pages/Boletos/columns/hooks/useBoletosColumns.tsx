import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { boletosColumns } from "@/components/pages/Boletos/columns/Columns";
import { Parcela } from "@/components/pages/Boletos/columns/types";

export const useBoletosColumns = (): ColumnDef<Parcela, any>[] => {
  return useMemo(() => boletosColumns, []);
};