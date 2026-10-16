import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Alert } from '../models/Alert.js';

export const getMyAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { unreadOnly, limit = 50 } = req.query;

    const query: any = {
      $or: [
        { recipientUserId: user.userId },
        { recipientRole: user.role },
        { recipientRole: 'ALL' },
      ],
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    const unreadCount = await Alert.countDocuments({
      $or: [
        { recipientUserId: user.userId },
        { recipientRole: user.role },
        { recipientRole: 'ALL' },
      ],
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      alerts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve alerts.' });
  }
};

export const markAlertAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    await Alert.updateOne(
      { alertId },
      { isRead: true, readAt: new Date(), voiceStatus: 'PLAYED' }
    );

    res.json({ success: true, message: 'Alert marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update alert status.' });
  }
};

export const markAllAlertsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    await Alert.updateMany(
      {
        $or: [
          { recipientUserId: user.userId },
          { recipientRole: user.role },
          { recipientRole: 'ALL' },
        ],
        isRead: false,
      },
      { isRead: true, readAt: new Date(), voiceStatus: 'PLAYED' }
    );

    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update alerts.' });
  }
};
