// lib/security/audit.ts
import { createClient } from '@/lib/supabase/server'

export interface AuditLog {
  eventType: string
  userId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class SecurityAudit {
  /**
   * Log security event
   */
  async log(log: AuditLog): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase
        .from('security_audit_logs')
        .insert({
          user_id: log.userId || null,
          event_type: log.eventType,
          ip_address: log.ipAddress || null,
          user_agent: log.userAgent || null,
          metadata: log.metadata || {},
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Audit log error:', error)
      // Don't throw - audit logging should not break main functionality
    }
  }
}