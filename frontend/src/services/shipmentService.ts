import api from './api';
import { IShipment, IWaste } from '../types';

export const shipmentService = {
  getShipments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ shipments: IShipment[]; total: number; totalPages: number }> => {
    const res = await api.get('/shipments', { params });
    return res.data;
  },

  getShipmentById: async (shipmentId: string): Promise<{ shipment: IShipment; waste: IWaste }> => {
    const res = await api.get(`/shipments/${shipmentId}`);
    return res.data;
  },

  lookupIdentifier: async (
    identifier: string
  ): Promise<{
    success: boolean;
    type: 'SHIPMENT' | 'WASTE';
    identifier: string;
    shipment: IShipment | null;
    waste: IWaste | null;
    allowedActions: string[];
  }> => {
    const res = await api.get(`/shipments/lookup/${encodeURIComponent(identifier)}`);
    return res.data;
  },

  acceptPickup: async (
    shipmentId: string,
    data: { driverName?: string; driverPhone?: string; vehicleNumber?: string; vehicleType?: string }
  ): Promise<IShipment> => {
    const res = await api.post(`/shipments/${shipmentId}/accept-pickup`, data);
    return res.data.shipment;
  },

  confirmCollection: async (
    shipmentId: string,
    data: { collectedQuantity: number; notes?: string }
  ): Promise<IShipment> => {
    const res = await api.post(`/shipments/${shipmentId}/confirm-collection`, data);
    return res.data.shipment;
  },

  confirmReceipt: async (
    shipmentId: string,
    data: { receivedQuantity: number; notes?: string }
  ): Promise<IShipment> => {
    const res = await api.post(`/shipments/${shipmentId}/confirm-receipt`, data);
    return res.data.shipment;
  },

  recordTreatment: async (
    shipmentId: string,
    data: { treatmentMethod: string; notes?: string }
  ): Promise<IShipment> => {
    const res = await api.post(`/shipments/${shipmentId}/record-treatment`, data);
    return res.data.shipment;
  },

  recordDisposal: async (
    shipmentId: string,
    data: { disposalMethod: string; landfillCellId?: string; notes?: string }
  ): Promise<IShipment> => {
    const res = await api.post(`/shipments/${shipmentId}/record-disposal`, data);
    return res.data.shipment;
  },
};
