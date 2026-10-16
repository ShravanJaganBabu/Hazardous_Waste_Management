import React from 'react';
import { IShipment } from '../../types';
import { Truck, MapPin, AlertTriangle, CheckCircle2, Clock, Navigation } from 'lucide-react';

interface ShipmentVisualJourneyProps {
  shipment: IShipment;
}

export const ShipmentVisualJourney: React.FC<ShipmentVisualJourneyProps> = ({ shipment }) => {
  const steps = [
    { key: 'REGISTERED', label: 'LAB / ORIGIN', sub: shipment.originOrganization?.name || 'Generator Lab' },
    { key: 'COLLECTED', label: 'PICKUP', sub: 'Container Intake' },
    { key: 'IN_TRANSIT', label: 'TRANSIT', sub: `${shipment.transporter?.vehicleNumber || 'Vehicle'} On Route` },
    { key: 'RECEIVED', label: 'FACILITY', sub: shipment.destinationFacility?.name || 'Treatment Facility' },
    { key: 'DISPOSED', label: 'DISPOSAL', sub: 'CPCB Certified' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'REGISTERED':
      case 'COLLECTION_REQUESTED':
        return 0;
      case 'COLLECTED':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'RECEIVED':
      case 'TREATED':
        return 3;
      case 'DISPOSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(shipment.status);
  const isDeviated = shipment.routeTracking?.isDeviated ?? false;
  const deviationDistance = shipment.routeTracking?.deviationDistanceKm ?? 4.2;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-em" />
            <h3 className="font-display font-bold text-lg text-white">Live Shipment Journey</h3>
          </div>
          <p className="text-xs font-mono text-mist mt-0.5">
            CONSIGNMENT: {shipment.shipmentId} · VEHICLE: {shipment.transporter?.vehicleNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-em/10 border border-em/30 text-em font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-em animate-pulse" />
            <span>{shipment.status.replace('_', ' ')}</span>
          </div>
          <div className="text-right font-mono text-xs text-mist">
            <span>ETA: </span>
            <span className="text-white font-bold">
              {shipment.expectedDeliveryTime
                ? new Date(shipment.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '18:40'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Waypoint Track */}
      <div className="relative pt-4 pb-2 px-2">
        <div className="absolute top-9 left-6 right-6 h-1 bg-line/60 rounded-full" />
        <div
          className="absolute top-9 left-6 h-1 bg-gradient-to-r from-em to-cyan rounded-full transition-all duration-500"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center text-center max-w-[90px] sm:max-w-[120px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs transition-all z-10 ${
                    isCurrent
                      ? 'bg-em text-black border-2 border-white shadow-[0_0_20px_rgba(57,255,176,0.6)] scale-110'
                      : isDone
                      ? 'bg-em/20 border border-em text-em'
                      : 'bg-void border border-line text-mist'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-em" />
                  ) : isCurrent ? (
                    <Truck className="w-5 h-5 animate-bounce-short" />
                  ) : (
                    <span>0{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-em' : 'text-white'}`}>
                  {step.label}
                </span>
                <span className="text-[9px] text-mist truncate max-w-full mt-0.5">{step.sub}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route Deviation Warning Alert if Detected */}
      {isDeviated && (
        <div className="p-4 rounded-xl bg-alert/15 border border-alert/50 flex items-start gap-3 text-alert shadow-[0_0_20px_rgba(255,106,61,0.2)]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <div className="font-bold font-mono tracking-wider">🚨 ROUTE DEVIATION DETECTED</div>
            <p className="text-white/90 mt-1 leading-relaxed">
              Vehicle moved <strong className="text-alert">{deviationDistance} km</strong> outside approved transit corridor. Route was expected through Chennai Industrial Express Corridor. Administrative review and explanation required.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry & Route Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2 border-t border-line/40">
        <div className="p-3 rounded-xl bg-void/60 border border-line">
          <span className="text-[10px] text-mist block">GPS COORDINATES</span>
          <span className="text-white font-bold flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-cyan" />
            {shipment.transporter?.gpsCoordinates?.latitude?.toFixed(4) || '13.0827'}° N,{' '}
            {shipment.transporter?.gpsCoordinates?.longitude?.toFixed(4) || '80.2707'}° E
          </span>
        </div>
        <div className="p-3 rounded-xl bg-void/60 border border-line">
          <span className="text-[10px] text-mist block">TRANSIT SPEED</span>
          <span className="text-em font-bold mt-1 block">
            {shipment.routeTracking?.currentSpeedKmH || 42} km/h (Nominal)
          </span>
        </div>
        <div className="p-3 rounded-xl bg-void/60 border border-line">
          <span className="text-[10px] text-mist block">DISTANCE TRAVELED</span>
          <span className="text-white font-bold mt-1 block">
            {shipment.routeTracking?.distanceTraveledKm || 18.4} / {shipment.routeTracking?.totalDistanceKm || 45.0} km
          </span>
        </div>
        <div className="p-3 rounded-xl bg-void/60 border border-line">
          <span className="text-[10px] text-mist block">ROUTE CORRIDOR</span>
          <span className="text-cyan font-bold mt-1 block">
            {isDeviated ? 'Corridor Breach' : 'Approved Safe #4'}
          </span>
        </div>
      </div>
    </div>
  );
};
