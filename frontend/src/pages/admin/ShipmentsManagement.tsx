import React, { useEffect, useState } from 'react';
import { shipmentService } from '../../services/shipmentService';
import { IShipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { QRModal } from '../../components/qr/QRModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { Truck, Search, QrCode, ArrowUpRight, Scale, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ShipmentsManagement: React.FC = () => {
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQR, setSelectedQR] = useState<{ url: string; shipment: IShipment } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getShipments({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setShipments(data.shipments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShipments();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest">
            <span>SECURE FLEET TELEMETRY</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Active Hazardous Waste Shipments
          </h1>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="py-2.5 px-5 rounded-xl bg-panel hover:bg-panel-light text-cyan border border-cyan/40 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(60,224,232,0.15)] transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Optical Checkpoint Scanner</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mist absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Shipment ID, manifest, org..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-mist/40 font-mono focus:outline-none focus:border-cyan"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-panel hover:bg-panel-light border border-line text-xs font-mono text-white"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-lg px-3 py-2 text-xs text-mist font-mono focus:outline-none focus:border-cyan"
          >
            <option value="">All Movement Stages</option>
            <option value="COLLECTION_REQUESTED">Collection Requested</option>
            <option value="IN_TRANSIT">In Transit (GPS Active)</option>
            <option value="RECEIVED">Received & Verified</option>
            <option value="TREATED">Treated</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="glass-panel rounded-2xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] font-mono text-mist uppercase tracking-wider bg-panel/50">
                <th className="py-3.5 px-4">Shipment ID / Manifest</th>
                <th className="py-3.5 px-4">Origin Consignor</th>
                <th className="py-3.5 px-4">Fleet Carrier / Vehicle</th>
                <th className="py-3.5 px-4">Destination Plant</th>
                <th className="py-3.5 px-4">Mass Balance</th>
                <th className="py-3.5 px-4">Movement Stage</th>
                <th className="py-3.5 px-4 text-center">QR Token</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mist">
                    No active shipment records found.
                  </td>
                </tr>
              ) : (
                shipments.map((shp) => (
                  <tr key={shp.shipmentId} className="hover:bg-panel-light/50 transition-colors">
                    <td className="py-4 px-4 font-mono">
                      <p className="font-bold text-white">{shp.shipmentId}</p>
                      <p className="text-[10px] text-cyan">{shp.manifestNumber}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-white truncate max-w-[170px]">{shp.originOrganization.name}</p>
                      <p className="text-[10px] font-mono text-mist">Contact: {shp.originOrganization.contactPerson}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-white truncate max-w-[170px]">{shp.transporter.company}</p>
                      <p className="text-[10px] font-mono text-cyan flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {shp.transporter.vehicleNumber} ({shp.transporter.driverName})
                      </p>
                    </td>
                    <td className="py-4 px-4 text-mist truncate max-w-[170px]">
                      {shp.destinationFacility.name}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{shp.declaredQuantity} {shp.unit}</span>
                      </div>
                      {shp.discrepancy?.hasMismatch && (
                        <span className="text-[10px] text-alert font-bold block animate-pulse">
                          Discrepancy: {shp.discrepancy.totalDiff} {shp.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={shp.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedQR({ url: shp.qrCode, shipment: shp })}
                        className="p-1.5 rounded-lg bg-panel hover:bg-panel-light border border-line text-mist hover:text-cyan transition-colors"
                        title="View Shipment QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/shipments/${shp.shipmentId}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan/15 text-mist hover:text-cyan border border-line hover:border-cyan/40 font-mono text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Telemetry</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
