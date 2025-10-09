-- T15: Security Scan RLS Fixes
-- Protect audit_log from tampering
-- Users should not be able to insert fake audit entries or delete logs

-- Prevent users from inserting audit logs directly
-- (Only system/triggers should insert)
CREATE POLICY "System only can insert audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (false);

-- Prevent anyone from deleting audit logs
-- (Audit logs should be immutable for compliance)
CREATE POLICY "Prevent audit log deletion"
ON public.audit_log FOR DELETE
USING (false);

-- Protect usage_tracking from deletion
-- Users should not be able to delete usage records to bypass limits

-- Prevent anyone from deleting usage tracking records
CREATE POLICY "Prevent usage tracking deletion"
ON public.usage_tracking FOR DELETE
USING (false);