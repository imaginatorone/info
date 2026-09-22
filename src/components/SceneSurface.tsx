import { useEffect, useRef, useState, type RefObject } from "react";
import { SignalScene, type SceneIntent } from "../core/render/SignalScene";

export function SceneSurface({
  intent,
  target,
  onReady,
}: {
  onReady: () => void;
  intent: SceneIntent;
  target: RefObject<HTMLButtonElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SignalScene | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!canvas.current || !target.current) return;
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      scene.current?.dispose();
      scene.current = null;
    };
    const element = canvas.current;
    element.addEventListener("webglcontextlost", lost);
    try {
      scene.current = new SignalScene(element, target.current);
    } catch {
      // Renderer initialization is an external capability check.
      // oxlint-disable-next-line react/set-state-in-effect
      setFailed(true);
    }
    void document.fonts.ready.then(onReady);
    return () => {
      element.removeEventListener("webglcontextlost", lost);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [target, onReady]);
  useEffect(() => {
    if (scene.current) scene.current.intent = intent;
  }, [intent]);
  return (
    <div
      className="scene-layer"
      aria-hidden="true"
      data-renderer={failed ? "fallback" : "webgl"}
    >
      <canvas
        ref={canvas}
        className="scene-surface"
        data-scene-surface
        hidden={failed}
      />
      {failed && (
        <div className="signal-fallback">
          · &nbsp; : &nbsp; .<br /> / &nbsp; ·<br />. &nbsp; + &nbsp; ·
        </div>
      )}
    </div>
  );
}
