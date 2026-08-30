export type Locale = "en" | "zh-Hant" | "zh-Hans";

export type MessageTree = {
  [key: string]: string | MessageTree;
};

export type TranslationKey =
  | "nav.home"
  | "nav.accounts"
  | "nav.ledger"
  | "nav.insights"
  | "loading"
  | "intro.skip"
  | "intro.next"
  | "intro.back"
  | "intro.welcome.title"
  | "intro.welcome.subtitle"
  | "intro.welcome.loadDemo"
  | "intro.features.title"
  | "intro.features.subtitle"
  | "intro.features.home.title"
  | "intro.features.home.desc"
  | "intro.features.accounts.title"
  | "intro.features.accounts.desc"
  | "intro.features.ledger.title"
  | "intro.features.ledger.desc"
  | "intro.features.insights.title"
  | "intro.features.insights.desc"
  | "intro.ledger.title"
  | "intro.ledger.subtitle"
  | "intro.ledger.step1"
  | "intro.ledger.step2"
  | "intro.ledger.step3"
  | "intro.ledger.step4"
  | "intro.start.title"
  | "intro.start.subtitle"
  | "intro.start.addAccount"
  | "intro.start.openLedger"
  | "intro.start.loadDemo"
  | "intro.start.skip"
  | "settings.eyebrow"
  | "settings.title"
  | "settings.subtitle"
  | "settings.display"
  | "settings.language"
  | "settings.languageEn"
  | "settings.languageZhHant"
  | "settings.languageZhHans"
  | "settings.theme"
  | "settings.themeLight"
  | "settings.themeDark"
  | "settings.themeLightHint"
  | "settings.themeDarkHint"
  | "settings.privacyTitle"
  | "settings.privacyDesc";

export const LOCALE_LABELS: Record<Locale, TranslationKey> = {
  en: "settings.languageEn",
  "zh-Hant": "settings.languageZhHant",
  "zh-Hans": "settings.languageZhHans",
};

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-Hant" || value === "zh-Hans";
}

export function localeToHtmlLang(locale: Locale): string {
  if (locale === "zh-Hant") return "zh-Hant";
  if (locale === "zh-Hans") return "zh-CN";
  return "en";
}
