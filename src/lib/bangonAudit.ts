// bangonAudit — single chokepoint for writing rows to bangon_admin_audit_log.
//
// All admin state-changing actions go through this so we never forget to
// log. RLS enforces `admin_id = auth.uid()` and `is_bangon_admin()`.

import { supabaseBangonAdmin as supabase } from './supabaseBangonAdmin';

export interface AuditPayload {
  action: 'approved' | 'rejected' | 'status_changed' | string;
  recordTable: string;
  recordId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function logAuditEntry(
  adminId: string,
  adminName: string,
  payload: AuditPayload,
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('bangon_admin_audit_log')
    .insert({
      admin_id: adminId,
      admin_name: adminName,
      action: payload.action,
      record_table: payload.recordTable,
      record_id: payload.recordId,
      before_state: payload.before ?? null,
      after_state: payload.after ?? null,
    });
  return { error: error?.message ?? null };
}
