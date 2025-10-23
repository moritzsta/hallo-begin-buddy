/**
 * Document Type Definitions for Smart Upload Context (Edge Function version)
 * 
 * This is a simplified version for use in edge functions.
 * The full config is in src/lib/documentTypes.ts
 */

const DOCUMENT_TYPE_CONTEXTS: Record<string, string> = {
  insurance: 'This is an insurance-related document. Suggest folder structures like "Versicherungen/[Insurance Type]/[Year]" or "Insurance/[Type]/[Year]". Look for policy numbers, coverage dates, and insurance company names.',
  contract: 'This is a contract document. Suggest folder structures like "Verträge/[Contract Type]" or "Contracts/[Type]". Look for contract dates, parties involved, and contract types (rental, employment, service, etc.).',
  invoice: 'This is an invoice or bill. Suggest folder structures like "Rechnungen/[Year]/[Vendor]" or "Invoices/[Year]/[Vendor]". Extract invoice numbers, dates, amounts, and vendor names.',
  tax: 'This is a tax-related document. Suggest folder structures like "Steuern/[Year]/[Tax Type]" or "Taxes/[Year]/[Type]". Look for tax years, tax IDs, and document types (returns, assessments, receipts).',
  id_document: 'This is an identification document (passport, ID card, driver\'s license, etc.). Suggest folder structures like "Dokumente/Ausweise" or "Documents/IDs". Handle with high sensitivity.',
  bank_statement: 'This is a bank statement. Suggest folder structures like "Finanzen/Kontoauszüge/[Year]/[Month]" or "Finance/Bank Statements/[Year]/[Month]". Look for account numbers, dates, and bank names.',
  quote: 'This is a quote or cost estimate. Suggest folder structures like "Angebote/[Year]/[Vendor]" or "Quotes/[Year]/[Vendor]". Extract quote numbers, dates, amounts, and vendor information.',
  photo: 'This is a photograph or image. Suggest folder structures like "Fotos/[Year]/[Event or Subject]" or "Photos/[Year]/[Event or Subject]". Try to identify the subject, event, or context.',
  medical: 'This is a medical document (prescription, test result, medical report, etc.). Suggest folder structures like "Gesundheit/[Type]/[Year]" or "Health/[Type]/[Year]". Look for dates, doctor names, and medical procedures.',
  receipt: 'This is a receipt or proof of purchase. Suggest folder structures like "Belege/[Year]/[Category]" or "Receipts/[Year]/[Category]". Extract dates, amounts, and vendor names.',
  certificate: 'This is a certificate or credential document. Suggest folder structures like "Zertifikate/[Type]" or "Certificates/[Type]". Look for issue dates, issuing organizations, and validity periods.',
  correspondence: 'This is correspondence or a letter. Suggest folder structures like "Korrespondenz/[Year]/[Sender]" or "Correspondence/[Year]/[Sender]". Identify sender, recipient, date, and subject.',
  graphic: 'This is a graphic, illustration, or design file. Suggest folder structures like "Grafiken/[Project or Category]" or "Graphics/[Project or Category]". Try to identify the purpose or project.',
  other: 'This document does not fit into standard categories. Analyze the content and suggest an appropriate folder structure based on the document\'s nature and purpose.',
};

/**
 * Get AI context for document type
 */
export const getDocumentTypeContext = (type: string): string => {
  return DOCUMENT_TYPE_CONTEXTS[type] || '';
};
