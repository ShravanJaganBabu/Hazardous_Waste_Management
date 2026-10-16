import React from 'react';
import { IShipment } from '../../types';
import { Scale, AlertTriangle, CheckCircle2, ArrowRight, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuantityTracker: React.FC<{ shipment: IShipment }> = ({ shipment }) => {
  const navigate = useNavigate();
  const declared = shipment.declaredQuantity;
  const collected = shipment.collectedQuantity ?? declared;
  const received = shipment.receivedQuantity ?? collected;
  const unit = shipment.unit || 'kg';

  const labToTransporterDiff = Number((collected - declared).toFixed(2));
  const transporterToFacilityDiff = Number((received - collected).toFixed(2));
  const totalDiff = Number((received - declared).toFixed(2));

  const hasMismatch = shipment.discrepancy?.hasMismatch || Math.abs(totalDiff) >= 0.5;
  const investigationId = `INV-${shipment.shipmentId.replace('SHP-', '')}`;

  return (
    <div className={`glass-panel p-6 rounded-2xl border ${hasMismatch ? 'border-alert/50 bg-alert/5' : 'border-line'}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Scale className={`w-5 h-5 ${hasMismatch ? 'text-alert' : 'text-em'}`} />
          <h3 className="font-display font-semibold text-base text-white">
            Mass Balance & Quantity Verification
          </h3>
        </div>
        {hasMismatch ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-alert/20 text-alert border border-alert/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            MISMATCH DETECTED ({totalDiff > 0 ? '+' : ''}{totalDiff} {unit})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-em/15 text-em border border-em/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            MASS BALANCE VERIFIED (100%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Generator Declared */}
        <div className="p-4 rounded-xl bg-black/40 border border-line">
          <p className="text-[10px] font-mono text-mist uppercase">01. GENERATOR DECLARED</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">{declared}</span>
            <span className="text-xs font-mono text-mist">{unit}</span>
          </div>
          <p className="text-xs text-mist/80 mt-1 truncate">{shipment.originOrganization.name}</p>
        </div>

        {/* Stage 2: Transporter Collected */}
        <div className="p-4 rounded-xl bg-black/40 border border-line">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-mist uppercase">02. TRANSPORTER INTAKE</p>
            {shipment.collectedQuantity !== undefined && labToTransporterDiff !== 0 && (
              <span className={`text-[10px] font-mono font-bold ${labToTransporterDiff < 0 ? 'text-alert' : 'text-cyan'}`}>
                {labToTransporterDiff > 0 ? `+${labToTransporterDiff}` : labToTransporterDiff} {unit}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">
              {shipment.collectedQuantity !== undefined ? shipment.collectedQuantity : '—'}
            </span>
            <span className="text-xs font-mono text-mist">{unit}</span>
          </div>
          <p className="text-xs text-mist/80 mt-1 truncate">{shipment.transporter.company}</p>
        </div>

        {/* Stage 3: Facility Received */}
        <div className="p-4 rounded-xl bg-black/40 border border-line">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-mist uppercase">03. FACILITY RECEIVED</p>
            {shipment.receivedQuantity !== undefined && transporterToFacilityDiff !== 0 && (
              <span className={`text-[10px] font-mono font-bold ${transporterToFacilityDiff < 0 ? 'text-alert' : 'text-cyan'}`}>
                {transporterToFacilityDiff > 0 ? `+${transporterToFacilityDiff}` : transporterToFacilityDiff} {unit}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-white">
              {shipment.receivedQuantity !== undefined ? shipment.receivedQuantity : '—'}
            </span>
            <span className="text-xs font-mono text-mist">{unit}</span>
          </div>
          <p className="text-xs text-mist/80 mt-1 truncate">{shipment.destinationFacility.name}</p>
        </div>
      </div>

      {/* Variance summary banner with interactive action button */}
      {hasMismatch && (
        <div className="mt-4 p-4 rounded-xl bg-alert/10 border border-alert/30 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-alert">
          <div className="flex items-start gap-3 leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-white text-sm">Automatic Compliance Inquiry Initiated ({investigationId})</strong>
              <p className="mt-0.5 text-alert/90">
                {shipment.discrepancy?.mismatchReason ||
                  `A net variance of ${totalDiff} ${unit} was recorded between Generator declaration and Facility intake. HazTrack has automatically logged an investigation case.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/admin/investigations/${investigationId}`)}
            className="shrink-0 py-2.5 px-4 rounded-xl bg-alert text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-glow-alert transition-all font-mono"
          >
            <FileSearch className="w-4 h-4" />
            <span>Open Case & Submit Response →</span>
          </button>
        </div>
      )}
    </div>
  );
};
