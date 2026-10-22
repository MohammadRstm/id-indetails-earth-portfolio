import { createRoot, extend, type CameraProps, type ReconcilerRoot, type RootState } from '@react-three/fiber';
import { useInsertionEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Group, Mesh, PlaneGeometry, Points } from 'three';

// Only the elements the globe writes as JSX; everything else is added as a <primitive>.
// react-three-fiber's own <Canvas> registers the whole of three.js, which then can't be left out of the bundle.
extend({ Group, Mesh, PlaneGeometry, Points });

interface GlobeCanvasProps {
  children: ReactNode;
  dpr: [number, number];
  antialias: boolean;
  camera: CameraProps;
  onCreated: (state: RootState) => void;
}

/**
 * A WebGL canvas filling its parent, rendering on demand. A slim stand-in for
 * react-three-fiber's <Canvas>: no pointer events (the globe handles those on
 * the DOM) and no context bridge (the scene reads no React context).
 */
export function GlobeCanvas({ children, dpr, antialias, camera, onCreated }: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const root = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;
    root.current ??= createRoot(canvas);
    root.current.configure({
      frameloop: 'demand',
      flat: true,
      dpr,
      camera,
      gl: { antialias, alpha: true, powerPreference: 'high-performance' },
      size: { ...size, top: 0, left: 0 },
      onCreated,
    });
    root.current.render(children);
  });

  // An insertion effect is not replayed by StrictMode, so the renderer is only released when the canvas really goes.
  useInsertionEffect(
    () => () => {
      root.current?.unmount();
      root.current = null;
    },
    [],
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
