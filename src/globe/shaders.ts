/**
 * GLSL for the globe. Lighting is computed in world space; the sun direction
 * is fixed relative to the camera, so the visible face stays lit from the
 * upper left and falls off softly toward the lower right.
 */

const sphereVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vEastW;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    // Local east tangent; the tiny offset keeps the poles finite.
    vec3 eastLocal = normalize(cross(vec3(0.0, 1.0, 0.0), normal) + vec3(0.0, 0.0, 1e-5));
    vEastW = normalize(mat3(modelMatrix) * eastLocal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const earthVertexShader = sphereVertex;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uWater;
  uniform sampler2D uNormal;
  uniform float uNormalStrength;
  uniform vec3 uSunDir;
  uniform float uReveal;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vEastW;

  // Palette values are written as sRGB and converted once, so they read like the design tokens.
  vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

  const vec3 OCEAN = vec3(0.027, 0.045, 0.086);   // #070c16
  const vec3 SHEEN = vec3(0.40, 0.55, 0.85);
  const vec3 LAND_TINT = vec3(0.87, 0.92, 1.0);
  const vec3 FILL_DIR = vec3(0.72, -0.34, 0.6);
  const vec3 FILL_COLOR = vec3(0.30, 0.45, 0.80);

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 east = normalize(vEastW - N * dot(vEastW, N));
    vec3 north = cross(N, east);

    // Terrain: tangent-space normal map, slopes scaled before renormalising.
    vec3 t = texture2D(uNormal, vUv).xyz * 2.0 - 1.0;
    t = normalize(vec3(t.xy * uNormalStrength, max(t.z, 0.05)));
    vec3 Nb = normalize(east * t.x + north * t.y + N * t.z);

    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPosW);
    float sunN = dot(N, L);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);

    // Crisp, antialiased coastline from the water mask.
    float water = texture2D(uWater, vUv).r;
    float edge = max(fwidth(water) * 0.75, 0.012);
    float sea = smoothstep(0.5 - edge, 0.5 + edge, water);

    // Land: luminance of the colour map becomes a cool grey; bright, unsaturated areas turn to ice.
    vec3 day = texture2D(uDay, vUv).rgb;
    float lum = pow(dot(day, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2);
    float tone = mix(0.2, 0.46, smoothstep(0.07, 0.62, lum));
    tone = mix(tone, 0.64, smoothstep(0.66, 0.92, lum));
    vec3 landAlbedo = toLinear(vec3(tone) * LAND_TINT);

    // Soft key light with a wide wrap: the night side fades rather than cutting off, and keeps its relief.
    float key = clamp((dot(Nb, L) + 0.4) / 1.4, 0.0, 1.0);
    float fill = clamp(dot(Nb, normalize(FILL_DIR)), 0.0, 1.0);
    vec3 landLight = vec3(0.1 + 1.3 * pow(key, 1.35)) + toLinear(FILL_COLOR) * fill * 0.22;
    vec3 land = landAlbedo * landLight;

    // Ocean: near-black, flat and glossy, with a broad sheen.
    vec3 H = normalize(L + V);
    float NdotH = max(dot(N, H), 0.0);
    float gloss = pow(NdotH, 36.0) * 0.4 + pow(NdotH, 7.0) * 0.07;
    vec3 ocean = toLinear(OCEAN) * mix(0.8, 1.5, smoothstep(-0.5, 0.7, sunN));
    ocean += toLinear(SHEEN) * gloss * 0.7;

    vec3 color = mix(land, ocean, sea);

    // Gentle shoulder so highlights roll off instead of clipping.
    color = color / (1.0 + max(color - 0.85, 0.0));
    gl_FragColor = vec4(color * uReveal, 1.0);
    #include <colorspace_fragment>
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
    vec3 color = vec3(0.0013, 0.0027, 0.006) * (0.8 + 1.4 * diffuse);
    vec2 cells = vUv * vec2(24.0, 12.0);
    vec2 grid = abs(fract(cells - 0.5) - 0.5) / fwidth(cells);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    color += vec3(0.105, 0.76, 1.0) * line * (0.03 + 0.07 * diffuse);
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
