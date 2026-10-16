import React, { useState } from 'react';
import { QrCode, CheckCircle2, ShieldCheck, Clock, User, MapPin } from 'lucide-react';
import { IShipment } from '../../types';

interface QRChainScannerProps {
  shipment?: IShipment;
  onScanComplete?: (code: string) => void;
}

export const QRChainScanner: React.FC<QRChainScannerProps> = ({ shipment }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'history'>('history');

  const historySteps = [
    { stage: 'LAB / GENERATOR', done: true, time: '16 Sep 2026, 10:15', by: 'HZU-002 (Apex Labs)', loc: 'Chennai Lab' },
    { stage: 'TRANSPORTER INTAKE', done: true, time: '16 Sep 2026, 12:40', by: 'HZU-005 (Shravan)', loc: 'Corridor Gate 1' },
    { stage: 'HIGHWAY CHECKPOINT', done: true, time: '16 Sep 2026, 14:10', by: 'HZU-001 (CPCB Officer)', loc: 'GST Corridor' },
    {
      stage: 'FACILITY RECEIPT',
      done: shipment?.status === 'RECEIVED' || shipment?.status === 'TREATED' || shipment?.status === 'DISPOSED',
      time: shipment?.receivedTime ? new Date(shipment.receivedTime).toLocaleString() : 'Pending verification',
      by: shipment?.destinationFacility?.contactPerson || 'HZU-006 (GreenSafe)',
      loc: 'Intake Bay #2',
    },
    {
      stage: 'NEUTRALIZATION TREATMENT',
      done: shipment?.status === 'TREATED' || shipment?.status === 'DISPOSED',
      time: shipment?.treatmentTime ? new Date(shipment.treatmentTime).toLocaleString() : 'Pending treatment',
      by: 'HZU-006 (GreenSafe)',
      loc: 'Reactor Cell A',
    },
    {
      stage: 'CPCB DISPOSAL CERTIFICATE',
      done: shipment?.status === 'DISPOSED',
      time: shipment?.disposalTime ? new Date(shipment.disposalTime).toLocaleString() : 'Pending certification',
      by: 'CPCB Audit Division',
      loc: 'Secured Landfill Cell',
    },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-6">
      <div className="flex items-center justify-between border-b border-line/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-em/10 border border-em/30 flex items-center justify-center text-em shadow-[0_0_15px_rgba(57,255,176,0.2)]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Cryptographic QR Chain</h3>
            <p className="text-xs font-mono text-mist">
              Tamper-proof multi-checkpoint consignment validation
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-void border border-line text-xs font-mono">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-em text-black font-bold' : 'text-mist hover:text-white'
            }`}
          >
            Audit History
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'qr' ? 'bg-em text-black font-bold' : 'text-mist hover:text-white'
            }`}
          >
            QR Pass
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-void/80 border border-line flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-mist block">NEXT REQUIRED VERIFICATION</span>
              <span className="text-em font-bold">
                {shipment?.status === 'IN_TRANSIT' ? 'FACILITY RECEIPT & WEIGH-IN' : 'AUDIT SEAL CONFIRMED'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-mist block">VERIFIED BY</span>
              <span className="text-white font-bold">{shipment?.transporter?.id || 'HZU-005'}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono text-mist uppercase tracking-wider block">
              Multi-Checkpoint Chain Records:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {historySteps.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border font-mono text-xs flex items-start gap-3 transition-all ${
                    s.done
                      ? 'bg-void/70 border-em/30 shadow-[0_0_10px_rgba(57,255,176,0.08)]'
                      : 'bg-void/30 border-line/40 opacity-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      s.done ? 'bg-em/15 text-em border border-em/40' : 'bg-void text-mist border border-line'
                    }`}
                  >
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-[11px] truncate">{s.stage}</div>
                    <div className="text-[10px] text-mist flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan" />
                      <span>{s.time}</span>
                    </div>
                    <div className="text-[9px] text-em/90 truncate mt-0.5">
                      {s.by} · {s.loc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-4">
          <div className="w-48 h-48 mx-auto bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(57,255,176,0.3)] flex items-center justify-center">
            {shipment?.qrCode ? (
              <img src={shipment.qrCode} alt="Shipment QR" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-32 h-32 text-black" />
            )}
          </div>
          <div className="font-mono text-xs">
            <span className="text-mist block">MANIFEST CODE:</span>
            <span className="text-white font-bold tracking-wider">{shipment?.manifestNumber || 'CPCB-MAN-2026-0042'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
