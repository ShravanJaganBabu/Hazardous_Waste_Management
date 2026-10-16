import React from 'react';
import { IShipment, IWaste, WasteStatus } from '../../types';
import { FlaskConical, Package, Truck, Factory, Recycle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ShipmentTimelineProps {
  shipment?: IShipment | null;
  waste?: IWaste | null;
}

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({ shipment, waste }) => {
  const currentStatus = (shipment?.status || waste?.currentStatus || 'REGISTERED') as WasteStatus;

  const steps = [
    {
      key: 'REGISTERED',
      label: 'Generation & Registration',
      sublabel: waste?.organizationName || 'Laboratory Generator',
      time: waste?.registrationDate,
      icon: FlaskConical,
      quantity: `${waste?.declaredQuantity || shipment?.declaredQuantity || 0} ${waste?.unit || shipment?.unit || 'kg'} (Declared)`,
    },
    {
      key: 'COLLECTION_REQUESTED',
      label: 'Collection Request',
      sublabel: shipment?.transporter.company || 'Assigned Logistics',
      time: shipment?.collectionRequestedTime,
      icon: Package,
      quantity: 'Manifest Dispatched',
    },
    {
      key: 'IN_TRANSIT',
      label: 'In Transit (GPS Locked)',
      sublabel: shipment?.transporter.driverName ? `${shipment.transporter.driverName} (${shipment.transporter.vehicleNumber})` : 'Secured Fleet',
      time: shipment?.transitStartTime || shipment?.collectionTime,
      icon: Truck,
      quantity: shipment?.collectedQuantity ? `${shipment.collectedQuantity} ${shipment.unit} (Collected)` : undefined,
    },
    {
      key: 'RECEIVED',
      label: 'Facility Intake & Verification',
      sublabel: shipment?.destinationFacility.name || 'Neutralization Facility',
      time: shipment?.receivedTime,
      icon: Factory,
      quantity: shipment?.receivedQuantity ? `${shipment.receivedQuantity} ${shipment.unit} (Received)` : undefined,
    },
    {
      key: 'TREATED',
      label: 'Neutralization & Treatment',
      sublabel: 'CPCB Chemical Neutralization',
      time: shipment?.treatmentTime,
      icon: Recycle,
      quantity: 'Treatment Verified',
    },
    {
      key: 'DISPOSED',
      label: 'Final Secured Disposal',
      sublabel: 'Destruction Certificate Sealed',
      time: shipment?.disposalTime,
      icon: CheckCircle2,
      quantity: 'End of Life Recorded',
    },
  ];

  const statusOrder: WasteStatus[] = [
    'REGISTERED',
    'COLLECTION_REQUESTED',
    'COLLECTED',
    'IN_TRANSIT',
    'RECEIVED',
    'TREATED',
    'DISPOSED',
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);

  const isCompleted = (stepKey: string) => {
    const stepIdx = statusOrder.indexOf(stepKey as WasteStatus);
    return stepIdx <= currentIndex;
  };

  const isCurrent = (stepKey: string) => {
    return stepKey === currentStatus || (currentStatus === 'COLLECTED' && stepKey === 'IN_TRANSIT');
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-line">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h3 className="font-display font-semibold text-lg text-white">Chain of Custody Timeline</h3>
          <p className="text-xs font-mono text-mist mt-0.5">
            Immutable Multi-Party Cryptographic Verification Ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-em animate-pulse" />
          <span className="text-xs font-mono text-em uppercase">{currentStatus.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Desktop Connector Line */}
        <div className="hidden lg:block absolute top-7 left-8 right-8 h-0.5 bg-line z-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
          {steps.map((step, idx) => {
            const completed = isCompleted(step.key);
            const active = isCurrent(step.key);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-start lg:items-center text-left lg:text-center">
                {/* Icon Circle */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                    active
                      ? 'bg-em/20 border-em text-em shadow-[0_0_25px_rgba(57,255,176,0.35)] animate-pulse'
                      : completed
                      ? 'bg-em-deep/40 border-em/60 text-em-core'
                      : 'bg-void border-line text-mist/50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Step Metadata */}
                <span className="text-[10px] font-mono text-mist mt-3">0{idx + 1}</span>
                <h4
                  className={`text-xs font-semibold mt-0.5 tracking-tight ${
                    active ? 'text-em' : completed ? 'text-white' : 'text-mist/70'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[11px] text-mist mt-1 max-w-[150px] leading-tight truncate">
                  {step.sublabel}
                </p>

                {step.quantity && (
                  <span className="mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-line text-mist">
                    {step.quantity}
                  </span>
                )}

                {step.time ? (
                  <span className="text-[10px] font-mono text-mist/80 mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-em" />
                    {new Date(step.time).toLocaleDateString()} {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-mist/40 mt-1">Pending</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
