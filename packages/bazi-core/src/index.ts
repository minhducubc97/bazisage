/**
 * BaziSage — bazi-core public API
 *
 * The single entry point for all chart computations.
 * All functions here are deterministic, offline-capable, and framework-agnostic.
 */

export * from "./types.js";
export * from "./tables.js";
export * from "./solar-time.js";
export * from "./pillars.js";
export * from "./ten-gods.js";
export * from "./strength.js";
export * from "./elements.js";
export * from "./luck-pillars.js";
export * from "./interactions.js";
export * from "./useful-god.js";

import type {
  BaziInput, BaziChart, ChartComputeResult,
  Pillar, Element, HeavenlyStem,
} from "./types.js";
import { applyTrueSolarTime, utcOffsetFromTimezone } from "./solar-time.js";
import { computePillars } from "./pillars.js";
import { computeTenGods } from "./ten-gods.js";
import { assessDayMasterStrength } from "./strength.js";
import { computeElementBalance } from "./elements.js";
import { computeLuckPillars, computeAnnualPillars } from "./luck-pillars.js";
import { determineUsefulGod } from "./useful-god.js";
import { STEM_INFO, BRANCH_INFO } from "./tables.js";

// ─── Main compute function ─────────────────────────────────────────────────────

/**
 * Compute a complete Bazi chart from user inputs.
 *
 * @param input - Birth data (date, time, location, gender)
 * @param timezone - IANA timezone string for the birth location (e.g., "Asia/Ho_Chi_Minh")
 * @param utcOffsetMinutes - UTC offset in minutes (e.g., UTC+7 → 420). Used if timezone fails.
 */
export function computeChart(
  input: BaziInput,
  timezone: string,
  utcOffsetMinutes: number
): ChartComputeResult {
  const warnings: string[] = [];

  // ── 1. Build UTC birth datetime ─────────────────────────────────────────────
  const birthLocalIso = input.birthTime
    ? `${input.birthDate}T${input.birthTime}:00`
    : `${input.birthDate}T12:00:00`; // Noon default for Three Pillars

  // Convert local time to UTC using the timezone offset
  const localMs = new Date(birthLocalIso + "Z").getTime() - utcOffsetMinutes * 60_000;

  // ── 2. Apply True Solar Time correction ────────────────────────────────────
  const { trueSolarDateMs, offsetMinutes } = applyTrueSolarTime(
    localMs,
    input.longitude,
    utcOffsetMinutes,
    true
  );

  // Convert corrected time back to a local datetime string for pillar calc
  const correctedDate = new Date(trueSolarDateMs + utcOffsetMinutes * 60_000);
  const correctedIso = correctedDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"

  const includeHour = input.birthTime !== null;
  if (!includeHour) {
    warnings.push("Three Pillars mode: hour pillar omitted (birth time unknown).");
  }

  // ── 3. Compute pillars ─────────────────────────────────────────────────────
  const { yearPillar, monthPillar, dayPillar, hourPillar } = computePillars(
    correctedIso,
    includeHour
  );

  const dayMaster: HeavenlyStem = dayPillar.stem;
  const dmInfo = STEM_INFO[dayMaster];
  const dmElement: Element = dmInfo.element;
  const dmPolarity = dmInfo.polarity;

  // ── 4. Ten Gods ────────────────────────────────────────────────────────────
  const tenGods = computeTenGods(
    dayMaster,
    yearPillar.stem,
    monthPillar.stem,
    hourPillar?.stem ?? null,
    yearPillar.hiddenStems,
    monthPillar.hiddenStems,
    dayPillar.hiddenStems,
    hourPillar?.hiddenStems ?? []
  );

  // ── 5. Element balance ─────────────────────────────────────────────────────
  const elementBalance = computeElementBalance(
    yearPillar, monthPillar, dayPillar, hourPillar
  );

  // ── 6. Day Master strength ─────────────────────────────────────────────────
  const { strength: dayMasterStrength } = assessDayMasterStrength(
    dayMaster, yearPillar, monthPillar, dayPillar, hourPillar
  );

  // ── 7. Useful God ──────────────────────────────────────────────────────────
  const { usefulGod, adverseElement } = determineUsefulGod(
    dmElement, dayMasterStrength, elementBalance
  );

  // ── 8. Luck Pillars ────────────────────────────────────────────────────────
  const [birthYear, birthMonth, birthDay] = input.birthDate.split("-").map(Number) as [number, number, number];

  const luckPillars = computeLuckPillars(
    birthYear, birthMonth, birthDay,
    yearPillar.stem,
    monthPillar.stem, monthPillar.branch,
    dayMaster,
    input.gender
  );

  // ── 9. Annual pillars (past 5, next 15 years) ─────────────────────────────
  const currentYear = new Date().getFullYear();
  const annualPillarData = computeAnnualPillars(currentYear - 5, currentYear + 15);
  const annualPillars = annualPillarData.map(({ year, stem, branch }) => ({
    year,
    pillar: {
      stem,
      branch,
      hiddenStems: [] as HeavenlyStem[],
      stemElement: STEM_INFO[stem].element,
      branchElement: BRANCH_INFO[branch]?.element ?? "Wood",
    } as Pillar,
    interactions: [],
  }));

  // ── 10. Assemble chart ─────────────────────────────────────────────────────
  const chart: BaziChart = {
    input,
    mode: includeHour ? "four_pillars" : "three_pillars",
    trueSolarOffsetMinutes: Math.round(offsetMinutes),
    calculationDatetime: new Date(trueSolarDateMs).toISOString(),
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement: dmElement,
    dayMasterPolarity: dmPolarity,
    dayMasterStrength,
    elementBalance,
    tenGods,
    usefulGod,
    adverseElement,
    luckPillars,
    annualPillars,
  };

  return { chart, warnings };
}
