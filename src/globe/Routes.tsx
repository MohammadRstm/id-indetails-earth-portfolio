import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Line, ShaderMaterial, Vector3 } from 'three';
import type { LocationGroup, RouteEdge } from '../lib/geo';
import { latLngToVector, minimumSpanningTree } from '../lib/geo';
import { easeTowards, setUniform, type EffectUniforms } from './effectUniforms';
import type { SceneUniforms } from './sceneUniforms';

const SEGMENTS = 72;
const SURFACE_RADIUS = 1.003;
const FAINT_STRENGTH = 0.25;
const ACTIVE_STRENGTH = 0.95;
/** Distance, in globe radii per second, the dashes travel along the selected place's routes. */
const FLOW_SPEED = 0.05;
const FADE_RATE = 7;
const DASH_PERIOD = 0.05;
const ROUTE_COLOR = new Color('#5be3ff');

const vertexShader = /* glsl */ `
  attribute float aArc;
  attribute float aT;
  varying float vArc;
  varying float vT;
  void main() {
    vArc = aArc;
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uPhase;
  uniform float uReveal;
  varying float vArc;
  varying float vT;

  const float PERIOD = ${DASH_PERIOD.toFixed(3)};
  const float DASH = 0.56;

  void main() {
    float cell = fract((vArc - uPhase) / PERIOD);
    float dash = smoothstep(0.0, 0.1, cell) * (1.0 - smoothstep(DASH, DASH + 0.1, cell));
    float ends = smoothstep(0.0, 0.16, vT) * (1.0 - smoothstep(0.84, 1.0, vT));
    float alpha = dash * ends * uStrength * uReveal;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

/** A great-circle arc between two places, lifted off the surface more the further apart they are. */
function buildArc(from: LocationGroup, to: LocationGroup, angle: number): BufferGeometry {
  const a = latLngToVector(from.lat, from.lng);
  const b = latLngToVector(to.lat, to.lng);
  const start = new Vector3(a.x, a.y, a.z);
  const end = new Vector3(b.x, b.y, b.z);
  const altitude = 0.015 + (0.1 * angle) / Math.PI;
  const sinAngle = Math.sin(angle);

  const positions = new Float32Array((SEGMENTS + 1) * 3);
  const arc = new Float32Array(SEGMENTS + 1);
  const along = new Float32Array(SEGMENTS + 1);
  const point = new Vector3();
  const previous = new Vector3();
  let length = 0;
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    point
      .copy(start)
      .multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
      .addScaledVector(end, Math.sin(t * angle) / sinAngle)
      .normalize()
      .multiplyScalar(SURFACE_RADIUS + altitude * Math.sin(Math.PI * t));
    if (i > 0) length += point.distanceTo(previous);
    previous.copy(point);
    point.toArray(positions, i * 3);
    arc[i] = length;
    along[i] = t;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aArc', new BufferAttribute(arc, 1));
  geometry.setAttribute('aT', new BufferAttribute(along, 1));
  return geometry;
}

interface Route {
  edge: RouteEdge;
  line: Line;
  material: ShaderMaterial;
  geometry: BufferGeometry;
}

interface RoutesProps {
  groups: LocationGroup[];
  activeGroupId: string;
  uniforms: SceneUniforms;
  effects: EffectUniforms;
}

/**
 * Dashed arcs joining the places along a minimum spanning tree. Arcs touching
 * the selected place are bright and flow away from it; the rest stay faint.
 */
export function Routes({ groups, activeGroupId, uniforms, effects }: RoutesProps) {
  const invalidate = useThree((state) => state.invalidate);
  // Written by the frame loop every frame, so kept out of render-time values.
  const live = useRef<Route[]>([]);
  const effectUniforms = useRef(effects);

  const routes = useMemo<Route[]>(() => {
    const byId = new Map(groups.map((group) => [group.id, group]));
    return minimumSpanningTree(groups).flatMap((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to || edge.angle < 1e-3) return [];
      const geometry = buildArc(from, to, edge.angle);
      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uColor: { value: ROUTE_COLOR },
          uStrength: { value: FAINT_STRENGTH },
          uPhase: { value: 0 },
          uReveal: uniforms.uReveal,
        },
      });
      const line = new Line(geometry, material);
      line.renderOrder = 2;
      line.frustumCulled = false;
      return [{ edge, line, material, geometry }];
    });
  }, [groups, uniforms]);

  useEffect(() => {
    live.current = routes;
    effectUniforms.current = effects;
  }, [routes, effects]);
  useEffect(
    () => () => {
      routes.forEach(({ material, geometry }) => {
        material.dispose();
        geometry.dispose();
      });
    },
    [routes],
  );
  useEffect(() => invalidate(), [activeGroupId, routes, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    let moving = false;
    for (const { edge, material } of live.current) {
      const touching = edge.from === activeGroupId || edge.to === activeGroupId;
      const target = touching ? ACTIVE_STRENGTH : FAINT_STRENGTH;
      const strength = material.uniforms.uStrength.value as number;
      if (strength !== target) {
        setUniform(material, 'uStrength', easeTowards(strength, target, dt, FADE_RATE));
        moving = true;
      }
      if (touching && effectUniforms.current.uAnimate.value > 0) {
        // Flows away from the selected place, whichever end of the arc it is.
        const phase = material.uniforms.uPhase.value as number;
        setUniform(material, 'uPhase', (phase + (edge.from === activeGroupId ? 1 : -1) * FLOW_SPEED * dt) % DASH_PERIOD);
        moving = true;
      }
    }
    if (moving) state.invalidate();
  });

  return (
    <>
      {routes.map(({ edge, line }) => (
        <primitive key={`${edge.from}-${edge.to}`} object={line} />
      ))}
    </>
  );
}
