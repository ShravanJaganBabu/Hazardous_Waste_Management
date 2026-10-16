import React, { useEffect, useState } from 'react';
import { incidentService } from '../../services/incidentService';
import { IIncident, IncidentType } from '../../types';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { AlertOctagon, Plus, MapPin, Phone, ShieldCheck, CheckCircle2, Siren, Radio, Clock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const IncidentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IIncident | null>(null);

  const [formData, setFormData] = useState({
    wasteId: 'HW-2026-000103',
    shipmentId: 'HW-2026-00124',
    incidentType: 'SPILL' as IncidentType,
    description: 'Containment seal ruptured during transit. Minor leak detected in secondary valve.',
    locationAddress: 'GST Corridor Expressway (KM 14.2), Chennai',
    severity: 'EMERGENCY',
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentService.getIncidents();
      setIncidents(data.incidents || []);
      if (data.incidents?.length && !selectedIncident) {
        setSelectedIncident(data.incidents[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentService.reportIncident(formData);
      setIsReportOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledge = async (incidentId: string) => {
    try {
      await incidentService.updateIncidentStatus(incidentId, {
        status: 'ACKNOWLEDGED',
        actionNote: `Acknowledged by Officer ${user?.name}. Emergency containment dispatch alerted.`,
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      await incidentService.updateIncidentStatus(incidentId, {
        status: 'RESOLVED',
        actionNote: `Resolved by ${user?.name}. Spill contained and site verified clean.`,
        resolutionNotes: 'Hazmat neutralizer applied. Disposal container resealed and verified.',
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-alert uppercase tracking-widest">
            <Siren className="w-4 h-4 animate-pulse text-alert" />
            <span>EMERGENCY RESPONSE CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Active Emergency Incident Command
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-alert hover:bg-alert/90 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(255,106,61,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Road Incident</span>
          </button>
        </div>
      </div>

      {/* Active Incidents Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Active Incidents */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-alert animate-ping" />
              <span>ACTIVE INCIDENTS ({activeIncidents.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-mist">LIVE DISPATCH FEED</span>
          </div>

          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-void/40 border border-line text-center text-mist font-mono text-xs">
                <CheckCircle2 className="w-8 h-8 text-em mx-auto mb-2" />
                <span>All transit corridors nominal. No active emergencies.</span>
              </div>
            ) : (
              activeIncidents.map((inc) => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                const isSpill = inc.incidentType === 'SPILL';
                return (
                  <div
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-alert/15 border-alert shadow-[0_0_25px_rgba(255,106,61,0.25)]'
                        : isSpill
                        ? 'bg-void/80 border-alert/40 hover:border-alert'
                        : 'bg-void/80 border-amber-400/40 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isSpill ? 'bg-alert animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-display font-bold text-sm text-white">
                          {inc.incidentType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-alert px-2 py-0.5 rounded bg-alert/20 border border-alert/30">
                        {inc.severity}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-mist mt-2">
                      <span className="text-white font-bold">{inc.shipmentId}</span>
                      <span className="block text-[10px] mt-0.5 truncate">{inc.location.address}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/40 text-[10px] font-mono text-mist">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan" />
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-em font-semibold">STATUS: {inc.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Selected Incident Command Center */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/50 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-alert/20 border border-alert/50 text-alert font-mono text-xs font-bold">
                      INCIDENT #{selectedIncident.incidentId}
                    </span>
                    <span className="text-xs font-mono text-cyan">SHIPMENT: {selectedIncident.shipmentId}</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-white mt-1">
                    {selectedIncident.incidentType.replace('_', ' ')} · Emergency Containment
                  </h2>
                </div>

                {/* Instant Actions (Pillar 8) */}
                <div className="flex flex-wrap gap-2">
                  {selectedIncident.status === 'REPORTED' && (
                    <button
                      onClick={() => handleAcknowledge(selectedIncident.incidentId)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold font-mono text-xs transition-all shadow-md"
                    >
                      ACKNOWLEDGE
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/admin/investigations')}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan/20 border border-cyan/50 hover:bg-cyan/30 text-cyan font-bold font-mono text-xs transition-all"
                  >
                    OPEN CASE
                  </button>
                  {selectedIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(selectedIncident.incidentId)}
                      className="px-3.5 py-1.5 rounded-xl bg-em hover:bg-em/90 text-black font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(57,255,176,0.3)]"
                    >
                      RESOLVE
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Overview */}
              <div className="p-4 rounded-xl bg-void/80 border border-line space-y-2">
                <span className="text-[10px] font-mono text-mist uppercase tracking-wider block">Incident Narrative:</span>
                <p className="text-xs text-white leading-relaxed">{selectedIncident.description}</p>
              </div>

              {/* Incident Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-void/60 border border-line">
                  <span className="text-[10px] text-mist block">INCIDENT LOCATION</span>
                  <span className="text-white font-bold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-alert" />
                    {selectedIncident.location.address}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-void/60 border border-line">
                  <span className="text-[10px] text-mist block">REPORTING OFFICER</span>
                  <span className="text-white font-bold flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-cyan" />
                    {selectedIncident.reportedBy.name} ({selectedIncident.reportedBy.role})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-void/60 border border-line">
                  <span className="text-[10px] text-mist block">CONTACT PHONE</span>
                  <span className="text-em font-bold flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-em" />
                    {selectedIncident.reportedBy.phone || '+91 94440 88905'}
                  </span>
                </div>
              </div>

              {/* Response Log */}
              {selectedIncident.responseActions && selectedIncident.responseActions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-line/40 font-mono text-xs">
                  <span className="text-[10px] text-mist uppercase tracking-wider block">Response Log:</span>
                  <div className="space-y-1.5">
                    {selectedIncident.responseActions.map((act, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-void/40 border border-line/60 text-[11px] flex items-center justify-between">
                        <span className="text-white">{act.action}</span>
                        <span className="text-mist text-[10px]">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-void/40 border border-line text-center text-mist font-mono text-xs">
              Select an incident from the dispatch feed to inspect details and initiate emergency response protocols.
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Report Hazardous Road Emergency">
        <form onSubmit={handleReport} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-mist mb-1">Shipment Consignment ID</label>
            <input
              type="text"
              value={formData.shipmentId}
              onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
              className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-em"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-mist mb-1">Incident Type</label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
                className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-em"
              >
                <option value="SPILL">Chemical Spill</option>
                <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                <option value="ACCIDENT">Road Collision / Accident</option>
                <option value="CONTAINER_DAMAGE">Container Seal Rupture</option>
                <option value="ROUTE_PROBLEM">Corridor Blockage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-mist mb-1">Severity Level</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-em"
              >
                <option value="EMERGENCY">Emergency (Highest Priority)</option>
                <option value="CRITICAL">Critical (Immediate Containment)</option>
                <option value="WARNING">Warning (Technical Alert)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-mist mb-1">Location Coordinates / Landmark</label>
            <input
              type="text"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-em"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-mist mb-1">Description & Immediate Risk</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white focus:outline-none focus:border-em h-24"
              placeholder="Describe situation, volume released, containment status..."
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="px-4 py-2 rounded-xl bg-void border border-line text-xs font-mono text-mist"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-alert text-white font-bold text-xs font-mono shadow-[0_0_20px_rgba(255,106,61,0.4)]"
            >
              Dispatch Emergency Alert
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
