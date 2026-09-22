const hash = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const ridge = (x: number, layer: number) =>
  0.49 +
  layer * 0.065 +
  Math.sin(x * (7 + layer) + layer * 2) * 0.035 +
  Math.sin(x * 21 + layer) * 0.012;

export function landscape(index: number, count: number, route: number) {
  const a = hash(index + 1),
    b = hash(index + 732),
    c = hash(index + 1731);
  let x = (index % 116) / 115,
    y = Math.floor(index / 116) / Math.ceil(count / 116);
  let ink = 0;
  let color = [0.33, 0.51, 0.67];
  if (route === 1 && index < count * 0.37) {
    // Separate blossom masses leave branching gaps and a wind-cut silhouette.
    const clusters = [
      [0.71, 0.16, 0.14, 0.1],
      [0.87, 0.13, 0.15, 0.1],
      [0.98, 0.25, 0.16, 0.12],
      [0.76, 0.3, 0.14, 0.09],
      [0.62, 0.26, 0.12, 0.08],
      [0.88, 0.32, 0.15, 0.09],
    ];
    const cluster = clusters[Math.floor(a * clusters.length)];
    const angle = b * Math.PI * 2,
      radius = Math.sqrt(c);
    const scallop = 0.88 + Math.sin(angle * 5 + a * 3) * 0.12;
    x = cluster[0] + Math.cos(angle) * radius * cluster[2] * scallop;
    y = cluster[1] + Math.sin(angle) * radius * cluster[3] * scallop;
    x = Math.round(x * 142) / 142;
    y = Math.round(y * 90) / 90;
    ink = b > 0.16 ? 0.32 + c * 0.43 : 0;
    color =
      c > 0.65
        ? [0.91, 0.73, 0.8]
        : b > 0.5
          ? [0.7, 0.41, 0.61]
          : [0.45, 0.39, 0.64];
  } else if (route === 1 && index < count * 0.45) {
    const branch = Math.floor(a * 4);
    const ends = [
      [0.66, 0.2],
      [0.9, 0.15],
      [1.0, 0.29],
      [0.74, 0.33],
    ];
    const end = ends[branch];
    x =
      0.85 +
      (end[0] - 0.85) * b * b -
      Math.sin(b * Math.PI) * 0.025 +
      (c - 0.5) * (0.02 * (1 - b) + 0.003);
    y = 0.67 + (end[1] - 0.67) * b;
    ink = 0.3 + c * 0.25;
    color = [0.48, 0.48, 0.62];
  } else if ((route === 2 || route === 3) && index < count * 0.036) {
    const columns = 15,
      gx = ((index % columns) / 14) * 2 - 1;
    const gy =
      (Math.floor(index / columns) /
        (Math.ceil((count * 0.036) / columns) - 1)) *
        2 -
      1;
    x = (route === 3 ? 0.79 : 0.69) + gx * 0.032;
    y = (route === 3 ? 0.2 : 0.47) + gy * 0.046;
    ink =
      Math.hypot(gx, gy) > 1 ||
      (route === 3 && Math.hypot((x - 0.804) * 1.5, y - 0.182) < 0.043)
        ? 0
        : 0.75;
    color = route === 3 ? [0.76, 0.88, 0.98] : [1, 0.77, 0.48];
  } else {
    // Three ordered contours, then a diagonal meadow with open paths through it.
    for (let layer = 0; layer < 3; layer++) {
      const delta = y - ridge(x, layer);
      const band = Math.exp(-Math.pow(delta / (0.009 + layer * 0.009), 2));
      ink += band * (0.35 + layer * 0.14) * (c > 0.17 ? 1 : 0);
    }
    const ground = 0.93 - x * 0.31;
    if (y > ground) {
      const blades = Math.pow(Math.max(0, Math.sin(x * 52 + y * 29)), 2);
      const path = Math.exp(
        -Math.pow((x - 0.58 + (y - 0.65) * 0.8) / 0.065, 2),
      );
      ink +=
        (0.23 + blades * 0.46) * (1 - path * 0.88) * (0.4 + (y - ground) * 2);
    }
    if (route === 1)
      color =
        y > ground
          ? c > 0.84
            ? [0.88, 0.56, 0.7]
            : [0.39, 0.6, 0.48]
          : [0.34, 0.57, 0.67];
    if (route === 2) {
      color =
        y < 0.54
          ? [0.69, 0.39, 0.59]
          : y < ground
            ? [0.91, 0.52, 0.42]
            : c > 0.78
              ? [0.87, 0.65, 0.65]
              : [0.74, 0.61, 0.35];
      const cloud = Math.sin(x * 8 + y * 13) + Math.sin(x * 19 - y * 24) * 0.45;
      if (y < 0.36 && cloud > 0.77 && c > 0.22) ink = (cloud - 0.7) * 0.23;
    }
    if (route === 3) {
      color = c > 0.7 ? [0.46, 0.69, 0.91] : [0.27, 0.36, 0.69];
      if (y < 0.42 && c > 0.965) ink = 0.3 + c * 0.16;
      if (y > ground && c > 0.73) {
        ink *= 1.7;
        color = [0.4, 0.63, 0.88];
      }
    }
    if (route === 4) {
      ink *= 0.62;
      color = y < 0.5 ? [0.64, 0.58, 0.74] : [0.46, 0.4, 0.56];
      if (y < 0.4 && c > 0.955) ink = 0.46;
    }
  }
  return { point: [x, y, Math.min(ink, 0.85), c], color };
}
