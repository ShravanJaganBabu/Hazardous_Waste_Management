import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { DocumentRecord } from '../models/Document.js';
import { logAudit } from '../services/auditService.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/json',
  'text/plain',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const uploadDocumentRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { wasteId, shipmentId, documentType, fileName, fileUrl, fileSize = 1024 * 250, mimeType = 'application/pdf' } = req.body;

    if (!documentType || !fileName || !fileUrl) {
      res.status(400).json({
        success: false,
        message: 'Document type, file name, and file URL are required.',
      });
      return;
    }

    if (Number(fileSize) > MAX_FILE_SIZE) {
      res.status(400).json({
        success: false,
        message: 'File size exceeds maximum permitted limit (15MB).',
      });
      return;
    }

    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: `Unsupported file format (${mimeType}). Allowed formats: PDF, JPEG, PNG, WEBP, JSON.`,
      });
      return;
    }

    const documentId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const doc = await DocumentRecord.create({
      documentId,
      wasteId,
      shipmentId,
      uploadedBy: {
        userId: user.userId,
        name: user.name,
        role: user.role,
      },
      documentType,
      fileName,
      originalName: fileName,
      fileUrl,
      fileSize: Number(fileSize),
      mimeType,
      verificationStatus: 'VERIFIED',
      verifiedBy: user.name,
      verifiedAt: new Date(),
    });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: documentId,
      description: `Uploaded compliance document: ${fileName} (${documentType}).`,
    });

    res.status(201).json({
      success: true,
      message: 'Document successfully secured in registry.',
      document: doc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to record document.' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { wasteId, shipmentId, documentType } = req.query;

    const query: any = {};
    if (wasteId) query.wasteId = wasteId;
    if (shipmentId) query.shipmentId = shipmentId;
    if (documentType) query.documentType = documentType;

    // RBAC: Non-admin users can view their own documents or general compliance documents
    if (user.role !== 'ADMIN') {
      query.$or = [
        { 'uploadedBy.userId': user.userId },
        { documentType: { $in: ['MSDS_SHEET', 'TRANSPORT_PERMIT', 'COLLECTION_MANIFEST'] } }
      ];
    }

    const documents = await DocumentRecord.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
};
