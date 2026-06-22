// src/components/parcelas-atrasadas/headers/SortableHeader.tsx
import { Button } from "@/components/ui/button";
import { ArrowUpDown, LucideIcon } from "lucide-react";
import { Column } from "@tanstack/react-table";

interface SortableHeaderProps<T> {
  column: Column<T>;
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function SortableHeader<T>({ 
  column, 
  title, 
  icon: Icon,
  iconClassName 
}: SortableHeaderProps<T>) {
  return (
    <div className="flex items-center justify-center">
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
      >
        {Icon && <Icon className={`w-4 h-4 mr-2 ${iconClassName}`} />}
        {title}
        <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
      </Button>
    </div>
  );
}