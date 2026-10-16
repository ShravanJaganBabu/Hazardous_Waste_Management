import api from './api';
import { IIncident } from '../types';

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
