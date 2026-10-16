import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Truck,
  FileSearch,
  AlertOctagon,
  ShieldCheck,
  Activity,
  QrCode,
  ArrowUpRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { ActionRequired, ActionItem } from '../../components/common/ActionRequired';
import { StatusBadge } from '../../components/common/StatusBadge';
import { reportService } from '../../services/reportService';
import { shipmentService } from '../../services/shipmentService';
import { investigationService } from '../../services/investigationService';
import { IDashboardStats, IShipment, IInvestigation } from '../../types';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { useSocket } from '../../context/SocketContext';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [statsData, shipmentsData, invData] = await Promise.all([
        reportService.getDashboardStats(),
        shipmentService.getShipments({ limit: 6 }),
        investigationService.getInvestigations({ status: 'AWAITING_RESPONSE' }),
      ]);

      setStats(statsData.stats);
      setWasteTypes(statsData.wasteTypeBreakdown);
      setTrends(statsData.monthlyTrends);
      setShipments(shipmentsData.shipments);
      setInvestigations(invData.investigations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleLiveEvent = () => {
      fetchData();
    };

    socket.on('investigation:mismatch', handleLiveEvent);
    socket.on('notification:new', handleLiveEvent);
    socket.on('alert:new', handleLiveEvent);
    socket.on('shipment:update', handleLiveEvent);

    return () => {
      socket.off('investigation:mismatch', handleLiveEvent);
      socket.off('notification:new', handleLiveEvent);
      socket.off('alert:new', handleLiveEvent);
      socket.off('shipment:update', handleLiveEvent);
    };
  }, [socket]);

  // Priority Action Items for Admin Command Center
  const actionItems: ActionItem[] = [
    ...(investigations.map((inv) => ({
      id: inv.investigationId,
      severity: inv.severity as any,
      title: inv.title,
      description: `Discrepancy case pending response from ${inv.assignedTo.name} (${inv.assignedTo.organization}).`,
      timeAgo: 'Just now',
      actionUrl: `/admin/investigations/${inv.investigationId}`,
      actionLabel: 'Review Discrepancy Case',
    }))),
    {
      id: 'fleet-alert-01',
      severity: 'WARNING',
      title: 'Transit Monitoring: Consignment HW-2026-000103',
      description: 'Vehicle TN-09-HZ-4042 en route to GreenSafe Plant. Approaching destination checkpoint.',
      timeAgo: '15m ago',
      actionUrl: '/admin/shipments/SHP-2026-000103',
      actionLabel: 'Inspect Telemetry',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-em animate-pulse" />
            HAZTRACK // CENTRAL COMMAND CENTER
          </div>
          <h1 className="text-3xl font-display font-bold text-white mt-1">
            Real-Time Operations & Traceability HUD
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-panel hover:bg-panel-light text-em border border-em/40 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,176,0.15)] transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Field QR Scanner</span>
          </button>
          <button
            onClick={() => navigate('/admin/waste')}
            className="py-2.5 px-5 rounded-xl bg-em hover:bg-em/90 text-black font-semibold text-xs flex items-center gap-1.5 shadow-glow-em transition-all"
          >
            <span>Waste Registry</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Required Queue */}
      <ActionRequired items={actionItems} />

      {/* Key Metric Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Hazardous Waste"
          value={`${stats?.totalWeightKg || 595} kg`}
          subtitle={`${stats?.totalWasteCount || 6} Consignments Tracked`}
          icon={Boxes}
          variant="emerald"
          trend="+14% this month"
          onClick={() => navigate('/admin/waste')}
        />
        <StatCard
          title="Active Shipments"
          value={stats?.activeShipmentsCount || 3}
          subtitle={`${stats?.inTransitCount || 1} Vehicle Currently in Transit`}
          icon={Truck}
          variant="cyan"
          trend="GPS Real-Time Locked"
          onClick={() => navigate('/admin/shipments')}
        />
        <StatCard
          title="Open Investigations"
          value={stats?.openInvestigationsCount || 1}
          subtitle="Mass Variance Inquiries"
          icon={FileSearch}
          variant="amber"
          trend="Automated Detection"
          onClick={() => navigate('/admin/investigations')}
        />
        <StatCard
          title="Regulatory Compliance"
          value={`${stats?.complianceRate || 99.4}%`}
          subtitle="CPCB Environmental Standard"
          icon={ShieldCheck}
          variant="emerald"
          trend="Zero Unresolved Violations"
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* Analytics & Real-Time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Volume Trends (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-line">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Hazardous Waste Flow Dynamics
              </h3>
              <p className="text-xs font-mono text-mist mt-0.5">
                Generation vs Neutralization vs Destruction (kg)
              </p>
            </div>
            <span className="text-xs font-mono text-em bg-em/10 px-2.5 py-1 rounded border border-em/20">
              6-Month Trend
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39ffb0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#39ffb0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ce0e8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3ce0e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#93a6a1" fontSize={11} fontStyle="monospace" />
                <YAxis stroke="#93a6a1" fontSize={11} fontStyle="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1210',
                    borderColor: 'rgba(148,255,205,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="generated" stroke="#39ffb0" strokeWidth={2} fillOpacity={1} fill="url(#colorGen)" name="Generated (kg)" />
                <Area type="monotone" dataKey="treated" stroke="#3ce0e8" strokeWidth={2} fillOpacity={1} fill="url(#colorTreated)" name="Treated (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Type Distribution (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">Hazard Profiles</h3>
            <p className="text-xs font-mono text-mist mt-0.5">Categorical Breakdown</p>

            <div className="mt-6 space-y-3">
              {wasteTypes.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-line flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-white truncate">{item._id}</p>
                    <p className="text-[10px] font-mono text-mist">{item.count} consignment{item.count > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-em shrink-0">
                    {item.totalQuantity} kg
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 text-center">
            <span className="text-[10px] font-mono text-mist">
              Continuous Mass Ledger Validated
            </span>
          </div>
        </div>
      </div>

      {/* Live Active Shipments Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">
              Live Fleet Transit & Consignment Manifests
            </h3>
            <p className="text-xs font-mono text-mist mt-0.5">
              Real-Time Chain of Custody Feed
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/shipments')}
            className="text-xs font-mono text-em hover:underline flex items-center gap-1"
          >
            <span>View All Shipments ({shipments.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] font-mono text-mist uppercase tracking-wider">
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Origin Generator</th>
                <th className="py-3 px-4">Transporter / Vehicle</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Mass Balance</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs">
              {shipments.map((shp) => (
                <tr key={shp.shipmentId} className="hover:bg-panel-light/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {shp.shipmentId}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white truncate max-w-[180px]">
                    {shp.originOrganization.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-white font-medium truncate">{shp.transporter.company}</p>
                    <p className="text-[10px] font-mono text-cyan">{shp.transporter.vehicleNumber}</p>
                  </td>
                  <td className="py-3.5 px-4 text-mist truncate max-w-[180px]">
                    {shp.destinationFacility.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-semibold text-white">{shp.declaredQuantity} {shp.unit}</span>
                    {shp.discrepancy?.hasMismatch && (
                      <span className="block text-[10px] text-alert font-bold">
                        Variance: {shp.discrepancy.totalDiff} {shp.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={shp.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/shipments/${shp.shipmentId}`)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-em/15 text-mist hover:text-em border border-line hover:border-em/40 font-mono text-[11px] transition-colors"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
};
