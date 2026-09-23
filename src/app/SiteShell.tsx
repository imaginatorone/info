import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { animate, AnimatePresence, motion, MotionConfig } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { SceneSurface } from "../components/SceneSurface";
import { SoundPlayer } from "../components/SoundPlayer";
import { AudioControl } from "../components/AudioControl";
import { useIdleGuide } from "../components/useIdleGuide";
import { useLocale } from "../content/locale";
import { EntryAudio } from "../core/audio/EntryAudio";

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const readMotionPreference = () => motionPreference.matches;
const subscribeMotionPreference = (notify: () => void) => {
  motionPreference.addEventListener("change", notify);
  return () => motionPreference.removeEventListener("change", notify);
};

const links = [
  ["/", "home"],
  ["/about", "about"],
  ["/code", "code"],
  ["/sound", "sound"],
  ["/links", "links"],
] as const;

export function SiteShell() {
  const { locale, t, setLocale } = useLocale();
  const [prepared, setPrepared] = useState(false);
  const [intro, setIntro] = useState(-1);

  const location = useLocation();
  const [entered, setEntered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hint = useIdleGuide(entered || intro < 1);
  const reduced = useSyncExternalStore(
    subscribeMotionPreference,
    readMotionPreference,
  );
  const target = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [audio] = useState(() => new EntryAudio());
  const ready = useCallback(() => {
    void audio.prepare().finally(() => setPrepared(true));
  }, [audio]);
  const introDone = useRef(false);
  const routeIndex = Math.max(
    0,
    links.findIndex(([to]) => to === location.pathname),
  );

  useEffect(() => {
    if (!prepared || introDone.current) return;
    let repeat = false;
    try {
      repeat = sessionStorage.getItem("intro-seen") === "true";
      sessionStorage.setItem("intro-seen", "true");
    } catch {
      /* Optional storage. */
    }
    const duration = reduced ? 350 : repeat ? 6200 : 7600;
    const start = performance.now();
    const timer = window.setInterval(() => {
      if (introDone.current) {
        clearInterval(timer);
        return;
      }
      const value = Math.min(1, (performance.now() - start) / duration);
      setIntro(
        value < 0.67
          ? (value * 0.34) / 0.67
          : value < 0.84
            ? 0.34
            : 0.35 + ((value - 0.84) * 0.65) / 0.16,
      );
      if (value === 1) {
        introDone.current = true;
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [prepared, reduced]);

  useEffect(() => {
    document.title = "·";
    const dispose = () => audio.dispose();
    window.addEventListener("pagehide", dispose, { once: true });
    return () => window.removeEventListener("pagehide", dispose);
  }, [audio]);

  useEffect(() => {
    if (!entered) return;
    const timer = window.setTimeout(
      () => {
        setRevealed(true);
        document.title = "1maginator";
      },
      reduced ? 120 : 1350,
    );
    return () => clearTimeout(timer);
  }, [entered, reduced]);

  useEffect(() => {
    if (!revealed) return;
    const frame = requestAnimationFrame(() => content.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [revealed, location.pathname]);

  const enter = () => {
    if (entered) return;
    void audio.press();
    setEntered(true);
  };

  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    if (!copy.current || !revealed) return;
    const animation = animate(
      copy.current,
      reduced
        ? { opacity: [0.72, 1] }
        : {
            opacity: [0.12, 1],
            transform: [
              "translateY(12px)",
              "translateY(-3px)",
              "translateY(0px)",
            ],
          },
      { duration: reduced ? 0.14 : 0.95, ease: [0.16, 1, 0.3, 1] },
    );
    return () => animation.stop();
  }, [locale, reduced, revealed]);

  const routeMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <div
        className="site-shell"
        data-entry={revealed ? "revealed" : entered ? "entering" : "idle"}
        data-intro={
          intro < 0
            ? "loading"
            : intro < 0.35
              ? "terminal"
              : intro < 1
                ? "dissolving"
                : "complete"
        }
        data-hint={hint ? "active" : "inactive"}
      >
        <SceneSurface
          target={target}
          onReady={ready}
          intent={{
            intro,
            locale,
            entered,
            reduced,
            hint,
            home: location.pathname === "/",
            routeIndex,
          }}
        />
        {intro < 0 && (
          <p className="intro-status" role="status">
            {t.initializing}
          </p>
        )}
        {intro >= 0 && intro < 1 && (
          <button
            className="intro-skip"
            onClick={() => {
              introDone.current = true;
              setIntro(1);
            }}
          >
            {locale === "ru" ? "пропустить" : "skip"}
          </button>
        )}
        <div
          className="entry-position"
          style={{ visibility: intro < 1 ? "hidden" : "visible" }}
        >
          <motion.button
            ref={target}
            className="entry-target"
            aria-label={t.enter}
            disabled={entered}
            tabIndex={entered ? -1 : 0}
            aria-hidden={entered || undefined}
            onClick={enter}
            whileTap={{ transform: "scale(0.84)" }}
            animate={{
              opacity: entered ? 0 : 1,
              transform: entered ? "scale(0.65)" : "scale(1)",
            }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
          >
            <span className="target-mark" aria-hidden="true">
              [·]
            </span>
          </motion.button>
        </div>
        {entered && <AudioControl audio={audio} />}
        {revealed && <SoundPlayer audio={audio} active={routeIndex === 3} />}
        {intro >= 1 && (
          <div className="locale-control" role="group" aria-label={t.language}>
            {(["en", "ru"] as const).map((value) => (
              <button
                key={value}
                aria-label={value}
                aria-pressed={locale === value}
                onClick={() => setLocale(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
        {revealed && (
          <motion.div
            className="shell-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.12 : 0.65 }}
          >
            <nav className="site-nav" aria-label={t.primary}>
              {links.map(([to], index) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  aria-label={t.nav[index]}
                  onPointerEnter={() => audio.play("hover")}
                  onFocus={() => audio.play("hover")}
                  onClick={() => audio.play("route")}
                >
                  {t.nav[index]}
                </NavLink>
              ))}
            </nav>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={location.pathname}
                ref={content}
                tabIndex={-1}
                className="site-content"
                initial={routeMotion.initial}
                animate={routeMotion.animate}
                exit={routeMotion.exit}
                transition={
                  reduced
                    ? { duration: 0.08 }
                    : {
                        duration: 0.38,
                        ease: [0.16, 1, 0.3, 1],
                      }
                }
              >
                <div ref={copy} className="locale-copy">
                  <Outlet context={{ audio }} />
                </div>
              </motion.main>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
}
