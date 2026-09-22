/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export type Locale = "en" | "ru";
export const dictionary = {
  en: {
    nav: ["home", "about", "code", "sound", "links"],
    enter: "Enter",
    primary: "Primary",
    language: "Language",
    mute: "Mute sound",
    unmute: "Unmute sound",
    volume: "Volume",
    muted: "muted",
    percent: "percent",
    snd: "snd",
    initializing: "initializing",
    ready: "ready",
    lead: "I'm 1maginator.",
    paragraphs: [
      "I build software, make music, and spend a lot of time turning small technical ideas into things I can actually use.",
      "Most of my work sits somewhere between code, sound, and visual experiments. I like tools that feel physical, interfaces with character, and projects that are useful enough to keep around.",
      "This site is partly a home for that work and partly another experiment.",
    ],
    status: [
      "session ready",
      "atlas / route states ok",
      "manifest ready",
      "done",
    ],
  },
  ru: {
    nav: ["home", "about", "code", "sound", "links"],
    enter: "Войти",
    primary: "Навигация",
    language: "Язык",
    mute: "Выключить звук",
    unmute: "Включить звук",
    volume: "Громкость",
    muted: "без звука",
    percent: "процентов",
    snd: "звук",
    initializing: "подготовка",
    ready: "готово",
    lead: "Я 1maginator.",
    paragraphs: [
      "Пишу софт, делаю музыку и часто превращаю небольшие технические идеи в вещи, которыми потом сам пользуюсь.",
      "Большая часть моих проектов находится где-то между кодом, звуком и визуальными экспериментами. Мне нравятся инструменты, которые ощущаются физически, интерфейсы с характером и проекты, к которым хочется возвращаться.",
      "Этот сайт - одновременно место для моих работ и еще один эксперимент.",
    ],
    status: [
      "сессия готова",
      "символы / сцены готовы",
      "список звуков готов",
      "готово",
    ],
  },
} as const;
export function detectLocale(languages: readonly string[]): Locale {
  return languages[0]?.toLowerCase().startsWith("ru") ? "ru" : "en";
}
function initial(): Locale {
  try {
    const saved = localStorage.getItem("locale");
    if (saved === "en" || saved === "ru") return saved;
  } catch {
    /* Optional storage. */
  }
  return detectLocale(
    navigator.languages.length ? navigator.languages : [navigator.language],
  );
}
const Context = createContext({
  locale: "en" as Locale,
  t: dictionary.en as (typeof dictionary)[Locale],
  setLocale: (_value: Locale) => {},
});
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, update] = useState(initial);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = (value: Locale) => {
    update(value);
    try {
      localStorage.setItem("locale", value);
    } catch {
      /* Optional storage. */
    }
  };
  return (
    <Context.Provider value={{ locale, t: dictionary[locale], setLocale }}>
      {children}
    </Context.Provider>
  );
}
export const useLocale = () => useContext(Context);
