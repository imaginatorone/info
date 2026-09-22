attribute vec3 aTerminal;
attribute vec4 aWorld1, aWorld2, aWorld3, aWorld4;
attribute vec3 aColor1, aColor2, aColor3, aColor4;
uniform vec4 uWorld;
uniform float uPulse, uIntro, uLanguage;
varying vec3 vColor;
attribute vec3 aDetail;
uniform float uTime, uRatio, uPress, uHint, uHintStrength, uReduced, uHome;
uniform float uRoute, uRouteIndex;
uniform vec2 uSize, uPointer, uTarget;
varying float vGlyph, vAlpha, vBlue;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  value += noise(p) * amplitude;
  p = p * 2.03 + 17.1;
  amplitude *= 0.5;
  value += noise(p) * amplitude;
  p = p * 2.01 + 9.7;
  amplitude *= 0.5;
  value += noise(p) * amplitude;
  return value;
}

float bayer2(vec2 p) {
  vec2 q = mod(floor(p), 2.0);
  if (q.y < 0.5) return q.x < 0.5 ? 0.0 : 2.0;
  return q.x < 0.5 ? 3.0 : 1.0;
}

float bayer4(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  float coarse = bayer2(floor(q * 0.5));
  float fine = bayer2(mod(q, 2.0));
  return (4.0 * coarse + fine + 0.5) / 16.0;
}

float glyphRamp(float d) {
  d = clamp(d, 0.0, 1.0);
  if (d < 0.10) return 14.0;
  if (d < 0.19) return 26.0;
  if (d < 0.28) return 27.0;
  if (d < 0.37) return 13.0;
  if (d < 0.46) return 29.0;
  if (d < 0.55) return 11.0;
  if (d < 0.64) return 15.0;
  if (d < 0.73) return 10.0;
  if (d < 0.82) return 5.0;
  if (d < 0.91) return 3.0;
  return 32.0;
}

