import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../content/locale";
import { site } from "../content/site";
import type { EntryAudio } from "../core/audio/EntryAudio";
import {
  loadSoundCloud,
  type SoundCloudWidget,
  type Track,
} from "../services/soundcloud";
const time = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
export function SoundPlayer({
  audio,
  active,
}: {
  audio: EntryAudio;
  active: boolean;
}) {
  const { locale } = useLocale();
  const ru = locale === "ru";
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [native, setNative] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const seeking = useRef(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const widget = useRef<SoundCloudWidget | null>(null);
  useEffect(() => {
    if (!loaded) return;
    const element = iframe.current;
    let alive = true;
    const timer = window.setTimeout(() => {
      if (alive) setError(true);
    }, 18000);
    const sync = () => {
      try {
        widget.current?.setVolume(audio.muted ? 0 : audio.volume * 100);
      } catch {
        if (alive) setError(true);
      }
    };
    const unsubscribe = audio.subscribe(sync);
    void loadSoundCloud()
      .then(() => {
        if (!alive || !element || !window.SC) return;
        const player = window.SC.Widget(element);
        widget.current = player;
        player.bind("ready", () => {
          if (!alive) return;
          clearTimeout(timer);
          setReady(true);
          setError(false);
          sync();
          player.getSounds((sounds) => {
            if (alive)
              setTracks(
                sounds.filter(
                  (sound) =>
                    Number.isFinite(sound.duration) && sound.duration > 0,
                ),
              );
          });
        });
        player.bind("play", () => {
          if (!alive) return;
          setPlaying(true);
          player.getCurrentSoundIndex((value) => {
            if (alive) setIndex(value);
          });
        });
        player.bind("pause", () => {
          if (alive) setPlaying(false);
        });
        player.bind("finish", () => {
          if (alive) setPlaying(false);
        });
        player.bind("playProgress", (event) => {
          if (
            alive &&
            !seeking.current &&
            Number.isFinite(event.currentPosition)
          )
            setPosition(Math.max(0, event.currentPosition));
        });
        player.bind("seek", (event) => {
          if (
            alive &&
            !seeking.current &&
            Number.isFinite(event.currentPosition)
          )
            setPosition(Math.max(0, event.currentPosition));
        });
        player.bind("error", () => {
          if (alive) {
            setError(true);
            setPlaying(false);
          }
        });
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
      clearTimeout(timer);
      unsubscribe();
      const player = widget.current;
      // The iframe may already be detached during teardown. No transport call is safe then.
      if (element?.isConnected) {
        try {
          player?.pause();
        } catch {
          /* The widget window has closed. */
        }
      }
      for (const event of [
        "ready",
        "play",
        "pause",
        "finish",
        "playProgress",
        "seek",
        "error",
      ]) {
        try {
          player?.unbind(event);
        } catch {
          /* The iframe may be gone. */
        }
      }
      widget.current = null;
    };
  }, [loaded, audio, attempt]);
  const track = tracks[index];
  const progress =
    track && Number.isFinite(position)
      ? Math.max(0, Math.min(1, position / track.duration))
      : 0;
  const command = (action: (player: SoundCloudWidget) => void) => {
    if (!widget.current || !ready) return;
    try {
      action(widget.current);
    } catch {
      setError(true);
      setPlaying(false);
    }
  };
  const toggle = () => {
    setDismissed(false);
    command((player) => player.toggle());
  };
  const seek = (value: number) => {
    if (!Number.isFinite(value)) return;
    setPosition(value);
    command((player) => player.seekTo(value));
  };
  const retry = () => {
    setReady(false);
    setError(false);
    setAttempt((value) => value + 1);
  };
  const select = (value: number) => {
    if (value < 0 || value >= tracks.length) return;
    setDismissed(false);
    command((player) => player.skip(value));
    setIndex(value);
    setPosition(0);
    command((player) => player.play());
  };
  return (
    <>
      <section
        className={
          active ? "foundation-page sound-page player-stage" : "mini-player"
        }
        hidden={!active && (!loaded || dismissed)}
        data-route={active ? "sound" : undefined}
        aria-label={ru ? "Музыкальный плеер" : "Music player"}
      >
        {active ? (
          <h1>sound</h1>
        ) : (
          <div className="mini-heading">
            <Link to="/sound">sound / {ru ? "открыть" : "open"}</Link>
            <button
              aria-label={ru ? "Остановить и скрыть" : "Stop and hide"}
              onClick={() => {
                command((player) => player.pause());
                setDismissed(true);
              }}
            >
              [ x ]
            </button>
          </div>
        )}
        <div className="ascii-player" data-playing={playing}>
          <div className="transport-title">
            <span aria-hidden="true">{playing ? "[ > ]" : "[ - ]"}</span>
            <span>{track?.title ?? "1maginator"}</span>
          </div>
          <div className="ascii-wave" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => (
              <span
                key={i}
                style={{
                  opacity: i / 48 <= progress ? 1 : 0.28,
                  animationDelay: `${i * -0.13}s`,
                }}
              >
                {"▁▂▃▄▅▆▅▄▃▂"[(i * 7 + Math.floor(i / 5)) % 10]}
              </span>
            ))}
          </div>
          {!loaded ? (
            <button
              className="text-control load-tracks"
              onClick={() => setLoaded(true)}
            >
              [ + ] {ru ? "загрузить треки" : "load tracks"}
            </button>
          ) : (
            <>
              <div className="transport-controls">
                <button
                  disabled={!ready || index === 0}
                  aria-label={ru ? "Предыдущий трек" : "Previous track"}
                  onClick={() => select(index - 1)}
                >
                  |&lt;
                </button>
                <button
                  disabled={!ready}
                  onClick={toggle}
                  aria-label={
                    playing
                      ? ru
                        ? "Пауза"
                        : "Pause"
                      : ru
                        ? "Воспроизвести"
                        : "Play"
                  }
                >
                  {playing ? "[ || ]" : "[ > ]"}
                </button>
                <button
                  disabled={!ready || index >= tracks.length - 1}
                  aria-label={ru ? "Следующий трек" : "Next track"}
                  onClick={() => select(index + 1)}
                >
                  &gt;|
                </button>
                <span className="track-time">
                  {time(position)} / {time(track?.duration ?? 0)}
                </span>
              </div>
              <label className="seek-control">
                <span className="seek-glyphs" aria-hidden="true">
                  {"=".repeat(Math.round(progress * 36))}
                  {"·".repeat(36 - Math.round(progress * 36))}
                </span>
                <input
                  onPointerDown={() => {
                    seeking.current = true;
                  }}
                  onPointerUp={() => {
                    seeking.current = false;
                  }}
                  onPointerCancel={() => {
                    seeking.current = false;
                  }}
                  onBlur={() => {
                    seeking.current = false;
                  }}
                  type="range"
                  min="0"
                  max={track?.duration ?? 1}
                  value={Math.min(position, track?.duration ?? 1)}
                  disabled={!ready}
                  aria-label={ru ? "Позиция трека" : "Track position"}
                  aria-valuetext={time(position)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    seek(value);
                  }}
                />
              </label>
            </>
          )}
          {error && (
            <button className="text-control" onClick={retry}>
              {ru ? "повторить загрузку" : "try again"}
            </button>
          )}
          <p role="status" className="integration-note">
            {error
              ? ru
                ? "SoundCloud не ответил. Можно открыть обычный плеер ниже."
                : "SoundCloud did not respond. The original player is available below."
              : loaded && !ready
                ? ru
                  ? "загрузка треков"
                  : "loading tracks"
                : ""}
          </p>
          {active && (
            <ol className="track-list">
              {tracks.map((sound, i) => (
                <li key={sound.id}>
                  <button
                    aria-current={index === i ? "true" : undefined}
                    onClick={() => select(i)}
                  >
                    <span>
                      {index === i ? ">" : String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{sound.title}</span>
                    <span>{time(sound.duration)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {active && (
            <footer>
              <a
                href={
                  track?.permalink_url?.startsWith("https://soundcloud.com/")
                    ? track.permalink_url
                    : site.socials.soundcloud
                }
                target="_blank"
                rel="noreferrer noopener"
              >
                SoundCloud / 1maginator
              </a>
              {loaded && (
                <button
                  className="text-control"
                  onClick={() => setNative((value) => !value)}
                >
                  {ru ? "обычный плеер" : "original player"}
                </button>
              )}
            </footer>
          )}
        </div>
      </section>
      {loaded && (
        <iframe
          key={attempt}
          ref={iframe}
          className={
            native && active ? "soundcloud-native" : "soundcloud-engine"
          }
          title="SoundCloud"
          tabIndex={native && active ? 0 : -1}
          aria-hidden={!native || !active}
          allow="autoplay; encrypted-media"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(site.soundcloudUser)}&auto_play=false&visual=false&show_artwork=false&show_user=true&color=%237d8ba9`}
        />
      )}
    </>
  );
}
