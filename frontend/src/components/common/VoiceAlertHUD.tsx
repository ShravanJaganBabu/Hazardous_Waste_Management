import React from 'react';
import { Volume2, VolumeX, RotateCcw, X, AlertOctagon, Radio } from 'lucide-react';
import { useVoiceAlert } from '../../context/VoiceAlertContext';
import { useLanguage } from '../../context/LanguageContext';
import { TranslationKey } from '../../i18n';

export const VoiceAlertHUD: React.FC = () => {
  const { activeMessage, dismissActiveMessage, replayActiveMessage, isMuted, toggleMute, currentVoiceName, isSpeaking } = useVoiceAlert();
  const { t } = useLanguage();

  if (!activeMessage) return null;

  const isEmergency = activeMessage.severity === 'EMERGENCY';

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-md w-full animate-bounce-short">
      <div
        className={`glass-panel p-4 rounded-xl border backdrop-blur-2xl shadow-2xl ${
          isEmergency
            ? 'border-critical bg-critical/15 text-white shadow-glow-critical'
            : 'border-em bg-panel/90 text-white shadow-glow-em'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isEmergency ? 'bg-critical/30 text-critical' : 'bg-em/20 text-em'} animate-pulse`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 border border-current">
                  {t('aiFemaleVoiceSynthesizer', 'AI Female Voice')} // {t(`severity_${activeMessage.severity}` as TranslationKey, activeMessage.severity)}
                </span>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-cyan">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>{t('broadcastingLive', 'SPEAKING')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-mist mt-0.5 font-mono truncate max-w-[280px]">
                {currentVoiceName}
              </p>
            </div>
          </div>

          <button
            onClick={dismissActiveMessage}
            className="text-mist hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-sm font-medium leading-snug bg-black/40 p-2.5 rounded-lg border border-line break-words">
          "{activeMessage.text}"
        </p>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/60">
          <div className="flex items-center gap-2">
            <button
              onClick={replayActiveMessage}
              className="flex items-center gap-1 text-xs font-mono text-em hover:text-white bg-em/10 hover:bg-em/20 px-2.5 py-1 rounded border border-em/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {t('replayVoice', 'Replay')}
            </button>
            <button
              onClick={toggleMute}
              className="flex items-center gap-1 text-xs font-mono text-mist hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded border border-line transition-colors"
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-critical" /> : <Volume2 className="w-3 h-3 text-em" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          <button
            onClick={dismissActiveMessage}
            className="text-xs font-mono text-mist hover:text-white underline"
          >
            {t('voiceAlertDismiss', 'Acknowledge & Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
