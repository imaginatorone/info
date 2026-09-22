import { prepareLoop, type LoopOptions } from "./loop";
type Sound = "ambience" | "press" | "hover" | "reveal" | "route" | "toggle";
type Asset = LoopOptions & { src: string | null; gain?: number };
type Manifest = Partial<Record<Sound, Asset>>;

export class EntryAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private buses = new Map<Sound, GainNode>();
  private buffers = new Map<Sound, AudioBuffer>();
  private assets: Manifest = {};
  private ambience?: AudioBufferSourceNode;
  private loading?: Promise<void>;
  private manifest?: Promise<void>;
  private disposed = false;
  private lastHover = -1;
  muted = false;
  volume = 0.5;
  constructor() {
    try {
      this.muted = localStorage.getItem("sound-muted") === "true";
      const saved = localStorage.getItem("sound-volume");
      if (saved !== null && Number.isFinite(Number(saved)))
        this.volume = Math.max(0, Math.min(1, Number(saved)));
    } catch {
      /* Storage is optional. */
    }
  }
  get level() {
    return this.master
      ? this.master.gain.value / 0.64
      : this.muted
        ? 0
        : this.volume;
  }
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private notify() {
    this.listeners.forEach((listener) => listener());
  }
  private gain() {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime,
      param = this.master.gain;
    param.cancelAndHoldAtTime(now);
    param.setTargetAtTime(this.muted ? 0 : this.volume * 0.64, now, 0.035);
  }
  setVolume(value: number) {
    if (!Number.isFinite(value)) return this.volume;
    this.volume = Math.max(0, Math.min(1, value));
    this.gain();
    this.notify();
    try {
      localStorage.setItem("sound-volume", String(this.volume));
    } catch {
      /* Storage is optional. */
    }
    return this.volume;
  }
  toggle() {
    this.muted = !this.muted;
    this.gain();
    this.notify();
    if (!this.muted && this.context?.state === "suspended")
      void this.context.resume().catch(() => {});
    try {
      localStorage.setItem("sound-muted", String(this.muted));
    } catch {
      /* Storage is optional. */
    }
    return this.muted;
  }
  private visibility = () => {
    if (!this.context || this.disposed) return;
    if (document.hidden) void this.context.suspend().catch(() => {});
    else void this.context.resume().catch(() => {});
  };
  prepare() {
    this.manifest ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then(async (response) => {
        if (response.ok) this.assets = (await response.json()) as Manifest;
      })
      .catch(() => {});
    return this.manifest;
  }
  private async load() {
    try {
      await this.prepare();
      await Promise.all(
        (
          ["ambience", "press", "hover", "reveal", "route", "toggle"] as const
        ).map(async (key) => {
          const asset = this.assets[key];
          if (!asset?.src || !this.context) return;
          try {
            const response = await fetch(
              asset.src.startsWith("/audio/")
                ? `${import.meta.env.BASE_URL}${asset.src.slice(1)}`
                : asset.src,
            );
            if (!response.ok) return;
            const buffer = await this.context.decodeAudioData(
              await response.arrayBuffer(),
            );
            if (this.disposed) return;
            this.buffers.set(key, buffer);
            const level = Number.isFinite(asset.gain)
              ? Math.max(0, Math.min(1, asset.gain!))
              : 0.5;
            this.buses.get(key)!.gain.value = level;
            if (key === "ambience") this.startAmbience(buffer, asset);
          } catch {
            /* An unavailable asset never blocks the scene. */
          }
        }),
      );
    } catch {
      /* The procedural entry works without an asset manifest. */
    }
  }
  private startAmbience(buffer: AudioBuffer, asset: Asset) {
    if (!this.context || this.ambience || this.disposed) return;
    const loop = prepareLoop(this.context, buffer, asset);
    const source = this.context.createBufferSource();
    source.buffer = loop.buffer;
    source.loop = true;
    source.loopStart = loop.start;
    source.loopEnd = loop.end;
    const fade = this.context.createGain();
    fade.gain.setValueAtTime(0, this.context.currentTime);
    fade.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.8);
    source.connect(fade).connect(this.buses.get("ambience")!);
    source.start(this.context.currentTime, loop.start);
    this.ambience = source;
    source.onended = () => {
      source.disconnect();
      fade.disconnect();
    };
  }
  play(key: Exclude<Sound, "ambience">, delay = 0) {
    const context = this.context,
      buffer = this.buffers.get(key);
    if (!context || !buffer || context.state !== "running" || this.disposed)
      return;
    if (key === "hover") {
      if (context.currentTime - this.lastHover < 0.15) return;
      this.lastHover = context.currentTime;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.buses.get(key)!);
    source.start(context.currentTime + delay);
    source.onended = () => source.disconnect();
  }
  async press() {
    try {
      if (this.disposed) return;
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume * 0.64;
        this.master.connect(this.context.destination);
        for (const key of [
          "ambience",
          "press",
          "hover",
          "reveal",
          "route",
          "toggle",
        ] as const) {
          const bus = this.context.createGain();
          bus.connect(this.master);
          this.buses.set(key, bus);
        }
        document.addEventListener("visibilitychange", this.visibility);
      }
      const context = this.context;
      await context.resume();
      if (this.disposed || context.state !== "running") return;
      this.loading ??= this.load();
      // Bound asset readiness, not sound timing; late assets are used by later interactions.
      await Promise.race([
        this.loading,
        new Promise((resolve) => window.setTimeout(resolve, 120)),
      ]);
      if (this.disposed || context.state !== "running") return;
      // Nodes are scheduled against the audio clock after decoding.
      if (this.buffers.has("press")) this.play("press");
      else {
        const buffer = context.createBuffer(
          1,
          context.sampleRate * 0.075,
          context.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] =
            (Math.random() * 2 - 1) *
            Math.exp(-i / (context.sampleRate * 0.008));
        const source = context.createBufferSource();
        source.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1800;
        const envelope = context.createGain();
        envelope.gain.value = 0.26;
        source
          .connect(filter)
          .connect(envelope)
          .connect(this.buses.get("press")!);
        source.start(context.currentTime);
        source.stop(context.currentTime + 0.08);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          envelope.disconnect();
        };
      }
      if (this.buffers.has("reveal")) this.play("reveal", 0.8);
      else {
        const tone = context.createOscillator(),
          envelope = context.createGain(),
          now = context.currentTime;
        tone.frequency.setValueAtTime(196, now);
        tone.frequency.exponentialRampToValueAtTime(98, now + 0.75);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.12, now + 0.035);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        tone.connect(envelope).connect(this.buses.get("reveal")!);
        tone.start(now);
        tone.stop(now + 1.15);
        tone.onended = () => {
          tone.disconnect();
          envelope.disconnect();
        };
      }
    } catch {
      /* Entry remains usable without an audio device. */
    }
  }
  dispose() {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.visibility);
    this.ambience?.stop();
    void this.context?.close().catch(() => {});
  }
}
