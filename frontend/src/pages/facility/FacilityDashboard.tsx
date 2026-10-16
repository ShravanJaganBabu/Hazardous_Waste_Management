import React, { useEffect, useState } from 'react';
import { shipmentService } from '../../services/shipmentService';
import { IShipment } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionRequired, ActionItem } from '../../components/common/ActionRequired';
import { QRModal } from '../../components/qr/QRModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { Modal } from '../../components/common/Modal';
import {
  Factory,
  Scale,
  Flame,
  Recycle,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVoiceAlert } from '../../context/VoiceAlertContext';
import { useNavigate } from 'react-router-dom';

export const FacilityDashboard: React.FC = () => {
  const { user } = useAuth();
  const { playVoiceAlert } = useVoiceAlert();
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ url: string; shipment: IShipment } | null>(null);

  // Active Action Modal State
  const [activeModalShipment, setActiveModalShipment] = useState<IShipment | null>(null);
  const [actionType, setActionType] = useState<'RECEIVE' | 'TREAT' | 'DISPOSE' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form Inputs
  const [actionInput, setActionInput] = useState({
    receivedQuantity: 0,
    treatmentMethod: 'Acid-Base Chemical Neutralization & Hydroxide Precipitation',
    disposalMethod: 'Secured Engineered Hazardous Landfill Encapsulation (Cell #4)',
    notes: '',
  });

  const navigate = useNavigate();

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getShipments();
      setShipments(data.shipments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const awaitingVerification = shipments.filter((s) => s.status === 'IN_TRANSIT');
  const awaitingTreatment = shipments.filter((s) => s.status === 'RECEIVED');
  const awaitingDisposal = shipments.filter((s) => s.status === 'TREATED');

  const openActionModal = (shipment: IShipment, type: 'RECEIVE' | 'TREAT' | 'DISPOSE') => {
    setActiveModalShipment(shipment);
    setActionType(type);
    setModalError('');
    setActionInput({
      receivedQuantity: shipment.receivedQuantity || shipment.collectedQuantity || shipment.declaredQuantity,
      treatmentMethod: 'Acid-Base Chemical Neutralization & Hydroxide Precipitation',
      disposalMethod: 'Secured Engineered Hazardous Landfill Encapsulation (Cell #4)',
      notes: '',
    });
  };

  const handleExecuteAction = async () => {
    if (!activeModalShipment || !actionType) return;
    setSubmitting(true);
    setModalError('');

    try {
      if (actionType === 'RECEIVE') {
        const receivedQty = Number(actionInput.receivedQuantity);
        const declaredQty = activeModalShipment.declaredQuantity;
        const diff = Math.abs(receivedQty - declaredQty);

        await shipmentService.confirmReceipt(activeModalShipment.shipmentId, {
          receivedQuantity: receivedQty,
          notes: actionInput.notes,
        });

        if (diff >= 0.5) {
          setSuccessToast(`Mass discrepancy (${diff.toFixed(1)} kg) detected on ${activeModalShipment.shipmentId}. Formal investigation initiated.`);
        } else {
          setSuccessToast(`Weighbridge intake verified for ${activeModalShipment.shipmentId}`);
          playVoiceAlert(`Consignment ${activeModalShipment.shipmentId} intake verified at weighbridge.`, 'INFO');
        }
      } else if (actionType === 'TREAT') {
        await shipmentService.recordTreatment(activeModalShipment.shipmentId, {
          treatmentMethod: actionInput.treatmentMethod,
          notes: actionInput.notes,
        });
        setSuccessToast(`Chemical neutralization completed for ${activeModalShipment.shipmentId}`);
        playVoiceAlert(`Chemical neutralization recorded and locked in ledger for consignment ${activeModalShipment.shipmentId}.`, 'INFO');
      } else if (actionType === 'DISPOSE') {
        await shipmentService.recordDisposal(activeModalShipment.shipmentId, {
          disposalMethod: actionInput.disposalMethod,
          notes: actionInput.notes,
        });
        setSuccessToast(`Certificate of Final Disposal sealed for ${activeModalShipment.shipmentId}`);
        playVoiceAlert(`Certificate of final disposal sealed for consignment ${activeModalShipment.shipmentId}.`, 'INFO');
      }

      setActiveModalShipment(null);
      setActionType(null);
      await fetchShipments();
      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Action execution failed. Please check permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const actionItems: ActionItem[] = [
    ...awaitingTreatment.map((s) => ({
      id: s.shipmentId,
      severity: 'WARNING' as const,
      title: `Neutralization Queued: ${s.shipmentId}`,
      description: `Weighbridge intake complete (${s.receivedQuantity || s.declaredQuantity} ${s.unit}). Consignment ready in treatment reactor.`,
      timeAgo: 'Intake Verified',
      actionUrl: `/admin/shipments/${s.shipmentId}`,
      actionLabel: 'Commence Neutralization',
    })),
    ...awaitingVerification.map((s) => ({
      id: s.shipmentId,
      severity: 'CRITICAL' as const,
      title: `Arrival Checkpoint Intake: ${s.shipmentId}`,
      description: `${s.transporter.company} vehicle ${s.transporter.vehicleNumber} arriving with ${s.declaredQuantity} ${s.unit}.`,
      timeAgo: 'En Route',
      actionUrl: `/admin/shipments/${s.shipmentId}`,
      actionLabel: 'Weighbridge Intake & Verify Mass',
    })),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em uppercase tracking-widest">
            <Factory className="w-4 h-4" />
            <span>TREATMENT & RECOVERY PLANT // {user?.organizationName}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Weighbridge Intake & Neutralization Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-panel hover:bg-panel-light text-em border border-em/40 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,176,0.15)] transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Intake QR Scanner</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-em/15 border border-em text-white text-sm font-mono flex items-center justify-between shadow-glow-em animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-em" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-mist hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      <ActionRequired items={actionItems} />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Awaiting Mass Intake"
          value={awaitingVerification.length}
          subtitle="En Route to Gate"
          icon={Scale}
          variant="amber"
        />
        <StatCard
          title="Under Neutralization"
          value={awaitingTreatment.length}
          subtitle="Processing Reactors"
          icon={Flame}
          variant="cyan"
        />
        <StatCard
          title="Disposed & Certified"
          value={shipments.filter((s) => s.status === 'DISPOSED').length}
          subtitle="Certificate Sealed"
          icon={Recycle}
          variant="emerald"
        />
      </div>

      {/* Facility Shipments Queue */}
      <div className="glass-panel p-6 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">
              Facility Processing Queue
            </h3>
            <p className="text-xs font-mono text-mist mt-0.5">
              CPCB Hazardous Intake & Neutralization Ledger
            </p>
          </div>
        </div>

        {shipments.length === 0 && !loading ? (
          <div className="py-12 text-center text-mist font-mono text-xs">
            No active consignments allocated to this facility.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipments.map((shp) => (
              <div
                key={shp.shipmentId}
                className="p-5 rounded-2xl bg-black/40 border border-line hover:border-em/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-white px-2.5 py-1 rounded bg-panel border border-line">
                      {shp.shipmentId}
                    </span>
                    <StatusBadge status={shp.status} />
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-mist">Generator Org:</span>
                      <span className="text-white truncate max-w-[180px]">{shp.originOrganization.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist">Declared Mass:</span>
                      <span className="text-em font-bold">{shp.declaredQuantity} {shp.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist">Weighbridge Intake:</span>
                      <span className="text-cyan font-bold">{shp.receivedQuantity ? `${shp.receivedQuantity} ${shp.unit}` : 'Pending Intake'}</span>
                    </div>
                    {shp.treatmentMethod && (
                      <div className="flex justify-between">
                        <span className="text-mist">Treatment Method:</span>
                        <span className="text-purple-400 font-medium truncate max-w-[170px]">{shp.treatmentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQR({ url: shp.qrCode, shipment: shp })}
                      title="View QR Manifest"
                      className="p-2 rounded-lg bg-panel hover:bg-panel-light text-mist hover:text-em border border-line"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/shipments/${shp.shipmentId}`)}
                      className="text-xs font-mono text-mist hover:text-white underline px-1"
                    >
                      Details
                    </button>
                  </div>

                  {/* Direct Action Buttons by Lifecycle Stage */}
                  {shp.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => openActionModal(shp, 'RECEIVE')}
                      className="py-2 px-3.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Intake & Verify</span>
                    </button>
                  )}

                  {shp.status === 'RECEIVED' && (
                    <button
                      onClick={() => openActionModal(shp, 'TREAT')}
                      className="py-2 px-3.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-glow-alert"
                    >
                      <Flame className="w-3.5 h-3.5 text-purple-400" />
                      <span>Commence Neutralization</span>
                    </button>
                  )}

                  {shp.status === 'TREATED' && (
                    <button
                      onClick={() => openActionModal(shp, 'DISPOSE')}
                      className="py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Recycle className="w-3.5 h-3.5" />
                      <span>Record Disposal</span>
                    </button>
                  )}

                  {shp.status === 'DISPOSED' && (
                    <span className="text-[11px] font-mono text-em flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Destruction Sealed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Execution Modal */}
      {activeModalShipment && actionType && (
        <Modal
          isOpen={!!activeModalShipment}
          onClose={() => {
            setActiveModalShipment(null);
            setActionType(null);
          }}
          title={
            actionType === 'RECEIVE'
              ? 'Confirm Weighbridge Intake & Mass'
              : actionType === 'TREAT'
              ? 'Commence Chemical Neutralization Process'
              : 'Issue Certificate of Final Disposal'
          }
          subtitle={`Consignment ${activeModalShipment.shipmentId} — Declared: ${activeModalShipment.declaredQuantity} ${activeModalShipment.unit}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-critical/15 border border-critical text-critical text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {actionType === 'RECEIVE' && (
              <div>
                <label className="block text-xs font-mono text-mist uppercase mb-1">
                  Weighbridge Measured Weight ({activeModalShipment.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={actionInput.receivedQuantity}
                  onChange={(e) => setActionInput({ ...actionInput, receivedQuantity: Number(e.target.value) })}
                  className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan"
                />
                <p className="text-[11px] font-mono text-mist mt-1">
                  Note: Variances &gt; 0.5 kg from declared ({activeModalShipment.declaredQuantity} {activeModalShipment.unit}) automatically flag an investigation.
                </p>
              </div>
            )}

            {actionType === 'TREAT' && (
              <div>
                <label className="block text-xs font-mono text-mist uppercase mb-1">
                  Neutralization / Treatment Protocol *
                </label>
                <select
                  value={actionInput.treatmentMethod}
                  onChange={(e) => setActionInput({ ...actionInput, treatmentMethod: e.target.value })}
                  className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 mb-2"
                >
                  <option value="Acid-Base Chemical Neutralization & Hydroxide Precipitation">
                    Acid-Base Neutralization & Precipitation
                  </option>
                  <option value="High-Temperature Thermal Incineration (1200°C)">
                    High-Temperature Thermal Incineration (1200°C)
                  </option>
                  <option value="Chemical Oxidation & Alkaline Cyanide Destruction">
                    Alkaline Chlorination / Cyanide Oxidation
                  </option>
                  <option value="Heavy Metal Solidification & Polymer Matrix Encapsulation">
                    Stabilization & Polymer Matrix Fixation
                  </option>
                  <option value="Organic Solvent Recovery & Thermal Desorption">
                    Thermal Desorption & Solvent Recovery
                  </option>
                </select>
              </div>
            )}

            {actionType === 'DISPOSE' && (
              <div>
                <label className="block text-xs font-mono text-mist uppercase mb-1">
                  Permanent Encapsulation / Landfill Cell *
                </label>
                <input
                  type="text"
                  value={actionInput.disposalMethod}
                  onChange={(e) => setActionInput({ ...actionInput, disposalMethod: e.target.value })}
                  className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Facility Operator Notes / Observations
              </label>
              <textarea
                rows={3}
                placeholder="e.g. pH neutralized to 7.2. Heavy metals precipitated and filter cake transferred to secondary containment."
                value={actionInput.notes}
                onChange={(e) => setActionInput({ ...actionInput, notes: e.target.value })}
                className="w-full bg-black/50 border border-line rounded-xl p-3 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-line/60">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setActiveModalShipment(null);
                  setActionType(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-line text-mist hover:text-white text-xs font-mono disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteAction}
                className="py-2.5 px-6 rounded-xl bg-em text-black font-semibold text-xs shadow-glow-em hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign & Lock Transition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
        onActionTriggered={(shipment, type) => {
          setIsScannerOpen(false);
          openActionModal(shipment, type);
        }}
      />
    </div>
  );
};
