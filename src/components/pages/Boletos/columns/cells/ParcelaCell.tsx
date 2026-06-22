import React from "react";

interface ParcelaCellProps {
  parcela: string;
  className?: string;
}

export const ParcelaCell: React.FC<ParcelaCellProps> = ({
  parcela,
  className = "",
}) => {
  return (
    <span className={`dark:text-gray-200 ${className}`}>{parcela}</span>
  );
};

export const createParcelaCell = (row: any) => (
  <ParcelaCell parcela={row.getValue("parcela")} />
);