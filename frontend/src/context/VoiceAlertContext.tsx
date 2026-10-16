import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AlertSeverity } from '../types';
import { useLanguage } from './LanguageContext';
import { TranslationKey } from '../i18n';

interface VoiceMessage {
  id: string;
  text: string;
  severity: AlertSeverity;
  timestamp: Date;
}

export type VoiceEventType =
  | 'PICKUP_ASSIGNED'
  | 'DISCREPANCY_INQUIRY'
  | 'DELIVERY_SUCCESS'
  | 'ROAD_INCIDENT'
  | 'INVESTIGATION_MISMATCH'
  | 'TRANSIT_DELAY'
  | 'TEST_VOICE';

export interface VoiceEventParams {
  shipmentId?: string;
  company?: string;
  quantity?: number | string;
  unit?: string;
  diff?: number | string;
  title?: string;
  severity?: AlertSeverity;
  eventId?: string;
}

export interface InvestigationVoiceParams {
  differenceKg: number;
  wasteId?: string;
  unit?: string;
  assignedParty?: string;
  isResponsibleParty?: boolean;
  eventId?: string;
}

interface VoiceAlertContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isSpeaking: boolean;
  playVoiceAlert: (text: string, severity?: AlertSeverity, params?: VoiceEventParams) => void;
  announceEvent: (type: VoiceEventType, params?: VoiceEventParams) => void;
  playInvestigationVoice: (params: InvestigationVoiceParams) => void;
  testVoiceAnnouncement: () => void;
  activeMessage: VoiceMessage | null;
  dismissActiveMessage: () => void;
  replayActiveMessage: () => void;
  currentVoiceName: string;
  femaleVoices: SpeechSynthesisVoice[];
  selectVoice: (voiceName: string) => void;
  hasVoiceForCurrentLanguage: boolean;
}

const VoiceAlertContext = createContext<VoiceAlertContextType | undefined>(undefined);

