import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
  X,
  ShieldAlert,
  User,
  Radio,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useVoiceAlert } from '../../context/VoiceAlertContext';
import { useLanguage } from '../../context/LanguageContext';

export const InvestigationAlertModal: React.FC = () => {
  const { activeInvestigationModal, closeInvestigationModal } = useNotifications();
  const { playVoiceAlert, isMuted, toggleMute, currentVoiceName, isSpeaking } = useVoiceAlert();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!activeInvestigationModal) return null;

  const {
    investigationId,
    wasteId,
    shipmentId,
    declaredQuantity,
    receivedQuantity,
    differenceKg,
    unit,
    assignedParty,
    assignedRole,
    voiceText,
    tolerance = 0.5,
  } = activeInvestigationModal;

  const handleOpenInvestigation = () => {
    closeInvestigationModal();
    navigate(`/admin/investigations/${investigationId}`);
  };

  const handleReplayVoice = () => {
    playVoiceAlert(voiceText, 'CRITICAL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-void/95 border-2 border-critical/80 rounded-2xl shadow-[0_0_50px_rgba(255,75,75,0.35)] overflow-hidden">
        {/* Animated Header Strip */}
        <div className="bg-gradient-to-r from-critical/30 via-critical/10 to-transparent p-4 sm:p-5 border-b border-critical/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-critical/20 text-critical border border-critical/50 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-critical uppercase px-2 py-0.5 rounded bg-critical/20 border border-critical/40">
                  {t('discrepancyBannerSub', 'SMART MONITORING ENGINE // CRITICAL DISCREPANCY')}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-critical"></span>
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mt-1">
                {t('investigationRequiredTitle', 'Investigation Required: Mass Balance Discrepancy')}
              </h2>
            </div>
          </div>

          <button
            onClick={closeInvestigationModal}
            className="p-1.5 rounded-lg text-mist hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* AI Female Voice Broadcast Banner */}
          <div className="p-4 rounded-xl bg-panel/90 border border-line backdrop-blur-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-em/15 text-em border border-em/40">
                <Radio className={`w-5 h-5 ${isSpeaking ? 'animate-pulse text-em' : 'text-mist'}`} />
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-em animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-em uppercase tracking-wide">
                    {t('aiFemaleVoiceSynthesizer', 'AI Female Voice Synthesizer')}
                  </span>
                  {isSpeaking && (
                    <span className="text-[9px] font-mono text-cyan bg-cyan/10 px-2 py-0.2 rounded border border-cyan/30 animate-pulse">
                      {t('broadcastingLive', 'BROADCASTING LIVE')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-mist font-mono mt-0.5">
                  {t('voiceProfileLabel', { name: currentVoiceName }, `Voice Profile: ${currentVoiceName}`)}
                </p>
              </div>
            </div>

            {/* Audio Waveform & Voice Controls */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Animated Waveform Bars */}
              <div className="flex items-end gap-1 h-5 px-2 py-1 bg-black/40 rounded border border-line">
                <span className={`w-1 bg-em rounded-full ${isSpeaking ? 'h-4 animate-bounce' : 'h-1.5'}`} />
                <span className={`w-1 bg-cyan rounded-full ${isSpeaking ? 'h-5 animate-pulse' : 'h-2'}`} />
                <span className={`w-1 bg-em rounded-full ${isSpeaking ? 'h-3 animate-bounce delay-75' : 'h-1'}`} />
                <span className={`w-1 bg-amber-400 rounded-full ${isSpeaking ? 'h-4 animate-pulse delay-100' : 'h-2'}`} />
              </div>

              <button
                onClick={handleReplayVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-em/15 hover:bg-em/25 text-em border border-em/40 font-mono text-xs transition-colors"
                title={t('replayVoice', 'Replay Voice')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('replayVoice', 'Replay Voice')}</span>
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-mist hover:text-white border border-line transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-critical" /> : <Volume2 className="w-4 h-4 text-em" />}
              </button>
            </div>
          </div>

          {/* Spoken Announcement Quote Box */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-white font-sans text-sm leading-relaxed relative">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
              {t('voiceTranscriptBroadcast', 'Voice Transcript Broadcast:')}
            </span>
            <p className="italic text-gray-200 break-words">
              "{voiceText}"
            </p>
          </div>

          {/* Mass Balance Ledger & Discrepancy Breakdown */}
          <div className="rounded-xl border border-line bg-black/40 p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line text-mist uppercase tracking-wider text-[10px]">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-critical" />
                <span>{t('massBalanceVerificationLedger', 'Mass Balance Verification Ledger')}</span>
              </div>
              <span>{t('toleranceLabel', { val: tolerance, unit }, `Tolerance: ±${tolerance} ${unit}`)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-void border border-line">
                <span className="text-[10px] text-mist block">{t('dispatchedMass', 'Dispatched Mass')}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {declaredQuantity.toFixed(1)} {unit}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-void border border-line">
                <span className="text-[10px] text-mist block">{t('receivedMass', 'Received Mass')}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {receivedQuantity.toFixed(1)} {unit}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-critical/20 border border-critical/50">
                <span className="text-[10px] text-critical block font-bold">{t('differenceVariance', 'Difference (Variance)')}</span>
                <span className="text-sm font-bold text-critical mt-0.5 block">
                  -{differenceKg.toFixed(1)} {unit}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40">
                <span className="text-[10px] text-amber-400 block font-bold">{t('varianceStatus', 'Variance Status')}</span>
                <span className="text-[11px] font-bold text-amber-400 mt-1 block">
                  {t('exceedsTolerance', 'Exceeds Tolerance')}
                </span>
              </div>
            </div>

            {/* Entity Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div>
                <span className="text-mist">{t('wasteBatchId', 'Waste Batch ID')}: </span>
                <span className="text-white font-bold">{wasteId}</span>
              </div>
              <div>
                <span className="text-mist">{t('consignmentId', 'Consignment ID')}: </span>
                <span className="text-white font-bold">{shipmentId || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan shrink-0" />
                <span className="text-mist">{t('responsibleParty', 'Responsible')}: </span>
                <span className="text-cyan font-bold truncate">{assignedParty} ({assignedRole})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-panel/70 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-mist text-center sm:text-left">
            <span>{t('caseReference', { id: investigationId }, `Case Reference: ${investigationId}`)}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={closeInvestigationModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-void border border-line text-mist hover:text-white font-mono text-xs transition-colors"
            >
              {t('reviewLater', 'Review Later')}
            </button>

            <button
              onClick={handleOpenInvestigation}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-critical hover:bg-critical/90 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 shadow-glow-critical transition-all"
            >
              <span>{t('openInvestigationCase', 'Open Investigation Case')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
