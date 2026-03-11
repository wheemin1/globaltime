import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_CODES, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'timesync_lang_suggested';

export function LanguageSuggestBanner() {
  const { i18n } = useTranslation();
  const [suggestion, setSuggestion] = useState<{ code: string; label: string; flag: string; message: string } | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const navLang = navigator.language?.split('-')[0]?.toLowerCase();
    if (!navLang || !SUPPORTED_CODES.includes(navLang as any)) return;
    if (navLang === i18n.language) return;

    const lang = SUPPORTED_LANGUAGES.find(l => l.code === navLang);
    if (!lang) return;

    // Get the suggestion message from that language's resources
    const resources = i18n.getResourceBundle(navLang, 'translation') as Record<string, any> | undefined;
    const message = resources?.languageSuggest?.[navLang] as string | undefined;
    if (!message) return;

    setSuggestion({ code: navLang, label: lang.label, flag: lang.flag, message });
  }, [i18n.language]);

  if (!suggestion) return null;

  const handleAccept = () => {
    i18n.changeLanguage(suggestion.code);
    localStorage.setItem(STORAGE_KEY, suggestion.code);
    setSuggestion(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setSuggestion(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-lg border border-border bg-background shadow-lg p-4 flex items-center gap-3">
      <span className="text-2xl">{suggestion.flag}</span>
      <p className="flex-1 text-sm text-foreground">{suggestion.message}</p>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" className="h-7 text-xs" onClick={handleAccept}>
          {suggestion.label}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
