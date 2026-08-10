import { createContext, useContext, useCallback, type ReactNode } from 'react';
import i18n, { getStoredLang, setStoredLang } from '../i18n';
import { eventsApi } from '../services/v2Api';

interface LanguageContextValue {
  lang: string;
  changeLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: getStoredLang(),
  changeLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const changeLanguage = useCallback((lang: string) => {
    setStoredLang(lang);
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    // Report for admin analytics (best-effort, non-blocking).
    eventsApi.reportLanguageChange(lang).catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ lang: i18n.language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
