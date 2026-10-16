import api from './api';
import { IAuditLog } from '../types';

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
