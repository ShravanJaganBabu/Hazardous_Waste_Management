import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Radar, Bell, QrCode, ShieldCheck, FlaskConical, Package, Truck, Factory, Recycle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { ThreeHazTrackChain } from '../components/ThreeHazTrackChain';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleEnter = () => {
    if (user?.role === 'ADMIN') navigate('/admin/dashboard');
    else if (user?.role === 'LABORATORY' || user?.role === 'INDUSTRY') navigate('/lab/dashboard');
    else if (user?.role === 'TRANSPORTER') navigate('/transporter/dashboard');
    else if (user?.role === 'TREATMENT_FACILITY') navigate('/facility/dashboard');
    else navigate('/admin/dashboard');
  };

  const stages = [
    { n: '01', l: 'Generate', sub: 'Lab / Industry Declaration', icon: FlaskConical },
    { n: '02', l: 'Collect', sub: 'Containerized Sealed Intake', icon: Package },
    { n: '03', l: 'Transport', sub: 'Secured GPS Tracked Route', icon: Truck },
    { n: '04', l: 'Treat', sub: 'Neutralization & Processing', icon: Factory },
    { n: '05', l: 'Dispose', sub: 'Certified CPCB Destruction', icon: Recycle },
  ];

  const features = [
    {
      n: '01',
      t: 'Real-time Traceability',
      d: 'Continuous GPS telemetry and stage verification from generator pickup to final landfill neutralization.',
      icon: Radar,
    },
    {
      n: '02',
      t: 'Smart Discrepancy Detection',
      d: 'Automated mass-balance calculation flags multi-party quantity variances and initiates automated inquiries.',
      icon: Bell,
    },
    {
      n: '03',
      t: 'Cryptographic QR Manifests',
      d: 'Instant tamper-proof consignment identification and document verification at checkpoints.',
      icon: QrCode,
    },
    {
      n: '04',
      t: 'AI Voice & Audit Ledger',
      d: 'Tactical voice warnings for emergency containment alerts paired with an immutable compliance log.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-void text-white font-sans selection:bg-em/20 selection:text-em">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center bg-void/80 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-em/40 flex items-center justify-center text-em shadow-[0_0_20px_rgba(57,255,176,0.3)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-wide">
                Haz<span className="text-em">Track</span>
              </span>
              <span className="block font-mono text-[9px] tracking-widest text-mist">
                HAZARDOUS WASTE MANAGEMENT SYSTEM
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-mist">
            <a href="#home" className="hover:text-white transition-colors">{t('home')}</a>
            <a href="#trace" className="hover:text-white transition-colors">{t('howItWorks')}</a>
            <a href="#features" className="hover:text-white transition-colors">{t('features')}</a>
            <a href="#about" className="hover:text-white transition-colors">{t('about')}</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSelector align="right" />
            <button
              onClick={handleEnter}
              className="py-2.5 px-5 sm:px-6 rounded-full border border-em/50 text-xs font-mono text-em hover:bg-em/10 hover:border-em transition-all shadow-[0_0_15px_rgba(57,255,176,0.15)] flex items-center gap-1.5"
            >
              <span>{t('enterDemo')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-40 pb-20 overflow-hidden min-h-screen flex items-center grid-bg">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-em-deep/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <p className="font-mono text-xs tracking-widest text-em uppercase mb-4">
              {t('heroPreTitle')}
            </p>
            <h1 className="font-display font-bold text-5xl lg:text-6xl tracking-tight leading-[1.08]">
              <span>{t('heroTitle1')}</span>
              <br />
              <span>{t('heroTitle2')}</span>
              <br />
              <span className="text-em drop-shadow-[0_0_25px_rgba(57,255,176,0.45)]">
                {t('heroTitle3')}
              </span>
            </h1>
            <p className="mt-6 text-mist text-lg max-w-lg leading-relaxed">
              {t('heroDescription')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleEnter}
                className="py-3.5 px-8 rounded-full bg-em text-black font-semibold text-sm flex items-center gap-2 hover:brightness-110 shadow-[0_0_30px_rgba(57,255,176,0.35)] transition-all"
              >
                <span>{t('enterDemo')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#trace"
                className="py-3.5 px-8 rounded-full border border-white/20 text-white/90 text-sm hover:border-em/50 hover:text-white transition-all"
              >
                ▷ {t('howItWorks')}
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-line/60 font-mono">
              <div>
                <p className="text-xs text-mist">{t('cpcbCompliance')}</p>
                <p className="text-lg font-bold text-white mt-0.5">100% CPCB</p>
              </div>
              <div>
                <p className="text-xs text-mist">Mass Balance</p>
                <p className="text-lg font-bold text-em mt-0.5">Automated</p>
              </div>
              <div>
                <p className="text-xs text-mist">AI Voice HUD</p>
                <p className="text-lg font-bold text-cyan mt-0.5">Active</p>
              </div>
            </div>
          </div>

          {/* Interactive 3D Holographic Chain Graphic */}
          <div className="relative flex items-center justify-center">
            <ThreeHazTrackChain />
          </div>
        </div>
      </section>

      {/* Traceability Lifecycle Section */}
      <section id="trace" className="py-24 border-t border-line bg-panel/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-white">
              {t('completeTraceabilityArch')}
            </h2>
            <p className="text-mist mt-3 text-sm">
              {t('traceabilityDesc')}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-6">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.n}
                  className="glass-panel p-6 rounded-2xl border border-line hover:border-em/50 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-void border border-em/30 flex items-center justify-center text-em group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-em/70 mt-4 block">{stage.n}</span>
                  <h3 className="font-display font-semibold text-lg text-white mt-1">{stage.l}</h3>
                  <p className="text-xs text-mist mt-2 leading-relaxed">{stage.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 border-t border-line">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl">
            <p className="text-xs font-mono text-em uppercase tracking-widest">{t('enterpriseCompliance')}</p>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mt-2">
              {t('builtForRegulatory')}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.n}
                  className="glass-panel p-8 rounded-2xl border border-line hover:border-em/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono text-mist">{feat.n}</span>
                    <div className="w-10 h-10 rounded-xl bg-em/10 text-em border border-em/20 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white">{feat.t}</h3>
                  <p className="text-sm text-mist mt-3 leading-relaxed">{feat.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer id="about" className="py-16 border-t border-line bg-void">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-panel border border-em/40 flex items-center justify-center text-em">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-white">
                Haz<span className="text-em">Track</span>
              </span>
              <p className="text-xs text-mist">{t('brandSubtitle')}</p>
            </div>
          </div>

          <div className="text-center md:text-right font-mono text-xs text-mist">
            <p className="font-semibold text-white">{t('complianceNetwork')}</p>
            <p className="mt-0.5 text-em">{t('environmentalDivision')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

