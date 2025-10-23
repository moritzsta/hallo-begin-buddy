/**
 * Document Type Definitions for Smart Upload Context (Edge Function version)
 * 
 * This is a simplified version for use in edge functions.
 * The full config is in src/lib/documentTypes.ts
 */

const DOCUMENT_TYPE_CONTEXTS: Record<string, string> = {
  insurance: 'This is an insurance-related document. TITLE FORMAT: Use "[Insurance Type] - [Company] - [Policy Number] - [Year]" format (e.g., "Kfz-Versicherung - Allianz - 123456789 - 2024"). KEYWORDS: Extract insurance type, policy number, insurance company, coverage start date, coverage end date, insured person/object. FOLDER: "Versicherungen/[Type]/[Year]" or "Insurance/[Type]/[Year]".',
  contract: 'This is a contract document. TITLE FORMAT: Use "[Contract Type] - [Party Name] - [Start Date]" format (e.g., "Mietvertrag - Mustermann GmbH - 01.01.2024"). KEYWORDS: Extract contract type, contract number, both parties\' names, start date, end date, contract value. FOLDER: "Verträge/[Type]/[Year]" or "Contracts/[Type]/[Year]".',
  invoice: 'This is an invoice or bill. TITLE FORMAT: Use "RE[Invoice Number] - [Vendor] - [Amount] - [Date]" format (e.g., "RE2024-0027 - Acme GmbH - 1.234,56 EUR - 15.03.2024"). KEYWORDS: Extract invoice number, vendor name, invoice date, due date, total amount, tax ID/VAT number. FOLDER: "Rechnungen/[Year]/[Vendor Category]" or "Invoices/[Year]/[Vendor Category]".',
  tax: 'This is a tax-related document. TITLE FORMAT: Use "[Document Type] - [Tax Year] - [Tax ID/Number]" format (e.g., "Einkommensteuerbescheid 2023 - Steuernummer 123/456/78901"). KEYWORDS: Extract tax year, tax ID, document type (return/assessment/receipt), tax office, taxpayer name, filing date. FOLDER: "Steuern/[Year]/[Type]" or "Taxes/[Year]/[Type]".',
  id_document: 'This is an identification document (passport, ID card, driver\'s license, etc.). Suggest folder structures like "Dokumente/Ausweise" or "Documents/IDs". Handle with high sensitivity.',
  bank_statement: 'This is a bank statement. TITLE FORMAT: Use "[Bank Name] - Kontoauszug [Month/Year] - Konto [Last 4 digits]" format (e.g., "Sparkasse - Kontoauszug März 2024 - Konto 1234"). KEYWORDS: Extract bank name, account number (last 4 digits only), statement period, statement date, account holder name. FOLDER: "Finanzen/Kontoauszüge/[Year]/[Month]" or "Finance/Bank Statements/[Year]/[Month]".',
  quote: 'This is a quote or cost estimate. TITLE FORMAT: Use "Angebot [Number] - [Vendor] - [Amount] - [Date]" format (e.g., "Angebot 2024-042 - Handwerk GmbH - 2.500 EUR - 10.03.2024"). KEYWORDS: Extract quote number, vendor name, quote date, valid until date, total amount, service/product description. FOLDER: "Angebote/[Year]/[Service Category]" or "Quotes/[Year]/[Service Category]".',
  photo: 'This is a photograph or image. Suggest folder structures like "Fotos/[Year]/[Event or Subject]" or "Photos/[Year]/[Event or Subject]". Try to identify the subject, event, or context.',
  medical: 'This is a medical document (prescription, test result, medical report, etc.). TITLE FORMAT: Use "[Document Type] - [Doctor/Clinic] - [Date] - [Patient]" format (e.g., "Laborbefund - Dr. Müller - 20.03.2024 - Max Mustermann"). KEYWORDS: Extract document type, doctor/clinic name, patient name, document date, medical procedure/test type. FOLDER: "Gesundheit/[Type]/[Year]" or "Health/[Type]/[Year]".',
  receipt: 'This is a receipt or proof of purchase. TITLE FORMAT: Use "[Vendor] - [Amount] - [Date] - [Item/Category]" format (e.g., "MediaMarkt - 49,99 EUR - 15.03.2024 - Elektronik"). KEYWORDS: Extract vendor name, purchase date, total amount, payment method, purchased items/categories. FOLDER: "Belege/[Year]/[Category]" or "Receipts/[Year]/[Category]".',
  certificate: 'This is a certificate or credential document. TITLE FORMAT: Use "[Certificate Type] - [Issuer] - [Recipient] - [Issue Date]" format (e.g., "Deutschzertifikat B2 - Goethe Institut - Max Mustermann - 15.06.2024"). KEYWORDS: Extract certificate type, issuing organization, recipient name, issue date, valid until date, certificate number. FOLDER: "Zertifikate/[Type]" or "Certificates/[Type]".',
  correspondence: 'This is correspondence or a letter. TITLE FORMAT: Use "[Sender] - [Subject] - [Date]" format (e.g., "Stadtwerke München - Jahresabrechnung Strom - 05.01.2024"). KEYWORDS: Extract sender name, recipient name, letter date, subject/topic, reference number. FOLDER: "Korrespondenz/[Year]/[Sender Category]" or "Correspondence/[Year]/[Sender Category]".',
  graphic: 'This is a graphic, illustration, or design file. Suggest folder structures like "Grafiken/[Project or Category]" or "Graphics/[Project or Category]". Try to identify the purpose or project.',
  other: 'This document does not fit into standard categories. Analyze the content and suggest an appropriate folder structure based on the document\'s nature and purpose.',
};

/**
 * Get AI context for document type
 */
export const getDocumentTypeContext = (type: string): string => {
  return DOCUMENT_TYPE_CONTEXTS[type] || '';
};
