import { AuditLog } from '../models/AuditLog.js';

interface AuditLogParams {
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'WASTE' | 'SHIPMENT' | 'INVESTIGATION' | 'INCIDENT' | 'DOCUMENT' | 'USER' | 'AUTH';
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (params: AuditLogParams): Promise<void> => {
  try {
    const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await AuditLog.create({
      auditId,
      ...params,
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit entry:', err);
  }
};
