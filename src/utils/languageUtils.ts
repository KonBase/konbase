import { useEffect, useState } from 'react';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const languages: Language[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
  },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
];

// Simple translation cache
const translationCache: Record<string, Record<string, string>> = {};

export async function translateText(
  text: string,
  targetLang: string,
): Promise<string> {
  // Check if we're using English - if so, just return the original text
  if (targetLang.startsWith('en')) {
    return text;
  }

  // Check cache first
  if (translationCache[targetLang]?.[text]) {
    return translationCache[targetLang][text];
  }

  try {
    // In a real application, you would call a translation API here
    // For example: Google Translate, DeepL, Microsoft Translator, etc.

    // This is a mock implementation for demonstration
    // In a production app, replace this with an actual API call
    const mockTranslated = await mockTranslation(text, targetLang);

    // Cache the result
    if (!translationCache[targetLang]) {
      translationCache[targetLang] = {};
    }
    translationCache[targetLang][text] = mockTranslated;

    return mockTranslated;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

// Mock translation function - replace with actual API in production
async function mockTranslation(
  text: string,
  targetLang: string,
): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simple mock translations for demonstration
  const mockPhrases: Record<string, Record<string, string>> = {
    'fr-FR': {
      Settings: 'Paramètres',
      Account: 'Compte',
      Appearance: 'Apparence',
      Accessibility: 'Accessibilité',
      Notifications: 'Notifications',
      Security: 'Sécurité',
      'Language & Region': 'Langue et région',
      'Save Changes': 'Enregistrer les modifications',
      'Display Language': "Langue d'affichage",
      'Date Format': 'Format de date',
      'Time Format': "Format de l'heure",
      'Save Preferences': 'Enregistrer les préférences',
    },
    'de-DE': {
      Settings: 'Einstellungen',
      Account: 'Konto',
      Appearance: 'Aussehen',
      Accessibility: 'Barrierefreiheit',
      Notifications: 'Benachrichtigungen',
      Security: 'Sicherheit',
      'Language & Region': 'Sprache & Region',
      'Save Changes': 'Änderungen speichern',
      'Display Language': 'Anzeigesprache',
      'Date Format': 'Datumsformat',
      'Time Format': 'Zeitformat',
      'Save Preferences': 'Einstellungen speichern',
    },
    // Add more languages as needed
  };

  return mockPhrases[targetLang]?.[text] || text;
}

// React hook for translation
export function useTranslation() {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('user-language') || 'en-US';
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('user-language', language);
  }, [language]);

  const translate = async (text: string): Promise<string> => {
    if (language === 'en-US') return text;

    if (translations[text]) return translations[text];

    try {
      setIsLoading(true);
      const translated = await translateText(text, language);

      setTranslations((prev) => ({
        ...prev,
        [text]: translated,
      }));

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsLoading(false);
    }
  };

  const t = (text: string): string => {
    if (language === 'en-US') return text;
    return translations[text] || text;
  };

  return {
    language,
    setLanguage,
    translate,
    t,
    isLoading,
  };
}
