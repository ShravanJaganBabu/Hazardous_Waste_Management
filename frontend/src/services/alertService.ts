import api from './api';
import { IAlert, IInvestigation, IIncident, IDashboardStats, IAuditLog } from '../types';

export const alertService = {
  getMyAlerts: async (params?: { unreadOnly?: boolean; limit?: number }): Promise<{ alerts: IAlert[]; unreadCount: number }> => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },

  markAsRead: async (alertId: string): Promise<void> => {
    await api.patch(`/alerts/${alertId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/alerts/read-all');
  },
};

export const investigationService = {
  getInvestigations: async (params?: { status?: string; severity?: string; issueType?: string }): Promise<{ count: number; investigations: IInvestigation[] }> => {
    const res = await api.get('/investigations', { params });
    return res.data;
  },

  getInvestigationById: async (investigationId: string): Promise<{ investigation: IInvestigation }> => {
    const res = await api.get(`/investigations/${investigationId}`);
    return res.data;
  },

  createInvestigation: async (data: {
    wasteId: string;
    shipmentId?: string;
    issueType: string;
    title: string;
    description: string;
    severity?: string;
    assignedToUserId: string;
  }): Promise<IInvestigation> => {
    const res = await api.post('/investigations', data);
    return res.data.investigation;
  },

  submitResponse: async (investigationId: string, data: { message: string; attachments?: string[] }): Promise<IInvestigation> => {
    const res = await api.post(`/investigations/${investigationId}/respond`, data);
    return res.data.investigation;
  },

  resolveInvestigation: async (
    investigationId: string,
    data: { verdict: string; resolutionNote: string; penaltyOrAction?: string }
  ): Promise<IInvestigation> => {
    const res = await api.post(`/investigations/${investigationId}/resolve`, data);
    return res.data.investigation;
  },
};

export const incidentService = {
  getIncidents: async (params?: { status?: string; severity?: string }): Promise<{ count: number; incidents: IIncident[] }> => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },

  reportIncident: async (data: {
    wasteId: string;
    shipmentId: string;
    incidentType: string;
    description: string;
    locationAddress: string;
    latitude?: number;
    longitude?: number;
    severity?: string;
    attachments?: string[];
  }): Promise<IIncident> => {
    const res = await api.post('/incidents/report', data);
    return res.data.incident;
  },

  updateIncidentStatus: async (
    incidentId: string,
    data: { status?: string; actionNote?: string; resolutionNotes?: string }
  ): Promise<IIncident> => {
    const res = await api.patch(`/incidents/${incidentId}/status`, data);
    return res.data.incident;
  },
};

export const reportService = {
  getDashboardStats: async (): Promise<{
    stats: IDashboardStats;
    wasteTypeBreakdown: Array<{ _id: string; count: number; totalQuantity: number }>;
    monthlyTrends: Array<{ month: string; generated: number; treated: number; disposed: number }>;
    recentAlerts: IAlert[];
  }> => {
    const res = await api.get('/reports/stats');
    return res.data;
  },
};

export const auditService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    actorRole?: string;
    action?: string;
    search?: string;
  }): Promise<{ logs: IAuditLog[]; total: number; totalPages: number }> => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
};
