import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { lang, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-full px-1.5 py-1 bg-white/80">
      <Globe size={14} className="text-[#6b7280] ml-1" />
      <button
        onClick={() => changeLanguage('en')}
        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${lang === 'en' ? 'bg-[#2d6a4f] text-white' : 'text-[#6b7280] hover:text-[#2d6a4f]'}`}
        aria-label={t('language.en')}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${lang === 'hi' ? 'bg-[#2d6a4f] text-white' : 'text-[#6b7280] hover:text-[#2d6a4f]'}`}
        aria-label={t('language.hi')}
      >
        हिं
      </button>
    </div>
  );
}
