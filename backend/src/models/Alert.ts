import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './User.js';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export type AlertType =
  | 'QUANTITY_MISMATCH'
  | 'PICKUP_OVERDUE'
  | 'TRANSIT_DELAY'
  | 'MISSING_DOCUMENT'
  | 'TREATMENT_OVERDUE'
  | 'DISPOSAL_OVERDUE'
  | 'INCIDENT_REPORTED'
  | 'INVESTIGATION_OPENED'
  | 'INVESTIGATION_RESPONSE'
  | 'COMPLIANCE_WARNING'
  | 'SYSTEM_NOTICE';

export interface IAlert extends Document {
  alertId: string;
  recipientUserId: string;
  recipientRole?: UserRole | 'ALL';
  shipmentId?: string;
  wasteId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  voiceRequired: boolean;
  voiceStatus: 'PENDING' | 'PLAYED' | 'DISMISSED';
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    recipientUserId: { type: String, required: true, index: true },
    recipientRole: { type: String, index: true },
    shipmentId: { type: String, index: true },
    wasteId: { type: String, index: true },
    type: { type: String, required: true, index: true },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
      default: 'INFO',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionUrl: { type: String },
    voiceRequired: { type: Boolean, default: false },
    voiceStatus: {
      type: String,
      enum: ['PENDING', 'PLAYED', 'DISMISSED'],
      default: 'PENDING',
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
