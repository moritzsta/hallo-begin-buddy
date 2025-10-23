-- Add document_type column to files table for categorization
ALTER TABLE public.files 
ADD COLUMN document_type TEXT;

-- Create index for better query performance on document_type filtering
CREATE INDEX idx_files_document_type ON public.files(document_type);

-- Add comment for documentation
COMMENT ON COLUMN public.files.document_type IS 'Document category from smart upload (insurance, contract, invoice, etc.)';