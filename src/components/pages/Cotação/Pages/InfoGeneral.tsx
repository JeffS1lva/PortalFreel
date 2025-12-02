"use client";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CustomCardCotacao,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BuildingIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import type { Quotation } from "@/components/pages/Cotação/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTriggerCotacaoInfo,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import {
  DatePicker,
  DatePickerLancamento,
} from "@/components/pages/Cotação/utils/DatePicker";

interface GeneralInformationProps {
  quotation: Quotation;
  updateQuotation: (field: keyof Quotation, value: any) => void;
  stepRef: (el: HTMLDivElement | null) => void;
  onChangeClient?: () => void;
}

function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  const parts = dateString.split("-");
  if (parts.length !== 3) return undefined;

  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1;
  const day = Number.parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? undefined : date;
}

function formatDateToString(date: Date | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function GeneralInformation({
  quotation,
  updateQuotation,
  stepRef,
  onChangeClient,
}: GeneralInformationProps) {
  useEffect(() => {
    const ids = ["docDate", "docDueDate"];
    ids.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.required = true;
    });
  }, []);

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      className="animate-bounce-in space-y-6 focus:outline-none"
      role="region"
      aria-label="Informações gerais da cotação"
    >
      <CustomCardCotacao className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-accent/5 to-transparent pb-4 pt-5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary rounded-xl shadow-md flex-shrink-0">
                <BuildingIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold leading-tight">
                  Informações Gerais
                </CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm leading-tight">
                  Cliente: {quotation.CardCode}{" "}
                  {quotation.CardName ? `- ${quotation.CardName}` : ""}
                </p>
              </div>
            </div>

            {onChangeClient && (
              <Button
                variant="outline"
                onClick={onChangeClient}
                className="w-full sm:w-auto hover:bg-destructive/10 hover:text-destructive transition-all text-sm h-10"
              >
                Alterar Cliente
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data de Lançamento */}
            <div className="space-y-2">
              <Label
                htmlFor="docDate"
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                Data de Lançamento
              </Label>
              <DatePickerLancamento
                id="docDate"
                date={parseDate(quotation.DocDate)}
                onDateChange={(date) =>
                  updateQuotation("DocDate", formatDateToString(date))
                }
                placeholder="Selecione a data"
                className="h-12 text-sm border-2 focus:border-primary"
                required
              />
            </div>

            {/* Data de Entrega */}
            <div className="space-y-2">
              <Label
                htmlFor="docDueDate"
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                Data de Entrega
                <span
                  className="text-destructive text-xs"
                  aria-label="obrigatório"
                >
                  *
                </span>
              </Label>
              <DatePicker
                id="docDueDate"
                date={parseDate(quotation.DocDueDate)}
                onDateChange={(date) =>
                  updateQuotation("DocDueDate", formatDateToString(date))
                }
                placeholder="Selecione a data"
                className="h-12 text-sm border-2 focus:border-secondary"
                required
              />
            </div>

            {/* Data de Picking */}
            <div className="space-y-2">
              <Label
                htmlFor="taxDate"
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                Data de Picking
                <span
                  className="text-destructive text-xs"
                  aria-label="obrigatório"
                >
                  *
                </span>
              </Label>
              <DatePicker
                id="taxDate"
                date={parseDate(quotation.TaxDate)}
                onDateChange={(date) =>
                  updateQuotation("TaxDate", formatDateToString(date))
                }
                placeholder="Selecione a data"
                className="h-12 text-sm border-2 focus:border-accent"
                required
              />
            </div>

            {/* Número de Referência */}
            <div className="space-y-2">
              <Label
                htmlFor="numAtCard"
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <FileTextIcon className="h-3.5 w-3.5 text-primary" />
                Número de Referência
              </Label>
              <Input
                id="numAtCard"
                value={quotation.NumAtCard}
                placeholder="Ex: COT-2025-001"
                onChange={(e) => updateQuotation("NumAtCard", e.target.value)}
                className="h-12 text-sm border-2 focus:border-accent placeholder:text-muted-foreground/70"
              />
            </div>

            {/* Filial */}
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="bplIdAssignedToInvoice"
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <FileTextIcon className="h-3.5 w-3.5 text-primary" />
                Filial
              </Label>
              <Select
                value={(quotation.BPL_IDAssignedToInvoice || "").toString()}
                onValueChange={(value) => {
                  const bplId = Number.parseInt(value) || 0;
                  updateQuotation("BPL_IDAssignedToInvoice", bplId);

                  const mainUsage =
                    bplId === 1
                      ? 40
                      : bplId === 2
                      ? 90
                      : quotation.TaxExtension?.MainUsage;
                  updateQuotation("TaxExtension", { MainUsage: mainUsage });
                }}
              >
                <SelectTriggerCotacaoInfo
                  id="bplIdAssignedToInvoice"
                  className="h-12 text-sm border-2 focus:border-accent"
                >
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTriggerCotacaoInfo>

                {/* CORRETO: SelectItem DENTRO do SelectContent */}
                <SelectContent>
                  <SelectItem value="1">Polar Matriz</SelectItem>
                  <SelectItem value="2">Polar Filial MG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </CustomCardCotacao>
    </div>
  );
}
