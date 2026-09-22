import { dictionary, type Locale } from "../../content/locale";
import { landscape } from "./landscapes";
import * as THREE from "three";
import identityPoints from "../../content/identity-points.json";
import vertexShader from "./signal.vert?raw";
import fragmentShader from "./signal.frag?raw";

export type SceneIntent = {
  intro?: number;
  locale?: Locale;
  entered: boolean;
  reduced: boolean;
  hint: boolean;
  home: boolean;
  routeIndex: number;
};

const glyphIndex = (char: string) => char.charCodeAt(0) - 32;

export class SignalScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private atlas: THREE.CanvasTexture;
  private frame = 0;
  private start = performance.now();
  private pressed = -1;
  private hinted = -1;
  private routed = -1;
  private lastRouteIndex = 0;
  private wasHint = false;
  private hintStrength = 0;
  private last = 0;
  private average = 16.7;
  private lastQuality = 0;
  private ratio = 1;
  private terminalLocale?: Locale;
  private languageTime = -100;
  private world = new THREE.Vector4();
  private pulseTime = -100;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private target: HTMLElement;

  intent: SceneIntent = {
    entered: false,
    reduced: false,
    hint: false,
    home: true,
    routeIndex: 0,
  };

  constructor(canvas: HTMLCanvasElement, target: HTMLElement) {
    this.target = target;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x07090a, 1);

    const sheet = document.createElement("canvas");
    sheet.width = 512;
    sheet.height = 352;
    const ctx = sheet.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.font = "24px Menlo, SFMono-Regular, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    for (let index = 0; index < 162; index++) {
      const code =
        index < 96
          ? index + 32
          : index < 160
            ? index - 96 + 1040
            : index === 160
              ? 1025
              : 1105;
      ctx.fillText(
        String.fromCharCode(code),
        (index % 16) * 32 + 16,
        Math.floor(index / 16) * 32 + 16,
      );
    }
    this.atlas = new THREE.CanvasTexture(sheet);
    this.atlas.minFilter = THREE.LinearFilter;
    this.atlas.magFilter = THREE.LinearFilter;
    this.atlas.generateMipmaps = false;

    const positions: number[] = [];
    const detail: number[] = [];
    let random = 1949;
    const rand = () => {
      random = (random * 16807) % 2147483647;
      return random / 2147483647;
    };
    const add = (x: number, y: number, kind: number, weight = 1, code = 0) => {
      positions.push(x, y, kind);
      detail.push(weight, code, rand());
    };

    for (let y = 0; y < 42; y++)
      for (let x = 0; x < 70; x++) add(x / 69 - 0.5, y / 41 - 0.5, 0);
    for (let y = 0; y < 30; y++)
      for (let x = 0; x < 50; x++) add(x / 49 - 0.5, y / 29 - 0.5, 1);
    for (let i = 0; i < 260; i++) add(rand() - 0.5, rand() - 0.5, 2);

    const ink = new Map<number, number>();
    for (const [x, y, weight] of identityPoints) {
      const column = Math.round((x + 0.5) * 48);
      const row = Math.round((y + 0.5) * 58);
      const key = row * 49 + column;
      ink.set(key, Math.max(ink.get(key) ?? 0, weight));
    }
    for (const [key, weight] of ink) {
      const x = (key % 49) / 48 - 0.5;
      const y = Math.floor(key / 49) / 58 - 0.5;
      add(x, y, 3, weight);
    }

    const title = document.createElement("canvas");
    title.width = 960;
    title.height = 180;
    const titleCtx = title.getContext("2d");
    if (!titleCtx) throw new Error("2D canvas unavailable");
    titleCtx.fillStyle = "#fff";
    titleCtx.font = "700 126px Menlo, SFMono-Regular, monospace";
    titleCtx.textAlign = "center";
    titleCtx.textBaseline = "middle";
    titleCtx.fillText("1maginator", 480, 94);
    const pixels = titleCtx.getImageData(0, 0, title.width, title.height).data;
    const step = 7;
    for (let y = 0; y < title.height; y += step) {
      for (let x = 0; x < title.width; x += step) {
        const alpha = pixels[(y * title.width + x) * 4 + 3] / 255;
        if (alpha > 0.08)
          add(x / title.width - 0.5, y / title.height - 0.5, 4, alpha);
      }
    }

    for (let i = 0; i < 76; i++) add(i / 75, 0, 5);
    for (let i = 0; i < 5; i++) add(i, 0, 6, 1, glyphIndex("PRESS"[i]));

    const arrowArt = ["          /", "~~~~~====>", "          \\"];
    for (let row = 0; row < arrowArt.length; row++) {
      for (let column = 0; column < arrowArt[row].length; column++) {
        const char = arrowArt[row][column];
        if (char !== " ") add(column, row, 7, 1, glyphIndex(char));
      }
    }

    const particleGlyphs = [".", ":", "'", "*", "+", "~", "`"];
    for (let i = 0; i < 360; i++) {
      const glyph = particleGlyphs[Math.floor(rand() * particleGlyphs.length)];
      add(rand(), rand(), 8, 0.2 + rand() * 0.8, glyphIndex(glyph));
    }

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    this.geometry.setAttribute(
      "aDetail",
      new THREE.Float32BufferAttribute(detail, 3),
    );

    const count = positions.length / 3;
    this.geometry.setAttribute(
      "aTerminal",
      new THREE.Float32BufferAttribute(new Float32Array(count * 3).fill(-1), 3),
    );
    for (let route = 1; route <= 4; route++) {
      const points: number[] = [],
        colors: number[] = [];
      for (let i = 0; i < count; i++) {
        const target = landscape(i, count, route);
        points.push(...target.point);
        colors.push(...target.color);
      }
      this.geometry.setAttribute(
        `aWorld${route}`,
        new THREE.Float32BufferAttribute(points, 4),
      );
      this.geometry.setAttribute(
        `aColor${route}`,
        new THREE.Float32BufferAttribute(colors, 3),
      );
    }
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWorld: { value: this.world },
        uPulse: { value: -100 },
        uLanguage: { value: -100 },
        uIntro: { value: 1 },
        uSize: { value: new THREE.Vector2() },
        uPointer: { value: this.pointer },
        uTarget: { value: new THREE.Vector2() },
        uRatio: { value: 1 },
        uPress: { value: -1 },
        uHint: { value: -1 },
        uHintStrength: { value: 0 },
        uReduced: { value: 0 },
        uHome: { value: 1 },
        uRoute: { value: -1 },
        uRouteIndex: { value: 0 },
        uAtlas: { value: this.atlas },
      },
      vertexShader,
      fragmentShader,
    });

    const glyphs = new THREE.Points(this.geometry, this.material);
    glyphs.frustumCulled = false;
    this.scene.add(glyphs);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.move, { passive: true });
    window.addEventListener("pointerdown", this.pulse, { passive: true });
    window.addEventListener("focusin", this.focus);
    document.addEventListener("visibilitychange", this.visibility);
    this.frame = requestAnimationFrame(this.draw);
  }

  private move = (event: PointerEvent) => {
    this.pointerTarget.set(event.clientX, event.clientY);
  };

  private terminal(locale: Locale) {
    if (this.terminalLocale)
      this.languageTime = (performance.now() - this.start) / 1000;
    const t = dictionary[locale];
    const lines = [
      "+ session / local",
      "$ boot session",
      `  ${t.status[0]}`,
      "$ prepare glyph-field",
      `  ${t.status[1]}`,
      "$ load locale",
      `  ${locale}`,
      "$ prime audio-bus",
      `  ${t.status[2]}`,
      "$ render entrypoint",
      `  ${t.status[3]}`,
      "_",
    ];
    const attribute = this.geometry.getAttribute(
      "aTerminal",
    ) as THREE.BufferAttribute;
    (attribute.array as Float32Array).fill(-1);
    let index = 0;
    lines.forEach((line, row) =>
      Array.from(line).forEach((char, column) => {
        const code = char.charCodeAt(0);
        const glyph =
          code < 128
            ? code - 32
            : code === 1025
              ? 160
              : code === 1105
                ? 161
                : code - 1040 + 96;
        if (char !== " ") attribute.setXYZ(index++, column, row, glyph);
      }),
    );
    attribute.needsUpdate = true;
    this.terminalLocale = locale;
  }
  private pulse = (event: PointerEvent) => {
    this.move(event);
    this.pulseTime = (performance.now() - this.start) / 1000;
  };
  private focus = (event: FocusEvent) => {
    if (
      !(event.target instanceof HTMLElement) ||
      !event.target.matches("a,button,[role=slider]")
    )
      return;
    const rect = event.target.getBoundingClientRect();
    this.pointerTarget.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
    this.pulseTime = (performance.now() - this.start) / 1000;
  };
  private resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.ratio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.setSize(width, height, false);
    this.material.uniforms.uSize.value.set(width, height);
    this.material.uniforms.uRatio.value = this.ratio;
    this.pointer.set(width / 2, height / 2);
    this.pointerTarget.copy(this.pointer);
    const rect = this.target.getBoundingClientRect();
    this.material.uniforms.uTarget.value.set(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
  };

  private visibility = () => {
    cancelAnimationFrame(this.frame);
    if (!document.hidden) {
      this.last = 0;
      this.frame = requestAnimationFrame(this.draw);
    }
  };

  private draw = (now: number) => {
    const time = (now - this.start) / 1000;
    if (this.terminalLocale !== (this.intent.locale ?? "en"))
      this.terminal(this.intent.locale ?? "en");
    const dt = Math.min(this.last ? now - this.last : 16.7, 50);
    if (!this.intent.entered) {
      this.lastRouteIndex = this.intent.routeIndex;
    } else if (this.intent.routeIndex !== this.lastRouteIndex) {
      this.lastRouteIndex = this.intent.routeIndex;
      this.routed = time;
    }
    if (this.intent.entered && this.pressed < 0) this.pressed = time;
    if (this.intent.hint && !this.wasHint) this.hinted = time;
    this.wasHint = this.intent.hint;

    const desiredHint = Number(this.intent.hint && !this.intent.entered);
    this.hintStrength +=
      (desiredHint - this.hintStrength) * (1 - Math.exp(-dt / 110));
    if (this.intent.reduced) {
      this.pointer.copy(this.pointerTarget);
      this.hintStrength = desiredHint;
    } else this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-dt / 150));

    const uniforms = this.material.uniforms;
    for (let i = 0; i < 4; i++) {
      const goal = Number(
        this.intent.entered && this.intent.routeIndex === i + 1,
      );
      this.world.setComponent(
        i,
        this.world.getComponent(i) +
          (goal - this.world.getComponent(i)) *
            (1 - Math.exp(-dt / (this.intent.reduced ? 60 : 420))),
      );
    }
    uniforms.uIntro.value = this.intent.intro ?? 1;
    uniforms.uPulse.value = time - this.pulseTime;
    uniforms.uLanguage.value = time - this.languageTime;
    uniforms.uTime.value = time;
    uniforms.uPress.value = this.pressed < 0 ? -1 : time - this.pressed;
    uniforms.uHint.value = this.hinted < 0 ? -1 : time - this.hinted;
    uniforms.uHintStrength.value = this.hintStrength;
    uniforms.uReduced.value = Number(this.intent.reduced);
    uniforms.uHome.value = Number(this.intent.home);
    uniforms.uRoute.value = this.routed < 0 ? -1 : time - this.routed;
    uniforms.uRouteIndex.value = this.intent.routeIndex;

    if (this.last && !this.intent.reduced) {
      this.average =
        this.average * 0.98 + Math.min(now - this.last, 100) * 0.02;
      if (now - this.lastQuality > 6000) {
        const next =
          this.average > 22.5
            ? Math.max(1, this.ratio - 0.15)
            : this.average < 17
              ? Math.min(2, window.devicePixelRatio, this.ratio + 0.1)
              : this.ratio;
        if (next !== this.ratio) {
          this.ratio = next;
          this.renderer.setPixelRatio(next);
          uniforms.uRatio.value = next;
        }
        this.lastQuality = now;
      }
    }

    this.last = now;
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.draw);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("pointerdown", this.pulse);
    window.removeEventListener("focusin", this.focus);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.move);
    document.removeEventListener("visibilitychange", this.visibility);
    this.geometry.dispose();
    this.material.dispose();
    this.atlas.dispose();
    this.renderer.dispose();
  }
}
