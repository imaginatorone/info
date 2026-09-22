# Content and localization

Supported locales: English and Russian.

## Locale behavior

- Detect the initial locale from navigator.languages / navigator.language.
- If the first supported language starts with "ru", use Russian.
- Otherwise use English.
- Add a small manual EN / RU switch integrated into the existing ASCII/TUI visual language.
- Persist a manual choice in localStorage.
- A persisted manual choice wins over system language on future visits.
- Update document.documentElement.lang whenever locale changes.
- Language changes must happen without page reload.
- Do not duplicate page components by language. Keep one typed dictionary/content layer.
- All accessibility labels that contain language should use the active locale.
- External service/brand names stay unchanged.
- Shell-like commands in the intro may remain English for authenticity, but prose/status output and site content should follow the active locale where natural.
- Functional PRESS may remain PRESS in both locales if changing it damages the composition. Everything else should be localized.

## Voice

Keep both languages human, short, calm, slightly informal, and specific.

Russian must read like native Russian, not translated English.
English must not sound like startup copy.

Use normal "-" where a dash is needed. Do not use em dash or en dash in visible copy.

## Navigation

English:
- home
- about
- code
- sound
- links

Russian:
- главная
- обо мне
- код
- звук
- ссылки

## About copy

### English

Kicker:
about

Lead:
I'm 1maginator.

Body:
I build software, make music, and spend a lot of time turning small technical ideas into things I can actually use.

Most of my work sits somewhere between code, sound, and visual experiments. I like tools that feel physical, interfaces with character, and projects that are useful enough to keep around.

This site is partly a home for that work and partly another experiment.

Small line:
software / sound / visual experiments

### Russian

Kicker:
обо мне

Lead:
Я 1maginator.

Body:
Пишу софт, делаю музыку и часто превращаю небольшие технические идеи в вещи, которыми потом сам пользуюсь.

Большая часть моих проектов находится где-то между кодом, звуком и визуальными экспериментами. Мне нравятся инструменты, которые ощущаются физически, интерфейсы с характером и проекты, к которым хочется возвращаться.

Этот сайт - одновременно место для моих работ и еще один эксперимент.

Small line:
софт / звук / визуальные эксперименты

## Copy rules

Do not invent employers, years of experience, locations, education, clients, awards, personal history, or project claims.

Do not mention how the site was built.
Keep implementation details out of public copy.

Avoid:
- passionate developer
- creative technologist
- digital playground
- where creativity meets technology
- cutting-edge
- innovative solutions
- seamless experiences
- pushing boundaries

If more personal detail is needed later, leave a clear content slot instead of inventing it.
