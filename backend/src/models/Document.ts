import mongoose, { Document as MongooseDoc, Schema } from 'mongoose';

export type DocumentType =
  | 'MSDS_SHEET'
  | 'COLLECTION_MANIFEST'
  | 'TRANSPORT_PERMIT'
  | 'CHAIN_OF_CUSTODY'
  | 'TREATMENT_CERTIFICATE'
  | 'DISPOSAL_CERTIFICATE'
  | 'INCIDENT_PHOTO'
  | 'INVESTIGATION_EVIDENCE'
  | 'OTHER';

export interface IDocumentRecord extends MongooseDoc {
  documentId: string;
  wasteId?: string;
  shipmentId?: string;
  uploadedBy: {
    userId: string;
    name: string;
    role: string;
  };
  documentType: DocumentType;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    wasteId: { type: String, index: true },
    shipmentId: { type: String, index: true },
    uploadedBy: {
      userId: { type: String, required: true, index: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        'MSDS_SHEET',
        'COLLECTION_MANIFEST',
        'TRANSPORT_PERMIT',
        'CHAIN_OF_CUSTODY',
        'TREATMENT_CERTIFICATE',
        'DISPOSAL_CERTIFICATE',
        'INCIDENT_PHOTO',
        'INVESTIGATION_EVIDENCE',
        'OTHER',
      ],
      index: true,
    },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const DocumentRecord = mongoose.model<IDocumentRecord>('DocumentRecord', DocumentRecordSchema);
