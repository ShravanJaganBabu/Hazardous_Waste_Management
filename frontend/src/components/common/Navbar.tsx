import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Shield,
  ChevronDown,
  Sparkles,
  Layers,
  FlaskConical,
  Truck,
  Factory,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useVoiceAlert } from '../../context/VoiceAlertContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { TranslationKey } from '../../i18n';

interface IDemoRoleOption {
  role: UserRole;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  defaultId: string;
}

const DEMO_ROLES_BASE: IDemoRoleOption[] = [
  {
    role: 'ADMIN',
    labelKey: 'adminRole',
    descKey: 'centralComplianceOversight',
    icon: Shield,
    route: '/admin/dashboard',
    defaultId: 'HZU-001',
  },
  {
    role: 'LABORATORY',
    labelKey: 'labRole',
    descKey: 'wasteRegistrationPickups',
    icon: FlaskConical,
    route: '/lab/dashboard',
    defaultId: 'HZU-002',
  },
  {
    role: 'TRANSPORTER',
    labelKey: 'transporterRole',
    descKey: 'fleetTransitHandoffs',
    icon: Truck,
    route: '/transporter/dashboard',
    defaultId: 'HZU-004',
  },
  {
    role: 'TREATMENT_FACILITY',
    labelKey: 'facilityRole',
    descKey: 'receiptTreatmentDisposal',
    icon: Factory,
    route: '/facility/dashboard',
    defaultId: 'HZU-006',
  },
];

export const Navbar: React.FC = () => {
  const { user, setDemoRole, switchUserQuick } = useAuth();
  const { unreadCount, toggleDrawer } = useNotifications();
  const { isMuted, toggleMute } = useVoiceAlert();
  const { isConnected } = useSocket();
  const { t } = useLanguage();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (roleOption: IDemoRoleOption) => {
    setDemoRole(roleOption.role);
    setShowRoleDropdown(false);
    navigate(roleOption.route);
  };

  const currentRoleConfig =
    DEMO_ROLES_BASE.find(
      (r) =>
        r.role === user?.role ||
        (user?.role === 'INDUSTRY' && r.role === 'LABORATORY')
    ) || DEMO_ROLES_BASE[0];

  const CurrentRoleIcon = currentRoleConfig.icon;

  return (
    <header className="h-16 border-b border-line bg-void/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-panel border border-em/40 flex items-center justify-center text-em shadow-[0_0_15px_rgba(57,255,176,0.25)] group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <div className="leading-none">
            <span className="font-display font-bold text-base tracking-wider text-white">
              HAZ<span className="text-em">TRACK</span>
            </span>
            <span className="block font-mono text-[9px] tracking-widest text-mist mt-0.5">
              {t('secureChain')} // {t('demoActive')}
            </span>
          </div>
        </Link>

        {/* Live System Engine Status */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-line text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-em animate-pulse' : 'bg-critical'}`} />
          <span className="text-mist">{isConnected ? t('liveChainSecured') : t('connecting')}</span>
        </div>
      </div>

      {/* Center: Prominent DEMO ROLE Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowRoleDropdown((prev) => !prev)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-panel border border-em/40 hover:border-em text-white shadow-[0_0_20px_rgba(57,255,176,0.15)] transition-all group"
          title={t('selectDemoRole')}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-em" />
            <span className="text-[11px] font-mono text-mist uppercase tracking-wider font-semibold">
              {t('demoRole')}:
            </span>
            <span className="text-xs font-semibold text-em font-mono flex items-center gap-1.5">
              <CurrentRoleIcon className="w-3.5 h-3.5" />
              {t(currentRoleConfig.labelKey)}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-mist group-hover:text-white transition-transform duration-200 ${
              showRoleDropdown ? 'rotate-180 text-em' : ''
            }`}
          />
        </button>

        {/* Demo Role Dropdown Menu */}
        {showRoleDropdown && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-void border border-line rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
            <div className="p-2.5 border-b border-line/60">
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan" />
                {t('selectDemoRole')}
              </p>
              <p className="text-[11px] text-mist/80 mt-0.5">
                {t('switchDashboardInstantly')}
              </p>
            </div>

            <div className="py-1 space-y-1">
              {DEMO_ROLES_BASE.map((r) => {
                const Icon = r.icon;
                const isSelected =
                  user?.role === r.role ||
                  (user?.role === 'INDUSTRY' && r.role === 'LABORATORY');
                return (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-em/15 text-em border border-em/30 shadow-[0_0_15px_rgba(57,255,176,0.1)]'
                        : 'text-mist hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-em/20 text-em' : 'bg-panel text-mist'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white leading-tight">
                          {t(r.labelKey)}
                        </p>
                        <p className="text-[10px] text-mist">{t(r.descKey)}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-em shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* AI Voice Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? t('aiVoiceMuted') : t('aiVoiceActive')}
          className={`p-2 rounded-lg border transition-all ${
            isMuted
              ? 'bg-white/5 border-line text-mist hover:text-white'
              : 'bg-em/10 border-em/40 text-em shadow-[0_0_15px_rgba(57,255,176,0.2)]'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={toggleDrawer}
          className="relative p-2 rounded-lg bg-white/5 border border-line hover:border-em/40 text-mist hover:text-white transition-colors"
          title={t('notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-critical text-white text-[10px] font-mono font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Global Language Selector */}
        <LanguageSelector align="right" />

        {/* Active Demo Identity Pill */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg bg-panel border border-line hover:border-line-bright transition-all"
            title="Demo User Details"
          >
            <div className="w-7 h-7 rounded-md bg-em/15 text-em border border-em/30 flex items-center justify-center font-mono text-xs font-bold">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name}</p>
              <p className="text-[10px] font-mono text-em">{user?.userId}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-mist" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-void border border-line rounded-xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
              {/* Profile Overview */}
              <div className="p-3 border-b border-line/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-mist font-medium">{user?.userId}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-em/10 text-em border border-em/20 font-semibold">
                    {user?.role}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-1">{user?.name}</p>
                <p className="text-xs text-mist truncate">{user?.organizationName}</p>
                <span className="inline-block mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                  {t('demoAuthBypassed')}
                </span>
              </div>

              {/* Reset to Admin / Return to Landing */}
              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    setDemoRole('ADMIN');
                    setShowUserMenu(false);
                    navigate('/admin/dashboard');
                  }}
                  className="w-full p-2 text-left rounded-lg text-xs font-medium text-mist hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-em" />
                  {t('resetToAdmin')}
                </button>
                <Link
                  to="/"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full p-2 text-left rounded-lg text-xs font-medium text-mist hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors font-mono"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan" />
                  {t('landingPage')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

