// i18n bootstrap — react-i18next with lazy-loaded JSON locale files.
// English is bundled inline as the always-on fallback; every other language
// is fetched on demand the first time it is selected.
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

export type LanguageCode =
  | "en" | "fr" | "es" | "pt" | "de" | "it" | "nl" | "ru" | "uk" | "tr"
  | "ar" | "zh-CN" | "zh-TW" | "ja" | "ko" | "hi" | "ur" | "bn"
  | "ms" | "id" | "th" | "vi" | "sw" | "yo" | "ig" | "ha";

export interface LanguageMeta {
  code: LanguageCode;
  name: string; // native name
  english: string; // english name
  flag: string; // emoji
  rtl?: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", english: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", english: "French", flag: "🇫🇷" },
  { code: "es", name: "Español", english: "Spanish", flag: "🇪🇸" },
  { code: "pt", name: "Português", english: "Portuguese", flag: "🇵🇹" },
  { code: "de", name: "Deutsch", english: "German", flag: "🇩🇪" },
  { code: "it", name: "Italiano", english: "Italian", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", english: "Dutch", flag: "🇳🇱" },
  { code: "ru", name: "Русский", english: "Russian", flag: "🇷🇺" },
  { code: "uk", name: "Українська", english: "Ukrainian", flag: "🇺🇦" },
  { code: "tr", name: "Türkçe", english: "Turkish", flag: "🇹🇷" },
  { code: "ar", name: "العربية", english: "Arabic", flag: "🇸🇦", rtl: true },
  { code: "zh-CN", name: "简体中文", english: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "zh-TW", name: "繁體中文", english: "Chinese (Traditional)", flag: "🇹🇼" },
  { code: "ja", name: "日本語", english: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "한국어", english: "Korean", flag: "🇰🇷" },
  { code: "hi", name: "हिन्दी", english: "Hindi", flag: "🇮🇳" },
  { code: "ur", name: "اردو", english: "Urdu", flag: "🇵🇰", rtl: true },
  { code: "bn", name: "বাংলা", english: "Bengali", flag: "🇧🇩" },
  { code: "ms", name: "Melayu", english: "Malay", flag: "🇲🇾" },
  { code: "id", name: "Indonesia", english: "Indonesian", flag: "🇮🇩" },
  { code: "th", name: "ไทย", english: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", english: "Vietnamese", flag: "🇻🇳" },
  { code: "sw", name: "Kiswahili", english: "Swahili", flag: "🇰🇪" },
  { code: "yo", name: "Yorùbá", english: "Yoruba", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", english: "Igbo", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", english: "Hausa", flag: "🇳🇬" },
];

const RTL_CODES = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.code as string));

export function isRtl(code: string) {
  return RTL_CODES.has(code) || RTL_CODES.has(code.split("-")[0]);
}

const STORAGE_KEY = "pme:lang";

// Lazy backend — dynamic-import locale JSON the first time a language is needed.
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  fr: () => import("./locales/fr.json"),
  es: () => import("./locales/es.json"),
  pt: () => import("./locales/pt.json"),
  de: () => import("./locales/de.json"),
  it: () => import("./locales/it.json"),
  nl: () => import("./locales/nl.json"),
  ru: () => import("./locales/ru.json"),
  uk: () => import("./locales/uk.json"),
  tr: () => import("./locales/tr.json"),
  ar: () => import("./locales/ar.json"),
  "zh-CN": () => import("./locales/zh-CN.json"),
  "zh-TW": () => import("./locales/zh-TW.json"),
  ja: () => import("./locales/ja.json"),
  ko: () => import("./locales/ko.json"),
  hi: () => import("./locales/hi.json"),
  ur: () => import("./locales/ur.json"),
  bn: () => import("./locales/bn.json"),
  ms: () => import("./locales/ms.json"),
  id: () => import("./locales/id.json"),
  th: () => import("./locales/th.json"),
  vi: () => import("./locales/vi.json"),
  sw: () => import("./locales/sw.json"),
  yo: () => import("./locales/yo.json"),
  ig: () => import("./locales/ig.json"),
  ha: () => import("./locales/ha.json"),
};

const loaded = new Set<string>(["en"]);

export async function ensureLanguageLoaded(code: string) {
  if (loaded.has(code)) return;
  const loader = loaders[code];
  if (!loader) return;
  try {
    const mod = await loader();
    i18n.addResourceBundle(code, "translation", mod.default, true, true);
    loaded.add(code);
  } catch {
    /* fall back silently to English */
  }
}

export function applyDirection(code: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  document.documentElement.dir = isRtl(code) ? "rtl" : "ltr";
}

let initialized = false;
export function initI18n() {
  if (initialized) return i18n;
  initialized = true;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en } },
      fallbackLng: "en",
      supportedLngs: LANGUAGES.map((l) => l.code),
      nonExplicitSupportedLngs: true,
      load: "currentOnly",
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        lookupLocalStorage: STORAGE_KEY,
        caches: ["localStorage"],
      },
      returnEmptyString: false,
    });

  const current = i18n.resolvedLanguage || i18n.language || "en";
  applyDirection(current);
  if (current !== "en") void ensureLanguageLoaded(current);

  i18n.on("languageChanged", (lng) => {
    applyDirection(lng);
    try { localStorage.setItem(STORAGE_KEY, lng); } catch { /* noop */ }
  });

  return i18n;
}

export async function changeLanguage(code: LanguageCode) {
  await ensureLanguageLoaded(code);
  await i18n.changeLanguage(code);
}

export default i18n;
