import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useLocale } from "../content/locale";
import type { EntryAudio } from "../core/audio/EntryAudio";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function AudioControl({ audio }: { audio: EntryAudio }) {
  const { t } = useLocale();
  const [volume, setVolume] = useState(audio.volume);
  const [muted, setMuted] = useState(audio.muted);
  const dragging = useRef<number | null>(null);

  const change = (value: number) => {
    const next = audio.setVolume(clamp(value));
    setVolume(next);
    return next;
  };

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    change((event.clientX - rect.left) / rect.width);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    fromPointer(event);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === event.pointerId) fromPointer(event);
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current !== event.pointerId) return;
    fromPointer(event);
    dragging.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    const next: Record<string, number> = {
      ArrowRight: volume + step,
      ArrowUp: volume + step,
      ArrowLeft: volume - step,
      ArrowDown: volume - step,
      PageUp: volume + 0.1,
      PageDown: volume - 0.1,
      Home: 0,
      End: 1,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    change(next[event.key]);
  };

  const visibleLevel = muted ? 0 : volume;
  const style = { "--level": visibleLevel } as CSSProperties;

  return (
    <div className="audio-control" data-muted={muted ? "true" : "false"}>
      <button
        className="sound-switch"
        aria-label={muted ? t.unmute : t.mute}
        aria-pressed={muted}
        onClick={() => {
          const wasMuted = audio.muted;
          if (!wasMuted) audio.play("toggle");
          const next = audio.toggle();
          if (wasMuted) audio.play("toggle");
          setMuted(next);
        }}
      >
        <span aria-hidden="true">{muted ? "[x]" : "[~]"}</span>
        <span className="sound-label">{t.snd}</span>
      </button>
      <div
        className="volume-rail"
        role="slider"
        tabIndex={0}
        aria-label={t.volume}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
        aria-valuetext={`${Math.round(volume * 100)} ${t.percent}${muted ? `, ${t.muted}` : ""}`}
        style={style}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={() => {
          dragging.current = null;
        }}
        onLostPointerCapture={() => {
          dragging.current = null;
        }}
      >
        <span className="volume-dots" aria-hidden="true">
          ·················
        </span>
        <span className="volume-bars" aria-hidden="true">
          |||||||||||||||||
        </span>
        <span className="volume-head" aria-hidden="true">
          +
        </span>
      </div>
      <output className="volume-value" aria-hidden="true">
        {String(Math.round(volume * 100)).padStart(2, "0")}
      </output>
    </div>
  );
}
