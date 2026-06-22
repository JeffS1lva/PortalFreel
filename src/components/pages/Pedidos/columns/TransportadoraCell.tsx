// src/components/pedidos/columns/TransportadoraCell.tsx
import * as React from "react";

interface TransportadoraCellProps {
  nome: string | null;
}

export const TransportadoraCell = ({ nome }: TransportadoraCellProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!nome) return <span className="text-slate-400">-</span>;
  
  const isLong = nome.length > 23;
  const displayName = isLong ? `${nome.slice(0, 23)}...` : nome;
  
  return (
    <div className="relative">
      <button
        onClick={() => isLong && setIsExpanded(!isExpanded)}
        className={`text-left transition-all duration-200 ${
          isLong 
            ? "hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer underline decoration-dotted underline-offset-2" 
            : ""
        }`}
      >
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {isExpanded ? nome : displayName}
        </span>
        {isLong && (
          <span className="ml-1 text-xs text-slate-400">
            {isExpanded ? "▲" : "▼"}
          </span>
        )}
      </button>
    </div>
  );
};