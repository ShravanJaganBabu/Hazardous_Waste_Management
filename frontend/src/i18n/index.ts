import { en, TranslationKey } from './translations/en';
import { ta } from './translations/ta';
import { hi } from './translations/hi';
import { LanguageCode } from './languages';

export * from './languages';
export type { TranslationKey };

export const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  ta,
  hi,
};

export const getTranslation = (
  lang: LanguageCode,
  key: TranslationKey,
  paramsOrFallback?: Record<string, string | number> | string,
  fallback?: string
): string => {
  const langDict = translations[lang] || translations.en;
  let text = langDict[key] || translations.en[key];

  let params: Record<string, string | number> | undefined;
  let fallbackStr = fallback;

  if (typeof paramsOrFallback === 'string') {
    fallbackStr = paramsOrFallback;
  } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
    params = paramsOrFallback;
  }

  if (!text) {
    text = fallbackStr || (key as string);
  }

  if (params && text) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }

  return text;
};
