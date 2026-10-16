import React, { useEffect, useState } from 'react';
import { wasteService } from '../../services/wasteService';
import { IWaste, HazardLevel, WasteStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { QRModal } from '../../components/qr/QRModal';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Filter, QrCode, ArrowRight, Truck, FlaskConical, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const WasteManagement: React.FC = () => {
  const { user } = useAuth();
  const [wasteList, setWasteList] = useState<IWaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');

  // Modals state
  const [selectedQR, setSelectedQR] = useState<{ url: string; waste: IWaste } | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [selectedWasteForPickup, setSelectedWasteForPickup] = useState<IWaste | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    wasteType: '',
    category: 'Class 8 (Toxic/Corrosive)',
    declaredQuantity: 50,
    unit: 'kg',
    description: '',
    hazardLevel: 'HIGH' as HazardLevel,
    handlingInstructions: '',
  });

  const [pickupForm, setPickupForm] = useState({
    transporterId: 'HZU-004',
    destinationFacilityId: 'HZU-006',
    notes: '',
  });

  const fetchWaste = async () => {
    setLoading(true);
    try {
      const data = await wasteService.getWasteList({
        search: search || undefined,
        status: statusFilter || undefined,
        hazardLevel: hazardFilter || undefined,
      });
      setWasteList(data.wasteList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaste();
  }, [statusFilter, hazardFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWaste();
  };

  const handleAutoFill = () => {
    const samples = [
      {
        wasteType: 'Spent Cyanide Plating Solution',
        category: 'Class 8 (Toxic/Corrosive)',
        declaredQuantity: 75,
        unit: 'kg',
        description: 'UN-rated heavy duty HDPE drums sealed with cryptographic tamper-evident barcoding.',
        hazardLevel: 'EXTREME' as HazardLevel,
        handlingInstructions: 'Certified chemical hazard gear required. Avoid direct contact.',
      },
      {
        wasteType: 'Organic Halogenated Solvent Sludge',
        category: 'Class 3 (Flammable Liquid)',
        declaredQuantity: 120,
        unit: 'liters',
        description: 'Double-walled pressure-vented chemical cylinders for solvent recovery.',
        hazardLevel: 'HIGH' as HazardLevel,
        handlingInstructions: 'Store in cool ventilated bay away from ignition sources.',
      },
      {
        wasteType: 'Heavy Metal Catalyst Residue',
        category: 'Class 6.1 (Toxic Substance)',
        declaredQuantity: 40,
        unit: 'kg',
        description: 'Reinforced sealed containers containing nickel & cadmium heavy residues.',
        hazardLevel: 'HIGH' as HazardLevel,
        handlingInstructions: 'Full body Hazmat PPE and respiratory filters mandatory.',
      },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setFormData(picked);
    setRegisterError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setIsRegistering(true);
    try {
      const newWaste = await wasteService.registerWaste(formData);
      setIsRegisterOpen(false);
      setFormData({
        wasteType: '',
        category: 'Class 8 (Toxic/Corrosive)',
        declaredQuantity: 50,
        unit: 'kg',
        description: '',
        hazardLevel: 'HIGH',
        handlingInstructions: '',
      });
      setSuccessToast(`Consignment ${newWaste?.wasteId || 'HW-2026-NEW'} sealed and registered!`);
      setTimeout(() => setSuccessToast(null), 5000);
      await fetchWaste();
      if (newWaste?.qrCode) {
        setSelectedQR({ url: newWaste.qrCode, waste: newWaste });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to register consignment. Please check backend connection.';
      setRegisterError(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWasteForPickup) return;
    try {
      await wasteService.requestCollection(selectedWasteForPickup.wasteId, pickupForm);
      setIsCollectionOpen(false);
      setSelectedWasteForPickup(null);
      fetchWaste();
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em uppercase tracking-widest">
            <span>SECURE REGISTRY</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Hazardous Waste Consignment Registry
          </h1>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="py-2.5 px-5 rounded-xl bg-em hover:bg-em/90 text-black font-semibold text-xs flex items-center gap-2 shadow-glow-em transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Waste</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mist absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Waste ID, type, org..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-mist/40 font-mono focus:outline-none focus:border-em"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-panel hover:bg-panel-light border border-line text-xs font-mono text-white"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-lg px-3 py-2 text-xs text-mist font-mono focus:outline-none focus:border-em"
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="COLLECTION_REQUESTED">Collection Requested</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RECEIVED">Received</option>
            <option value="TREATED">Treated</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-lg px-3 py-2 text-xs text-mist font-mono focus:outline-none focus:border-em"
          >
            <option value="">All Hazard Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EXTREME">Extreme</option>
          </select>
        </div>
      </div>

      {/* Waste List Table */}
      <div className="glass-panel rounded-2xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] font-mono text-mist uppercase tracking-wider bg-panel/50">
                <th className="py-3.5 px-4">Waste ID</th>
                <th className="py-3.5 px-4">Organization Generator</th>
                <th className="py-3.5 px-4">Waste Classification</th>
                <th className="py-3.5 px-4">Hazard Profile</th>
                <th className="py-3.5 px-4">Declared Mass</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4 text-center">QR Manifest</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs">
              {wasteList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mist">
                    No waste consignments found matching current criteria.
                  </td>
                </tr>
              ) : (
                wasteList.map((waste) => (
                  <tr key={waste.wasteId} className="hover:bg-panel-light/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {waste.wasteId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-white truncate max-w-[180px]">{waste.organizationName}</p>
                      <p className="text-[10px] font-mono text-mist">By: {waste.registeredByName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white truncate max-w-[180px]">{waste.wasteType}</p>
                      <p className="text-[10px] font-mono text-mist">{waste.category}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          waste.hazardLevel === 'EXTREME'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : waste.hazardLevel === 'HIGH'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {waste.hazardLevel}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-em text-sm">
                      {waste.declaredQuantity} {waste.unit}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={waste.currentStatus} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedQR({ url: waste.qrCode, waste })}
                        className="p-1.5 rounded-lg bg-panel hover:bg-panel-light border border-line text-mist hover:text-em transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      {waste.currentStatus === 'REGISTERED' && (
                        <button
                          onClick={() => {
                            setSelectedWasteForPickup(waste);
                            setIsCollectionOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-em/15 hover:bg-em/25 text-em border border-em/30 font-mono text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch Pickup</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Waste */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setRegisterError(null);
        }}
        title="Register Hazardous Waste Consignment"
        subtitle="Secure Chain Initial Generator Declaration"
        maxWidth="lg"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Quick Auto-Fill / Preset Generator */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-panel border border-em/30">
            <div className="text-xs font-mono text-mist">
              <span className="text-em font-semibold">Demo Helper:</span> Populate valid test manifest
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-3 py-1 rounded-lg bg-em/15 hover:bg-em/25 text-em border border-em/40 font-mono text-xs font-semibold transition-all shadow-[0_0_10px_rgba(57,255,176,0.15)]"
            >
              ⚡ Auto-Fill Sample Manifest
            </button>
          </div>

          {registerError && (
            <div className="p-3 rounded-xl bg-critical/15 border border-critical/40 text-critical text-xs font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Registration Failed</p>
                <p className="mt-0.5 text-mist">{registerError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Waste Type & Chemical Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spent Chromium Acid Solution"
              value={formData.wasteType}
              onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Hazard Classification *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              >
                <option value="Class 8 (Toxic/Corrosive)">Class 8 (Toxic / Corrosive)</option>
                <option value="Class 3 (Flammable Liquid)">Class 3 (Flammable Liquid)</option>
                <option value="Class 6.1 (Toxic Substance)">Class 6.1 (Toxic Substance)</option>
                <option value="Class 4.1 (Flammable Solid)">Class 4.1 (Flammable Solid)</option>
                <option value="Class 9 (Miscellaneous Hazardous)">Class 9 (Miscellaneous)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Hazard Risk Level *
              </label>
              <select
                value={formData.hazardLevel}
                onChange={(e) => setFormData({ ...formData, hazardLevel: e.target.value as HazardLevel })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="EXTREME">Extreme Hazard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1">
                Declared Quantity *
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
                Mass Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters (L)</option>
                <option value="tonnes">Metric Tonnes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Description & Packaging Details *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. UN-rated high-density polyethylene drums with secondary containment pallets."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl p-3 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Handling & Safety Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Mandatory nitrile gloves, splash goggles, and ventilation exhaust."
              value={formData.handlingInstructions}
              onChange={(e) => setFormData({ ...formData, handlingInstructions: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
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
              className="py-2.5 px-6 rounded-xl bg-em text-black font-semibold text-xs shadow-glow-em hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Sealing Consignment...</span>
                </>
              ) : (
                <span>Seal & Register Consignment</span>
              )}
            </button>
          </div>
        </form>
      </Modal>


      {/* Modal: Request Collection */}
      <Modal
        isOpen={isCollectionOpen}
        onClose={() => setIsCollectionOpen(false)}
        title="Dispatch Logistics Pickup Request"
        subtitle={`Consignment ${selectedWasteForPickup?.wasteId} (${selectedWasteForPickup?.declaredQuantity} ${selectedWasteForPickup?.unit})`}
        maxWidth="md"
      >
        <form onSubmit={handleRequestPickup} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Assigned Hazmat Transporter *
            </label>
            <select
              value={pickupForm.transporterId}
              onChange={(e) => setPickupForm({ ...pickupForm, transporterId: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
            >
              <option value="HZU-004">Rini — EcoHaul Hazmat Transport Logistics</option>
              <option value="HZU-005">Shravan — Vanguard Hazmat Fleet Express</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Destination Neutralization Facility *
            </label>
            <select
              value={pickupForm.destinationFacilityId}
              onChange={(e) => setPickupForm({ ...pickupForm, destinationFacilityId: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-em"
            >
              <option value="HZU-006">Ravan — GreenSafe Neutralization & Recovery Plant</option>
              <option value="HZU-007">Avan — BioClean High-Temp Incineration Facility</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-mist uppercase mb-1">
              Handling Notes / Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Ensure driver wears Class B respiratory gear during drum transfer."
              value={pickupForm.notes}
              onChange={(e) => setPickupForm({ ...pickupForm, notes: e.target.value })}
              className="w-full bg-black/50 border border-line rounded-xl p-3 text-sm text-white font-mono placeholder:text-mist/40 focus:outline-none focus:border-em"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCollectionOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-line text-mist hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-em text-black font-semibold text-xs shadow-glow-em hover:brightness-110 transition-all"
            >
              Dispatch Collection Request
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
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
