export interface LanguageOption {
  code: 'en' | 'ta' | 'hi';
  name: string;
  nativeName: string;
  shortLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    shortLabel: 'த',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    shortLabel: 'हि',
  },
];

export type LanguageCode = 'en' | 'ta' | 'hi';
