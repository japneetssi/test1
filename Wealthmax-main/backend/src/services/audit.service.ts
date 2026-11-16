import db from '../config/database';
import logger from '../config/logger';

export interface AuditEvent {
    userId?: string;
    action: string;
    resource: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Audit logging - now REAL (fix for useless.md #4 / #8).
 *
 * Every insert is wrapped in its own catch: an audit failure must never break
 * the user request that is being audited, but it is loudly logged so
 * silent data loss is impossible. The audit_logs table is created by
 * migrations/1789000000001_create_audit_logs.js.
 */
export class AuditService {
    /**
     * Log a security or compliance event
     */
    static async log(event: AuditEvent): Promise<void> {
        try {
            await db.query(
                `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    event.userId || null,
                    event.action,
                    event.resource,
                    event.details ? JSON.stringify(event.details) : null,
                    event.ipAddress || null,
                    event.userAgent || null,
                ]
            );
            logger.debug(`Audit event recorded: ${event.action} on ${event.resource}`);
        } catch (error: any) {
            // Never let audit logging break the caller's request; surface loudly.
            logger.error('AUDIT WRITE FAILED - compliance event not persisted', {
                action: event.action,
                resource: event.resource,
                error: error.message,
            });
        }
    }

    /**
     * Retrieve logs for a specific user (Compliance Admin use case)
     */
    static async getLogsByUser(userId: string): Promise<any[]> {
        try {
            const result = await db.query(
                `SELECT id, user_id, action, resource, details, ip_address, user_agent, created_at
                 FROM audit_logs
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 200`,
                [userId]
            );
            return result.rows;
        } catch (error: any) {
            logger.error('AUDIT READ FAILED', { userId, error: error.message });
            throw error;
        }
    }
}
