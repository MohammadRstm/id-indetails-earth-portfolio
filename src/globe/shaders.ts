/**
 * GLSL for the globe. The Earth is drawn as a grey dot matrix over land and a
 * see-through ocean: a far-side pass shows the land on the back of the planet
 * dimly through the water, and the near-side pass adds the lit dots and a soft
 * light along the edge. Lighting is fixed relative to the camera, from the
 * upper left.
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
  uniform sampler2D uWater;
  uniform vec3 uSunDir;
  uniform float uReveal;
  /** 1 for the pass that draws the far hemisphere, seen through the oceans. */
  uniform float uFarSide;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  const float PI = 3.14159265;
  const float ROWS = 210.0;
  const float DOT_RADIUS = 0.33;

  float landAt(vec2 uv, float lod) {
    return 1.0 - smoothstep(0.35, 0.65, textureLod(uWater, uv, lod).r);
  }

  void main() {
    // Rows of equal latitude, each holding as many dots as fit, so dots stay round and evenly spaced up to the poles.
    float rowCoord = vUv.y * ROWS;
    float row = floor(rowCoord);
    float lat = ((row + 0.5) / ROWS - 0.5) * PI;
    float cols = max(3.0, floor(2.0 * ROWS * cos(lat)));
    vec2 cell = vec2(vUv.x * cols, rowCoord);
    vec2 centreUv = vec2((floor(cell.x) + 0.5) / cols, (row + 0.5) / ROWS);
    // Each dot is fully on or off: the mask is read once at the dot's centre.
    float land = landAt(centreUv, 0.0);

    float aa = fwidth(rowCoord);
    float shape = 1.0 - smoothstep(DOT_RADIUS - aa, DOT_RADIUS + aa, length(fract(cell) - 0.5));
    // Once a dot is only a pixel or two across, fade to an even tone so the grid never shimmers.
    // The tone sits a little above the dots' true coverage, which would read too dim.
    float dots = land * mix(shape, 1.5 * PI * DOT_RADIUS * DOT_RADIUS, smoothstep(0.35, 0.9, aa));

    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float light = 0.38 + 0.62 * smoothstep(-0.45, 0.85, dot(N, normalize(uSunDir)));

    if (uFarSide > 0.5) {
      float alpha = dots * 0.34 * uReveal;
      if (alpha < 0.002) discard;
      gl_FragColor = vec4(vec3(0.62) * alpha, alpha);
      return;
    }

    float facing = clamp(dot(N, V), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.6);
    // A faint wash under the dots keeps the continents legible where the dots thin out.
    float wash = landAt(vUv, 0.0) * 0.05 * light;

    float oceanAlpha = 0.3 + 0.35 * rim;
    vec3 color = vec3(0.045) * oceanAlpha * (1.0 - dots) + vec3(0.8) * light * dots + vec3(wash);
    float alpha = oceanAlpha * (1.0 - dots) + dots;
    color += vec3(0.82) * rim * (0.22 + 0.4 * light);

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
