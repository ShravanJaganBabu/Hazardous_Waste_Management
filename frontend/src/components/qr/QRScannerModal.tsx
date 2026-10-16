import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowRight, Truck, Building2, Scale, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import { IShipment, IWaste } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface LookupResponse {
  type: 'SHIPMENT' | 'WASTE';
  identifier: string;
  shipment: IShipment | null;
  waste: IWaste | null;
  allowedActions: string[];
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (result: { shipment: IShipment | null; waste: IWaste | null }) => void;
  onActionTriggered?: (shipment: IShipment, actionType: 'RECEIVE' | 'TREAT' | 'DISPOSE') => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onActionTriggered,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LookupResponse | null>(null);

  const resetState = () => {
    setManualCode('');
    setError('');
    setResult(null);
    setLoading(false);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleLookup = async (codeToLookup: string) => {
    let clean = codeToLookup.trim();
    if (!clean) {
      setError(t('noIdentifierError', 'Please enter a valid Shipment ID, Waste ID, or Manifest Number.'));
      setResult(null);
      return;
    }

    // Normalization: Extract identifier if JSON QR payload or URL was scanned
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        clean = parsed.shipmentId || parsed.wasteId || parsed.manifestNumber || clean;
      } catch {}
    }
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const parts = clean.split('/');
      clean = parts[parts.length - 1] || clean;
    }
    clean = clean.split('?')[0].split('#')[0].trim();

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await shipmentService.lookupIdentifier(clean);
      setResult(data);
      if (onScanSuccess) {
        onScanSuccess({ shipment: data.shipment, waste: data.waste });
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        `No hazardous waste manifest or shipment found for identifier "${clean}".`;
      setError(errMsg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Real verified seeded database records for demo tags
  const sampleQRs = [
    { label: 'In-Transit Consignment (250 kg)', id: 'SHP-2026-000103', type: 'Acid Carrier' },
    { label: 'Intake Verified Consignment (75 kg)', id: 'SHP-2026-000104', type: 'Lead Sludge' },
    { label: 'Pending Pickup Consignment (85 kg)', id: 'SHP-2026-000102', type: 'Organic Solvents' },
    { label: 'Registered Waste Manifest (120 kg)', id: 'HW-2026-000101', type: 'Heavy Metal Sludge' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={t('fieldQrScannerTitle', 'Field QR Scanner & Lookup')}
      subtitle={t('fieldQrScannerSubtitle', 'Identify Waste Manifests & Consignments in Real-Time')}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Optical Sensor Simulator */}
        <div className="relative aspect-video max-h-48 w-full rounded-2xl bg-black/80 border border-line flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-em shadow-[0_0_15px_#39ffb0] animate-bounce" />
          <QrCode className="w-16 h-16 text-em/40 animate-pulse" />
          <p className="mt-2 text-xs font-mono text-mist px-4 text-center">
            {t('opticalSensorStandby', 'Optical Sensor Simulation — Enter Identifier or Select Demo Manifest')}
          </p>
        </div>

        {/* Manual Barcode / Identifier Input */}
        <div>
          <label className="block text-xs font-mono text-mist uppercase mb-1.5">
            {t('manualIdentifierInput', 'Manual Identifier Input')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('scannerPlaceholder', 'e.g. SHP-2026-000103 or HW-2026-000101')}
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLookup(manualCode);
                }
              }}
              className="flex-1 bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
            />
            <button
              onClick={() => handleLookup(manualCode)}
              disabled={loading}
              className="py-2.5 px-5 rounded-xl bg-em text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-em/90 transition-colors shadow-glow-em disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t('scanButton', 'Scan')}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-2 p-3 rounded-xl bg-critical/10 border border-critical/40 text-critical text-xs font-mono flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Real Lookup Record Result Display */}
        {result && (
          <div className="p-4 rounded-xl bg-panel/90 border border-em/40 shadow-[0_0_20px_rgba(57,255,176,0.1)] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-line flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-em" />
                <span className="text-xs font-mono font-bold text-em tracking-wider uppercase">
                  {t('scannedRecordFound', 'MATCHING RECORD VERIFIED')}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/60 border border-line text-xs font-mono font-bold text-white">
                  {result.shipment?.shipmentId || result.waste?.wasteId}
                </span>
              </div>
              <StatusBadge status={result.shipment?.status || result.waste?.currentStatus || 'REGISTERED'} />
            </div>

            {/* Manifest & Chemical Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-line">
                <div className="flex justify-between">
                  <span className="text-mist">{t('wasteTypeLabel', 'Waste Type')}:</span>
                  <span className="text-white font-bold truncate max-w-[170px]">
                    {result.waste?.wasteType || 'Hazardous Chemical Residue'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mist">{t('manifestNumberLabel', 'Manifest No')}:</span>
                  <span className="text-cyan font-bold">
                    {result.shipment?.manifestNumber || (result.waste?.activeShipmentId ? `MNF-${result.waste.activeShipmentId}` : 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mist">{t('mass', 'Mass')}:</span>
                  <span className="text-em font-bold">
                    {result.shipment?.declaredQuantity || result.waste?.declaredQuantity}{' '}
                    {result.shipment?.unit || result.waste?.unit || 'kg'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-line">
                <div className="flex justify-between">
                  <span className="text-mist">{t('pickupOrg', 'Generator Org')}:</span>
                  <span className="text-white truncate max-w-[170px]">
                    {result.shipment?.originOrganization?.name || result.waste?.organizationName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mist">{t('vehicle', 'Transporter')}:</span>
                  <span className="text-cyan truncate max-w-[170px]">
                    {result.shipment?.transporter?.company
                      ? `${result.shipment.transporter.company} (${result.shipment.transporter.vehicleNumber})`
                      : 'Pending Assignment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mist">{t('destination', 'Facility')}:</span>
                  <span className="text-white truncate max-w-[170px]">
                    {result.shipment?.destinationFacility?.name || 'Authorized CPCB TSDF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Permitted Operational Action Buttons */}
            <div className="pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Facility Actions */}
                {result.allowedActions.includes('RECEIVE') && (
                  <button
                    onClick={() => {
                      if (onActionTriggered && result.shipment) {
                        onActionTriggered(result.shipment, 'RECEIVE');
                        handleModalClose();
                      } else if (result.shipment) {
                        navigate(`/admin/shipments/${result.shipment.shipmentId}`);
                        handleModalClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-em text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-em/90 transition-all shadow-glow-em"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('verifyWeighbridgeIntake', 'Verify Weighbridge Intake')}</span>
                  </button>
                )}

                {result.allowedActions.includes('TREAT') && (
                  <button
                    onClick={() => {
                      if (onActionTriggered && result.shipment) {
                        onActionTriggered(result.shipment, 'TREAT');
                        handleModalClose();
                      } else if (result.shipment) {
                        navigate(`/admin/shipments/${result.shipment.shipmentId}`);
                        handleModalClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-cyan text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-cyan/90 transition-all shadow-glow-cyan"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('commenceNeutralization', 'Commence Neutralization')}</span>
                  </button>
                )}

                {result.allowedActions.includes('DISPOSE') && (
                  <button
                    onClick={() => {
                      if (onActionTriggered && result.shipment) {
                        onActionTriggered(result.shipment, 'DISPOSE');
                        handleModalClose();
                      } else if (result.shipment) {
                        navigate(`/admin/shipments/${result.shipment.shipmentId}`);
                        handleModalClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-purple-600 transition-all shadow-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('sealFinalDisposal', 'Seal Final Disposal Certificate')}</span>
                  </button>
                )}

                {/* Transporter Actions */}
                {result.allowedActions.includes('PICKUP') && (
                  <button
                    onClick={() => {
                      if (result.shipment) {
                        navigate(`/admin/shipments/${result.shipment.shipmentId}`);
                        handleModalClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-amber-500 text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-all"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('acceptConsignmentPickup', 'Accept Consignment Pickup')}</span>
                  </button>
                )}

                {result.allowedActions.includes('COLLECT') && (
                  <button
                    onClick={() => {
                      if (result.shipment) {
                        navigate(`/admin/shipments/${result.shipment.shipmentId}`);
                        handleModalClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-cyan text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-cyan/90 transition-all shadow-glow-cyan"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('confirmCollectionTransit', 'Confirm Collection & Start Transit')}</span>
                  </button>
                )}
              </div>

              {/* View Ledger Route Controls */}
              {result.shipment && (
                <button
                  onClick={() => {
                    navigate(`/admin/shipments/${result.shipment!.shipmentId}`);
                    handleModalClose();
                  }}
                  className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-mist hover:text-white border border-line text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <span>{t('viewDigitalLedger', 'View Full Digital Ledger →')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Demo Scan Tags Connected to Real Seeded Records */}
        <div className="pt-4 border-t border-line">
          <p className="text-[10px] font-mono tracking-wider text-mist uppercase mb-2">
            {t('simulateDemoTags', 'Verified Seeded Manifest Tags (Demo Presets):')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleQRs.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setManualCode(sample.id);
                  handleLookup(sample.id);
                }}
                className="p-2.5 rounded-xl bg-panel hover:bg-panel-light border border-line hover:border-em/40 text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-em transition-colors">
                    {sample.label}
                  </p>
                  <p className="text-[10px] font-mono text-cyan">{sample.id}</p>
                </div>
                <span className="text-[10px] font-mono text-mist bg-white/5 px-2 py-1 rounded group-hover:bg-em/15 group-hover:text-em transition-colors">
                  {t('simulateScan', 'Simulate Scan →')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
