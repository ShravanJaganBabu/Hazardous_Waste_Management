import React, { useEffect, useState } from 'react';
import { investigationService } from '../../services/investigationService';
import { IInvestigation } from '../../types';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { FileSearch, AlertTriangle, ArrowRight, ShieldAlert, Scale, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvestigationsPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const data = await investigationService.getInvestigations({
        status: statusFilter || undefined,
      });
      setInvestigations(data.investigations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4" />
            <span>COMPLIANCE & DISCREPANCY AUDIT WING</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Hazardous Consignment Investigations
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-xl px-4 py-2.5 text-xs text-mist font-mono focus:outline-none focus:border-amber-400"
          >
            <option value="">All Inquiry Stages</option>
            <option value="OPEN">Open</option>
            <option value="AWAITING_RESPONSE">Awaiting Response</option>
            <option value="RESPONSE_RECEIVED">Response Received</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VIOLATION_CONFIRMED">Violation Confirmed</option>
          </select>
        </div>
      </div>

      {/* Investigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investigations.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-mist glass-panel rounded-2xl border border-line">
            <FileSearch className="w-12 h-12 mx-auto text-em/40 mb-3" />
            <p className="text-base font-semibold text-white">No active inquiry records found.</p>
            <p className="text-xs text-mist mt-1">Mass balances and shipment compliance are nominal.</p>
          </div>
        ) : (
          investigations.map((inv) => (
            <div
              key={inv.investigationId}
              onClick={() => navigate(`/admin/investigations/${inv.investigationId}`)}
              className="glass-panel p-6 rounded-2xl border border-line hover:border-amber-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white px-2.5 py-1 rounded bg-panel border border-line">
                      {inv.investigationId}
                    </span>
                    <SeverityBadge severity={inv.severity} />
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                <h3 className="font-display font-semibold text-base text-white mt-2">
                  {inv.title}
                </h3>
                <p className="text-xs text-mist mt-2 leading-relaxed line-clamp-3">
                  {inv.description}
                </p>

                {inv.quantityComparison && (
                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-line grid grid-cols-3 gap-2 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-mist block">Declared</span>
                      <span className="text-xs font-bold text-white">{inv.quantityComparison.declaredQuantity} {inv.quantityComparison.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mist block">Intake</span>
                      <span className="text-xs font-bold text-white">{inv.quantityComparison.receivedQuantity ?? '—'} {inv.quantityComparison.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mist block">Variance</span>
                      <span className="text-xs font-bold text-alert">
                        {inv.quantityComparison.discrepancyAmount} {inv.quantityComparison.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-mist">Assigned: </span>
                  <span className="text-white font-medium">{inv.assignedTo.name} ({inv.assignedTo.role})</span>
                </div>
                <div className="flex items-center gap-1 text-em hover:underline">
                  <span>Inspect Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
