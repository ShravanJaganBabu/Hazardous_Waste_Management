import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
  align?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'default',
  className = '',
  align = 'right',
}) => {
  const { language, setLanguage, languages, currentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = languages.findIndex((l) => l.code === language);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguage(languages[nextIndex].code as LanguageCode);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = languages.findIndex((l) => l.code === language);
        const prevIndex = (currentIndex - 1 + languages.length) % languages.length;
        setLanguage(languages[prevIndex].code as LanguageCode);
      }
    }
  };

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select preferred language"
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 focus:outline-none ${
          isOpen
            ? 'bg-panel-light border-em/60 text-white shadow-[0_0_15px_rgba(57,255,176,0.2)] ring-1 ring-em/40'
            : 'bg-black/40 hover:bg-panel border-line hover:border-em/40 text-mist hover:text-white backdrop-blur-md shadow-sm'
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-em transition-transform duration-300 group-hover:rotate-12" />
        <span className="font-medium tracking-wide text-white">
          {variant === 'compact' ? currentLanguage.shortLabel : currentLanguage.nativeName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-mist/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-em' : 'group-hover:text-mist'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            aria-label="Preferred Language"
            className={`absolute z-50 mt-1.5 w-44 rounded-2xl bg-void/95 border border-line p-1.5 shadow-2xl backdrop-blur-2xl ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-mist/70 border-b border-line/60 mb-1 flex items-center justify-between">
              <span>{t('preferredLanguage')}</span>
              <span className="text-[9px] text-em font-semibold">i18n</span>
            </div>

            <div className="space-y-0.5">
              {languages.map((item) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item.code as LanguageCode)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-em/15 text-white border border-em/40 shadow-[0_0_12px_rgba(57,255,176,0.15)] font-semibold'
                        : 'text-mist hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          isSelected ? 'text-em font-bold' : 'text-white'
                        }`}
                      >
                        {item.nativeName}
                      </span>
                      {item.nativeName !== item.name && (
                        <span className="text-[10px] text-mist/60 font-normal">
                          ({item.name})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-em shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
