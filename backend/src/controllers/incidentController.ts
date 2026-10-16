import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Incident } from '../models/Incident.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { User } from '../models/User.js';

export const reportIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      wasteId,
      shipmentId,
      incidentType,
      description,
      locationAddress,
      latitude,
      longitude,
      severity = 'EMERGENCY',
      attachments = [],
    } = req.body;

    if (!wasteId || !shipmentId || !incidentType || !description || !locationAddress) {
      res.status(400).json({
        success: false,
        message: 'Please provide all mandatory incident fields (wasteId, shipmentId, type, description, location).',
      });
      return;
    }

    const incidentId = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const incident = await Incident.create({
      incidentId,
      wasteId,
      shipmentId,
      reportedBy: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        phone: user.phone || '+91 98401 55678',
      },
      incidentType,
      description,
      location: {
        address: locationAddress,
        coordinates: latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined,
      },
      attachments,
      severity,
      status: 'REPORTED',
      responseActions: [
        {
          action: 'Incident logged in HazTrack Emergency Dispatch Queue',
          performedBy: user.userId,
          performedByName: user.name,
          timestamp: new Date(),
        },
      ],
    });

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'INCIDENT_REPORTED',
      entityType: 'INCIDENT',
      entityId: incidentId,
      newValue: { incidentType, severity, location: locationAddress },
      description: `Emergency incident reported by ${user.name}: ${incidentType} at ${locationAddress}.`,
    });

    // Alert ALL Admins immediately with EMERGENCY Voice alert
    const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
    for (const admin of admins) {
      await createNotification({
        recipientUserId: admin.userId,
        recipientRole: 'ADMIN',
        shipmentId,
        wasteId,
        type: 'INCIDENT_REPORTED',
        severity: severity as any,
        title: `EMERGENCY ALERT: ${incidentType.replace('_', ' ')} Reported on ${shipmentId}`,
        message: `${user.name} reported a ${severity.toLowerCase()} ${incidentType.toLowerCase()} at ${locationAddress}. Immediate Hazmat response required.`,
        actionUrl: `/admin/incidents`,
        voiceRequired: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency incident broadcasted to Command Center.',
      incident,
    });
  } catch (error: any) {
    console.error('[INCIDENT REPORT ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to report incident.' });
  }
};

export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, severity, incidentType } = req.query;

    const query: any = {};

    if (user.role === 'TRANSPORTER') {
      query['reportedBy.userId'] = user.userId;
    }

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (incidentType) query.incidentType = incidentType;

    const incidents = await Incident.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const incidentId = String(req.params.incidentId);
    const { status, actionNote, resolutionNotes } = req.body;

    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found.' });
      return;
    }

    if (status) incident.status = status;
    if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED') incident.resolvedAt = new Date();

    if (actionNote) {
      incident.responseActions = incident.responseActions || [];
      incident.responseActions.push({
        action: actionNote,
        performedBy: user.userId,
        performedByName: user.name,
        timestamp: new Date(),
      });
    }

    await incident.save();

    await logAudit({
      actorUserId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      action: 'INCIDENT_STATUS_UPDATED',
      entityType: 'INCIDENT',
      entityId: incidentId,
      newValue: { status, actionNote },
      description: `Incident status updated to ${status} by ${user.name}.`,
    });

    res.json({
      success: true,
      message: 'Incident record updated.',
      incident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update incident.' });
  }
};
