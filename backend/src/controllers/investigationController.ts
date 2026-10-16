import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Investigation, IInvestigation } from '../models/Investigation.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { User } from '../models/User.js';

export const getInvestigations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, severity, issueType } = req.query;

    const query: any = {};

    if (user.role !== 'ADMIN') {
      query.$or = [
        { 'assignedTo.userId': user.userId },
        { 'createdBy.userId': user.userId },
      ];
    }

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (issueType) query.issueType = issueType;

    const investigations = await Investigation.find(query).sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: investigations.length,
      investigations,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve investigations.' });
  }
};

export const getInvestigationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const investigationId = String(req.params.investigationId);
    const investigation = await Investigation.findOne({ investigationId });

    if (!investigation) {
      res.status(404).json({ success: false, message: 'Investigation case not found.' });
      return;
    }

    res.json({
      success: true,
      investigation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch investigation case details.' });
  }
};

export const createInvestigation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { wasteId, shipmentId, issueType, title, description, severity = 'CRITICAL', assignedToUserId } = req.body;

    if (!wasteId || !issueType || !title || !description || !assignedToUserId) {
      res.status(400).json({
        success: false,
        message: 'All fields are required to initiate an investigation.',
      });
      return;
    }

    const assignedUser = await User.findOne({ userId: assignedToUserId });
    if (!assignedUser) {
      res.status(400).json({ success: false, message: 'Assigned target user not found.' });
      return;
    }

    const investigationId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const investigation = await Investigation.create({
      investigationId,
      wasteId,
      shipmentId,
      issueType,
      title,
      description,
      severity,
      createdBy: {
        userId: user.userId,
        name: user.name,
        role: user.role,
      },
      assignedTo: {
        userId: assignedUser.userId,
        name: assignedUser.name,
        role: assignedUser.role,
        organization: assignedUser.organizationName,
      },
      status: 'AWAITING_RESPONSE',
      evidence: [],
      responses: [],
    });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'INVESTIGATION_OPENED',
      entityType: 'INVESTIGATION',
      entityId: investigationId,
      description: `Opened formal compliance investigation ${investigationId} regarding ${title}.`,
    });

    // Notify assigned party
    await createNotification({
      recipientUserId: assignedUser.userId,
      recipientRole: assignedUser.role,
      shipmentId,
      wasteId,
      type: 'INVESTIGATION_OPENED',
      severity,
      title: `Formal Inquiry: ${title}`,
      message: `${user.name} opened an investigation regarding ${issueType}. Please submit your response and manifest documentation.`,
      actionUrl: `/${assignedUser.role.toLowerCase()}/investigations`,
      voiceRequired: true,
    });

    res.status(201).json({
      success: true,
      message: 'Investigation initiated and notified to the responsible party.',
      investigation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to initiate investigation.' });
  }
};

export const submitResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const investigationId = String(req.params.investigationId);
    const { message, attachments = [] } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Response explanation cannot be empty.' });
      return;
    }

    const investigation = await Investigation.findOne({ investigationId });
    if (!investigation) {
      res.status(404).json({ success: false, message: 'Investigation not found.' });
      return;
    }

    const responseId = `RSP-${Date.now()}`;
    investigation.responses.push({
      responseId,
      senderUserId: user.userId,
      senderName: user.name,
      senderRole: user.role,
      senderOrganization: user.organizationName,
      message,
      attachments,
      createdAt: new Date(),
    });

    investigation.status = 'RESPONSE_RECEIVED';
    await investigation.save();

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'INVESTIGATION_RESPONSE_SUBMITTED',
      entityType: 'INVESTIGATION',
      entityId: investigationId,
      description: `Submitted formal explanation for investigation ${investigationId}.`,
    });

    // Notify Admins that response is in review
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotification({
        recipientUserId: admin.userId,
        recipientRole: 'ADMIN',
        shipmentId: investigation.shipmentId,
        wasteId: investigation.wasteId,
        type: 'INVESTIGATION_RESPONSE',
        severity: 'INFO',
        title: `Response Received for Case ${investigationId}`,
        message: `${user.name} (${user.organizationName}) submitted an official explanation.`,
        actionUrl: `/admin/investigations/${investigationId}`,
      });
    }

    res.json({
      success: true,
      message: 'Your explanation has been recorded and submitted to Compliance Officers.',
      investigation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to submit response.' });
  }
};

export const resolveInvestigation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const investigationId = String(req.params.investigationId);
    const { verdict, resolutionNote, penaltyOrAction } = req.body;

    if (!verdict || !resolutionNote) {
      res.status(400).json({
        success: false,
        message: 'Verdict and resolution notes are required to close an investigation.',
      });
      return;
    }

    const investigation = await Investigation.findOne({ investigationId });
    if (!investigation) {
      res.status(404).json({ success: false, message: 'Investigation not found.' });
      return;
    }

    investigation.resolution = {
      resolvedBy: user.userId,
      resolvedByName: user.name,
      resolutionNote,
      verdict,
      penaltyOrAction,
      resolvedAt: new Date(),
    };

    investigation.status = verdict === 'VIOLATION_CONFIRMED' ? 'VIOLATION_CONFIRMED' : 'RESOLVED';
    investigation.resolvedAt = new Date();
    await investigation.save();

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: verdict === 'VIOLATION_CONFIRMED' ? 'INVESTIGATION_VIOLATION_CONFIRMED' : 'INVESTIGATION_RESOLVED',
      entityType: 'INVESTIGATION',
      entityId: investigationId,
      newValue: { verdict, penaltyOrAction },
      description: `Closed case ${investigationId} with verdict: ${verdict}. Note: ${resolutionNote}`,
    });

    // Notify assigned party of final decision
    await createNotification({
      recipientUserId: investigation.assignedTo.userId,
      recipientRole: investigation.assignedTo.role as any,
      shipmentId: investigation.shipmentId,
      wasteId: investigation.wasteId,
      type: 'SYSTEM_NOTICE',
      severity: verdict === 'VIOLATION_CONFIRMED' ? 'CRITICAL' : 'INFO',
      title: `Case ${investigationId} Closed: ${verdict}`,
      message: `Admin ${user.name} recorded the final verdict: ${verdict}. ${resolutionNote}`,
      actionUrl: `/${investigation.assignedTo.role.toLowerCase()}/investigations`,
    });

    res.json({
      success: true,
      message: `Investigation closed with verdict ${verdict}.`,
      investigation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to resolve investigation.' });
  }
};