export const VoiceAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('haztrack_voice_mute') === 'true';
    }
    return false;
  });
  const [activeMessage, setActiveMessage] = useState<VoiceMessage | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('HazTrack AI Voice Synthesizer');
  const [hasVoiceForCurrentLanguage, setHasVoiceForCurrentLanguage] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Deduplication state
  const announcedEventIdsRef = useRef<Set<string>>(new Set());
  const lastSpokenTextRef = useRef<string>('');
  const lastSpokenTimestampRef = useRef<number>(0);

  // Helper to test if a voice matches a language code
  const isTamilVoice = (v: SpeechSynthesisVoice): boolean => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return lang.includes('ta') || name.includes('tamil') || name.includes('valluvar');
  };

  const isHindiVoice = (v: SpeechSynthesisVoice): boolean => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang.includes('hi') ||
      name.includes('hindi') ||
      name.includes('kalpana') ||
      name.includes('swara') ||
      name.includes('madhur') ||
      name.includes('hemant')
    );
  };

  const isIndianEnglishVoice = (v: SpeechSynthesisVoice): boolean => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return lang === 'en-in' || name.includes('india') || name.includes('neerja') || name.includes('prabhat') || name.includes('heera');
  };

  const isFemaleVoice = (v: SpeechSynthesisVoice): boolean => {
    const name = v.name.toLowerCase();
    if (
      name.includes('david') ||
      name.includes('george') ||
      name.includes('guy') ||
      name.includes('mark') ||
      name.includes('richard') ||
      name.includes('ravi') ||
      name.includes('james') ||
      name.includes('michael') ||
      name.includes('male') ||
      name.includes('prabhat')
    ) {
      return false;
    }
    return (
      name.includes('jenny') ||
      name.includes('aria') ||
      name.includes('zira') ||
      name.includes('samantha') ||
      name.includes('victoria') ||
      name.includes('karen') ||
      name.includes('neerja') ||
      name.includes('kalpana') ||
      name.includes('swara') ||
      name.includes('female') ||
      name.includes('natural') ||
      name.includes('online') ||
      (name.includes('google') && name.includes('us'))
    );
  };

  // Find the most appropriate voice for the selected language
  const findBestVoiceForLang = useCallback(
    (voices: SpeechSynthesisVoice[], langCode: 'en' | 'ta' | 'hi'): { voice: SpeechSynthesisVoice | null; isSupported: boolean } => {
      if (!voices || voices.length === 0) return { voice: null, isSupported: false };

      if (langCode === 'ta') {
        const tamilVoice = voices.find(isTamilVoice);
        if (tamilVoice) return { voice: tamilVoice, isSupported: true };
        return { voice: null, isSupported: false };
      }

      if (langCode === 'hi') {
        const hindiVoice = voices.find(isHindiVoice);
        if (hindiVoice) return { voice: hindiVoice, isSupported: true };
        return { voice: null, isSupported: false };
      }

      // English: prefer Indian English female, then high-fidelity female English
      const indianEn = voices.find((v) => isIndianEnglishVoice(v) && isFemaleVoice(v)) || voices.find(isIndianEnglishVoice);
      if (indianEn) return { voice: indianEn, isSupported: true };

      const priorityOrder = [
        'microsoft jenny online (natural)',
        'microsoft aria online (natural)',
        'microsoft jenny',
        'microsoft aria',
        'microsoft zira',
        'google us english',
        'samantha',
      ];
      for (const priority of priorityOrder) {
        const match = voices.find((v) => v.name.toLowerCase().includes(priority));
        if (match) return { voice: match, isSupported: true };
      }

      const anyFemale = voices.filter((v) => v.lang.startsWith('en')).find(isFemaleVoice);
      if (anyFemale) return { voice: anyFemale, isSupported: true };

      const anyEn = voices.find((v) => v.lang.startsWith('en'));
      return { voice: anyEn || voices[0] || null, isSupported: true };
    },
    []
  );

  // Load and refresh voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setAvailableVoices(voices);

      const females = voices.filter(isFemaleVoice);
      setFemaleVoices(females.length > 0 ? females : voices.slice(0, 5));

      const { voice: targetVoice, isSupported } = findBestVoiceForLang(voices, language);
      setHasVoiceForCurrentLanguage(isSupported);

      if (targetVoice) {
        setSelectedVoiceName(targetVoice.name);
        setCurrentVoiceName(`${targetVoice.name} (${targetVoice.lang})`);
      } else {
        const langName = language === 'ta' ? 'Tamil (ta-IN)' : language === 'hi' ? 'Hindi (hi-IN)' : 'English (en-IN)';
        setCurrentVoiceName(`${langName} TTS voice package not detected in browser`);
      }
    }
  }, [findBestVoiceForLang, language]);

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [populateVoices]);

  // Cancel any lingering speech when language switches
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    populateVoices();
  }, [language, populateVoices]);

  const selectVoice = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    const v = availableVoices.find((item) => item.name === voiceName);
    if (v) {
      setCurrentVoiceName(`${v.name} (${v.lang})`);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('haztrack_voice_mute', String(next));
        if (next && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      }
      return next;
    });
  };

  /**
   * Core speaking engine
   */
  const speakText = useCallback(
    (textToSpeak: string, severity: AlertSeverity = 'INFO', eventId?: string) => {
      if (!textToSpeak) return;

      // Duplicate prevention
      const now = Date.now();
      if (eventId && announcedEventIdsRef.current.has(eventId)) {
        return;
      }
      if (
        textToSpeak === lastSpokenTextRef.current &&
        now - lastSpokenTimestampRef.current < 4000
      ) {
        return;
      }

      if (eventId) {
        announcedEventIdsRef.current.add(eventId);
      }
      lastSpokenTextRef.current = textToSpeak;
      lastSpokenTimestampRef.current = now;

      // Always display visually in the VoiceAlertHUD
      const msg: VoiceMessage = {
        id: `voice-${Date.now()}`,
        text: textToSpeak,
        severity,
        timestamp: new Date(),
      };
      setActiveMessage(msg);

      if (isMuted) return;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear old queue

        const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
        const { voice: targetVoice, isSupported } = findBestVoiceForLang(voices, language);

        // If the current language is Tamil or Hindi and no native voice is installed,
        // do NOT play English voice reading Tamil/Hindi text! Display in HUD only.
        if ((language === 'ta' || language === 'hi') && !isSupported) {
          const langLabel = language === 'ta' ? 'Tamil (ta-IN)' : 'Hindi (hi-IN)';
          setCurrentVoiceName(`${langLabel} voice not installed in OS. Spoken announcement displayed in HUD.`);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.pitch = severity === 'EMERGENCY' ? 1.25 : 1.15;
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        if (targetVoice) {
          utterance.voice = targetVoice;
          setCurrentVoiceName(`${targetVoice.name} (${targetVoice.lang})`);
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    },
    [isMuted, availableVoices, findBestVoiceForLang, language]
  );

  /**
   * Centralized Announcement System
   * Receives real application events and translates them into current language
   */
  const announceEvent = useCallback(
    (type: VoiceEventType, params?: VoiceEventParams) => {
      let announcement = '';
      const severity = params?.severity || 'INFO';

      switch (type) {
        case 'PICKUP_ASSIGNED': {
          announcement = t('voicePickupAssigned', {
            shipmentId: params?.shipmentId || 'SHP-2026-000102',
            company: params?.company || 'Titan Petrochemicals Limited',
            quantity: params?.quantity || '85',
            unit: params?.unit || (language === 'ta' ? 'கிலோகிராம்' : language === 'hi' ? 'किलोग्राम' : 'kilograms'),
          });
          speakText(announcement, params?.severity || 'WARNING', params?.eventId);
          break;
        }

        case 'DISCREPANCY_INQUIRY': {
          announcement = t('voiceDiscrepancyInquiry');
          speakText(announcement, params?.severity || 'CRITICAL', params?.eventId);
          break;
        }

        case 'DELIVERY_SUCCESS': {
          announcement = t('voiceDeliverySuccess');
          speakText(announcement, params?.severity || 'INFO', params?.eventId);
          break;
        }

        case 'ROAD_INCIDENT': {
          announcement = t('voiceRoadIncident');
          speakText(announcement, params?.severity || 'EMERGENCY', params?.eventId);
          break;
        }

        case 'INVESTIGATION_MISMATCH': {
          const unitStr =
            params?.unit?.toLowerCase() === 'kg'
              ? language === 'ta' ? 'கிலோகிராம்' : language === 'hi' ? 'किलोग्राम' : 'kilogram'
              : params?.unit || 'kilogram';
          announcement = t('voiceInvestigationMismatch', {
            diff: params?.diff || '2.5',
            unit: unitStr,
          });
          speakText(announcement, params?.severity || 'CRITICAL', params?.eventId);
          break;
        }

        case 'TRANSIT_DELAY': {
          announcement = t('voiceTransitDelay', {
            shipmentId: params?.shipmentId || 'SHP-2026-000103',
          });
          speakText(announcement, params?.severity || 'WARNING', params?.eventId);
          break;
        }

        case 'TEST_VOICE': {
          announcement = t('voiceTestMessage');
          speakText(announcement, 'INFO', params?.eventId);
          break;
        }

        default:
          break;
      }
    },
    [language, speakText, t]
  );

  /**
   * General voice alert entry point
   */
  const playVoiceAlert = useCallback(
    (text: string, severity: AlertSeverity = 'CRITICAL', params?: VoiceEventParams) => {
      // Check if text matches known events to ensure translation
      const lower = text.toLowerCase();
      if (lower.includes('pickup assigned') || lower.includes('collection requested')) {
        announceEvent('PICKUP_ASSIGNED', {
          shipmentId: params?.shipmentId,
          company: params?.company,
          quantity: params?.quantity,
          unit: params?.unit,
          severity,
          eventId: params?.eventId,
        });
        return;
      }

      if (lower.includes('discrepancy') || lower.includes('quantity mismatch') || lower.includes('investigation request')) {
        announceEvent('DISCREPANCY_INQUIRY', {
          severity,
          eventId: params?.eventId,
        });
        return;
      }

      if (lower.includes('delivery completed') || lower.includes('intake verified')) {
        announceEvent('DELIVERY_SUCCESS', {
          severity,
          eventId: params?.eventId,
        });
        return;
      }

      if (lower.includes('road incident') || lower.includes('spill')) {
        announceEvent('ROAD_INCIDENT', {
          severity,
          eventId: params?.eventId,
        });
        return;
      }

      if (lower.includes('delay')) {
        announceEvent('TRANSIT_DELAY', {
          shipmentId: params?.shipmentId,
          severity,
          eventId: params?.eventId,
        });
        return;
      }

      // Direct text fallback
      speakText(text, severity, params?.eventId);
    },
    [announceEvent, speakText]
  );

  const playInvestigationVoice = useCallback(
    (params: InvestigationVoiceParams) => {
      const unit =
        params.unit?.toLowerCase() === 'kg'
          ? language === 'ta' ? 'கிலோகிராம்' : language === 'hi' ? 'किलोग्राम' : 'kilogram'
          : params.unit || 'kilogram';
      const formattedDiff = params.differenceKg.toFixed(1).replace('.0', '');

      announceEvent('INVESTIGATION_MISMATCH', {
        diff: formattedDiff,
        unit,
        severity: 'CRITICAL',
        eventId: params.eventId,
      });
    },
    [announceEvent, language]
  );

  const testVoiceAnnouncement = useCallback(() => {
    announceEvent('TEST_VOICE');
  }, [announceEvent]);

  const dismissActiveMessage = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveMessage(null);
  };

  const replayActiveMessage = () => {
    if (activeMessage) {
      speakText(activeMessage.text, activeMessage.severity);
    }
  };

  return (
    <VoiceAlertContext.Provider
      value={{
        isMuted,
        toggleMute,
        isSpeaking,
        playVoiceAlert,
        announceEvent,
        playInvestigationVoice,
        testVoiceAnnouncement,
        activeMessage,
        dismissActiveMessage,
        replayActiveMessage,
        currentVoiceName,
        femaleVoices,
        selectVoice,
        hasVoiceForCurrentLanguage,
      }}
    >
      {children}
    </VoiceAlertContext.Provider>
  );
};

export const useVoiceAlert = () => {
  const context = useContext(VoiceAlertContext);
  if (!context) throw new Error('useVoiceAlert must be used within VoiceAlertProvider');
  return context;
};
