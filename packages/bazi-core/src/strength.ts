/**
 * Day Master Strength Assessment via the 12 Growth Stages (长生十二宫).
 *
 * This determines whether the Day Master is Strong, Balanced, or Weak —
 * the single most important assessment in reading a Bazi chart.
 *
 * Method:
 * 1. Score the Day Master's element in all 4 branch positions using growth stages
 * 2. Add supporting helper stems (stems that produce or share the DM element)
 * 3. Weigh month branch highest (月支 is the most influential)
 * 4. Classify: Strong / Balanced / Weak based on total score
 */
import type { HeavenlyStem, EarthlyBranch, DayMasterStrength, Element } from "./types.js";
import type { Pillar } from "./types.js";
import { STEM_INFO, GROWTH_STAGES_YANG, getGrowthStage, GROWTH_STAGE_STRENGTH } from "./tables.js";

/**
 * Primary classification of a growth stage as "rooted" (strong presence) or not.
 * Roots are: 长生, 冠带, 临官, 帝旺 — where the element is actively powerful.
 */
const ROOTING_STAGES = new Set<string>(["长生", "冠带", "临官", "帝旺"]);

/**
 * Weights for each pillar position in strength assessment.
 * Month branch (月支) dominates — classical texts emphasize this heavily.
 */
const BRANCH_WEIGHTS = {
  month: 3.0,
  day: 2.0,
  year: 1.5,
  hour: 1.5,
};

/**
 * Compute the total strength score for the Day Master's element.
 * Returns a raw score and classification.
 */
export function assessDayMasterStrength(
  dayMaster: HeavenlyStem,
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null
): { strength: DayMasterStrength; score: number; details: string } {
  const dmInfo = STEM_INFO[dayMaster];
  const dmElement = dmInfo.element;
  const dmPolarity = dmInfo.polarity;

  let score = 0;
  const details: string[] = [];

  // ── Branch root scores ──────────────────────────────────────────────────────
  const pillarsToCheck: Array<{ pillar: Pillar; label: string; weight: number }> = [
    { pillar: yearPillar,  label: "Year branch",  weight: BRANCH_WEIGHTS.year },
    { pillar: monthPillar, label: "Month branch", weight: BRANCH_WEIGHTS.month },
    { pillar: dayPillar,   label: "Day branch",   weight: BRANCH_WEIGHTS.day },
  ];
  if (hourPillar) {
    pillarsToCheck.push({ pillar: hourPillar, label: "Hour branch", weight: BRANCH_WEIGHTS.hour });
  }

  for (const { pillar, label, weight } of pillarsToCheck) {
    const stage = getGrowthStage(dmElement, dmPolarity, pillar.branch);
    const stageScore = GROWTH_STAGE_STRENGTH[stage] * weight;
    score += stageScore;
    details.push(`${label} (${pillar.branch}): ${stage} ×${weight} = ${stageScore.toFixed(1)}`);
  }

  // ── Stem support scores ─────────────────────────────────────────────────────
  // Stems in the same element (比肩/劫财) and Resource stems (偏印/正印) support DM
  const allStems: HeavenlyStem[] = [
    yearPillar.stem,
    monthPillar.stem,
    // NOT day stem itself
    ...(hourPillar ? [hourPillar.stem] : []),
    ...yearPillar.hiddenStems,
    ...monthPillar.hiddenStems,
    ...dayPillar.hiddenStems,
    ...(hourPillar?.hiddenStems ?? []),
  ];

  for (const stem of allStems) {
    const info = STEM_INFO[stem];
    const { element } = info;
    // Same element = parallel/rob wealth = supports DM
    if (element === dmElement) {
      score += 2;
      details.push(`Supporting stem ${stem} (${element}) +2`);
    }
    // Resource element (produces DM) = indirect/direct resource
    else if (producesElement(element, dmElement)) {
      score += 1.5;
      details.push(`Resource stem ${stem} (${element}→${dmElement}) +1.5`);
    }
  }

  // ── Classification ──────────────────────────────────────────────────────────
  // Thresholds calibrated against known charts
  let strength: DayMasterStrength;
  if (score >= 28) {
    strength = "Strong";
  } else if (score >= 16) {
    strength = "Balanced";
  } else {
    strength = "Weak";
  }

  return { strength, score, details: details.join("\n") };
}

function producesElement(source: Element, target: Element): boolean {
  const cycle: Record<Element, Element> = {
    Wood: "Fire", Fire: "Earth", Earth: "Metal", Metal: "Water", Water: "Wood",
  };
  return cycle[source] === target;
}

/** Whether a branch provides a "root" (transparent support) for the given element */
export function hasRoot(element: Element, polarity: "Yang" | "Yin", branch: EarthlyBranch): boolean {
  const stage = getGrowthStage(element, polarity, branch);
  return ROOTING_STAGES.has(stage);
}
