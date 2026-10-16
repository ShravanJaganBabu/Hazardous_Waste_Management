import React from 'react';
import { WasteStatus, AlertSeverity } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { TranslationKey } from '../../i18n';

export const StatusBadge: React.FC<{ status: WasteStatus | string }> = ({ status }) => {
  const { t } = useLanguage();

  const getStyle = (st: string) => {
    switch (st) {
      case 'REGISTERED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'COLLECTION_REQUESTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'COLLECTED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'IN_TRANSIT':
        return 'bg-em/10 text-em border-em/30 animate-pulse';
      case 'RECEIVED':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'TREATED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DISPOSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'OPEN':
      case 'REPORTED':
        return 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
      case 'AWAITING_RESPONSE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESPONSE_RECEIVED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'VIOLATION_CONFIRMED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const statusKey = `status_${status}` as TranslationKey;
  const translatedText = t(statusKey, status.replace(/_/g, ' '));

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase border ${getStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {translatedText}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const { t } = useLanguage();

  const getStyle = () => {
    switch (severity) {
      case 'INFO':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CRITICAL':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/40 font-semibold';
      case 'EMERGENCY':
        return 'bg-red-500/20 text-red-400 border-red-500/50 font-bold animate-pulse';
    }
  };

  const severityKey = `severity_${severity}` as TranslationKey;
  const translatedSeverity = t(severityKey, severity);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${getStyle()}`}
    >
      {translatedSeverity}
    </span>
  );
};
