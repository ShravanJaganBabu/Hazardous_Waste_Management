import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, User as UserIcon, ArrowRight, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { switchUserQuick } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier) {
      switchUserQuick(identifier);
    }
    navigate('/dashboard');
  };

  const demoUsers = [
    { name: 'Harinitha', id: 'HZU-001', username: 'harinitha_admin', roleKey: 'adminRole' as const, badgeKey: 'adminBadge' as const },
    { name: 'Rinitha', id: 'HZU-002', username: 'rinitha_lab', roleKey: 'labRole' as const, badgeKey: 'labBadge' as const },
    { name: 'Harini', id: 'HZU-003', username: 'harini_industry', roleKey: 'industryRole' as const, badgeKey: 'industryBadge' as const },
    { name: 'Rini', id: 'HZU-004', username: 'rini_transporter', roleKey: 'transporterRole' as const, badgeKey: 'transporterBadge1' as const },
    { name: 'Shravan', id: 'HZU-005', username: 'shravan_transporter', roleKey: 'transporterRole' as const, badgeKey: 'transporterBadge2' as const },
    { name: 'Ravan', id: 'HZU-006', username: 'ravan_facility', roleKey: 'facilityRole' as const, badgeKey: 'facilityBadge1' as const },
    { name: 'Avan', id: 'HZU-007', username: 'avan_facility', roleKey: 'facilityRole' as const, badgeKey: 'facilityBadge2' as const },
  ];

  const handleQuickEnter = (username: string) => {
    switchUserQuick(username);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-void flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden grid-bg">
      {/* Background glow flares */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-em-deep/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header with Brand & Top-Right Language Selector */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-30 pt-2 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-panel border border-em/40 flex items-center justify-center text-em shadow-[0_0_15px_rgba(57,255,176,0.25)] group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base tracking-wider text-white">
            HAZ<span className="text-em">TRACK</span>
          </span>
        </Link>

        {/* Preferred Language Selector (Top-Right) */}
        <LanguageSelector align="right" />
      </div>

      {/* Main Authentication Gate Container */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 my-auto py-6">
        {/* Login Form Box (7 cols) */}
        <div className="lg:col-span-7 glass-panel bg-void/90 p-6 sm:p-8 rounded-3xl border border-line shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-panel border border-em/40 flex items-center justify-center text-em shadow-[0_0_20px_rgba(57,255,176,0.3)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white tracking-tight">
                {t('loginHeading')}
              </h1>
              <p className="text-xs font-mono text-mist mt-0.5">
                {t('loginSubtitle')}
              </p>
            </div>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('sessionExpired')}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-critical/10 border border-critical/30 text-critical text-xs font-mono flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-mist uppercase mb-1.5">
                {t('usernameOrEmail')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mist">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  className="w-full bg-black/50 border border-line focus:border-em rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-mist/40 font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-mist uppercase">
                  {t('password')}
                </label>
                <span className="text-[11px] font-mono text-em/80">
                  {t('defaultPasswordHint')}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mist">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full bg-black/50 border border-line focus:border-em rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-mist/40 font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-em text-black font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_0_25px_rgba(57,255,176,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span className="font-mono text-xs">{t('authenticating')}</span>
                </div>
              ) : (
                <>
                  <span>{t('authenticateAndEnter')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line/60 flex items-center justify-between text-xs text-mist font-mono">
            <span>{t('centralControl')}</span>
            <span className="text-em">{t('secureMonitoringGate')}</span>
          </div>
        </div>

        {/* Stakeholder Demo Selector (5 cols) */}
        <div className="lg:col-span-5 glass-panel bg-panel/70 p-6 rounded-3xl border border-line flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan" />
              <h2 className="font-display font-semibold text-sm text-white">
                {t('presetsTitle')}
              </h2>
            </div>
            <p className="text-xs text-mist leading-relaxed mb-4">
              {t('presetsDescription')}
            </p>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickEnter(u.username)}
                  className="w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all bg-black/30 border-line hover:border-em/60 hover:bg-em/10 text-mist hover:text-white group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{u.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-cyan">
                        {t(u.roleKey)}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-mist mt-0.5">
                      {t(u.badgeKey)}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-em bg-em/10 px-2 py-1 rounded border border-em/20">
                    {u.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 text-[10px] font-mono text-mist/80">
            {t('multiPartyRbac')}
          </div>
        </div>
      </div>

      {/* Subtle Bottom Bar */}
      <div className="w-full max-w-5xl mx-auto text-center text-[10px] font-mono text-mist/60 py-2">
        {t('secureAccessOnly')}
      </div>
    </div>
  );
};
