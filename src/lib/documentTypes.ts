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
    context: 'This is an insurance-related document. TITLE FORMAT: Use "[Insurance Type] - [Company] - [Policy Number] - [Year]" format (e.g., "Kfz-Versicherung - Allianz - 123456789 - 2024"). KEYWORDS: Extract insurance type, policy number, insurance company, coverage start date, coverage end date, insured person/object. FOLDER: "Versicherungen/[Type]/[Year]" or "Insurance/[Type]/[Year]".',
  },
  contract: {
    label_de: 'Vertrag',
    label_en: 'Contract',
    context: 'This is a contract document. TITLE FORMAT: Use "[Contract Type] - [Party Name] - [Start Date]" format (e.g., "Mietvertrag - Mustermann GmbH - 01.01.2024"). KEYWORDS: Extract contract type, contract number, both parties\' names, start date, end date, contract value. FOLDER: "Verträge/[Type]/[Year]" or "Contracts/[Type]/[Year]".',
  },
  invoice: {
    label_de: 'Rechnung',
    label_en: 'Invoice',
    context: 'This is an invoice or bill. TITLE FORMAT: Use "RE[Invoice Number] - [Vendor] - [Amount] - [Date]" format (e.g., "RE2024-0027 - Acme GmbH - 1.234,56 EUR - 15.03.2024"). KEYWORDS: Extract invoice number, vendor name, invoice date, due date, total amount, tax ID/VAT number. FOLDER: "Rechnungen/[Year]/[Vendor Category]" or "Invoices/[Year]/[Vendor Category]".',
  },
  tax: {
    label_de: 'Steuer',
    label_en: 'Tax',
    context: 'This is a tax-related document. TITLE FORMAT: Use "[Document Type] - [Tax Year] - [Tax ID/Number]" format (e.g., "Einkommensteuerbescheid 2023 - Steuernummer 123/456/78901"). KEYWORDS: Extract tax year, tax ID, document type (return/assessment/receipt), tax office, taxpayer name, filing date. FOLDER: "Steuern/[Year]/[Type]" or "Taxes/[Year]/[Type]".',
  },
  id_document: {
    label_de: 'Ausweis / Identitätsdokument',
    label_en: 'ID Document',
    context: 'This is an identification document (passport, ID card, driver\'s license, etc.). Suggest folder structures like "Dokumente/Ausweise" or "Documents/IDs". Handle with high sensitivity.',
  },
  bank_statement: {
    label_de: 'Kontoauszug',
    label_en: 'Bank Statement',
    context: 'This is a bank statement. TITLE FORMAT: Use "[Bank Name] - Kontoauszug [Month/Year] - Konto [Last 4 digits]" format (e.g., "Sparkasse - Kontoauszug März 2024 - Konto 1234"). KEYWORDS: Extract bank name, account number (last 4 digits only), statement period, statement date, account holder name. FOLDER: "Finanzen/Kontoauszüge/[Year]/[Month]" or "Finance/Bank Statements/[Year]/[Month]".',
  },
  quote: {
    label_de: 'Angebot / Kostenvoranschlag',
    label_en: 'Quote / Estimate',
    context: 'This is a quote or cost estimate. TITLE FORMAT: Use "Angebot [Number] - [Vendor] - [Amount] - [Date]" format (e.g., "Angebot 2024-042 - Handwerk GmbH - 2.500 EUR - 10.03.2024"). KEYWORDS: Extract quote number, vendor name, quote date, valid until date, total amount, service/product description. FOLDER: "Angebote/[Year]/[Service Category]" or "Quotes/[Year]/[Service Category]".',
  },
  photo: {
    label_de: 'Foto',
    label_en: 'Photo',
    context: 'This is a photograph or image. Suggest folder structures like "Fotos/[Year]/[Event or Subject]" or "Photos/[Year]/[Event or Subject]". Try to identify the subject, event, or context.',
  },
  medical: {
    label_de: 'Medizinisches Dokument',
    label_en: 'Medical Document',
    context: 'This is a medical document (prescription, test result, medical report, etc.). TITLE FORMAT: Use "[Document Type] - [Doctor/Clinic] - [Date] - [Patient]" format (e.g., "Laborbefund - Dr. Müller - 20.03.2024 - Max Mustermann"). KEYWORDS: Extract document type, doctor/clinic name, patient name, document date, medical procedure/test type. FOLDER: "Gesundheit/[Type]/[Year]" or "Health/[Type]/[Year]".',
  },
  receipt: {
    label_de: 'Beleg / Quittung',
    label_en: 'Receipt',
    context: 'This is a receipt or proof of purchase. TITLE FORMAT: Use "[Vendor] - [Amount] - [Date] - [Item/Category]" format (e.g., "MediaMarkt - 49,99 EUR - 15.03.2024 - Elektronik"). KEYWORDS: Extract vendor name, purchase date, total amount, payment method, purchased items/categories. FOLDER: "Belege/[Year]/[Category]" or "Receipts/[Year]/[Category]".',
  },
  certificate: {
    label_de: 'Zertifikat / Bescheinigung',
    label_en: 'Certificate',
    context: 'This is a certificate or credential document. TITLE FORMAT: Use "[Certificate Type] - [Issuer] - [Recipient] - [Issue Date]" format (e.g., "Deutschzertifikat B2 - Goethe Institut - Max Mustermann - 15.06.2024"). KEYWORDS: Extract certificate type, issuing organization, recipient name, issue date, valid until date, certificate number. FOLDER: "Zertifikate/[Type]" or "Certificates/[Type]".',
  },
  correspondence: {
    label_de: 'Korrespondenz / Brief',
    label_en: 'Correspondence / Letter',
    context: 'This is correspondence or a letter. TITLE FORMAT: Use "[Sender] - [Subject] - [Date]" format (e.g., "Stadtwerke München - Jahresabrechnung Strom - 05.01.2024"). KEYWORDS: Extract sender name, recipient name, letter date, subject/topic, reference number. FOLDER: "Korrespondenz/[Year]/[Sender Category]" or "Correspondence/[Year]/[Sender Category]".',
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
