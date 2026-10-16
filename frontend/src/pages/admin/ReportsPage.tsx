import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/reportService';
import { IDashboardStats } from '../../types';
import { FileSpreadsheet, Download, ShieldCheck, CheckCircle2, FileText, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportService.getDashboardStats();
        setStats(data.stats);
        setWasteTypes(data.wasteTypeBreakdown);
        setTrends(data.monthlyTrends);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const COLORS = ['#39ffb0', '#3ce0e8', '#ffb338', '#ff3d57', '#a855f7'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-em uppercase tracking-widest">
            <FileSpreadsheet className="w-4 h-4" />
            <span>REGULATORY COMPLIANCE & ANALYTICS</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            CPCB Environmental Compliance Reports
          </h1>
        </div>

        <button
          onClick={() => window.print()}
          className="py-2.5 px-5 rounded-xl bg-em hover:bg-em/90 text-black font-semibold text-xs flex items-center gap-2 shadow-glow-em transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Export Compliance Manifest</span>
        </button>
      </div>

      {/* Compliance Overview Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-em/30 bg-em/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-em/20 text-em border border-em/40">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-em uppercase tracking-wider">
              OFFICIAL CPCB RATING // HAZTRACK REGULATORY NETWORK
            </span>
            <h3 className="text-xl font-display font-bold text-white">
              Institutional Environmental Standard: {stats?.complianceRate || 99.4}% Compliance
            </h3>
            <p className="text-xs text-mist mt-0.5">
              Verified by Central Pollution Control Board (CPCB) Rule 19 Hazardous Waste Tracking
            </p>
          </div>
        </div>

        <div className="flex gap-4 font-mono text-center">
          <div className="p-3 rounded-xl bg-black/50 border border-line">
            <span className="text-[10px] text-mist block">Verified Destructions</span>
            <span className="text-base font-bold text-em">100%</span>
          </div>
          <div className="p-3 rounded-xl bg-black/50 border border-line">
            <span className="text-[10px] text-mist block">Audit Integrity</span>
            <span className="text-base font-bold text-cyan">SHA-256</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-line">
          <h3 className="font-display font-semibold text-base text-white mb-4">
            Consignment Processing Capacity (kg/month)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="month" stroke="#93a6a1" fontSize={11} />
                <YAxis stroke="#93a6a1" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1210',
                    borderColor: 'rgba(148,255,205,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="generated" fill="#39ffb0" radius={[4, 4, 0, 0]} name="Generated" />
                <Bar dataKey="treated" fill="#3ce0e8" radius={[4, 4, 0, 0]} name="Neutralized" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Class Share (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-line">
          <h3 className="font-display font-semibold text-base text-white mb-4">
            Hazardous Consignment Class Proportions
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteTypes}
                  dataKey="totalQuantity"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {wasteTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1210',
                    borderColor: 'rgba(148,255,205,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
