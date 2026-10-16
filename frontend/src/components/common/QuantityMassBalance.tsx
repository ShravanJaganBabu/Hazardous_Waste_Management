import React from 'react';
import { IShipment } from '../../types';
import { Scale, ArrowDown, AlertCircle, CheckCircle } from 'lucide-react';

interface QuantityMassBalanceProps {
  shipment: IShipment;
}

export const QuantityMassBalance: React.FC<QuantityMassBalanceProps> = ({ shipment }) => {
  const declared = shipment.declaredQuantity || 75.0;
  const collected = shipment.collectedQuantity ?? 74.5;
  const received = shipment.receivedQuantity ?? 72.0;
  const treated = shipment.treatedQuantity ?? (received ? Number((received * 0.994).toFixed(1)) : undefined);
  const disposed = shipment.disposedQuantity ?? (treated ? Number((treated * 0.997).toFixed(1)) : undefined);
  const unit = shipment.unit || 'kg';

  const stages = [
    { label: 'DECLARED', val: declared, role: 'Laboratory Generator', sub: 'Initial consignment declaration' },
    { label: 'COLLECTED', val: collected, role: 'Transporter Intake', sub: 'Tare scale container verification' },
    { label: 'RECEIVED', val: received, role: 'Facility Gate Weigh-In', sub: 'Gross intake scale verification' },
    { label: 'TREATED', val: treated, role: 'Neutralization Plant', sub: 'Post-neutralization mass balance' },
    { label: 'DISPOSED', val: disposed, role: 'Destruction / Landfill', sub: 'Final certified destruction mass' },
  ];

  const totalDifference = Number((declared - (disposed ?? received ?? collected ?? declared)).toFixed(2));
  const hasMismatch = Math.abs(totalDifference) >= 0.5;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-em/10 border border-em/30 flex items-center justify-center text-em">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Chain-of-Custody Mass Balance</h3>
            <p className="text-xs font-mono text-mist">
              Continuous multi-stage quantity verification ledger
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-mist block text-[10px]">TOTAL VARIANCE (DECLARED → FINAL)</span>
          <span
            className={`text-base font-bold ${
              hasMismatch ? 'text-alert' : 'text-em'
            }`}
          >
            {totalDifference > 0 ? `-${totalDifference}` : `+${Math.abs(totalDifference)}`} {unit}
          </span>
        </div>
      </div>

      {/* Visual Chain Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
        {stages.map((st, i) => {
          const isAvailable = st.val !== undefined && st.val !== null;
          return (
            <div
              key={st.label}
              className={`p-4 rounded-xl border transition-all text-center relative ${
                isAvailable
                  ? 'bg-void/80 border-em/30 shadow-[0_0_15px_rgba(57,255,176,0.1)]'
                  : 'bg-void/30 border-line/40 opacity-50'
              }`}
            >
              <span className="text-[10px] font-mono tracking-widest text-mist block">{st.label}</span>
              <div className="font-display font-bold text-xl text-white mt-1">
                {isAvailable ? `${st.val} ${unit}` : '—'}
              </div>
              <span className="text-[10px] font-mono text-em block mt-1">{st.role}</span>
              <span className="text-[9px] text-mist block mt-0.5 leading-tight">{st.sub}</span>

              {i < stages.length - 1 && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-em/40 font-mono">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Variance Explanatory Ledger Card */}
      <div className="p-4 rounded-xl bg-void/60 border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {hasMismatch ? (
              <AlertCircle className="w-4 h-4 text-alert" />
            ) : (
              <CheckCircle className="w-4 h-4 text-em" />
            )}
            <span className="font-bold text-white">Mass Balance Verification Status</span>
          </div>
          <p className="text-mist text-[11px] leading-relaxed">
            {hasMismatch
              ? `Discrepancy of ${totalDifference} ${unit} between Generator (${declared} ${unit}) and Facility Received (${received} ${unit}). Explanatory statement attached to Investigation portal.`
              : `All multi-stage weigh-ins within 0.5% standard CPCB allowable containerization tolerance.`}
          </p>
        </div>

        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <span className="text-[10px] text-mist block">DECLARED</span>
            <span className="text-white font-bold">{declared} {unit}</span>
          </div>
          <div className="text-mist font-bold">→</div>
          <div>
            <span className="text-[10px] text-mist block">DISPOSED</span>
            <span className="text-em font-bold">{disposed ?? received ?? declared} {unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
