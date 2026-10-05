import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { getStoredLang, setStoredLang } from '../index';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to English', () => {
    expect(getStoredLang()).toBe('en');
  });

  it('persists the selected language', () => {
    setStoredLang('hi');
    expect(getStoredLang()).toBe('hi');
    expect(localStorage.getItem('fr_lang')).toBe('hi');
  });

  it('switches languages via i18next', async () => {
    await i18n.changeLanguage('hi');
    expect(i18n.language).toBe('hi');
    expect(i18n.t('nav.browse')).toContain('खाना');
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.browse')).toBe('Browse Food');
  });

  it('falls back to English for missing keys', async () => {
    // 'hi' dictionary lacks a key that 'en' has → fallback to 'en'.
    await i18n.changeLanguage('hi');
    const translated = i18n.t('app.name');
    expect(translated).toBe('FoodRescue');
    await i18n.changeLanguage('en');
  });
});