void main() {
  float kind = position.z;
  float seed = aDetail.z;
  float moving = 1.0 - uReduced;
  float t = uTime * moving;
  float mobile = 1.0 - smoothstep(560.0, 820.0, uSize.x);
  vec2 pointerNorm = (uPointer / uSize - 0.5) * 2.0;
  vec2 p = vec2(-5000.0);
  float size = 10.0;
  vGlyph = 14.0;
  vAlpha = 0.0;
  vBlue = 0.0;
  vColor = vec3(0.79, 0.81, 0.78);

  vec2 figureCenter = uSize * mix(vec2(0.70, 0.34), vec2(0.50, 0.29), mobile);
  float figureHeight = mix(
    min(uSize.y * 0.62, uSize.x * 0.40),
    min(uSize.y * 0.41, uSize.x * 0.88),
    mobile
  );
  vec2 titleCenter = uSize * mix(vec2(0.27, 0.68), vec2(0.50, 0.61), mobile);

  if (kind < 1.5) {
    float layer = step(0.5, kind);
    vec2 uv = position.xy;
    vec2 cells = mix(vec2(70.0, 42.0), vec2(50.0, 30.0), layer);
    vec2 cell = (uv + 0.5) * cells;
    float flow = fbm(uv * mix(4.1, 3.2, layer) + vec2(t * 0.025, -t * 0.018) + layer * 8.0);
    float detailNoise = noise(uv * 11.0 + vec2(-t * 0.017, t * 0.021) + layer * 4.0);
    float density = smoothstep(0.25, 0.82, flow * 0.86 + detailNoise * 0.22);
    float threshold = bayer4(cell);
    float visible = step(threshold * 0.88, density);
    float edge = smoothstep(0.04, 0.17, uv.x + 0.5) *
      smoothstep(0.04, 0.17, 0.5 - uv.x) *
      smoothstep(0.03, 0.15, uv.y + 0.5) *
      smoothstep(0.03, 0.15, 0.5 - uv.y);

    vec2 center = uSize * mix(vec2(0.20, 0.28), vec2(0.82, 0.70), layer);
    if (mobile > 0.5) {
      center = uSize * mix(vec2(-0.18, 0.18), vec2(1.08, 0.58), layer);
    }
    float planeWidth = mix(min(760.0, uSize.x * 0.64), min(610.0, uSize.x * 0.58), layer);
    float planeHeight = mix(min(470.0, uSize.y * 0.56), min(390.0, uSize.y * 0.45), layer);
    if (mobile > 0.5) {
      planeWidth = mix(uSize.x * 1.15, uSize.x * 0.92, layer);
      planeHeight = mix(uSize.y * 0.34, uSize.y * 0.29, layer);
    }

    float depth = (flow - 0.5) * 0.24 + layer * 0.36;
    float perspective = 1.0 / (1.0 + depth * 0.42);
    p = center + vec2(uv.x * planeWidth, uv.y * planeHeight) * perspective;
    p.x += uv.y * mix(-135.0, 105.0, layer) * perspective;
    p.y += uv.x * mix(32.0, -24.0, layer) * perspective;
    vec2 drift = vec2(
      noise(uv * 3.2 + vec2(t * 0.035, 2.0 + layer)) - 0.5,
      noise(uv * 3.0 + vec2(7.0 + layer, -t * 0.028)) - 0.5
    );
    p += drift * mix(18.0, 11.0, layer) * moving;
    p += pointerNorm * mix(vec2(18.0, 10.0), vec2(8.0, 5.0), layer);

    vGlyph = glyphRamp(clamp(density + threshold * 0.12, 0.0, 1.0));
    vAlpha = visible * edge * mix(0.52, 0.29, layer) * (0.35 + density * 0.65);
    size = mix(13.5, 11.0, layer) * perspective;

    vec2 safeFigure = (p - figureCenter) / vec2(figureHeight * 0.58, figureHeight * 0.62);
    vAlpha *= smoothstep(0.54, 1.15, length(safeFigure));
    vec2 safeTitle = (p - titleCenter) / vec2(mix(250.0, 170.0, mobile), mix(88.0, 68.0, mobile));
    if (uPress >= 0.0) vAlpha *= smoothstep(0.70, 1.20, length(safeTitle));
    vAlpha *= smoothstep(36.0, 100.0, length(p - uTarget));
  } else if (kind < 2.5) {
    vec2 uv = position.xy;
    p = (uv + 0.5) * uSize;
    vec2 drift = vec2(
      noise(uv * 9.0 + vec2(t * 0.015, 1.0)) - 0.5,
      noise(uv * 8.0 + vec2(5.0, -t * 0.012)) - 0.5
    );
    p += drift * 34.0 * moving + pointerNorm * 8.0;
    float twinkle = 0.45 + 0.55 * noise(uv * 16.0 + t * 0.025);
    vGlyph = seed > 0.72 ? 26.0 : 14.0;
    vAlpha = 0.045 + twinkle * 0.055;
    size = 8.0 + seed * 3.0;
  } else if (kind < 3.5) {
    vec2 uv = position.xy;
    float weight = aDetail.x;
    vec2 cell = (uv + 0.5) * vec2(49.0, 59.0);
    float threshold = bayer4(cell);
    float contourNoise = noise(uv * 7.0 + vec2(t * 0.022, -t * 0.018));
    float presence = uPress < 0.0
      ? 0.46
      : mix(0.56, 0.90, smoothstep(0.55, 1.8, uPress));
    float visible = step(threshold * 0.84, weight * 0.86 + contourNoise * 0.25);

    float localDepth = noise(uv * 4.5 + 2.0) - 0.5;
    vec2 shape = uv * vec2(figureHeight * 0.86, figureHeight);
    p = figureCenter + shape;
    p += pointerNorm * vec2(32.0, 18.0) * (0.62 + localDepth * 0.55);
    p += vec2(
      noise(uv * 5.0 + vec2(t * 0.032, 0.0)) - 0.5,
      noise(uv * 5.3 + vec2(3.0, -t * 0.028)) - 0.5
    ) * 7.0 * moving;

    vGlyph = glyphRamp(clamp(0.24 + weight * 0.72 + threshold * 0.08, 0.0, 1.0));
    vAlpha = visible * presence * (0.22 + weight * 0.72);
    vAlpha *= 0.78 + 0.22 * noise(uv * 12.0 + t * 0.04);
    size = mix(12.8, 10.2, mobile) * (1.0 + localDepth * 0.08);
  } else if (kind < 4.5) {
    float reveal = uPress < 0.0
      ? 0.0
      : (uReduced > 0.5 ? step(0.05, uPress) : smoothstep(0.52 + seed * 0.32, 1.72 + seed * 0.28, uPress));
    float titleWidth = mix(min(520.0, uSize.x * 0.42), min(340.0, uSize.x * 0.88), mobile);
    vec2 dest = titleCenter + vec2(position.x * titleWidth, position.y * titleWidth / 5.25);
    vec2 origin = dest + vec2(
      (hash(vec2(seed, 1.0)) - 0.5) * 180.0,
      (hash(vec2(seed, 7.0)) - 0.5) * 130.0
    );
    p = mix(origin, dest, reveal);
    float row = floor((position.y + 0.5) * 26.0);
    float damage = uPress < 0.0 ? 0.0 :
      smoothstep(0.12, 0.18, uPress) * (1.0 - smoothstep(0.34, 0.48, uPress)) * moving;
    p.x += (hash(vec2(row, floor(max(uPress, 0.0) * 32.0))) - 0.5) * 74.0 * damage;
    float threshold = bayer4((position.xy + 0.5) * vec2(138.0, 26.0));
    float visible = step(threshold * 0.70, aDetail.x);
    vGlyph = glyphRamp(clamp(aDetail.x * 0.88 + threshold * 0.14, 0.0, 1.0));
    float grain = noise(position.xy * vec2(64.0, 18.0) + t * 0.08);
    vAlpha = visible * reveal * (0.42 + aDetail.x * 0.38 + grain * 0.20);
    vGlyph = glyphRamp(0.48 + aDetail.x * 0.30 + grain * 0.20);
    p.y += sin(floor((position.x + 0.5) * 10.0) * 7.1) * 1.3;
    p.x += (seed - 0.5) * 1.4;
    vBlue = (1.0 - reveal) * reveal * 1.35;
    size = mix(8.6, 7.2, mobile);
  } else if (kind < 5.5) {
    float s = position.x;
    float h = uReduced > 0.5 ? 3.0 : max(uHint, 0.0);
    float emerge = smoothstep(s * 0.48, s * 0.48 + 0.72, h);
    float len = mix(min(290.0, uSize.x * 0.28), min(155.0, uSize.x * 0.40), mobile);
    vec2 end = uTarget - vec2(mix(138.0, 116.0, mobile), 0.0);
    vec2 start = end + vec2(-len, mix(-72.0, -48.0, mobile));
    float curve = smoothstep(0.0, 1.0, s);
    vec2 line = mix(start, end, curve);
    line.y += sin(curve * 3.14159) * mix(44.0, 28.0, mobile);
    line.y += (noise(vec2(s * 6.4, h * 0.22 + t * 0.08)) - 0.5) *
      24.0 * sin(curve * 3.14159) * moving;
    float pointerDistance = length(line - uPointer);
    line.y += (line.y > uPointer.y ? 1.0 : -1.0) *
      exp(-pointerDistance * pointerDistance / 2200.0) * 8.0 * moving;
    p = line;
    vGlyph = glyphRamp(0.24 + seed * 0.42);
    vAlpha = uHintStrength * emerge * (0.62 + 0.18 * noise(vec2(s * 9.0, t * 0.05)));
    size = mix(12.5, 11.5, mobile);
  } else if (kind < 6.5) {
    float h = uReduced > 0.5 ? 3.0 : max(uHint, 0.0);
    p = uTarget + vec2(
      mix(-102.0, -91.0, mobile) + position.x * mix(11.0, 10.0, mobile),
      mix(39.0, 36.0, mobile)
    );
    vGlyph = aDetail.y;
    float breathe = 0.84 + 0.16 * sin(t * 1.7);
    vAlpha = uHintStrength * smoothstep(1.05, 1.38, h) * breathe;
    size = mix(15.5, 14.5, mobile);
  } else if (kind < 7.5) {
    float h = uReduced > 0.5 ? 3.0 : max(uHint, 0.0);
    float assemble = smoothstep(
      0.55 + seed * 0.30,
      1.08 + seed * 0.34,
      h
    );
    float cellX = mix(10.8, 9.5, mobile);
    float cellY = mix(14.5, 13.0, mobile);
    vec2 artEnd = uTarget - vec2(mix(23.0, 20.0, mobile), 0.0);
    vec2 dest = artEnd + vec2(
      (position.x - 10.0) * cellX,
      (position.y - 1.0) * cellY
    );
    vec2 origin = dest + vec2(
      (seed - 0.5) * 88.0,
      (hash(vec2(seed * 17.0, 4.0)) - 0.5) * 54.0
    );
    p = mix(origin, dest, assemble);
    float pointerDistance = length(p - uPointer);
    p += normalize(p - uPointer + vec2(0.01)) *
      exp(-pointerDistance * pointerDistance / 2600.0) * 5.0 * moving;
    vGlyph = aDetail.y;
    vAlpha = uHintStrength * assemble *
      (0.86 + 0.14 * noise(vec2(seed * 8.0, t * 0.08)));
    size = mix(14.0, 13.0, mobile);
  } else {
    vec2 uv = position.xy;
    float depth = aDetail.x;
    vec2 drift = vec2(
      0.004 + seed * 0.0045,
      -0.0025 - depth * 0.0025
    ) * t;
    vec2 q = fract(uv + drift);
    p = q * uSize;
    vec2 delta = p - uPointer;
    float pointerDistance = max(length(delta), 1.0);
    float repel = exp(-pointerDistance * pointerDistance / 24000.0) * moving;
    p += delta / pointerDistance * repel * (5.0 + depth * 9.0);
    p += pointerNorm * (2.0 + depth * 4.0);
    float edge = smoothstep(0.0, 0.08, q.x) *
      smoothstep(0.0, 0.08, 1.0 - q.x) *
      smoothstep(0.0, 0.08, q.y) *
      smoothstep(0.0, 0.08, 1.0 - q.y);
    float flicker = 0.55 + 0.45 * noise(vec2(seed * 23.0, t * 0.045));
    vGlyph = aDetail.y;
    vAlpha = edge * flicker * (0.035 + depth * 0.105);
    size = 6.2 + depth * 3.4;
  }

  if (uPress >= 0.0 && kind < 4.5) {
    float e = uPress;
    float distanceToPress = length(p - uTarget);
    float pulse = exp(-pow((distanceToPress - e * 610.0) / 92.0, 2.0)) *
      exp(-e * 0.72) * moving;
    vec2 direction = normalize(p - uTarget + vec2(0.01));
    p += direction * pulse * 74.0;
    vBlue = max(vBlue, pulse);

    float rupture = smoothstep(0.055, 0.095, e) *
      (1.0 - smoothstep(0.26, 0.43, e)) * moving;
    float row = floor(p.y / 18.0);
    float shift = (hash(vec2(row, floor(e * 28.0))) - 0.5) * 2.0;
    p.x += shift * 42.0 * rupture;
    if (rupture > 0.05) {
      vGlyph = glyphRamp(hash(vec2(seed * 31.0, floor(e * 24.0))));
      vAlpha = min(1.0, vAlpha + rupture * 0.22);
    }
  }

  float worldAmount = dot(uWorld, vec4(1.0));
  if (worldAmount > 0.001) {
    vec4 world = (aWorld1*uWorld.x + aWorld2*uWorld.y + aWorld3*uWorld.z + aWorld4*uWorld.w) / worldAmount;
    vec3 color = (aColor1*uWorld.x + aColor2*uWorld.y + aColor3*uWorld.z + aColor4*uWorld.w) / worldAmount;
    vec2 destination = world.xy * uSize;
    if (mobile > 0.5) {
      destination.y = (0.02 + world.y * 0.94) * uSize.y;
      if (uWorld.x > 0.5 && world.y < 0.48) destination.y *= 0.52;
      if (uWorld.z > 0.5 && world.y < 0.36 && world.x > 0.68) destination.y *= 0.55;
    }
    float depth = max(0.0, world.y - 0.5);
    destination += pointerNorm * vec2(9.0, 5.0) * (0.2 + depth) * moving;
    float wind = sin(t*0.47 + world.x*9.0 + world.y*4.0);
    float ground = smoothstep(0.65,0.95,world.y);
    destination.x += wind * ground * (3.0 + depth*12.0) * moving;
    destination.y += cos(t*0.32+world.x*8.0)*ground*2.5*moving;
    if (uWorld.x > 0.5 && world.y < 0.42) destination.x += sin(t*0.38+world.y*12.0)*3.0*moving;
    if (kind > 7.5) {
      float fall = fract(seed*17.0 + t*(0.02+seed*0.018));
      vec2 petal = vec2(0.58 + seed*0.48 - fall*0.2 + sin(fall*8.0+seed*31.0)*0.04, 0.08+fall*0.74);
      vec2 ember = vec2(fract(0.52 + seed*0.5 + sin(t*0.16+seed*14.0)*0.03), 0.52+fract(seed*8.0-t*0.015)*0.42);
      vec2 firefly = vec2(fract(0.6 + seed*0.42 + sin(t*0.11+seed*18.0)*0.035), 0.56+sin(seed*40.0+t*0.17)*0.16);
      vec2 dust = vec2(fract(seed*11.0 + t*0.006), 0.58+fract(seed*4.0-t*0.01)*0.36);
      vec2 mote = (petal*uWorld.x + ember*uWorld.y + firefly*uWorld.z + dust*uWorld.w) / max(worldAmount, 0.001);
      destination = mote*uSize;
      world.z = 0.22 + 0.5*pow(0.5+0.5*sin(t*(0.7+seed)+seed*44.0), 3.0);
      world.z *= uWorld.x > 0.5 ? sin(fall*3.14159) : 1.0;
      color = (vec3(0.94,0.64,0.79)*uWorld.x + vec3(0.95,0.58,0.32)*uWorld.y + vec3(0.58,0.76,0.96)*uWorld.z + vec3(0.74,0.72,0.8)*uWorld.w) / max(worldAmount, 0.001);
    }
    float stagger = clamp(worldAmount + sin(seed * 21.0) * worldAmount * (1.0-worldAmount) * 0.7, 0.0, 1.0);
    p = mix(p, destination, stagger);
    float safe = 1.0;
    // The copy occupies the left centre; leave that region deliberately quiet.
    float copyZone = (1.0-smoothstep(mix(0.43,0.9,mobile), mix(0.58,1.0,mobile), world.x)) * smoothstep(0.12,0.2,world.y) * (1.0-smoothstep(mix(0.66,0.72,mobile),mix(0.75,0.8,mobile),world.y));
    if (mobile > 0.5) {
      float aboutZone = smoothstep(0.10,0.16,destination.y/uSize.y) * (1.0-smoothstep(0.66,0.72,destination.y/uSize.y));
      float shortZone = smoothstep(0.36,0.42,world.y) * (1.0-smoothstep(0.57,0.64,world.y));
      copyZone = mix(shortZone, aboutZone, uWorld.x);
    }
    float alpha = world.z * (1.0-copyZone*0.98) * safe;
    vAlpha = mix(vAlpha, alpha, stagger);
    float shimmer = noise(world.xy*7.0 + vec2(t*0.075,-t*0.045));
    vec3 sheen = mix(vec3(0.48,0.71,0.83),vec3(0.86,0.60,0.75),sin(world.y*8.0+t*0.19)*0.5+0.5);
    color = mix(color,sheen,shimmer*0.25);
    vColor = mix(vColor, color, worldAmount);
    vAlpha *= 0.70+shimmer*0.48;
    if (kind > 7.5) vGlyph = uWorld.x > 0.5 ? (seed > 0.5 ? 15.0 : 7.0) : (seed>0.7 ? 10.0 : 14.0);
    vGlyph = mix(vGlyph, glyphRamp(0.2 + world.w * 0.72), step(0.45, stagger));
    size = mix(size, mix(12.0, 8.0, mobile) + depth * 3.0, stagger);
    if (kind > 7.5) size = mix(9.0,13.0,seed);
  }
  float languageWave = exp(-pow((p.y/uSize.y - clamp(uLanguage*0.55,0.0,1.5))/0.16,2.0))*exp(-max(uLanguage,0.0)*0.42)*moving;
  p.x += sin(seed*31.0 + p.y*0.04)*languageWave*34.0;
  vAlpha = mix(vAlpha, min(1.0, vAlpha + 0.7), languageWave * 0.9);
  if (languageWave > 0.42) vGlyph = glyphRamp(fract(seed*2.7 + uLanguage));
  vec2 delta = p-uPointer;
  float distanceToPointer = length(delta);
  float local = exp(-distanceToPointer*distanceToPointer/5800.0);
  float ripple = exp(-pow((distanceToPointer-uPulse*190.0)/28.0,2.0))*exp(-uPulse*2.5);
  p += normalize(delta+vec2(0.01))*(local*12.0+ripple*14.0)*moving;
  vAlpha += (local*0.07+ripple*0.15)*step(0.04,vAlpha)*moving;
  if (uIntro < 0.999) {
    vec2 terminal = uSize * mix(vec2(0.27,0.28),vec2(0.10,0.29),mobile) + aTerminal.xy * vec2(mix(8.4,7.2,mobile),22.0);
    float scattered = smoothstep(0.35+seed*0.12,0.88+seed*0.12,uIntro);
    terminal += vec2(sin(seed*32.0)*120.0, cos(seed*18.0)*90.0) * sin(scattered*3.14159) * moving;
    p = mix(terminal,p,scattered);
    float rowVisible = step(aTerminal.y, floor(uIntro/0.35*12.0));
    if (aTerminal.y > 10.5 && uIntro < 0.35) rowVisible *= step(0.35,fract(uTime*2.0));
    vAlpha = mix(aTerminal.z >= 0.0 ? 0.7*rowVisible : 0.0,vAlpha,scattered);
    vGlyph = mix(aTerminal.z,vGlyph,step(0.4,scattered));
    size = mix(14.0,size,scattered);
  }
  vAlpha *= uIntro < 0.0 ? 0.0 : 1.0;
  vAlpha *= smoothstep(64.0, 132.0, uSize.y - p.y);
  gl_Position = vec4(p / uSize * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  gl_PointSize = max(1.0, size * uRatio);
}

