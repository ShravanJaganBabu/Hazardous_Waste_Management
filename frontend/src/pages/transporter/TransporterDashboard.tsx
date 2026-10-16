import React, { useEffect, useState } from 'react';
import { shipmentService } from '../../services/shipmentService';
import { investigationService } from '../../services/investigationService';
import { IShipment, IInvestigation } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionRequired, ActionItem } from '../../components/common/ActionRequired';
import { QRModal } from '../../components/qr/QRModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { Truck, Navigation, AlertOctagon, QrCode, CheckCircle2, ArrowRight, FileSearch } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const TransporterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ url: string; shipment: IShipment } | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentsData, invData] = await Promise.all([
        shipmentService.getShipments(),
        investigationService.getInvestigations({ status: 'AWAITING_RESPONSE' }).catch(() => ({ investigations: [] })),
      ]);
      setShipments(shipmentsData.shipments || []);
      setInvestigations(invData.investigations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingPickups = shipments.filter((s) => s.status === 'COLLECTION_REQUESTED');
  const inTransitShipments = shipments.filter((s) => s.status === 'IN_TRANSIT');

  const actionItems: ActionItem[] = [
    ...(investigations.map((inv) => ({
      id: inv.investigationId,
      severity: 'CRITICAL' as const,
      title: t('discrepancyInquiryTitle', { id: inv.investigationId }, `🚨 Discrepancy Inquiry: ${inv.investigationId}`),
      description: t(
        'discrepancyInquiryDesc',
        { title: inv.title },
        `${inv.title}. Compliance Officer requested formal explanation and intake manifests.`
      ),
      timeAgo: t('immediateActionRequired', 'Immediate Action Required'),
      actionUrl: `/admin/investigations/${inv.investigationId}`,
      actionLabel: t('submitExplanationEvidence', 'Submit Explanation & Evidence'),
    }))),
    ...(pendingPickups.map((p) => ({
      id: p.shipmentId,
      severity: 'WARNING' as const,
      title: t('pickupAssignedTitle', { id: p.shipmentId }, `Pickup Assigned: ${p.shipmentId}`),
      description: t(
        'pickupAssignedDesc',
        { org: p.originOrganization.name, qty: p.declaredQuantity, unit: p.unit },
        `Collection requested at ${p.originOrganization.name} (${p.declaredQuantity} ${p.unit}).`
      ),
      timeAgo: t('pending', 'Pending'),
      actionUrl: `/admin/shipments/${p.shipmentId}`,
      actionLabel: t('acceptConfirmPickup', 'Accept & Confirm Pickup'),
    }))),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest">
            <Truck className="w-4 h-4 shrink-0" />
            <span className="break-words">
              {t(
                'fleetCarrierTerminal',
                { org: user?.organizationName || 'EcoHaul Logistics' },
                `FLEET CARRIER TERMINAL // ${user?.organizationName}`
              )}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            {t('hazardousTransitGpsDispatch', 'Hazardous Transit & GPS Dispatch')}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-panel hover:bg-panel-light text-cyan border border-cyan/40 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(60,224,232,0.15)] transition-all"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>{t('fieldQrScanner', 'Field QR Scanner')}</span>
          </button>
          <button
            onClick={() => navigate('/admin/incidents')}
            className="py-2.5 px-5 rounded-xl bg-critical hover:bg-critical/90 text-white font-semibold text-xs flex items-center gap-2 shadow-glow-critical transition-all"
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{t('reportRoadIncident', 'Report Road Incident')}</span>
          </button>
        </div>
      </div>

      <ActionRequired items={actionItems} />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('activeInTransit', 'Active In-Transit')}
          value={inTransitShipments.length}
          subtitle={t('gpsContinuousTelemetry', 'GPS Continuous Telemetry')}
          icon={Navigation}
          variant="cyan"
        />
        <StatCard
          title={t('assignedPickups', 'Assigned Pickups')}
          value={pendingPickups.length}
          subtitle={t('awaitingDriverConfirmation', 'Awaiting Driver Confirmation')}
          icon={Truck}
          variant="amber"
        />
        <StatCard
          title={t('discrepancyInquiries', 'Discrepancy Inquiries')}
          value={investigations.length}
          subtitle={t('awaitingYourExplanation', 'Awaiting Your Explanation')}
          icon={FileSearch}
          variant={investigations.length > 0 ? 'critical' : 'emerald'}
        />
        <StatCard
          title={t('securedDeliveries', 'Secured Deliveries')}
          value={shipments.filter((s) => s.status === 'RECEIVED' || s.status === 'TREATED' || s.status === 'DISPOSED').length}
          subtitle={t('weighbridgeIntakeVerified', 'Weighbridge Intake Verified')}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Assigned Routes / Shipments */}
      <div className="glass-panel p-6 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">
              {t('assignedFleetConsignments', 'Assigned Fleet Consignments')}
            </h3>
            <p className="text-xs font-mono text-mist mt-0.5">
              {t('cpcbHazardousMovementManifests', 'CPCB Hazardous Movement Manifests')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shipments.map((shp) => (
            <div
              key={shp.shipmentId}
              className="p-5 rounded-xl bg-black/40 border border-line hover:border-cyan/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-white px-2.5 py-1 rounded bg-panel border border-line">
                    {shp.shipmentId}
                  </span>
                  <StatusBadge status={shp.status} />
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-mist">{t('vehicle', 'Vehicle')}:</span>
                    <span className="text-cyan font-bold truncate">{shp.transporter.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-mist">{t('mass', 'Mass')}:</span>
                    <span className="text-em font-bold">{shp.declaredQuantity} {shp.unit}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-mist">{t('pickupOrg', 'Pickup Org')}:</span>
                    <span className="text-white truncate max-w-[200px]">{shp.originOrganization.name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-mist">{t('destination', 'Destination')}:</span>
                    <span className="text-white truncate max-w-[200px]">{shp.destinationFacility.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
                <button
                  onClick={() => setSelectedQR({ url: shp.qrCode, shipment: shp })}
                  className="p-2 rounded-lg bg-panel hover:bg-panel-light text-mist hover:text-cyan border border-line transition-colors"
                  title="View QR Manifest"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/admin/shipments/${shp.shipmentId}`)}
                  className="py-2 px-4 rounded-lg bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 text-xs font-mono font-medium flex items-center gap-1 transition-colors"
                >
                  <span>{t('openRouteControls', 'Open Route Controls')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedQR && (
        <QRModal
          isOpen={!!selectedQR}
          onClose={() => setSelectedQR(null)}
          qrCodeUrl={selectedQR.url}
          shipment={selectedQR.shipment}
        />
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
