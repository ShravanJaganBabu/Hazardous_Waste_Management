import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { TranslationKey } from '../../i18n';

export interface ActionItem {
  id: string;
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  title: string;
  description: string;
  timeAgo: string;
  actionUrl: string;
  actionLabel: string;
}

export const ActionRequired: React.FC<{ items: ActionItem[] }> = ({ items }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!items || items.length === 0) return null;

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'EMERGENCY':
        return 'border-critical/60 bg-critical/10 text-critical shadow-glow-critical animate-pulse';
      case 'CRITICAL':
        return 'border-alert/50 bg-alert/10 text-alert shadow-glow-alert';
      case 'WARNING':
        return 'border-warning/40 bg-warning/10 text-warning';
      default:
        return 'border-cyan/30 bg-cyan/10 text-cyan';
    }
  };

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-alert animate-pulse" />
        <h2 className="text-xs font-mono font-semibold tracking-widest text-alert uppercase">
          {t('actionRequiredTitle', { count: items.length }, `ACTION REQUIRED // URGENT DISPATCH QUEUE (${items.length})`)}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`glass-panel p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${getSeverityStyle(
              item.severity
            )}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-current">
                  <AlertTriangle className="w-3 h-3" />
                  {t(`severity_${item.severity}` as TranslationKey, item.severity)}
                </span>
                <span className="text-[11px] font-mono text-mist flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.timeAgo}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white tracking-tight break-words">{item.title}</h4>
              <p className="text-xs text-mist/90 mt-1 line-clamp-3 leading-relaxed break-words">{item.description}</p>
            </div>

            <button
              onClick={() => navigate(item.actionUrl)}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-black/50 hover:bg-black/80 border border-current text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors duration-150"
            >
              <span className="break-words">{item.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-current shrink-0" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
