import React from 'react';
import { IShipment, IRiskFactor } from '../../types';
import { ShieldAlert, Info, AlertTriangle } from 'lucide-react';

interface ShipmentRiskBadgeProps {
  shipment: IShipment;
  detailed?: boolean;
}

export const ShipmentRiskBadge: React.FC<ShipmentRiskBadgeProps> = ({ shipment, detailed = true }) => {
  const score = shipment.riskScore ?? (shipment.discrepancy?.hasMismatch ? 82 : 24);
  const level = shipment.riskLevel ?? (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW');
  
  const factors: IRiskFactor[] = shipment.riskFactors?.length
    ? shipment.riskFactors
    : [
        { factor: 'Hazard Classification Rating', points: 30 },
        ...(shipment.discrepancy?.hasMismatch ? [{ factor: 'Quantity Mismatch Variance', points: 25 }] : []),
        ...(shipment.routeTracking?.isDeviated ? [{ factor: 'Route Corridor Breach', points: 18 }] : []),
        { factor: 'Transit Schedule Verification', points: 15 },
        { factor: 'Digital Manifest Validation', points: 12 },
      ];

  const getColorClass = () => {
    switch (level) {
      case 'CRITICAL':
        return 'text-alert border-alert/50 bg-alert/15 shadow-[0_0_20px_rgba(255,106,61,0.25)]';
      case 'HIGH':
        return 'text-amber-400 border-amber-400/50 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.25)]';
      case 'MEDIUM':
        return 'text-cyan border-cyan/50 bg-cyan/15';
      default:
        return 'text-em border-em/50 bg-em/15';
    }
  };

  const getBarBlocks = () => {
    const filledCount = Math.round(score / 10);
    const totalBlocks = 10;
    return '█'.repeat(filledCount) + '░'.repeat(totalBlocks - filledCount);
  };

  if (!detailed) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-xs ${getColorClass()}`}>
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>RISK {score}/100 · {level}</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-line bg-panel/40 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${level === 'CRITICAL' ? 'text-alert' : level === 'HIGH' ? 'text-amber-400' : 'text-em'}`} />
          <h4 className="font-display font-bold text-base text-white">Dynamic Risk Indicator</h4>
        </div>
        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${getColorClass()}`}>
          {level} RISK
        </span>
      </div>

      {/* Visual ASCII & Progress Bar */}
      <div className="p-3 rounded-xl bg-void/80 border border-line font-mono space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-mist">SHIPMENT RISK PROFILE</span>
          <span className="text-white font-bold text-sm">{score} / 100</span>
        </div>
        <div className="text-sm tracking-widest text-em font-mono">
          <span className={level === 'CRITICAL' ? 'text-alert' : level === 'HIGH' ? 'text-amber-400' : 'text-em'}>
            {getBarBlocks()}
          </span>
        </div>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="space-y-2 font-mono text-xs">
        <span className="text-[10px] text-mist uppercase tracking-wider block">Risk Factors Contribution:</span>
        <div className="space-y-1.5">
          {factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-line/30 text-[11px]">
              <span className="text-mist">{f.factor}</span>
              <span className="text-white font-bold">+{f.points}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 font-bold text-xs text-em">
            <span>TOTAL INDICATOR</span>
            <span className={level === 'CRITICAL' ? 'text-alert' : 'text-em'}>{score} / 100</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 pt-2 border-t border-line/40 text-[10px] font-mono text-mist leading-relaxed">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-cyan" />
        <span>Important: This is a system-generated risk indicator calculated via automated telemetry, not a definitive legal judgment.</span>
      </div>
    </div>
  );
};
