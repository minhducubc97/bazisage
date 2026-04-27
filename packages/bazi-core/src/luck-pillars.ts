/**
 * Luck Pillars (大运) — 10-year cycle calculation.
 *
 * Each person has a series of 10-year Luck Pillars starting at a computed age.
 * The start age is determined by counting days to the next (or previous) solar term
 * from the birth date, with each 3 days = 1 year of life.
 *
 * Direction of counting:
 *   Male Yang year stem  → Forward  (count to next term)
 *   Male Yin year stem   → Backward (count to previous term)
 *   Female Yang year stem → Backward
 *   Female Yin year stem  → Forward
 *
 * After the start age, each subsequent Luck Pillar adds 10 years.
 */
import { SolarDay } from "tyme4ts";
import type { HeavenlyStem, EarthlyBranch, Gender, Pillar, LuckPillar } from "./types.js";
import {
  STEMS, BRANCHES, HIDDEN_STEMS,
  stemElement, stemPolarity, branchElement,
  getGrowthStage, GROWTH_STAGE_STRENGTH,
} from "./tables.js";
import type { GrowthStage } from "./types.js";

/**
 * Determines if this chart runs Luck Pillars in the forward (ascending) direction.
 * Forward = counting days to the NEXT solar term.
 */
function isForwardDirection(yearStem: HeavenlyStem, gender: Gender): boolean {
  const yearPolarity = stemPolarity(yearStem);
  if (gender === "M") {
    return yearPolarity === "Yang"; // Male Yang year → Forward
  } else {
    return yearPolarity === "Yin";  // Female Yin year → Forward
  }
}

/**
 * Compute the Luck Pillar start age by counting days between birth
 * and the nearest relevant solar term boundary.
 *
 * Returns approximate start age in years (float).
 * 3 days = 1 year in Bazi tradition.
 */
function computeLuckPillarStartAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  forward: boolean
): number {
  try {
    const birthSolarDay = SolarDay.fromYmd(birthYear, birthMonth, birthDay);
    const terms = birthSolarDay.getSolarSeason().getSolarYear().getSolarTerms();

    // Find the next or previous Jié (節) term
    // Jié terms are at even indices (0, 2, 4, ...) in the 24 solar terms array
    // We need to find the term that comes AFTER (forward) or BEFORE (backward) birth

    // Build a flat list of terms across this year and adjacent years for safety
    const allTerms: Array<{ year: number; month: number; day: number }> = [];
    for (const term of terms) {
      const td = term.getJulianDay().getSolarDay();
      allTerms.push({
        year: td.getMonth().getYear().getYear(),
        month: td.getMonth().getMonth(),
        day: td.getDay(),
      });
    }

    // Sort by date
    allTerms.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    const birthMs = Date.UTC(birthYear, birthMonth - 1, birthDay);

    if (forward) {
      // Find first term strictly after birth date
      for (const term of allTerms) {
        const termMs = Date.UTC(term.year, term.month - 1, term.day);
        if (termMs > birthMs) {
          const daysDiff = (termMs - birthMs) / 86_400_000;
          return daysDiff / 3; // 3 days = 1 year
        }
      }
    } else {
      // Find last term strictly before birth date
      let lastBefore: { year: number; month: number; day: number } | null = null;
      for (const term of allTerms) {
        const termMs = Date.UTC(term.year, term.month - 1, term.day);
        if (termMs < birthMs) lastBefore = term;
      }
      if (lastBefore) {
        const termMs = Date.UTC(lastBefore.year, lastBefore.month - 1, lastBefore.day);
        const daysDiff = (birthMs - termMs) / 86_400_000;
        return daysDiff / 3;
      }
    }
  } catch {
    // Ignore tyme4ts errors
  }

  // Fallback: approximate 1 year start age
  return 1;
}

/**
 * Get the sequence of Luck Pillar stems and branches.
 * After the natal month pillar, pillars run in a fixed sexagenary sequence,
 * either forward or backward through the 60-cycle.
 *
 * Starting from the Month Pillar stem/branch, each next pillar is +1 or -1
 * in the 60-cycle (or equivalently, +1/-1 in stem and +1/-1 in branch separately).
 */
function getLuckPillarSequence(
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  forward: boolean,
  count: number
): Array<{ stem: HeavenlyStem; branch: EarthlyBranch }> {
  const pillars: Array<{ stem: HeavenlyStem; branch: EarthlyBranch }> = [];
  let stemIdx = STEMS.indexOf(monthStem);
  let branchIdx = BRANCHES.indexOf(monthBranch);
  const dir = forward ? 1 : -1;

  for (let i = 0; i < count; i++) {
    stemIdx = ((stemIdx + dir) % 10 + 10) % 10;
    branchIdx = ((branchIdx + dir) % 12 + 12) % 12;
    pillars.push({
      stem: STEMS[stemIdx] as HeavenlyStem,
      branch: BRANCHES[branchIdx] as EarthlyBranch,
    });
  }

  return pillars;
}

/**
 * Compute Luck Pillars for a chart.
 *
 * @param birthYear/Month/Day - Birth date (standard local calendar)
 * @param yearStem - The natal year stem (determines direction)
 * @param monthStem/Branch - Natal month pillar (starting point for sequence)
 * @param dayMaster - The Day Master stem
 * @param gender - M or F
 * @param birthCalendarYear - The actual birth calendar year (for calculating start year)
 * @param count - Number of Luck Pillars to generate (default 8 = 80 years)
 */
export function computeLuckPillars(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  yearStem: HeavenlyStem,
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  dayMaster: HeavenlyStem,
  gender: Gender,
  count = 8
): LuckPillar[] {
  const forward = isForwardDirection(yearStem, gender);
  const startAge = computeLuckPillarStartAge(birthYear, birthMonth, birthDay, forward);
  const startAgeRounded = Math.round(startAge * 10) / 10;

  const dmElement = stemElement(dayMaster);
  const dmPolarity = stemPolarity(dayMaster);
  const sequence = getLuckPillarSequence(monthStem, monthBranch, forward, count);

  return sequence.map((sp, idx) => {
    const { stem, branch } = sp;
    const pillar: Pillar = {
      stem,
      branch,
      hiddenStems: HIDDEN_STEMS[branch],
      stemElement: stemElement(stem),
      branchElement: branchElement(branch),
    };

    const luckStartAge = startAgeRounded + idx * 10;
    const luckEndAge = luckStartAge + 9;
    const stage = getGrowthStage(dmElement, dmPolarity, branch) as GrowthStage;

    return {
      pillar,
      startAge: Math.round(luckStartAge),
      startYear: birthYear + Math.round(luckStartAge),
      endAge: Math.round(luckEndAge),
      dayMasterGrowthStage: stage,
    };
  });
}

/**
 * Compute annual pillars for a range of years.
 * Uses formula-based approach (tyme4ts is used in index.ts for the main chart).
 * Jun 1 of each year is guaranteed to be past LiChun so formula is safe.
 */
export function computeAnnualPillars(
  startYear: number,
  endYear: number
): Array<{ year: number; stem: HeavenlyStem; branch: EarthlyBranch }> {
  const results = [];
  for (let year = startYear; year <= endYear; year++) {
    const stemIdx = ((year - 4) % 10 + 10) % 10;
    const branchIdx = ((year - 4) % 12 + 12) % 12;
    results.push({
      year,
      stem: STEMS[stemIdx] as HeavenlyStem,
      branch: BRANCHES[branchIdx] as EarthlyBranch,
    });
  }
  return results;
}
