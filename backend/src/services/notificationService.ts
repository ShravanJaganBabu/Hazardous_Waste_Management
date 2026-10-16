import { Alert, IAlert, AlertSeverity, AlertType } from '../models/Alert.js';
import { getIO } from '../socket/socketHandler.js';
import { UserRole } from '../models/User.js';

interface CreateAlertParams {
  recipientUserId: string;
  recipientRole?: UserRole | 'ALL';
  shipmentId?: string;
  wasteId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  voiceRequired?: boolean;
  metadata?: Record<string, any>;
}

export const createNotification = async (params: CreateAlertParams): Promise<IAlert> => {
  const alertId = `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const alert = await Alert.create({
    alertId,
    recipientUserId: params.recipientUserId,
    recipientRole: params.recipientRole,
    shipmentId: params.shipmentId,
    wasteId: params.wasteId,
    type: params.type,
    severity: params.severity,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
    voiceRequired: params.voiceRequired ?? (params.severity === 'CRITICAL' || params.severity === 'EMERGENCY'),
    voiceStatus: 'PENDING',
    isRead: false,
    metadata: params.metadata,
  });

  // Real-time strictly targeted recipient push (no unrestricted global broadcasts)
  const io = getIO();
  if (io) {
    if (params.recipientUserId) {
      // Send directly to the intended user's authenticated room
      io.to(params.recipientUserId).emit('notification:new', alert);
      if (params.type === 'QUANTITY_MISMATCH' || params.type === 'INVESTIGATION_OPENED') {
        io.to(params.recipientUserId).emit('investigation:mismatch', alert);
      }
    } else if (params.recipientRole && params.recipientRole !== 'ALL') {
      // Send to authorized role room
      io.to(`role:${params.recipientRole}`).emit('notification:new', alert);
      if (params.type === 'QUANTITY_MISMATCH' || params.type === 'INVESTIGATION_OPENED') {
        io.to(`role:${params.recipientRole}`).emit('investigation:mismatch', alert);
      }
    } else if (params.recipientRole === 'ALL') {
      // Only broadcast when explicitly intended for ALL stakeholders
      io.to('haztrack:all').emit('notification:new', alert);
    }

    // Critical emergencies also alert Admin Command Center for oversight
    if (params.severity === 'EMERGENCY' && params.recipientRole !== 'ADMIN' && params.recipientUserId !== 'HZU-001') {
      io.to('role:ADMIN').emit('notification:new', alert);
    }
  }

  return alert;
};
