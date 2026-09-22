varying vec3 vColor;
uniform sampler2D uAtlas;
varying float vGlyph, vAlpha, vBlue;

void main() {
  float glyph = floor(vGlyph + 0.5);
  vec2 cell = vec2(mod(glyph, 16.0), floor(glyph / 16.0));
  vec2 uv = vec2(
    (cell.x + gl_PointCoord.x) / 16.0,
    1.0 - (cell.y + gl_PointCoord.y) / 11.0
  );

  float core = texture2D(uAtlas, uv).a;
  vec2 texel = vec2(1.0 / 512.0, 1.0 / 352.0);
  float soft = max(
    max(texture2D(uAtlas, uv + vec2(texel.x, 0.0)).a,
        texture2D(uAtlas, uv - vec2(texel.x, 0.0)).a),
    max(texture2D(uAtlas, uv + vec2(0.0, texel.y)).a,
        texture2D(uAtlas, uv - vec2(0.0, texel.y)).a)
  );

  vec3 neutral = vColor;
  vec3 energy = vec3(0.39, 0.67, 1.0);
  vec3 color = mix(neutral, energy, clamp(vBlue, 0.0, 1.0));
  float alpha = (core + soft * 0.11) * vAlpha;
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(color, alpha);
}
