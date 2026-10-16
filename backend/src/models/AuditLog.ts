import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  auditId: string;
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
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    actorUserId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['WASTE', 'SHIPMENT', 'INVESTIGATION', 'INCIDENT', 'DOCUMENT', 'USER', 'AUTH'],
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    description: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only immutable log
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
