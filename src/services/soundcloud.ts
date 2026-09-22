export type Track = {
  id: number;
  title: string;
  duration: number;
  permalink_url: string;
};
export type Playback = { currentPosition: number; relativePosition: number };
export interface SoundCloudWidget {
  bind(event: string, callback: (event: Playback) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  skip(index: number): void;
  getSounds(callback: (sounds: Track[]) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
}
declare global {
  interface Window {
    SC?: { Widget: (iframe: HTMLIFrameElement) => SoundCloudWidget };
  }
}
let loading: Promise<void> | undefined;
export function loadSoundCloud() {
  if (window.SC) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      loading = undefined;
      reject(new Error("SoundCloud unavailable"));
    };
    document.head.append(script);
  });
  return loading;
}
