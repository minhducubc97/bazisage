/**
 * Five Element Balance (五行平衡)
 *
 * Calculates the percentage distribution of each element across all
 * Heavenly Stems and Earthly Branch hidden stems in the chart.
 *
 * Hidden stems within a branch are weighted by their sub-position:
 *   - Main hidden stem: 60% of the branch's weight
 *   - Secondary hidden stem: 30%
 *   - Tertiary hidden stem: 10%
 *
 * Pillars weights are equal (each stem counts as 1 unit, each branch as 1 unit).
 */
import type { HeavenlyStem, EarthlyBranch, ElementBalance, Element } from "./types.js";
import type { Pillar } from "./types.js";
import { STEM_INFO } from "./tables.js";

/** Weight of hidden stems within a branch */
const HIDDEN_STEM_WEIGHTS = [0.6, 0.3, 0.1] as const;

/**
 * Compute the Five Element balance for a chart.
 *
 * @param pillars - Array of all pillars (3 or 4). Null hourPillar is excluded.
 * @returns ElementBalance as percentages (0-100 each, sums to 100)
 */
export function computeElementBalance(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null
): ElementBalance {
  const raw: Record<Element, number> = {
    Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
  };

  const allPillars = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) allPillars.push(hourPillar);

  for (const pillar of allPillars) {
    // Heavenly Stem: counts as 1 unit
    const stemEl = STEM_INFO[pillar.stem].element;
    raw[stemEl] += 1;

    // Branch hidden stems: weighted by position
    pillar.hiddenStems.forEach((stem, idx) => {
      const weight = HIDDEN_STEM_WEIGHTS[idx] ?? 0.1;
      const el = STEM_INFO[stem].element;
      raw[el] += weight;
    });
  }

  // Convert to percentages
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { Wood: 20, Fire: 20, Earth: 20, Metal: 20, Water: 20 };
  }

  return {
    Wood:  Math.round((raw.Wood  / total) * 100),
    Fire:  Math.round((raw.Fire  / total) * 100),
    Earth: Math.round((raw.Earth / total) * 100),
    Metal: Math.round((raw.Metal / total) * 100),
    Water: Math.round((raw.Water / total) * 100),
  };
}
