import React from 'react';
import { X, CheckCheck, Bell, ShieldCheck, ExternalLink, Volume2, Sparkles, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useVoiceAlert } from '../../context/VoiceAlertContext';
import { useLanguage } from '../../context/LanguageContext';
import { SeverityBadge } from './StatusBadge';
import { useNavigate } from 'react-router-dom';

export const NotificationDrawer: React.FC = () => {
  const { alerts, unreadCount, isOpen, closeDrawer, markAsRead, markAllAsRead, triggerDemoInvestigationAlert } = useNotifications();
  const { playVoiceAlert, testVoiceAnnouncement, currentVoiceName } = useVoiceAlert();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-void border-l border-line h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-panel/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-em/10 text-em border border-em/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white tracking-tight">
                {t('systemAlertsVoiceHud', 'System Alerts & Voice HUD')}
              </h3>
              <p className="text-xs font-mono text-mist">
                {t('unreadNotifications', { count: unreadCount, plural: unreadCount !== 1 ? 's' : '' }, `${unreadCount} unread notifications`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={testVoiceAnnouncement}
              title={t('testVoiceEngine', 'Test Voice')}
              className="p-2 rounded-lg text-em hover:text-white bg-em/10 hover:bg-em/20 border border-em/30 text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px]">{t('testVoiceEngine', 'Test Voice')}</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title={t('markAllAsRead', 'Mark all as read')}
                className="p-2 rounded-lg text-mist hover:text-em hover:bg-white/5 border border-transparent hover:border-line transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg text-mist hover:text-white hover:bg-white/5 border border-transparent hover:border-line transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Voice Status Banner */}
        <div className="px-4 py-2.5 bg-em/5 border-b border-line/60 flex items-center justify-between text-[11px] font-mono text-mist">
          <div className="flex items-center gap-1.5 text-cyan">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('aiFemaleVoiceSynthesizer', 'AI Female Voice Synthesizer')}</span>
          </div>
          <span className="text-em text-[10px] truncate max-w-[150px]">{currentVoiceName}</span>
        </div>

        {/* Live Simulation Quick Trigger */}
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/25 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono text-amber-300">{t('liveDiscrepancyDemo', 'Live Discrepancy Demo')}</span>
          </div>
          <button
            onClick={() => {
              triggerDemoInvestigationAlert();
              closeDrawer();
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[11px] shadow transition-all flex items-center gap-1"
          >
            <span>{t('simulateAlert', 'Simulate 2.5kg Alert')}</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-16 text-center text-mist">
              <ShieldCheck className="w-12 h-12 mx-auto text-em/40 mb-3" />
              <p className="text-sm font-medium">{t('allSystemsNominal', 'All systems nominal.')}</p>
              <p className="text-xs text-mist/60 mt-1">{t('noActiveAlerts', 'No active compliance or shipment alerts.')}</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  alert.isRead
                    ? 'bg-panel/40 border-line text-mist hover:bg-panel/70'
                    : 'bg-panel-light border-em/30 text-white shadow-[0_0_15px_rgba(57,255,176,0.05)] hover:border-em'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-em animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoiceAlert(`${alert.title}. ${alert.message}`, alert.severity);
                      }}
                      title="Read aloud with AI voice"
                      className="p-1 rounded bg-black/40 hover:bg-em/20 text-mist hover:text-em border border-line hover:border-em/40 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-mist">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-semibold mt-2 text-white break-words">{alert.title}</h4>
                <p className="text-xs text-mist mt-1 leading-relaxed break-words">{alert.message}</p>

                <div className="mt-3 pt-2 border-t border-line/40 flex items-center justify-between text-xs font-mono">
                  {alert.actionUrl ? (
                    <button
                      onClick={() => {
                        if (!alert.isRead) markAsRead(alert.alertId);
                        navigate(alert.actionUrl!);
                        closeDrawer();
                      }}
                      className="flex items-center gap-1 text-em hover:underline"
                    >
                      <span>{t('inspectCase', 'Inspect Case')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : <span />}

                  {!alert.isRead && (
                    <button
                      onClick={() => markAsRead(alert.alertId)}
                      className="text-mist hover:text-white text-[11px]"
                    >
                      {t('markAsRead', 'Mark as read')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-panel/50 text-center">
          <p className="text-[11px] font-mono text-mist">
            {t('footerRealtimeNotice', 'HAZTRACK REAL-TIME DISPATCH ENGINE // SECURE COMPLIANCE HUB')}
          </p>
        </div>
      </div>
    </div>
  );
};
