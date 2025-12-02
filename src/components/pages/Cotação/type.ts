// src/components/pages/Cotação/type.ts
export interface DocumentLine {
  listCode: any;
  idUn?: number;
  LineNum: number;
  ItemCode: string;
  Quantity: number;
  Price: number;
  Currency: string;
  DiscountPercent: number;
  MeasureUnit: string;
  Usage: number;
  UoMEntry: number;
  UoMCode: string;
  ShipDate: string;
  U_SKILL_NP: string | null; // ← PERMITE NULL
  itemName?: string;
  preco?: number; // opcional, se usado em outros lugares
}

export interface ExtendedDocumentLine extends DocumentLine {
  itemCode?: string;
  itemName?: string;
  preco: number;
  unMedida?: string;
  unidade?: string;
  listCode: string;
  nomeLista?: string;
  moeda?: string;
  id?: string;
}

export interface QuotationSummary {
  priceListNum?: number;        // ← melhor que number | undefined
  shipToDefault?: string;
  BPL_IDAssignedToInvoice: number;
  TaxExtension: any;
  docEntry: number;
  cardCode: string;
  docDate: string;
  docStatus: string;
  docTotal: number;
  comments: string;
  docDueDate: string;
  taxDate: string;
  numAtCard: string;
  u_SKILL_FormaPagto: string;
  u_Portal: string;
  u_UPSlpCd2: number;
  u_UPSlpCd3: number;
  u_UPSlpCd4: number;
  openingRemarks: string;
  u_SKILL_ENDENT: string;
  u_POL_EnderEntrega: string;
  salesPersonCode: number;
  documentLines: DocumentLine[];
  cardName?: string;
  docNum?: string;
  BPAddresses?: BPAddress[];
  ShipToDefault?: string | BPAddress;
  DocCurrency?: string;
  PriceListNum?: number;
  
}

export interface DocumentSpecialLine {
  // Placeholder structure; adjust based on your API or requirements
  LineNum: number;
  LineType: string;
  Description: string;
}

export interface TaxExtension {
  MainUsage: number;
}

export interface QuickSuggestion {
  name: string;
  icon: string;
  color: string;
}

export interface Quotation {
  listCode: number;
  DocEntry: any;
  cardName: string;
  cardCode: string;
  CardCode: string;
  CardName?: string; // Made optional to allow undefined
  cnpj: string;
  CardType: string;
  SalesPersonCode: number;
  PriceListNum: number;
  Email: string;
  CreditLimit: number;
  CurrentAccountBalance: number;
  PaymentGroupCode: number;
  BilltoDefault: string;
  U_UPSlpCd2: number;
  U_UPSlpCd3: number;
  U_UPSlpCd4: number;
  ShipToDefault: string;
  BPAddresses: {
    addressName: string;
    street: string;
    block: string;
    zipCode: string;
    city: string;
    county: string;
    country: string;
    state: string;
    buildingFloorRoom: string;
    addressName2: string;
    addressName3: string | null;
    typeOfAddress: string;
    streetNo: string;
    bpCode: string;
    addressType: string;
  }[];
  DocDate: string;
  DocDueDate: string;
  TaxDate: string;
  NumAtCard: string;
  DocCurrency: string;
  DocRate: number;
  Confirmed: string;
  Cancelled: string;
  U_SKILL_FormaPagto: string;
  U_Portal: string;
  U_SKILL_ENDENT: string;
  Comments: string;
  OpeningRemarks: string;
  U_POL_EnderEntrega: string;
  BPL_IDAssignedToInvoice: number;
  DocType: string;
  DocObjectCode: string;
  DocumentLines: DocumentLine[];
  DocumentSpecialLines: DocumentSpecialLine[]; // Added for consistency with initialQuotation
  TaxExtension: TaxExtension; // Added for consistency with initialQuotation
  docNum?: number; // Added as optional to match initialQuotation
}

export const initialQuotation: Quotation = {
  DocObjectCode: "oQuotations",
  DocType: "dDocument_Items",
  BPL_IDAssignedToInvoice: 1,
  DocDate:new Date().toISOString().split("T")[0] , // VAZIO
  DocDueDate: "", // VAZIO
  TaxDate: "", // VAZIO (opcional)
  NumAtCard: "", // VAZIO (opcional)
  CardCode: "",
  CardName: undefined,
  cnpj: "",
  CardType: "",
  SalesPersonCode: 0,
  PriceListNum: 0,
  Email: "",
  CreditLimit: 0,
  CurrentAccountBalance: 0,
  PaymentGroupCode: 233,
  BilltoDefault: "",
  U_UPSlpCd2: 92,
  U_UPSlpCd3: 7,
  U_UPSlpCd4: 65,
  ShipToDefault: "",
  BPAddresses: [],
  DocCurrency: "R$",
  DocRate: 1.0,
  Confirmed: "tYES",
  Cancelled: "tNO",
  U_SKILL_FormaPagto: "15",
  U_Portal: "39",
  U_SKILL_ENDENT: "",
  Comments: "",
  OpeningRemarks: "",
  U_POL_EnderEntrega: "",
  DocumentLines: [],
  DocumentSpecialLines: [],
  TaxExtension: {
    MainUsage: 40,
  },
  docNum: undefined,
  DocEntry: undefined,
  cardName: "",
  cardCode: "",
  listCode:0,
};

export interface BPAddress {
  addressName: string;
  street: string;
  block: string;
  zipCode: string;
  city: string;
  county: string;
  country: string;
  state: string;
  buildingFloorRoom: string;
  addressName2: string;
  addressName3: string | null;
  typeOfAddress: string;
  streetNo: string;
  bpCode: string;
  addressType: string;
}

export interface BaseStepProps {
  quotation: Quotation;
  stepRef: (el: HTMLDivElement | null) => void;
}

export interface GeneralInformationProps extends BaseStepProps {
  updateQuotation: (field: keyof Quotation, value: any) => void;
}

export interface AddressesProps extends BaseStepProps {
  updateQuotation: (field: keyof Quotation, value: any) => void;
}

export interface ItemsProps extends BaseStepProps {
  updateDocumentLine: (
    index: number,
    field: keyof DocumentLine,
    value: any
  ) => void;
  addDocumentLine: () => void;
  removeDocumentLine: (index: number) => void;
}

export interface ReviewProps extends BaseStepProps {
  totalValue: number;
  totalDiscount: number;
  subtotal: number;
}
