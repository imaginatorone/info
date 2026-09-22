import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
export function SoundPage() {
  const { locale } = useLocale();
  const ru = locale === "ru";
  const { audio } = useOutletContext<{ audio: EntryAudio }>();
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [native, setNative] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const widget = useRef<SoundCloudWidget | null>(null);
  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      if (alive) setError(true);
    }, 18000);
    const sync = () =>
      widget.current?.setVolume(audio.muted ? 0 : audio.volume * 100);
    const unsubscribe = audio.subscribe(sync);
    void loadSoundCloud()
      .then(() => {
        if (!alive || !iframe.current || !window.SC) return;
        const player = window.SC.Widget(iframe.current);
        widget.current = player;
        player.bind("ready", () => {
          if (!alive) return;
          clearTimeout(timer);
          setReady(true);
          setError(false);
          sync();
          player.getSounds((sounds) => {
            if (alive) setTracks(sounds);
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
          if (alive) setPosition(event.currentPosition);
        });
        player.bind("seek", (event) => {
          if (alive) setPosition(event.currentPosition);
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
      player?.pause();
      for (const event of [
        "ready",
        "play",
        "pause",
        "finish",
        "playProgress",
        "seek",
        "error",
      ])
        player?.unbind(event);
      widget.current = null;
    };
  }, [loaded, audio]);
  const track = tracks[index];
  const progress = track ? Math.min(1, position / track.duration) : 0;
  const select = (value: number) => {
    widget.current?.skip(value);
    setIndex(value);
    setPosition(0);
    widget.current?.play();
  };
  return (
    <section className="foundation-page sound-page" data-route="sound">
      <h1>sound</h1>
      <div className="ascii-player" data-playing={playing}>
        <div className="transport-title">
          <span aria-hidden="true">{playing ? "[ > ]" : "[ - ]"}</span>
          <span>{track?.title ?? "1maginator"}</span>
        </div>
        <div className="ascii-wave" aria-hidden="true">
          {Array.from({ length: 48 }, (_, i) => (
            <span key={i} style={{ opacity: i / 48 <= progress ? 1 : 0.28 }}>
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
                onClick={() => widget.current?.toggle()}
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
                type="range"
                min="0"
                max={track?.duration ?? 1}
                value={Math.min(position, track?.duration ?? 1)}
                disabled={!ready}
                aria-label={ru ? "Позиция трека" : "Track position"}
                aria-valuetext={time(position)}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPosition(value);
                  widget.current?.seekTo(value);
                }}
              />
            </label>
          </>
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
      </div>
      {loaded && (
        <iframe
          ref={iframe}
          className={native ? "soundcloud-native" : "soundcloud-engine"}
          title="SoundCloud"
          tabIndex={native ? 0 : -1}
          aria-hidden={!native}
          allow="autoplay; encrypted-media"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(site.soundcloudUser)}&auto_play=false&visual=false&show_artwork=false&show_user=true&color=%237d8ba9`}
        />
      )}
    </section>
  );
}
