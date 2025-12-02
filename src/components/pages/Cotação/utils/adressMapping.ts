// utils/addressMapping.ts
import type { BPAddress, Quotation } from "@/components/pages/Cotação/type"

const formatAddress = (addr: BPAddress): string => {
  const parts = [
    addr.street ? `${addr.street.trim()} ${addr.typeOfAddress || ""}`.trim() : "",
    addr.streetNo ? `, ${addr.streetNo.trim()}` : "",
    addr.block ? `, ${addr.block.trim()}` : "",
    addr.buildingFloorRoom ? `, ${addr.buildingFloorRoom.trim()}` : "",
    addr.city ? `${addr.city.trim()}` : "",
    addr.state ? ` - ${addr.state.trim()}` : "",
    addr.zipCode ? `, ${addr.zipCode.trim()}` : "",
  ]

  return parts
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .replace(/^,\s*/, "")
}

const formatAddressWithName = (addr: BPAddress): string => {
  const address = formatAddress(addr)
  return `${addr.addressName} - ${address}`
}

export const formatAddressWithoutName = (addr: BPAddress): string => {
  return formatAddress(addr)
}

/* ---------- 1. U_SKILL_ENDENT (com nome) ---------- */
export const getDefaultAddressString = (quotation: Quotation): string => {
  if (!quotation.ShipToDefault) return ""

  const defaultAddr = typeof quotation.ShipToDefault === "string"
    ? quotation.BPAddresses?.find(a => a.addressName === quotation.ShipToDefault)
    : quotation.ShipToDefault as BPAddress

  return defaultAddr ? formatAddressWithName(defaultAddr) : ""
}

/* ---------- 2. U_POL_EnderEntrega (sem nome) ---------- */
export const getDeliveryAddressString = (
  quotation: Quotation,
  selectedAlternativeName?: string
): string => {
  const bpAddresses = quotation.BPAddresses ?? []
  if (!bpAddresses.length) return ""

  const defaultAddr = typeof quotation.ShipToDefault === "string"
    ? bpAddresses.find(a => a.addressName === quotation.ShipToDefault)
    : quotation.ShipToDefault as BPAddress

  // Usuário escolheu um endereço alternativo
  if (selectedAlternativeName) {
    const selected = bpAddresses.find(a => a.addressName === selectedAlternativeName)
    return selected ? formatAddressWithoutName(selected) : ""
  }

  // Nenhum alternativo escolhido → usa o padrão (sem nome)
  return defaultAddr ? formatAddressWithoutName(defaultAddr) : ""
}

/* ---------- 3. Comments ---------- */
export const updateInternalComments = (
  quotation: Quotation,
  value: string
): Partial<Quotation> => ({
  ...quotation,
  Comments: value
})

/* ---------- 4. OpeningRemarks ---------- */
export const updateClientRemarks = (
  quotation: Quotation,
  value: string
): Partial<Quotation> => ({
  ...quotation,
  OpeningRemarks: value
})