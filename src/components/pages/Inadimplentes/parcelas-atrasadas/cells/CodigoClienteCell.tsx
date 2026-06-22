interface CodigoClienteCellProps {
  codigo: string;
}

export function CodigoClienteCell({ codigo }: CodigoClienteCellProps) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="font-mono text-md bg-blue-50 dark:bg-blue-900/20 dark:text-blue-200 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700">
        {codigo}
      </span>
    </div>
  );
}