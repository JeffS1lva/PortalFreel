"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CustomCardCotacao,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPinIcon, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTriggerCotacao,
  SelectValue,
} from "@/components/ui/select";
import type { Quotation, BPAddress } from "@/components/pages/Cotação/type";
import { formatAddressWithoutName } from "@/components/pages/Cotação/utils/adressMapping";

interface AddressesProps {
  quotation: Quotation;
  updateQuotation: (field: keyof Quotation, value: any) => void;
  stepRef: (el: HTMLDivElement | null) => void;
}

export function Addresses({
  quotation,
  updateQuotation,
  stepRef,
}: AddressesProps) {
  const [selectedAddressName, setSelectedAddressName] = useState<string>("");

  const allBPAddresses = useMemo(
    () => quotation.BPAddresses ?? [],
    [quotation.BPAddresses]
  );

  const defaultAddressName = useMemo(() => {
    return typeof quotation.ShipToDefault === "string"
      ? quotation.ShipToDefault
      : (quotation.ShipToDefault as BPAddress)?.addressName ?? "";
  }, [quotation.ShipToDefault]);

  useEffect(() => {
    if (
      defaultAddressName &&
      !selectedAddressName &&
      allBPAddresses.length > 0
    ) {
      setSelectedAddressName(defaultAddressName);
      const defaultAddr = allBPAddresses.find(
        (a) => a.addressName === defaultAddressName
      );
      if (defaultAddr) {
        updateQuotation(
          "U_POL_EnderEntrega",
          formatAddressWithoutName(defaultAddr)
        );
      }
    }
  }, [
    defaultAddressName,
    selectedAddressName,
    allBPAddresses,
    updateQuotation,
  ]);

  const handleAddressSelect = useCallback(
    (addressName: string) => {
      setSelectedAddressName(addressName);
      const selected = allBPAddresses.find(
        (a) => a.addressName === addressName
      );
      if (selected) {
        updateQuotation(
          "U_POL_EnderEntrega",
          formatAddressWithoutName(selected)
        );
      }
    },
    [allBPAddresses, updateQuotation]
  );

  const handleCommentsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateQuotation("Comments", e.target.value);
    },
    [updateQuotation]
  );

  const handleOpeningRemarksChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateQuotation("OpeningRemarks", e.target.value);
    },
    [updateQuotation]
  );

  return (
    <div ref={stepRef} className="animate-bounce-in space-y-6">
      <CustomCardCotacao className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-secondary/5 to-transparent pb-5 pt-5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary rounded-xl shadow-md flex-shrink-0">
                <MapPinIcon className="h-5 w-5 text-secondary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold leading-tight">
                  Endereço de Entrega
                </CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm leading-tight">
                  Selecione um endereço do BP
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-4 sm:px-6 space-y-6">
          {/* SELECT DE ENDEREÇO */}
          <div className="space-y-2">
            <Label
              htmlFor="bpAddressSelect"
              className="text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              <MapPinIcon className="h-3.5 w-3.5 text-primary" />
              Endereço de Entrega
            </Label>

            {allBPAddresses.length > 0 ? (
              <Select
                value={selectedAddressName}
                onValueChange={handleAddressSelect}
              >
                <SelectTriggerCotacao
                  id="bpAddressSelect"
                  className="h-12 text-sm border-2 focus:border-secondary placeholder:text-muted-foreground/70"
                >
                  <SelectValue placeholder="Escolha um endereço..." />
                </SelectTriggerCotacao>
                <SelectContent>
                  {allBPAddresses.map((addr) => {
                    const isDefault = addr.addressName === defaultAddressName;
                    return (
                      <SelectItem
                        key={addr.addressName}
                        value={addr.addressName}
                        className={isDefault ? "font-semibold" : ""}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs sm:text-sm">
                          <span className="font-medium">
                            {addr.addressName}
                            {isDefault && " (padrão)"}
                          </span>
                          <span className="text-muted-foreground">
                            {addr.street} {addr.streetNo}, {addr.city} - {addr.state}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <div className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum endereço disponível
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  BPAddresses não foi carregado.
                </p>
              </div>
            )}
          </div>

          {/* OBSERVAÇÕES INTERNAS */}
          <div className="space-y-2">
            <Label
              htmlFor="comments"
              className="text-xs sm:text-sm font-semibold"
            >
              Observações Internas
            </Label>
            <Textarea
              id="comments"
              value={quotation.Comments || ""}
              placeholder="Notas para equipe interna..."
              onChange={handleCommentsChange}
              rows={3}
              className="resize-none border-2 text-sm min-h-20 focus-visible:ring-1"
            />
          </div>

          {/* OBSERVAÇÕES DO CLIENTE */}
          <div className="space-y-2">
            <Label
              htmlFor="openingRemarks"
              className="text-xs sm:text-sm font-semibold"
            >
              Observações do Cliente
            </Label>
            <Textarea
              id="openingRemarks"
              value={quotation.OpeningRemarks || ""}
              placeholder="Mensagem que aparecerá na cotação..."
              onChange={handleOpeningRemarksChange}
              rows={3}
              className="resize-none border-2 text-sm min-h-20 focus-visible:ring-1"
            />
          </div>
        </CardContent>
      </CustomCardCotacao>
    </div>
  );
}