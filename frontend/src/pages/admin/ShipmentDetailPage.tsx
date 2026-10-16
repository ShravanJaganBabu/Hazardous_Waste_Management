import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import { IShipment, IWaste } from '../../types';
import { ShipmentTimeline } from '../../components/tracking/ShipmentTimeline';
import { QuantityTracker } from '../../components/tracking/QuantityTracker';
import { ShipmentVisualJourney } from '../../components/common/ShipmentVisualJourney';
import { QuantityMassBalance } from '../../components/common/QuantityMassBalance';
import { ShipmentRiskBadge } from '../../components/common/ShipmentRiskBadge';
import { QRChainScanner } from '../../components/common/QRChainScanner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { QRModal } from '../../components/qr/QRModal';
import { Modal } from '../../components/common/Modal';
import {
  Truck,
  Building2,
  Factory,
  QrCode,
  ArrowLeft,
  Navigation,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Recycle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVoiceAlert } from '../../context/VoiceAlertContext';

export const ShipmentDetailPage: React.FC = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const { user } = useAuth();
  const { playVoiceAlert } = useVoiceAlert();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<IShipment | null>(null);
  const [waste, setWaste] = useState<IWaste | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Action Modals
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState({
    collectedQuantity: 0,
    receivedQuantity: 0,
    treatmentMethod: 'High-Temperature Thermal Neutralization & Precipitation',
    disposalMethod: 'Secured Engineered Landfill Encapsulation (Cell #4)',
    notes: '',
  });

  const fetchDetails = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const data = await shipmentService.getShipmentById(shipmentId);
      setShipment(data.shipment);
      setWaste(data.waste);
      setActionInput((prev) => ({
        ...prev,
        collectedQuantity: data.shipment.collectedQuantity || data.shipment.declaredQuantity,
        receivedQuantity: data.shipment.receivedQuantity || data.shipment.collectedQuantity || data.shipment.declaredQuantity,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-2 border-em/20 border-t-em rounded-full animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-20 text-center text-mist font-mono">
        Shipment consignment not found.
      </div>
    );
  }

  const handleConfirmAction = async () => {
    setSubmitting(true);
    setActionError('');
    try {
      if (actionModal === 'COLLECT') {
        await shipmentService.confirmCollection(shipment.shipmentId, {
          collectedQuantity: Number(actionInput.collectedQuantity),
          notes: actionInput.notes,
        });
        playVoiceAlert(`Consignment ${shipment.shipmentId} pickup verified and GPS route locked.`, 'INFO');
      } else if (actionModal === 'RECEIVE') {
        await shipmentService.confirmReceipt(shipment.shipmentId, {
          receivedQuantity: Number(actionInput.receivedQuantity),
          notes: actionInput.notes,
        });
        playVoiceAlert(`Consignment ${shipment.shipmentId} verified at treatment plant weighbridge.`, 'INFO');
      } else if (actionModal === 'TREAT') {
        await shipmentService.recordTreatment(shipment.shipmentId, {
          treatmentMethod: actionInput.treatmentMethod,
          notes: actionInput.notes,
        });
        playVoiceAlert(`Chemical neutralization completed and sealed for consignment ${shipment.shipmentId}.`, 'INFO');
      } else if (actionModal === 'DISPOSE') {
        await shipmentService.recordDisposal(shipment.shipmentId, {
          disposalMethod: actionInput.disposalMethod,
          notes: actionInput.notes,
        });
        playVoiceAlert(`Certificate of final destruction issued for consignment ${shipment.shipmentId}.`, 'INFO');
      }
      setActionModal(null);
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to update consignment status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-panel hover:bg-panel-light border border-line text-mist hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{shipment.shipmentId}</span>
              <span className="text-xs font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/30">
                {shipment.manifestNumber}
              </span>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-xs font-mono text-mist mt-1">
              Secured CPCB Multi-Node Electronic Tracking Manifest
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-panel hover:bg-panel-light text-em border border-em/40 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,176,0.15)] transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Consignment QR Manifest</span>
          </button>

          {/* Quick Lifecycle Advance Buttons */}
          {shipment.status === 'COLLECTION_REQUESTED' && (user?.role === 'TRANSPORTER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActionModal('COLLECT')}
              className="py-2.5 px-5 rounded-xl bg-cyan hover:bg-cyan/90 text-black font-semibold text-xs shadow-glow-cyan transition-all flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Confirm Pickup & Start Transit</span>
            </button>
          )}

          {shipment.status === 'IN_TRANSIT' && (user?.role === 'TREATMENT_FACILITY' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActionModal('RECEIVE')}
              className="py-2.5 px-5 rounded-xl bg-em hover:bg-em/90 text-black font-semibold text-xs shadow-glow-em transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Receipt & Verify Mass</span>
            </button>
          )}

          {shipment.status === 'RECEIVED' && (user?.role === 'TREATMENT_FACILITY' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActionModal('TREAT')}
              className="py-2.5 px-5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>Start Neutralization Process</span>
            </button>
          )}

          {shipment.status === 'TREATED' && (user?.role === 'TREATMENT_FACILITY' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setActionModal('DISPOSE')}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Recycle className="w-4 h-4" />
              <span>Record Final Disposal & Seal</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Visual Journey & Dynamic Risk Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShipmentVisualJourney shipment={shipment} />
        </div>
        <div className="lg:col-span-1">
          <ShipmentRiskBadge shipment={shipment} />
        </div>
      </div>

      {/* Chain-of-Custody Mass Balance Breakdown */}
      <QuantityMassBalance shipment={shipment} />

      {/* Cryptographic QR Chain Audit History */}
      <QRChainScanner shipment={shipment} />

      {/* Three-Column Stakeholder Node Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Node */}
        <div className="glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line text-xs font-mono text-mist uppercase">
              <Building2 className="w-4 h-4 text-em" />
              <span>01. ORIGIN CONSIGNOR</span>
            </div>
            <h4 className="font-display font-semibold text-base text-white">
              {shipment.originOrganization.name}
            </h4>
            <p className="text-xs text-mist mt-1 leading-relaxed">
              {shipment.originOrganization.location}
            </p>

            <div className="mt-4 pt-3 border-t border-line/60 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-mist">Contact Person:</span>
                <span className="text-white">{shipment.originOrganization.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Phone:</span>
                <span className="text-white">{shipment.originOrganization.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Hazard Class:</span>
                <span className="text-alert font-bold">{waste?.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transporter Fleet Node */}
        <div className="glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line text-xs font-mono text-mist uppercase">
              <Truck className="w-4 h-4 text-cyan" />
              <span>02. SECURE LOGISTICS FLEET</span>
            </div>
            <h4 className="font-display font-semibold text-base text-white">
              {shipment.transporter.company}
            </h4>
            <p className="text-xs text-mist mt-1 leading-relaxed">
              Driver: {shipment.transporter.driverName} ({shipment.transporter.driverPhone})
            </p>

            <div className="mt-4 pt-3 border-t border-line/60 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-mist">Vehicle Number:</span>
                <span className="text-cyan font-bold">{shipment.transporter.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Vehicle Profile:</span>
                <span className="text-white truncate max-w-[150px]">{shipment.transporter.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">GPS Telemetry:</span>
                <span className="text-em flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Live Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Facility Node */}
        <div className="glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line text-xs font-mono text-mist uppercase">
              <Factory className="w-4 h-4 text-em-core" />
              <span>03. TREATMENT & DISPOSAL PLANT</span>
            </div>
            <h4 className="font-display font-semibold text-base text-white">
              {shipment.destinationFacility.name}
            </h4>
            <p className="text-xs text-mist mt-1 leading-relaxed">
              {shipment.destinationFacility.location}
            </p>

            <div className="mt-4 pt-3 border-t border-line/60 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-mist">Facility Type:</span>
                <span className="text-white truncate max-w-[150px]">{shipment.destinationFacility.facilityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Plant Superintendent:</span>
                <span className="text-white">{shipment.destinationFacility.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Environmental Seal:</span>
                <span className="text-em">CPCB Form 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Dialog Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => {
          setActionModal(null);
          setActionError('');
        }}
        title={
          actionModal === 'COLLECT'
            ? 'Confirm Consignment Collection'
            : actionModal === 'RECEIVE'
            ? 'Confirm Facility Receipt & Weighbridge Intake'
            : actionModal === 'TREAT'
            ? 'Record Chemical Neutralization Treatment'
            : 'Issue Certificate of Final Disposal'
        }
        subtitle={`Shipment ${shipment.shipmentId}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-critical/15 border border-critical text-critical text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionModal === 'COLLECT' && (
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Verified Collected Quantity ({shipment.unit}) *
              </label>
              <input
                type="number"
                step="0.1"
                value={actionInput.collectedQuantity}
                onChange={(e) => setActionInput({ ...actionInput, collectedQuantity: Number(e.target.value) })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan"
              />
            </div>
          )}

          {actionModal === 'RECEIVE' && (
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Weighbridge Received Quantity ({shipment.unit}) *
              </label>
              <input
                type="number"
                step="0.1"
                value={actionInput.receivedQuantity}
                onChange={(e) => setActionInput({ ...actionInput, receivedQuantity: Number(e.target.value) })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              />
              <p className="text-[11px] font-mono text-mist mt-1">
                Note: Deviations &gt; 0.5 kg from declared ({shipment.declaredQuantity} {shipment.unit}) will automatically trigger an investigation case.
              </p>
            </div>
          )}

          {actionModal === 'TREAT' && (
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Neutralization Method *
              </label>
              <input
                type="text"
                value={actionInput.treatmentMethod}
                onChange={(e) => setActionInput({ ...actionInput, treatmentMethod: e.target.value })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {actionModal === 'DISPOSE' && (
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Disposal / Encapsulation Cell *
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
              Ledger Remarks / Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Container verified intact, seals unbroken."
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
                setActionModal(null);
                setActionError('');
              }}
              className="py-2.5 px-4 rounded-xl border border-line text-mist hover:text-white text-xs font-mono disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmAction}
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

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          qrCodeUrl={shipment.qrCode}
          shipment={shipment}
          waste={waste}
        />
      )}
    </div>
  );
};
