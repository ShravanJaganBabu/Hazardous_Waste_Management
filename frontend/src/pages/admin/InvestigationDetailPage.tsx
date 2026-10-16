import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investigationService } from '../../services/investigationService';
import { IInvestigation } from '../../types';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  FileSearch,
  Scale,
  MessageSquare,
  Send,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  FileText,
  Clock,
  UploadCloud,
  FileCheck2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InvestigationDetailPage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<IInvestigation | null>(null);
  const [loading, setLoading] = useState(true);

  // Response form
  const [responseMsg, setResponseMsg] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Admin verdict modal
  const [isVerdictModalOpen, setIsVerdictModalOpen] = useState(false);
  const [verdictForm, setVerdictForm] = useState({
    verdict: 'EXPLANATION_ACCEPTED',
    resolutionNote: '',
    penaltyOrAction: '',
  });

  const fetchInvestigation = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const data = await investigationService.getInvestigationById(investigationId);
      setInvestigation(data.investigation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigation();
  }, [investigationId]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="py-20 text-center text-mist font-mono">
        Investigation case record not found.
      </div>
    );
  }

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMsg.trim()) return;
    setSubmittingResponse(true);
    try {
      await investigationService.submitResponse(investigation.investigationId, {
        message: responseMsg.trim(),
      });
      setResponseMsg('');
      fetchInvestigation();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCloseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await investigationService.resolveInvestigation(investigation.investigationId, verdictForm);
      setIsVerdictModalOpen(false);
      fetchInvestigation();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  // Pillar 7: Investigation Timeline events
  const timelineEvents = [
    { time: '16:20', label: 'Mismatch Detected', desc: 'Automated mass-balance discrepancy triggered by Smart Engine' },
    { time: '16:21', label: 'Admin Notified', desc: 'Critical alert dispatched to CPCB compliance officer' },
    { time: '16:28', label: 'Investigation Created', desc: `Case #${investigation.investigationId} formally opened` },
    { time: '16:35', label: 'Explanation Requested', desc: `Assigned to ${investigation.assignedTo.name} (${investigation.assignedTo.role})` },
    ...(investigation.responses?.map((r, idx) => ({
      time: new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: `Response Submitted (${r.senderName})`,
      desc: r.message,
    })) || [
      { time: '17:02', label: 'Response Submitted', desc: 'Transporter provided explanatory manifest document' },
      { time: '17:10', label: 'Evidence Uploaded', desc: 'Weighbridge calibration certificate verified' },
    ]),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-panel hover:bg-panel-light border border-line text-mist hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">
                CASE #{investigation.investigationId}
              </span>
              <SeverityBadge severity={investigation.severity} />
              <StatusBadge status={investigation.status} />
            </div>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-white mt-1">
              {investigation.title}
            </h1>
          </div>
        </div>

        {isAdmin && investigation.status !== 'RESOLVED' && investigation.status !== 'VIOLATION_CONFIRMED' && (
          <button
            onClick={() => setIsVerdictModalOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-lg transition-all flex items-center gap-2 font-mono"
          >
            <Gavel className="w-4 h-4" />
            <span>Record Compliance Verdict</span>
          </button>
        )}
      </div>

      {/* Pillar 18: Escalation Timer Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-line bg-panel/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-white">
              INVESTIGATION RESPONSE DEADLINE: 2 HOURS
            </div>
            <p className="text-[11px] text-mist mt-0.5">
              Automated escalation to Central CPCB Audit Division if no response is submitted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-mist">TIME REMAINING:</span>
          <span className="px-3 py-1 rounded-xl bg-void border border-amber-400/50 text-amber-400 font-bold">
            38 min 20 sec
          </span>
        </div>
      </div>

      {/* Case Overview & Mass Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case Narrative (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-line space-y-4">
          <div>
            <span className="text-[10px] font-mono text-mist uppercase">Formal Case Summary</span>
            <p className="text-xs text-white mt-1.5 leading-relaxed font-sans">
              {investigation.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line/60 text-xs font-mono">
            <div>
              <span className="text-mist block">Target Consignment:</span>
              <span className="text-white font-bold">{investigation.shipmentId || investigation.wasteId}</span>
            </div>
            <div>
              <span className="text-mist block">Assigned Respondent:</span>
              <span className="text-cyan font-bold">{investigation.assignedTo.name} ({investigation.assignedTo.organization})</span>
            </div>
          </div>
        </div>

        {/* Mass Comparison Widget (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line text-xs font-mono text-mist uppercase">
              <Scale className="w-4 h-4 text-alert" />
              <span>Mass Balance Variance Ledger</span>
            </div>

            {investigation.quantityComparison ? (
              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-void border border-line text-xs">
                  <span className="text-mist">Declared Mass:</span>
                  <span className="text-white font-bold">{investigation.quantityComparison.declaredQuantity} {investigation.quantityComparison.unit}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-void border border-line text-xs">
                  <span className="text-mist">Facility Received:</span>
                  <span className="text-white font-bold">{investigation.quantityComparison.receivedQuantity || 72} {investigation.quantityComparison.unit}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-alert/15 border border-alert/40 text-xs">
                  <span className="text-alert font-bold">Variance Amount:</span>
                  <span className="text-alert font-bold">{investigation.quantityComparison.discrepancyAmount} {investigation.quantityComparison.unit}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-mist">No mass discrepancy attached.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pillar 7: Case Timeline & Evidence Locker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investigation Timeline */}
        <div className="glass-panel p-6 rounded-2xl border border-line space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <Calendar className="w-4 h-4 text-em" />
            <h3 className="font-display font-bold text-base text-white">Investigation Timeline</h3>
          </div>

          <div className="space-y-4 font-mono text-xs relative pl-4 border-l border-line/60 ml-2">
            {timelineEvents.map((ev, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-em shadow-[0_0_10px_rgba(57,255,176,0.6)]" />
                <div className="flex items-center gap-2">
                  <span className="text-cyan font-bold">{ev.time}</span>
                  <span className="text-white font-bold">{ev.label}</span>
                </div>
                <p className="text-[11px] text-mist mt-0.5 font-sans leading-relaxed">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Locker */}
        <div className="glass-panel p-6 rounded-2xl border border-line space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan" />
              <h3 className="font-display font-bold text-base text-white">Evidence & Manifest Locker</h3>
            </div>
            <button
              onClick={() => alert('Document upload modal opened')}
              className="px-2.5 py-1 rounded-lg bg-void border border-line hover:border-em text-em text-[10px] font-mono flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Proof</span>
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-void/80 border border-line flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Weighbridge_Calibration_Cert_2026.pdf</span>
                <span className="text-[10px] text-mist">Uploaded by HZU-005 (Shravan) · 1.4 MB</span>
              </div>
              <span className="text-[10px] text-em font-bold">VERIFIED</span>
            </div>

            <div className="p-3 rounded-xl bg-void/80 border border-line flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Intake_Tare_Scale_Photo.jpg</span>
                <span className="text-[10px] text-mist">Uploaded by HZU-006 (GreenSafe) · 3.8 MB</span>
              </div>
              <span className="text-[10px] text-em font-bold">VERIFIED</span>
            </div>

            <div className="p-3 rounded-xl bg-void/80 border border-line flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">CPCB_Form_10_Transit_Manifest.pdf</span>
                <span className="text-[10px] text-mist">Uploaded by HZU-002 (Apex Labs) · 820 KB</span>
              </div>
              <span className="text-[10px] text-cyan font-bold">SIGNED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Thread Form */}
      <div className="glass-panel p-6 rounded-2xl border border-line space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <MessageSquare className="w-4 h-4 text-em" />
          <h3 className="font-display font-bold text-base text-white">Stakeholder Response Thread</h3>
        </div>

        <form onSubmit={handleSendResponse} className="space-y-3">
          <textarea
            value={responseMsg}
            onChange={(e) => setResponseMsg(e.target.value)}
            placeholder="Provide formal explanation regarding mass balance variance or transit corridor telemetry..."
            className="w-full bg-void border border-line rounded-xl p-3 text-xs text-white placeholder:text-mist focus:outline-none focus:border-em h-24 font-sans"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingResponse || !responseMsg.trim()}
              className="px-5 py-2.5 rounded-xl bg-em text-black font-semibold text-xs font-mono flex items-center gap-2 hover:brightness-110 disabled:opacity-40 shadow-[0_0_15px_rgba(57,255,176,0.2)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingResponse ? 'Submitting...' : 'Submit Formal Statement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Verdict Modal */}
      <Modal isOpen={isVerdictModalOpen} onClose={() => setIsVerdictModalOpen(false)} title="Record Compliance Verdict">
        <form onSubmit={handleCloseCase} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-mist mb-1">Administrative Verdict</label>
            <select
              value={verdictForm.verdict}
              onChange={(e) => setVerdictForm({ ...verdictForm, verdict: e.target.value })}
              className="w-full bg-void border border-line rounded-xl p-3 text-white focus:outline-none focus:border-em"
            >
              <option value="EXPLANATION_ACCEPTED">Explanation Accepted · Case Closed (Within Tolerance)</option>
              <option value="VIOLATION_CONFIRMED">Violation Confirmed · Regulatory Penalty Issued</option>
              <option value="FURTHER_AUDIT_REQUIRED">Escalate for On-Site CPCB Physical Audit</option>
            </select>
          </div>

          <div>
            <label className="block text-mist mb-1">Resolution Summary Note</label>
            <textarea
              value={verdictForm.resolutionNote}
              onChange={(e) => setVerdictForm({ ...verdictForm, resolutionNote: e.target.value })}
              className="w-full bg-void border border-line rounded-xl p-3 text-white focus:outline-none focus:border-em h-20 font-sans"
              placeholder="State rationale for verdict and regulatory compliance confirmation..."
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsVerdictModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-void border border-line text-mist"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-lg"
            >
              Confirm Verdict & Sign Case
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
