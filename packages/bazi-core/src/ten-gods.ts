/**
 * Ten Gods (十神) calculation.
 *
 * The Ten Gods express the relationship of every Heavenly Stem in the chart
 * relative to the Day Master (self). They are the primary framework for
 * interpreting career, wealth, relationships, and personality.
 */
import type { HeavenlyStem, TenGod } from "./types.js";
import { STEM_INFO, PRODUCES, CONTROLS, PRODUCED_BY, CONTROLLED_BY } from "./tables.js";

/**
 * Derives the Ten God relationship between a target stem and the Day Master.
 *
 * Logic (based on 5-element relationships and polarity matching):
 *
 * DM vs Target:
 *   Same element, same polarity   → 比肩 (Friend/Companion)
 *   Same element, diff polarity   → 劫财 (Rob Wealth)
 *   DM produces target, same pol  → 食神 (Eating God)
 *   DM produces target, diff pol  → 伤官 (Hurting Officer)
 *   DM controls target, same pol  → 偏财 (Indirect Wealth)
 *   DM controls target, diff pol  → 正财 (Direct Wealth)
 *   Target controls DM, same pol  → 七杀 (Seven Killings)
 *   Target controls DM, diff pol  → 正官 (Direct Officer)
 *   Target produces DM, same pol  → 偏印 (Indirect Resource)
 *   Target produces DM, diff pol  → 正印 (Direct Resource)
 */
export function getTenGod(
  dayMaster: HeavenlyStem,
  targetStem: HeavenlyStem
): TenGod {
  const dmInfo = STEM_INFO[dayMaster];
  const targetInfo = STEM_INFO[targetStem];
  const dmElement = dmInfo.element;
  const dmPolarity = dmInfo.polarity;
  const targetElement = targetInfo.element;
  const targetPolarity = targetInfo.polarity;

  const samePolarity = dmPolarity === targetPolarity;

  if (targetElement === dmElement) {
    return samePolarity ? "比肩" : "劫财";
  }

  if (PRODUCES[dmElement] === targetElement) {
    return samePolarity ? "食神" : "伤官";
  }

  if (CONTROLS[dmElement] === targetElement) {
    return samePolarity ? "偏财" : "正财";
  }

  if (CONTROLLED_BY[dmElement] === targetElement) {
    return samePolarity ? "七杀" : "正官";
  }

  if (PRODUCED_BY[dmElement] === targetElement) {
    return samePolarity ? "偏印" : "正印";
  }

  // Should never reach here if the data is correct
  throw new Error(
    `Cannot determine Ten God: DM=${dayMaster}(${dmElement}) Target=${targetStem}(${targetElement})`
  );
}

/**
 * Returns all Ten Gods for a chart, given the Day Master and all stems
 * present across pillars.
 */
export function computeTenGods(
  dayMaster: HeavenlyStem,
  yearStem: HeavenlyStem,
  monthStem: HeavenlyStem,
  hourStem: HeavenlyStem | null,
  yearHiddenStems: HeavenlyStem[],
  monthHiddenStems: HeavenlyStem[],
  dayHiddenStems: HeavenlyStem[],
  hourHiddenStems: HeavenlyStem[]
) {
  return {
    yearStem: getTenGod(dayMaster, yearStem),
    monthStem: getTenGod(dayMaster, monthStem),
    dayStem: null, // Self — no Ten God classification
    hourStem: hourStem ? getTenGod(dayMaster, hourStem) : null,
    yearBranchHidden: yearHiddenStems.map(s => getTenGod(dayMaster, s)),
    monthBranchHidden: monthHiddenStems.map(s => getTenGod(dayMaster, s)),
    dayBranchHidden: dayHiddenStems.map(s => getTenGod(dayMaster, s)),
    hourBranchHidden: hourHiddenStems.map(s => getTenGod(dayMaster, s)),
  };
}
