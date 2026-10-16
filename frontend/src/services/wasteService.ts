import api from './api';
import { IWaste, IShipment } from '../types';

export const wasteService = {
  getWasteList: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    hazardLevel?: string;
    search?: string;
  }): Promise<{ wasteList: IWaste[]; total: number; totalPages: number }> => {
    const res = await api.get('/waste', { params });
    return res.data;
  },

  getWasteById: async (wasteId: string): Promise<{ waste: IWaste; shipment?: IShipment }> => {
    const res = await api.get(`/waste/${wasteId}`);
    return res.data;
  },

  registerWaste: async (data: Partial<IWaste>): Promise<IWaste> => {
    const res = await api.post('/waste/register', data);
    return res.data.waste;
  },

  requestCollection: async (
    wasteId: string,
    data: { transporterId: string; destinationFacilityId: string; notes?: string }
  ): Promise<{ shipment: IShipment; waste: IWaste }> => {
    const res = await api.post(`/waste/${wasteId}/request-collection`, data);
    return res.data;
  },
};
