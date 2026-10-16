import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { IAlert, AlertSeverity } from '../types';
import { alertService } from '../services/alertService';
import { useSocket } from './SocketContext';
import { useVoiceAlert } from './VoiceAlertContext';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

export interface InvestigationModalData {
  investigationId: string;
  wasteId: string;
  shipmentId?: string;
  declaredQuantity: number;
  receivedQuantity: number;
  differenceKg: number;
  unit: string;
  assignedParty: string;
  assignedRole: string;
  assignedOrg?: string;
  voiceText: string;
  severity: AlertSeverity;
  tolerance: number;
}

interface NotificationContextType {
  alerts: IAlert[];
  unreadCount: number;
  isOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  activeInvestigationModal: InvestigationModalData | null;
  openInvestigationModal: (data: InvestigationModalData) => void;
  closeInvestigationModal: () => void;
  triggerDemoInvestigationAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { playVoiceAlert, announceEvent } = useVoiceAlert();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeInvestigationModal, setActiveInvestigationModal] = useState<InvestigationModalData | null>(null);

  // Maintain deduplication sets
  const processedAlertIdsRef = useRef<Set<string>>(new Set());

  const fetchAlerts = async () => {
    try {
      const data = await alertService.getMyAlerts({ limit: 50 });
      if (data) {
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
        // Pre-populate processed alert IDs to avoid replaying speech on initial load
        if (data.alerts) {
          data.alerts.forEach((a: IAlert) => processedAlertIdsRef.current.add(a.alertId));
        }
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS FETCH]', err);
    }
  };

  useEffect(() => {
    // Session isolation: reset all previous session notifications, modals, and speech
    setAlerts([]);
    setUnreadCount(0);
    processedAlertIdsRef.current.clear();
    setActiveInvestigationModal(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (user?.userId) {
      fetchAlerts();
    }
  }, [user?.userId, user?.role]);

  const openInvestigationModal = useCallback((data: InvestigationModalData) => {
    setActiveInvestigationModal(data);
  }, []);

  const closeInvestigationModal = useCallback(() => {
    setActiveInvestigationModal(null);
  }, []);

  // Demo trigger helper for live testing / presentations
  const triggerDemoInvestigationAlert = useCallback(() => {
    const declared = 10.0;
    const received = 7.5;
    const diff = Number((declared - received).toFixed(2));
    const invId = `INV-DEMO-${Date.now().toString().slice(-4)}`;
    const voiceText = t('voiceInvestigationMismatch', { diff: '2.5', unit: 'kg' });

    const demoData: InvestigationModalData = {
      investigationId: invId,
      wasteId: 'HW-2026-000101',
      shipmentId: 'SHP-2026-000101',
      declaredQuantity: declared,
      receivedQuantity: received,
      differenceKg: diff,
      unit: 'kg',
      assignedParty: 'Shravan Logistics Carrier',
      assignedRole: 'TRANSPORTER',
      assignedOrg: 'Tamil Nadu EcoExpress Logistics',
      voiceText,
      severity: 'CRITICAL',
      tolerance: 0.5,
    };

    setActiveInvestigationModal(demoData);
    announceEvent('INVESTIGATION_MISMATCH', {
      diff: '2.5',
      unit: 'kg',
      severity: 'CRITICAL',
      eventId: invId,
    });
  }, [announceEvent, t]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert: IAlert) => {
      // Recipient-aware delivery: verify that this alert is authorized for the current user/role
      const isAuthorizedRecipient =
        !newAlert.recipientUserId ||
        newAlert.recipientUserId === user?.userId ||
        newAlert.recipientRole === user?.role ||
        newAlert.recipientRole === 'ALL' ||
        (user?.role === 'ADMIN' && (newAlert.severity === 'CRITICAL' || newAlert.severity === 'EMERGENCY'));

      if (!isAuthorizedRecipient) {
        return; // Drop alerts not intended for the active user
      }

      // Prevent duplicate processing from multiple socket rooms
      if (processedAlertIdsRef.current.has(newAlert.alertId)) {
        return;
      }
      processedAlertIdsRef.current.add(newAlert.alertId);

      setAlerts((prev) => [newAlert, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Check if alert represents a quantity mismatch or investigation requirement
      const isMismatchAlert =
        newAlert.type === 'QUANTITY_MISMATCH' ||
        newAlert.type === 'INVESTIGATION_OPENED' ||
        newAlert.title?.toLowerCase().includes('quantity mismatch') ||
        Boolean(newAlert.metadata?.investigationId);

      if (isMismatchAlert) {
        const meta = newAlert.metadata || {};
        const declared = Number(meta.declaredQuantity || 10.0);
        const received = Number(meta.receivedQuantity || 7.5);
        const diff = Number(meta.differenceKg || Math.abs(declared - received) || 2.5);
        const unit = meta.unit || 'kg';
        const invId = meta.investigationId || `INV-${newAlert.shipmentId || '2026-01'}`;

        const dynamicVoiceText =
          t('voiceInvestigationMismatch', { diff, unit });

        const modalPayload: InvestigationModalData = {
          investigationId: invId,
          wasteId: newAlert.wasteId || meta.wasteId || 'HW-2026-000101',
          shipmentId: newAlert.shipmentId || meta.shipmentId || 'SHP-2026-000101',
          declaredQuantity: declared,
          receivedQuantity: received,
          differenceKg: diff,
          unit,
          assignedParty: meta.assignedParty || 'Carrier Transporter',
          assignedRole: meta.assignedRole || 'TRANSPORTER',
          assignedOrg: meta.assignedOrg || 'Fleet Carrier Division',
          voiceText: dynamicVoiceText,
          severity: newAlert.severity || 'CRITICAL',
          tolerance: 0.5,
        };

        // Trigger the Investigation Popup Modal
        setActiveInvestigationModal(modalPayload);

        // Announce synchronized with current language
        announceEvent('INVESTIGATION_MISMATCH', {
          diff,
          unit,
          severity: newAlert.severity || 'CRITICAL',
          eventId: newAlert.alertId,
        });
        return;
      }

      // Check for pickup assignment alerts
      if (newAlert.type === 'COLLECTION_REQUESTED' || newAlert.title?.toLowerCase().includes('pickup')) {
        announceEvent('PICKUP_ASSIGNED', {
          shipmentId: newAlert.shipmentId,
          company: newAlert.metadata?.company || newAlert.metadata?.originOrg,
          quantity: newAlert.metadata?.quantity,
          unit: newAlert.metadata?.unit,
          severity: newAlert.severity || 'WARNING',
          eventId: newAlert.alertId,
        });
        return;
      }

      // Check for road incidents
      if (
        newAlert.type === 'ROAD_INCIDENT' ||
        newAlert.title?.toLowerCase().includes('incident') ||
        newAlert.title?.toLowerCase().includes('spill')
      ) {
        announceEvent('ROAD_INCIDENT', {
          severity: 'EMERGENCY',
          eventId: newAlert.alertId,
        });
        return;
      }

      // Check for delivery confirmation
      if (
        newAlert.type === 'DELIVERY_CONFIRMED' ||
        newAlert.title?.toLowerCase().includes('delivery') ||
        newAlert.title?.toLowerCase().includes('received')
      ) {
        announceEvent('DELIVERY_SUCCESS', {
          severity: 'INFO',
          eventId: newAlert.alertId,
        });
        return;
      }

      // Fallback Automated Voice Trigger for other Critical and Emergency alerts
      if (newAlert.voiceRequired || newAlert.severity === 'CRITICAL' || newAlert.severity === 'EMERGENCY') {
        playVoiceAlert(`${newAlert.title}. ${newAlert.message}`, newAlert.severity, {
          eventId: newAlert.alertId,
          shipmentId: newAlert.shipmentId,
        });
      }
    };

    socket.on('notification:new', handleNewAlert);
    socket.on('alert:new', handleNewAlert);
    socket.on('investigation:mismatch', handleNewAlert);

    return () => {
      socket.off('notification:new', handleNewAlert);
      socket.off('alert:new', handleNewAlert);
      socket.off('investigation:mismatch', handleNewAlert);
    };
  }, [socket, announceEvent, playVoiceAlert, t]);

  const markAsRead = async (alertId: string) => {
    try {
      await alertService.markAsRead(alertId);
      setAlerts((prev) => prev.map((a) => (a.alertId === alertId ? { ...a, isRead: true } : a)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await alertService.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        alerts,
        unreadCount,
        isOpen,
        toggleDrawer: () => setIsOpen((prev) => !prev),
        closeDrawer: () => setIsOpen(false),
        markAsRead,
        markAllAsRead,
        fetchAlerts,
        activeInvestigationModal,
        openInvestigationModal,
        closeInvestigationModal,
        triggerDemoInvestigationAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
