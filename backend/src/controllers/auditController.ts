import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AuditLog } from '../models/AuditLog.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 30, entityType, actorRole, action, search } = req.query;

    const query: any = {};

    if (entityType) query.entityType = entityType;
    if (actorRole) query.actorRole = actorRole;
    if (action) query.action = action;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { actorName: searchRegex },
        { action: searchRegex },
        { entityId: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit ledger.' });
  }
};
