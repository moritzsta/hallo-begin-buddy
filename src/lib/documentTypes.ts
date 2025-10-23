/**
 * Document Type Definitions for Smart Upload Context
 * 
 * These types help the AI make better decisions about folder structure,
 * naming conventions, and metadata extraction.
 */

export interface DocumentTypeConfig {
  label_de: string;
  label_en: string;
  context: string; // AI context to improve folder suggestions
}

export const DOCUMENT_TYPES: Record<string, DocumentTypeConfig> = {
  insurance: {
    label_de: 'Versicherung',
    label_en: 'Insurance',
    context: 'This is an insurance-related document. Suggest folder structures like "Versicherungen/[Insurance Type]/[Year]" or "Insurance/[Type]/[Year]". Look for policy numbers, coverage dates, and insurance company names.',
  },
  contract: {
    label_de: 'Vertrag',
    label_en: 'Contract',
    context: 'This is a contract document. Suggest folder structures like "Verträge/[Contract Type]" or "Contracts/[Type]". Look for contract dates, parties involved, and contract types (rental, employment, service, etc.).',
  },
  invoice: {
    label_de: 'Rechnung',
    label_en: 'Invoice',
    context: 'This is an invoice or bill. Suggest folder structures like "Rechnungen/[Year]/[Vendor]" or "Invoices/[Year]/[Vendor]". Extract invoice numbers, dates, amounts, and vendor names.',
  },
  tax: {
    label_de: 'Steuer',
    label_en: 'Tax',
    context: 'This is a tax-related document. Suggest folder structures like "Steuern/[Year]/[Tax Type]" or "Taxes/[Year]/[Type]". Look for tax years, tax IDs, and document types (returns, assessments, receipts).',
  },
  id_document: {
    label_de: 'Ausweis / Identitätsdokument',
    label_en: 'ID Document',
    context: 'This is an identification document (passport, ID card, driver\'s license, etc.). Suggest folder structures like "Dokumente/Ausweise" or "Documents/IDs". Handle with high sensitivity.',
  },
  bank_statement: {
    label_de: 'Kontoauszug',
    label_en: 'Bank Statement',
    context: 'This is a bank statement. Suggest folder structures like "Finanzen/Kontoauszüge/[Year]/[Month]" or "Finance/Bank Statements/[Year]/[Month]". Look for account numbers, dates, and bank names.',
  },
  quote: {
    label_de: 'Angebot / Kostenvoranschlag',
    label_en: 'Quote / Estimate',
    context: 'This is a quote or cost estimate. Suggest folder structures like "Angebote/[Year]/[Vendor]" or "Quotes/[Year]/[Vendor]". Extract quote numbers, dates, amounts, and vendor information.',
  },
  photo: {
    label_de: 'Foto',
    label_en: 'Photo',
    context: 'This is a photograph or image. Suggest folder structures like "Fotos/[Year]/[Event or Subject]" or "Photos/[Year]/[Event or Subject]". Try to identify the subject, event, or context.',
  },
  medical: {
    label_de: 'Medizinisches Dokument',
    label_en: 'Medical Document',
    context: 'This is a medical document (prescription, test result, medical report, etc.). Suggest folder structures like "Gesundheit/[Type]/[Year]" or "Health/[Type]/[Year]". Look for dates, doctor names, and medical procedures.',
  },
  receipt: {
    label_de: 'Beleg / Quittung',
    label_en: 'Receipt',
    context: 'This is a receipt or proof of purchase. Suggest folder structures like "Belege/[Year]/[Category]" or "Receipts/[Year]/[Category]". Extract dates, amounts, and vendor names.',
  },
  certificate: {
    label_de: 'Zertifikat / Bescheinigung',
    label_en: 'Certificate',
    context: 'This is a certificate or credential document. Suggest folder structures like "Zertifikate/[Type]" or "Certificates/[Type]". Look for issue dates, issuing organizations, and validity periods.',
  },
  correspondence: {
    label_de: 'Korrespondenz / Brief',
    label_en: 'Correspondence / Letter',
    context: 'This is correspondence or a letter. Suggest folder structures like "Korrespondenz/[Year]/[Sender]" or "Correspondence/[Year]/[Sender]". Identify sender, recipient, date, and subject.',
  },
  graphic: {
    label_de: 'Grafik / Illustration',
    label_en: 'Graphic / Illustration',
    context: 'This is a graphic, illustration, or design file. Suggest folder structures like "Grafiken/[Project or Category]" or "Graphics/[Project or Category]". Try to identify the purpose or project.',
  },
  other: {
    label_de: 'Sonstiges',
    label_en: 'Other',
    context: 'This document does not fit into standard categories. Analyze the content and suggest an appropriate folder structure based on the document\'s nature and purpose.',
  },
};

/**
 * Get localized label for document type
 */
export const getDocumentTypeLabel = (type: string, locale: string): string => {
  const config = DOCUMENT_TYPES[type];
  if (!config) return type;
  return locale === 'de' ? config.label_de : config.label_en;
};

/**
 * Get AI context for document type
 */
export const getDocumentTypeContext = (type: string): string => {
  const config = DOCUMENT_TYPES[type];
  return config?.context || '';
};

/**
 * Get all document type keys
 */
export const getAllDocumentTypes = (): string[] => {
  return Object.keys(DOCUMENT_TYPES);
};
