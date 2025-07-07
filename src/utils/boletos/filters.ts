import { parseDate } from "./formatters";

export const numericFilter = (row: { getValue: (arg0: any) => any; }, columnId: any, filterValue: string) => {
  const value = row.getValue(columnId);
  if (typeof value === "number") {
    return value.toString().includes(filterValue);
  }
  return false;
};

export interface DateRangeFilterValue {
  start: string;
  end: string;
}

export const dateRangeFilter = (
  row: { getValue: (arg0: any) => any; }, 
  columnId: any, 
  filterValue: DateRangeFilterValue
) => {
  if (!filterValue?.start || !filterValue?.end) return true;

  const cellValue = row.getValue(columnId);
  if (!cellValue) return false;

  const cellDate = parseDate(cellValue);
  const startDate = parseDate(filterValue.start);
  const endDate = parseDate(filterValue.end);

  // Para considerar o dia inteiro do "end"
  endDate.setUTCHours(23, 59, 59, 999);

  return cellDate >= startDate && cellDate <= endDate;
};