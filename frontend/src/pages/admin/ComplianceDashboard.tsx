import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, Clock, AlertTriangle, Scale, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ComplianceDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const complianceMetrics = [
    { title: 'Document Verification', percent: 92, status: 'Compliant', color: 'bg-em' },
    { title: 'Timely Collection', percent: 88, status: 'Review Required', color: 'bg-amber-400' },
    { title: 'Timely Treatment', percent: 95, status: 'Optimal', color: 'bg-em' },
    { title: 'Timely Disposal & Landfill', percent: 91, status: 'Optimal', color: 'bg-em' },
  ];

  const complianceIssues = [
    { type: 'Missing Documents', count: 7, severity: 'WARNING', sub: 'Consignment Form 10 / Lab manifests awaiting upload' },
    { type: 'Delayed Shipments', count: 4, severity: 'WARNING', sub: 'Transit exceeding corridor estimated arrival window' },
    { type: 'Quantity Discrepancies', count: 3, severity: 'CRITICAL', sub: 'Mass balance variance exceeds 1.5% regulatory tolerance' },
    { type: 'Overdue Investigations', count: 2, severity: 'CRITICAL', sub: '2-hour explanatory deadline elapsed without response' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-em" />
            <h1 className="font-display font-bold text-2xl text-white">
              CPCB Regulatory Compliance Dashboard
            </h1>
          </div>
          <p className="text-xs font-mono text-mist mt-1">
            CENTRAL POLLUTION CONTROL BOARD (CPCB) · HAZARDOUS WASTE RULES 2016
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('CPCB Audit Certificate generated and signed cryptographically!')}
            className="px-4 py-2 rounded-xl bg-em text-black font-semibold text-xs font-mono flex items-center gap-2 hover:brightness-110 shadow-[0_0_20px_rgba(57,255,176,0.3)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Generate CPCB Audit Report</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Score Card */}
      <div className="glass-panel p-8 rounded-2xl border border-em/40 bg-gradient-to-r from-panel/80 via-void/90 to-panel/80 shadow-[0_0_40px_rgba(57,255,176,0.15)] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-em/10 border border-em/30 text-em font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-em animate-pulse" />
            <span>ANNUAL AUDIT STATUS: CERTIFIED PASS</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">
            Overall System Compliance: <span className="text-em">94.8%</span>
          </h2>
          <p className="text-mist text-xs leading-relaxed">
            Continuous automated telemetry auditing across 7 active user identities, 5 lifecycle corridors, and 100% CPCB Form 10 manifests. Zero systemic breaches recorded this cycle.
          </p>
        </div>

        {/* Big Visual Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-void/80 border border-em/40 shadow-2xl text-center min-w-[200px]">
          <div className="font-display font-bold text-5xl text-em drop-shadow-[0_0_20px_rgba(57,255,176,0.5)]">
            94.8%
          </div>
          <span className="text-[11px] font-mono text-white mt-1 font-bold">COMPLIANCE INDEX</span>
          <span className="text-[9px] font-mono text-mist mt-0.5">GRADE: A+ EXEMPLARY</span>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-5">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-cyan" />
            <span>Category Performance Bars</span>
          </h3>

          <div className="space-y-4 font-mono text-xs">
            {complianceMetrics.map((m) => (
              <div key={m.title} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white">{m.title}</span>
                  <span className="text-em font-bold">{m.percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-void border border-line overflow-hidden">
                  <div
                    className={`h-full ${m.color} rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(57,255,176,0.5)]`}
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Compliance Issues List */}
        <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-5">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Compliance Bottlenecks</span>
          </h3>

          <div className="space-y-3">
            {complianceIssues.map((issue) => (
              <div
                key={issue.type}
                className="p-3.5 rounded-xl bg-void/60 border border-line flex items-center justify-between gap-4 font-mono text-xs hover:border-em/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        issue.severity === 'CRITICAL' ? 'text-alert' : 'text-amber-400'
                      }`}
                    >
                      {issue.count.toString().padStart(2, '0')} {issue.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-mist">{issue.sub}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-void border border-line text-[10px] text-mist">
                  Monitored
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
