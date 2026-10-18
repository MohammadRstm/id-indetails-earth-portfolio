/**
 * GLSL for the globe. The Earth is flat, dark land over a see-through ocean:
 * a far-side pass shows the land on the back of the planet dimly through the
 * water, and the near-side pass adds softly lit land and a light along the
 * edge. Country borders are drawn as lines on top (`CountryBorders.tsx`).
 * Lighting is fixed relative to the camera, from the upper left.
 */

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Written in display (sRGB) values with premultiplied alpha, so the greys read
 * exactly as specified; there is deliberately no colour-space conversion here.
 */
export const earthFragmentShader = /* glsl */ `
  uniform sampler2D uLand;
  uniform sampler2D uHighlight;
  uniform float uHighlightLevel;
  uniform vec3 uSunDir;
  uniform float uReveal;
  /** 1 for the pass that draws the far hemisphere, seen through the oceans. */
  uniform float uFarSide;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  // Kept dark so the project locations, not the land, draw the eye.
  const vec3 LAND = vec3(0.06, 0.063, 0.07);
  const vec3 OCEAN = vec3(0.028, 0.03, 0.034);
  const vec3 GLOW = vec3(0.24, 0.8, 1.0);

  void main() {
    float land = texture2D(uLand, vUv).a;

    if (uFarSide > 0.5) {
      float alpha = land * 0.45 * uReveal;
      if (alpha < 0.002) discard;
      gl_FragColor = vec4(LAND * 0.55 * alpha, alpha);
      return;
    }

    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float light = 0.55 + 0.45 * smoothstep(-0.45, 0.85, dot(N, normalize(uSunDir)));
    float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.8);

    float oceanAlpha = 0.32 + 0.4 * rim;
    vec3 color = OCEAN * oceanAlpha * (1.0 - land) + LAND * light * land;
    float alpha = oceanAlpha * (1.0 - land) + land;
    color += vec3(0.5, 0.53, 0.58) * rim * (0.12 + 0.2 * light);

    // The selected country: a soft cyan band either side of its border and a faint tint inside.
    vec2 mask = texture2D(uHighlight, vUv).rg;
    float band = 1.0 - abs(mask.g - 0.5) * 2.0;
    float glow = (band * band * 0.32 + mask.r * 0.05) * uHighlightLevel;
    color += GLOW * glow;
    alpha += glow * 0.6;

    gl_FragColor = vec4(color, min(alpha, 1.0)) * uReveal;
  }
`;

export const fallbackEarthFragmentShader = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uReveal;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    float diffuse = clamp(dot(N, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = vec3(0.004) * (0.8 + 1.4 * diffuse);
    vec2 cells = vUv * vec2(24.0, 12.0);
    vec2 grid = abs(fract(cells - 0.5) - 0.5) / fwidth(cells);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    color += vec3(0.75) * line * (0.03 + 0.07 * diffuse);
    gl_FragColor = vec4(color * uReveal, 1.0);
    #include <colorspace_fragment>
  }
`;

export const starsVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying float vBrightness;
  varying vec3 vColor;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    vBrightness = aBrightness;
    vColor = aColor;
  }
`;

export const starsFragmentShader = /* glsl */ `
  varying float vBrightness;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= alpha;
    gl_FragColor = vec4(vColor * vBrightness * alpha, alpha);
    #include <colorspace_fragment>
  }
`;
