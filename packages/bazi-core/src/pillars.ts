/**
 * Bazi Pillar Calculation
 *
 * Uses tyme4ts's built-in sixty-cycle (六十甲子) API for all pillar computation.
 * This is the accuracy-first approach — tyme4ts has been validated against
 * classical Chinese calendar references.
 *
 * True Solar Time correction is applied BEFORE calling tyme4ts,
 * so all pillar results reflect the corrected local time.
 */
import { SolarTime } from "tyme4ts";
import type { HeavenlyStem, EarthlyBranch, Pillar } from "./types.js";
import { HIDDEN_STEMS, stemElement, branchElement } from "./tables.js";

// ─── tyme4ts stem/branch string → our types ───────────────────────────────────

/**
 * Map tyme4ts's Chinese string outputs to our typed HeavenlyStem / EarthlyBranch.
 * tyme4ts returns stems/branches as their Chinese character strings.
 */
function toStem(s: string): HeavenlyStem {
  const valid: HeavenlyStem[] = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  if (valid.includes(s as HeavenlyStem)) return s as HeavenlyStem;
  throw new Error(`Unknown Heavenly Stem from tyme4ts: "${s}"`);
}

function toBranch(s: string): EarthlyBranch {
  const valid: EarthlyBranch[] = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  if (valid.includes(s as EarthlyBranch)) return s as EarthlyBranch;
  throw new Error(`Unknown Earthly Branch from tyme4ts: "${s}"`);
}

// ─── Build a Pillar from stem/branch strings ──────────────────────────────────

function buildPillar(stemStr: string, branchStr: string): Pillar {
  const stem = toStem(stemStr);
  const branch = toBranch(branchStr);
  return {
    stem,
    branch,
    hiddenStems: HIDDEN_STEMS[branch],
    stemElement: stemElement(stem),
    branchElement: branchElement(branch),
  };
}

// ─── Main pillar computation ──────────────────────────────────────────────────

export interface PillarSet {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
}

/**
 * Compute all four (or three) pillars using tyme4ts.
 *
 * @param correctedLocalIso - Local datetime AFTER True Solar Time correction ("YYYY-MM-DDTHH:MM")
 * @param includeHour - false for Three Pillars mode (when birth time unknown)
 */
export function computePillars(
  correctedLocalIso: string,
  includeHour: boolean
): PillarSet {
  const [datePart, timePart = "12:00"] = correctedLocalIso.split("T");
  const [year, month, day] = (datePart ?? "").split("-").map(Number);
  const [hour, minute] = (timePart ?? "12:00").split(":").map(Number);

  const y = year ?? 1970;
  const mo = month ?? 1;
  const d = day ?? 1;
  const h = includeHour ? (hour ?? 12) : 12;
  const mi = includeHour ? (minute ?? 0) : 0;

  // tyme4ts LunarHour gives all four pillars (year/month/day/hour sixty cycles)
  const solarTime = SolarTime.fromYmdHms(y, mo, d, h, mi, 0);
  const lunarHour = solarTime.getLunarHour();

  const yearCycle = lunarHour.getYearSixtyCycle();
  const monthCycle = lunarHour.getMonthSixtyCycle();
  const dayCycle = lunarHour.getDaySixtyCycle();
  const hourCycle = lunarHour.getSixtyCycle();

  const yearPillar = buildPillar(
    yearCycle.getHeavenStem().toString(),
    yearCycle.getEarthBranch().toString()
  );

  const monthPillar = buildPillar(
    monthCycle.getHeavenStem().toString(),
    monthCycle.getEarthBranch().toString()
  );

  const dayPillar = buildPillar(
    dayCycle.getHeavenStem().toString(),
    dayCycle.getEarthBranch().toString()
  );

  const hourPillar = includeHour
    ? buildPillar(
        hourCycle.getHeavenStem().toString(),
        hourCycle.getEarthBranch().toString()
      )
    : null;

  return { yearPillar, monthPillar, dayPillar, hourPillar };
}

// ─── Annual pillar helper ──────────────────────────────────────────────────────

/**
 * Get the year pillar (年柱) for a given calendar year.
 * Uses LiChun boundary (tyme4ts handles this automatically via getYearSixtyCycle()).
 * We use Feb 15 noon as a safe mid-year reference point.
 */
export function getYearPillar(year: number): Pillar {
  const st = SolarTime.fromYmdHms(year, 6, 1, 12, 0, 0);
  const cycle = st.getLunarHour().getYearSixtyCycle();
  return buildPillar(
    cycle.getHeavenStem().toString(),
    cycle.getEarthBranch().toString()
  );
}
