"use client";

import { useEffect, useMemo } from "react";
import { useWorthStore } from "@/lib/store";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeToHtmlLang,
  translate,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

export function useI18n() {
  const localeSetting = useWorthStore((s) => s.settings.locale);
  const updateSettings = useWorthStore((s) => s.updateSettings);

  const locale: Locale = isLocale(localeSetting) ? localeSetting : DEFAULT_LOCALE;

  const t = useMemo(
    () => (key: TranslationKey) => translate(locale, key),
    [locale],
  );

  return {
    locale,
    t,
    setLocale: (next: Locale) => updateSettings({ locale: next }),
  };
}

/** Sync `<html lang>` when locale changes. */
export function LocaleSync() {
  const localeSetting = useWorthStore((s) => s.settings.locale);
  const locale: Locale = isLocale(localeSetting) ? localeSetting : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  return null;
}
