import { describe, expect, it } from 'vitest';
import { globeQuality, isLowPower } from './quality';

describe('isLowPower', () => {
  it('flags few cores, little memory or saving data', () => {
    expect(isLowPower({ cores: 4 })).toBe(true);
    expect(isLowPower({ cores: 8, memory: 4 })).toBe(true);
    expect(isLowPower({ cores: 8, memory: 8, saveData: true })).toBe(true);
  });

  it('leaves capable devices, and ones that say nothing, at full quality', () => {
    expect(isLowPower({ cores: 8, memory: 8 })).toBe(false);
    expect(isLowPower({ cores: 6 })).toBe(false);
    expect(isLowPower({})).toBe(false);
  });
});

describe('globeQuality', () => {
  it('follows the device unless the address asks for a level', () => {
    expect(globeQuality({ cores: 2 }).lowPower).toBe(true);
    expect(globeQuality({ cores: 16 }).lowPower).toBe(false);
    expect(globeQuality({ cores: 16, override: 'low' }).lowPower).toBe(true);
    expect(globeQuality({ cores: 2, override: 'high' }).lowPower).toBe(false);
  });
});
