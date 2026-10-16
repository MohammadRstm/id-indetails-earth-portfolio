import { PauseIcon, PlayIcon } from './icons';

export function RotationToggle({ rotating, onToggle }: { rotating: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="rotation-toggle" onClick={onToggle}>
      {rotating ? <PauseIcon /> : <PlayIcon />}
      <span>{rotating ? 'Pause rotation' : 'Resume rotation'}</span>
    </button>
  );
}
