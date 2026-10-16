import api from './api';
import { IDashboardStats, IAlert } from '../types';

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
