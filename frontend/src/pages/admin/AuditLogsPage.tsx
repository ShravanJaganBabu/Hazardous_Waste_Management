import React, { useEffect, useState } from 'react';
import { auditService } from '../../services/alertService';
import { IAuditLog } from '../../types';
import { ShieldCheck, Search, Filter, History, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs({
        search: search || undefined,
        entityType: entityFilter || undefined,
        actorRole: roleFilter || undefined,
      });
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>CRYPTOGRAPHIC COMPLIANCE LEDGER</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Immutable Audit Trail & Chain History
          </h1>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mist absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ledger by actor, action, ID..."
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

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-lg px-3 py-2 text-xs text-mist font-mono focus:outline-none focus:border-em"
          >
            <option value="">All Entities</option>
            <option value="WASTE">Waste</option>
            <option value="SHIPMENT">Shipment</option>
            <option value="INVESTIGATION">Investigation</option>
            <option value="INCIDENT">Incident</option>
            <option value="AUTH">Auth</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-black/40 border border-line rounded-lg px-3 py-2 text-xs text-mist font-mono focus:outline-none focus:border-em"
          >
            <option value="">All Actor Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="LABORATORY">Laboratory</option>
            <option value="INDUSTRY">Industry</option>
            <option value="TRANSPORTER">Transporter</option>
            <option value="TREATMENT_FACILITY">Treatment Facility</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[11px] font-mono text-mist uppercase tracking-wider bg-panel/50">
                <th className="py-3.5 px-4">Audit ID</th>
                <th className="py-3.5 px-4">Actor Stakeholder</th>
                <th className="py-3.5 px-4">Action Signature</th>
                <th className="py-3.5 px-4">Entity Ref</th>
                <th className="py-3.5 px-4">Cryptographic Record Description</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-mist">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-panel-light/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {log.auditId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{log.actorName}</p>
                      <span className="text-[10px] text-cyan">{log.actorRole} ({log.actorUserId})</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-em/10 text-em border border-em/20 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-mist">
                      {log.entityType} // {log.entityId}
                    </td>
                    <td className="py-4 px-4 font-sans text-mist max-w-sm leading-relaxed">
                      {log.description}
                    </td>
                    <td className="py-4 px-4 text-right text-mist/80 shrink-0">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-em" />
                        {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
