import api from './api';
import { IInvestigation } from '../types';

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
