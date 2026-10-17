import { describe, expect, it } from 'vitest';
import { projectIdFromPath, projectPath } from './useProjectRoute';

describe('project addresses', () => {
  it('reads the project id from its address', () => {
    expect(projectIdFromPath('/projects/alfama-lofts')).toBe('alfama-lofts');
    expect(projectIdFromPath('/projects/alfama-lofts/')).toBe('alfama-lofts');
  });

  it('treats every other address as the globe', () => {
    expect(projectIdFromPath('/')).toBeNull();
    expect(projectIdFromPath('/projects')).toBeNull();
    expect(projectIdFromPath('/projects/')).toBeNull();
    expect(projectIdFromPath('/projects/a/b')).toBeNull();
    expect(projectIdFromPath('/about')).toBeNull();
  });

  it('ignores malformed escapes instead of throwing', () => {
    expect(projectIdFromPath('/projects/%E0%A4%A')).toBeNull();
  });

  it('round-trips an id through its address', () => {
    for (const id of ['alfama-lofts', 'a b', 'ü']) expect(projectIdFromPath(projectPath(id))).toBe(id);
  });
});
