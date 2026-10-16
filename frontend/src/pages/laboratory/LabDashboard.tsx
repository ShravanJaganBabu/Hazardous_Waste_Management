import React, { useEffect, useState } from 'react';
import { wasteService } from '../../services/wasteService';
import { shipmentService } from '../../services/shipmentService';
import { IWaste, IShipment, HazardLevel } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionRequired, ActionItem } from '../../components/common/ActionRequired';
import { QRModal } from '../../components/qr/QRModal';
import { Modal } from '../../components/common/Modal';
import { FlaskConical, Plus, Truck, QrCode, FileText, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LabDashboard: React.FC = () => {
  const { user } = useAuth();
  const [wasteList, setWasteList] = useState<IWaste[]>([]);
  const [shipments, setShipments] = useState<IShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ url: string; waste: IWaste } | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    wasteType: '',
    category: 'Class 8 (Toxic/Corrosive)',
    declaredQuantity: 60,
    unit: 'kg',
    description: '',
    hazardLevel: 'HIGH' as HazardLevel,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wasteData, shipmentData] = await Promise.all([
        wasteService.getWasteList({ limit: 10 }),
        shipmentService.getShipments({ limit: 5 }),
      ]);
      setWasteList(wasteData.wasteList);
      setShipments(shipmentData.shipments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleAutoFill = () => {
    setFormData({
      wasteType: 'Spent Hydrofluoric Acid Rinse',
      category: 'Class 8 (Toxic/Corrosive)',
      declaredQuantity: 45,
      unit: 'kg',
      description: 'Teflon-lined containment drums with secondary neutralization absorbents.',
      hazardLevel: 'EXTREME' as HazardLevel,
    });
    setRegisterError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setIsRegistering(true);
    try {
      const created = await wasteService.registerWaste(formData);
      setIsRegisterOpen(false);
      setFormData({
        wasteType: '',
        category: 'Class 8 (Toxic/Corrosive)',
        declaredQuantity: 60,
        unit: 'kg',
        description: '',
        hazardLevel: 'HIGH',
      });
      await fetchData();
      if (created?.qrCode) {
        setSelectedQR({ url: created.qrCode, waste: created });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to sign & register consignment. Please check backend connection.';
      setRegisterError(msg);
    } finally {
      setIsRegistering(false);
    }
  };


  const actionItems: ActionItem[] = [
    {
      id: 'lab-act-1',
      severity: 'WARNING',
      title: 'Consignment HW-2026-000101 Awaiting Logistics Pickup',
      description: '120 kg Heavy Metal Sludge sealed and ready at generator bay.',
      timeAgo: '1h ago',
      actionUrl: '/admin/waste',
      actionLabel: 'Dispatch Pickup',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em uppercase tracking-widest">
            <FlaskConical className="w-4 h-4" />
            <span>GENERATOR PORTAL // {user?.organizationName}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Laboratory Waste Declaration & Dispatch
          </h1>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="py-2.5 px-6 rounded-xl bg-em hover:bg-em/90 text-black font-semibold text-xs flex items-center gap-2 shadow-glow-em transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Consignment</span>
        </button>
      </div>

      <ActionRequired items={actionItems} />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="My Active Consignments"
          value={wasteList.length}
          subtitle="Declared in Chain"
          icon={FlaskConical}
          variant="emerald"
        />
        <StatCard
          title="Outbound Shipments"
          value={shipments.length}
          subtitle="In Transit / Processing"
          icon={Truck}
          variant="cyan"
        />
        <StatCard
          title="Destruction Certified"
          value="100%"
          subtitle="CPCB Form 10 Validated"
          icon={ShieldCheck}
          variant="emerald"
        />
      </div>

      {/* Recent Waste List */}
      <div className="glass-panel p-6 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">
              My Declared Hazardous Consignments
            </h3>
            <p className="text-xs font-mono text-mist mt-0.5">
              Secure Chain Custody Ledger
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/waste')}
            className="text-xs font-mono text-em hover:underline flex items-center gap-1"
          >
            <span>Full Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] font-mono text-mist uppercase tracking-wider">
                <th className="py-3 px-4">Consignment ID</th>
                <th className="py-3 px-4">Waste Classification</th>
                <th className="py-3 px-4">Declared Mass</th>
                <th className="py-3 px-4">Hazard Risk</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4 text-center">QR Token</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs">
              {wasteList.map((w) => (
                <tr key={w.wasteId} className="hover:bg-panel-light/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {w.wasteId}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">
                    {w.wasteType}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-em">
                    {w.declaredQuantity} {w.unit}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-alert">
                    {w.hazardLevel}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={w.currentStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedQR({ url: w.qrCode, waste: w })}
                      className="p-1.5 rounded-lg bg-panel hover:bg-panel-light border border-line text-mist hover:text-em transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate('/admin/waste')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-em/15 text-mist hover:text-em border border-line font-mono text-[11px] transition-colors"
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

      {/* Register Consignment Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setRegisterError(null);
        }}
        title="Register Hazardous Waste Consignment"
        subtitle="Generator Declaration"
        maxWidth="md"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Quick Auto-Fill / Preset Generator */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-panel border border-em/30">
            <span className="text-[11px] font-mono text-mist">
              <span className="text-em font-semibold">Demo:</span> Fill sample data
            </span>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-2.5 py-1 rounded-lg bg-em/15 hover:bg-em/25 text-em border border-em/40 font-mono text-[11px] font-semibold transition-all"
            >
              ⚡ Auto-Fill
            </button>
          </div>

          {registerError && (
            <div className="p-3 rounded-xl bg-critical/15 border border-critical/40 text-critical text-xs font-mono">
              <p className="font-bold">Declaration Failed</p>
              <p className="mt-0.5 text-mist">{registerError}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Waste Type / Compound *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cyanide Electroplating Baths"
              value={formData.wasteType}
              onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Declared Quantity (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={formData.declaredQuantity}
                onChange={(e) => setFormData({ ...formData, declaredQuantity: Number(e.target.value) })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Hazard Profile *
              </label>
              <select
                value={formData.hazardLevel}
                onChange={(e) => setFormData({ ...formData, hazardLevel: e.target.value as HazardLevel })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EXTREME">Extreme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Description & Packaging *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Container type, secondary seals, handling caveats..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-em"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              disabled={isRegistering}
              onClick={() => {
                setIsRegisterOpen(false);
                setRegisterError(null);
              }}
              className="py-2.5 px-4 rounded-xl border border-line text-mist hover:text-white text-xs font-mono disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegistering}
              className="py-2.5 px-6 rounded-xl bg-em text-black font-semibold text-xs shadow-glow-em transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Sign & Register</span>
              )}
            </button>
          </div>
        </form>
      </Modal>


      {selectedQR && (
        <QRModal
          isOpen={!!selectedQR}
          onClose={() => setSelectedQR(null)}
          qrCodeUrl={selectedQR.url}
          waste={selectedQR.waste}
        />
      )}
    </div>
  );
};
