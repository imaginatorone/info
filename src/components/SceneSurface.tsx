import { useEffect, useRef } from "react";

export function SceneSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // M1 owns the renderer lifecycle. Keep this component stable across routes.
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="scene-surface"
      aria-hidden="true"
      data-scene-surface
    />
  );
}
