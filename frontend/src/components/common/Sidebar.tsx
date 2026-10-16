import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  AlertOctagon,
  FileSearch,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  QrCode,
  Flame,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: t('commandCenter'), icon: LayoutDashboard },
          { to: '/admin/compliance', label: t('cpcbCompliance'), icon: ShieldCheck },
          { to: '/admin/waste', label: t('wasteRegistry'), icon: Boxes },
          { to: '/admin/shipments', label: t('activeShipments'), icon: Truck },
          { to: '/admin/investigations', label: t('investigations'), icon: FileSearch },
          { to: '/admin/incidents', label: t('emergencyControl'), icon: AlertOctagon },
          { to: '/admin/reports', label: t('reportsAnalytics'), icon: FileSpreadsheet },
          { to: '/admin/audit-logs', label: t('auditLedger'), icon: FileCheck2 },
          { to: '/admin/users', label: t('stakeholders'), icon: Users },
        ];
      case 'LABORATORY':
      case 'INDUSTRY':
        return [
          { to: '/lab/dashboard', label: t('labOperations'), icon: LayoutDashboard },
          { to: '/admin/waste', label: t('myConsignments'), icon: Boxes },
          { to: '/admin/shipments', label: t('shipmentTracking'), icon: Truck },
          { to: '/admin/investigations', label: t('inquiriesAudits'), icon: FileSearch },
        ];
      case 'TRANSPORTER':
        return [
          { to: '/transporter/dashboard', label: t('fleetTerminal'), icon: LayoutDashboard },
          { to: '/admin/shipments', label: t('assignedRoutes'), icon: Truck },
          { to: '/admin/incidents', label: t('roadIncidents'), icon: AlertOctagon },
          { to: '/admin/investigations', label: t('varianceInquiries'), icon: FileSearch },
        ];
      case 'TREATMENT_FACILITY':
        return [
          { to: '/facility/dashboard', label: t('plantTerminal'), icon: LayoutDashboard },
          { to: '/admin/shipments', label: t('incomingShipments'), icon: Truck },
          { to: '/admin/investigations', label: t('verificationAudits'), icon: FileSearch },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 border-r border-line bg-panel/70 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] font-mono tracking-widest text-mist uppercase">
            {role === 'ADMIN' ? t('adminRole') : role === 'LABORATORY' ? t('labRole') : role === 'INDUSTRY' ? t('industryRole') : role === 'TRANSPORTER' ? t('transporterRole') : t('facilityRole')} {t('portal')}
          </p>
          <p className="text-xs font-semibold text-white truncate">{user?.organizationName}</p>
        </div>

        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-em/15 text-em border border-em/30 shadow-[0_0_15px_rgba(57,255,176,0.1)]'
                    : 'text-mist hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Institutional Compliance Credit Footer */}
      <div className="p-4 border-t border-line/60 bg-void/50">
        <div className="p-3 rounded-lg bg-black/40 border border-line">
          <p className="text-[10px] font-mono font-bold text-em tracking-wider uppercase">
            {t('secureChain')}
          </p>
          <p className="text-[10px] text-mist mt-0.5">{t('brandSubtitle')}</p>
          <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-mist/70">
            <span>HAZTRACK v2.0</span>
            <span className="text-em">{t('cpcbVerified')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
