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
  uniform sampler2D uLights;
  uniform sampler2D uWater;
  uniform sampler2D uNormal;
  uniform float uNormalStrength;
  uniform vec3 uSunDir;
  uniform vec3 uAtmosphere;
  uniform float uReveal;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vEastW;

  // Palette values are written as sRGB and converted once, so they read like the design tokens.
  vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  const vec3 OCEAN = vec3(0.027, 0.045, 0.086);   // #070c16
  const vec3 SHEEN = vec3(0.40, 0.55, 0.85);
  const vec3 LAND_TINT = vec3(0.87, 0.92, 1.0);
  const vec3 CITY = vec3(0.357, 0.89, 1.0);       // #5be3ff
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

    // Ocean: near-black, flat and glossy, with a broad sheen and a slight lift toward the limb.
    vec3 H = normalize(L + V);
    float NdotH = max(dot(N, H), 0.0);
    float gloss = pow(NdotH, 36.0) * 0.4 + pow(NdotH, 7.0) * 0.07;
    float limb = pow(1.0 - NdotV, 3.0);
    vec3 ocean = toLinear(OCEAN) * mix(0.8, 1.5, smoothstep(-0.5, 0.7, sunN));
    ocean += toLinear(SHEEN) * gloss * 0.7;
    ocean += toLinear(vec3(0.09, 0.17, 0.3)) * limb * 0.5;

    vec3 color = mix(land, ocean, sea);

    // City lights: the map decides how dense the pinpoints are; each point is one tiny cell of a fixed grid.
    // Where cells shrink below a pixel the map's own smooth brightness takes over, so nothing shimmers.
    float lightMap = texture2D(uLights, vUv).r;
    vec2 cell = vUv * vec2(8192.0, 4096.0);
    float cellsPerPixel = max(fwidth(cell.x), fwidth(cell.y));
    float chance = smoothstep(0.08, 0.6, lightMap);
    float point = step(hash21(floor(cell)), chance) * smoothstep(0.5, 0.12, length(fract(cell) - 0.5));
    float pin = mix(point, chance * 0.35, smoothstep(0.7, 1.4, cellsPerPixel));
    float nightness = 1.0 - smoothstep(-0.35, 0.25, sunN);
    color += toLinear(CITY) * pin * mix(0.4, 1.0, nightness) * 2.6;

    // Thin atmospheric veil at the limb.
    float atmoLight = smoothstep(-0.4, 0.6, sunN);
    color += uAtmosphere * limb * 0.1 * (0.3 + atmoLight);

    // Gentle shoulder so highlights roll off instead of clipping.
    color = color / (1.0 + max(color - 0.85, 0.0));
    gl_FragColor = vec4(color * uReveal, 1.0);
    #include <colorspace_fragment>
  }
`;

export const atmosphereVertexShader = /* glsl */ `
  uniform float uZoom;
  uniform float uRadiusFar;
  uniform float uRadiusNear;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    // The shell thins as the camera closes in, so the close-up keeps a rim instead of a wide wash.
    float radius = mix(uRadiusFar, uRadiusNear, uZoom);
    vec4 world = modelMatrix * vec4(position * radius, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** Rendered on the back faces of a slightly larger shell, added to the colour and leaving alpha alone. */
export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDir;
  uniform float uReveal;
  uniform float uZoom;
  uniform float uRadiusFar;
  uniform float uRadiusNear;

  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float radius = mix(uRadiusFar, uRadiusNear, uZoom);
    // -dot(N, V) where the shell's back face meets the Earth's limb.
    float edge = sqrt(1.0 - 1.0 / (radius * radius));
    // 1 at the Earth's limb, 0 at the outer edge of the shell.
    float rim = clamp(-dot(N, V) / edge, 0.0, 1.0);
    float glow = pow(rim, 3.2) * 1.15 + pow(rim, 12.0) * 0.8;
    vec3 radial = normalize(N - V * dot(N, V));
    float sun = smoothstep(-0.65, 0.6, dot(radial, normalize(uSunDir)));
    vec3 color = uColor * glow * (0.12 + 1.05 * sun) * mix(1.0, 0.62, uZoom);
    gl_FragColor = vec4(color * uReveal, 1.0);
    #include <colorspace_fragment>
  }
`;

export const fallbackEarthFragmentShader = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uAtmosphere;
  uniform float uReveal;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float diffuse = clamp(dot(N, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = vec3(0.0013, 0.0027, 0.006) * (0.8 + 1.4 * diffuse);
    vec2 cells = vUv * vec2(24.0, 12.0);
    vec2 grid = abs(fract(cells - 0.5) - 0.5) / fwidth(cells);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    color += vec3(0.105, 0.76, 1.0) * line * (0.03 + 0.07 * diffuse);
    float limb = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
    color += uAtmosphere * limb * 0.06;
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
