// src/utils/dateUtils.ts
export const formatDateBR = (dateValue: unknown): string => {
  if (!dateValue) return "";
  const dateString = String(dateValue);
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const dateRangeFilter = (
  rowValue: unknown,
  filterValue: { start?: string; end?: string }
): boolean => {
  if (!filterValue?.start || !filterValue?.end) return true;
  if (!rowValue) return false;

  const dateString = String(rowValue);
  const [cellYear, cellMonth, cellDay] = dateString.split("-").map(Number);
  const [startYear, startMonth, startDay] = filterValue.start.split("-").map(Number);
  const [endYear, endMonth, endDay] = filterValue.end.split("-").map(Number);

  if (cellYear < startYear || cellYear > endYear) return false;
  if (cellYear === startYear && cellMonth < startMonth) return false;
  if (cellYear === endYear && cellMonth > endMonth) return false;
  if (cellYear === startYear && cellMonth === startMonth && cellDay < startDay) return false;
  if (cellYear === endYear && cellMonth === endMonth && cellDay > endDay) return false;

  return true;
};