/**
 * GLSL for the globe. Lighting is computed in world space; the sun direction
 * is fixed relative to the camera so the visible face stays lit while the
 * terminator and city lights sit along the right-hand limb.
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
  uniform sampler2D uRelief;
  uniform vec2 uReliefTexel;
  uniform vec3 uSunDir;
  uniform vec3 uAtmosphere;
  uniform float uReveal;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vEastW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 east = normalize(vEastW - N * dot(vEastW, N));
    vec3 north = cross(N, east);

    // Relief: perturb the normal from the elevation map's local slope.
    float h = texture2D(uRelief, vUv).r;
    float hEast = texture2D(uRelief, vUv + vec2(uReliefTexel.x, 0.0)).r;
    float hNorth = texture2D(uRelief, vUv + vec2(0.0, uReliefTexel.y)).r;
    vec3 Nb = normalize(N - 2.4 * ((hEast - h) * east + (hNorth - h) * north));

    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPosW);
    float sunN = dot(N, L);
    float dayMix = smoothstep(-0.16, 0.26, sunN);
    float diffuse = clamp(dot(Nb, L), 0.0, 1.0);

    vec3 albedo = texture2D(uDay, vUv).rgb;
    float water = texture2D(uWater, vUv).r;
    albedo = mix(albedo, albedo * vec3(0.72, 0.88, 1.08), water * 0.55);

    vec3 dayColor = albedo * (0.035 + 1.2 * diffuse);
    float dusk = smoothstep(-0.06, 0.1, sunN) * (1.0 - smoothstep(0.1, 0.34, sunN));
    dayColor *= mix(vec3(1.0), vec3(1.1, 0.84, 0.7), dusk * 0.55);

    vec3 H = normalize(L + V);
    float NdotH = max(dot(N, H), 0.0);
    float spec = water * (pow(NdotH, 110.0) * 0.85 + pow(NdotH, 14.0) * 0.05);
    vec3 specColor = vec3(0.74, 0.88, 1.0) * spec * smoothstep(0.0, 0.25, sunN);

    float lights = pow(texture2D(uLights, vUv).r, 1.35);
    float nightMix = 1.0 - smoothstep(-0.28, 0.05, sunN);
    vec3 lightColor = vec3(1.0, 0.82, 0.58) * lights * nightMix * 1.5;

    vec3 nightBase = albedo * vec3(0.01, 0.016, 0.03);
    vec3 color = mix(nightBase, dayColor, dayMix) + specColor + lightColor;

    // Atmospheric haze towards the limb, brighter on the sunlit side.
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
    float atmoLight = smoothstep(-0.35, 0.5, sunN);
    color = mix(color, uAtmosphere * (0.3 + atmoLight), fresnel * (0.18 + 0.6 * atmoLight));

    // Gentle shoulder so glints and dense city lights roll off instead of clipping.
    color = color / (1.0 + max(color - 0.85, 0.0));
    gl_FragColor = vec4(color * uReveal, 1.0);
    #include <colorspace_fragment>
  }
`;

export const cloudsFragmentShader = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  uniform float uReveal;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPosW);
    float density = smoothstep(0.22, 0.9, texture2D(uClouds, vUv).r);
    float sunN = dot(N, L);
    float lit = smoothstep(-0.12, 0.3, sunN);
    vec3 color = mix(vec3(0.012, 0.018, 0.03), vec3(0.94, 0.97, 1.0) * (0.3 + 0.8 * max(sunN, 0.0)), lit);
    float limb = smoothstep(0.0, 0.3, dot(N, V));
    gl_FragColor = vec4(color, density * uOpacity * limb * uReveal);
    #include <colorspace_fragment>
  }
`;

export const cloudsVertexShader = sphereVertex;

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** Rendered on the back faces of a slightly larger shell with additive blending. */
export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDir;
  uniform float uEdge;
  uniform float uReveal;

  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    // 1 at the Earth's limb, 0 at the outer edge of the shell.
    float rim = clamp(-dot(N, V) / uEdge, 0.0, 1.0);
    float glow = pow(rim, 3.2) * 1.15 + pow(rim, 12.0) * 0.8;
    vec3 radial = normalize(N - V * dot(N, V));
    float sun = smoothstep(-0.65, 0.6, dot(radial, normalize(uSunDir)));
    vec3 color = uColor * glow * (0.12 + 1.05 * sun);
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
    float diffuse = clamp(dot(N, normalize(uSunDir)), 0.0, 1.0);
    vec3 color = vec3(0.025, 0.06, 0.12) * (0.4 + 0.9 * diffuse);
    vec2 cells = vUv * vec2(24.0, 12.0);
    vec2 grid = abs(fract(cells - 0.5) - 0.5) / fwidth(cells);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    color += vec3(0.32, 0.8, 1.0) * line * (0.12 + 0.2 * diffuse);
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
    color = mix(color, uAtmosphere, fresnel * 0.5);
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
    gl_FragColor = vec4(vColor * vBrightness * alpha, 1.0);
    #include <colorspace_fragment>
  }
`;
