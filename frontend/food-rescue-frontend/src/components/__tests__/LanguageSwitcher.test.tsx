import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LanguageSwitcher from '../layout/LanguageSwitcher';
import { LanguageProvider } from '../../context/LanguageContext';

// Mock the analytics reporting so tests don't hit the network.
vi.mock('../../services/v2Api', () => ({
  eventsApi: { reportLanguageChange: vi.fn().mockResolvedValue({}) },
}));

const renderWithProviders = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    </I18nextProvider>
  );

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    void i18n.changeLanguage('en');
  });

  it('renders EN and Hindi buttons', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: 'English' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'हिन्दी' })).toBeTruthy();
  });

  it('switches to Hindi when clicked and persists', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(localStorage.getItem('fr_lang')).toBe('hi');
    expect(i18n.language).toBe('hi');
  });

  it('switches back to English when clicked', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(i18n.language).toBe('en');
  });
});
