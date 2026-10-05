import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const STORAGE_KEY = 'fr_lang';

export const getStoredLang = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'hi' || stored === 'en' ? stored : 'en';
};

export const setStoredLang = (lang: string) => {
  localStorage.setItem(STORAGE_KEY, lang);
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: getStoredLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
