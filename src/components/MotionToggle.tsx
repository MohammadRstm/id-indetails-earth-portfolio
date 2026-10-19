import { PauseIcon, PlayIcon } from './icons';

/** Pauses the drifting strip and the ripples on the globe. */
export function MotionToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="motion-toggle" onClick={onToggle}>
      {playing ? <PauseIcon /> : <PlayIcon />}
      <span>{playing ? 'Pause' : 'Play'}</span>
    </button>
  );
}
