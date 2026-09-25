import { describe, expect, it } from 'vitest';
import { isOverrideActive } from '../src/consensus/weighted-voting.js';
import { ParameterAggregator } from '../src/consensus/parameter-aggregation.js';
import { ParameterCategory, type PerformerOverride } from '../src/types/index.js';

const NOW = 1_800_000_000_000;
const override = (expiresAt?: number): PerformerOverride => ({
  performerId: 'performer', parameter: 'intensity', value: 0.8, mode: 'absolute',
  ...(expiresAt === undefined ? {} : { expiresAt }),
});

describe('explicit expiry timestamp contract', () => {
  it.each([
    ['absent expiry', undefined, NOW, true],
    ['epoch zero before expiry', 0, -1, true],
    ['epoch zero at expiry', 0, 0, false],
    ['epoch zero after expiry', 0, NOW, false],
    ['negative expiry after expiry', -1, NOW, false],
    ['past expiry', NOW - 1, NOW, false],
    ['present expiry', NOW, NOW, false],
    ['future expiry', NOW + 1, NOW, true],
  ] as const)('%s', (_name, expiry, clock, active) => {
    expect(isOverrideActive(override(expiry), clock)).toBe(active);
  });

  it('clears expired epoch-zero override from both aggregator stores', () => {
    const aggregator = new ParameterAggregator('session', [{
      id: 'intensity', name: 'Intensity', description: 'Synthetic fixture',
      category: ParameterCategory.INTENSITY, min: 0, max: 1, defaultValue: 0.3,
      audienceControllable: true, performerControllable: true, smoothingEnabled: false,
    }]);
    aggregator.setOverride(override(0));
    expect(aggregator.getState('intensity')?.performerOverride).not.toBeNull();
    expect(aggregator.getOverride('intensity', NOW)).toBeNull();
    expect(aggregator.getState('intensity')?.performerOverride).toBeNull();
    expect(aggregator.computeParameter('intensity', NOW)?.value).not.toBe(0.8);
  });
});
