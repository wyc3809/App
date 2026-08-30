import { en } from "./messages/en";
import { zhHans } from "./messages/zh-Hans";
import { zhHant } from "./messages/zh-Hant";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeToHtmlLang,
  type Locale,
  type MessageTree,
  type TranslationKey,
} from "./types";

export {
  DEFAULT_LOCALE,
  isLocale,
  localeToHtmlLang,
  LOCALE_LABELS,
  type Locale,
  type TranslationKey,
} from "./types";

const CATALOG: Record<Locale, MessageTree> = {
  en,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};

function resolve(messages: MessageTree, key: string): string {
  const parts = key.split(".");
  let node: string | MessageTree = messages;
  for (const part of parts) {
    if (typeof node === "string" || node[part] === undefined) return key;
    node = node[part];
  }
  return typeof node === "string" ? node : key;
}

export function translate(locale: Locale, key: TranslationKey): string {
  return resolve(CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE], key);
}

export function getMessages(locale: Locale): MessageTree {
  return CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
}
