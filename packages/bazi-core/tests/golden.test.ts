/**
 * Golden fixture tests for bazi-core.
 *
 * All expected values are cross-validated against tyme4ts (the authoritative
 * calculation library) and verified with bazi-calculator.com.
 *
 * Ground truth collection: debug_tyme.mjs in this package.
 */
import { describe, it, expect } from "vitest";
import { computeChart } from "../src/index.js";
import type { BaziInput } from "../src/index.js";

// ─── Fixture 1: Zhang Wei — the spec's reference chart ────────────────────────
// Born: 1990-05-15, 11:30, Hanoi (longitude 105.85°E, UTC+7)
// Ground truth from tyme4ts:
//   Year:  庚午 (Geng-Wu)
//   Month: 辛巳 (Xin-Si)
//   Day:   庚辰 (Geng-Chen) ← Day Master = 庚 Yang Metal
//   Hour:  壬午 (Ren-Wu)
// Note: The spec example in bazi-app-3.md had an incorrect day pillar (甲午).
// The correct day pillar per tyme4ts is 庚辰.

describe("Fixture 1: Zhang Wei (1990-05-15, 11:30, Hanoi)", () => {
  const input: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: "11:30",
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const result = computeChart(input, "Asia/Ho_Chi_Minh", 420);
  const { chart } = result;

  it("Year pillar is 庚午 (Geng-Wu)", () => {
    expect(chart.yearPillar.stem).toBe("庚");
    expect(chart.yearPillar.branch).toBe("午");
    expect(chart.yearPillar.stemElement).toBe("Metal");
    expect(chart.yearPillar.branchElement).toBe("Fire");
  });

  it("Month pillar is 辛巳 (Xin-Si)", () => {
    expect(chart.monthPillar.stem).toBe("辛");
    expect(chart.monthPillar.branch).toBe("巳");
    expect(chart.monthPillar.stemElement).toBe("Metal");
    expect(chart.monthPillar.branchElement).toBe("Fire");
  });

  it("Day pillar is 庚辰 (Geng-Chen) — tyme4ts ground truth", () => {
    expect(chart.dayPillar.stem).toBe("庚");
    expect(chart.dayPillar.branch).toBe("辰");
  });

  it("Hour pillar is 壬午 (Ren-Wu) for 11:30 local", () => {
    expect(chart.hourPillar).not.toBeNull();
    expect(chart.hourPillar?.stem).toBe("壬");
    expect(chart.hourPillar?.branch).toBe("午");
  });

  it("Day Master is 庚 (Geng Metal, Yang)", () => {
    expect(chart.dayMaster).toBe("庚");
    expect(chart.dayMasterElement).toBe("Metal");
    expect(chart.dayMasterPolarity).toBe("Yang");
  });

  it("Chart mode is four_pillars", () => {
    expect(chart.mode).toBe("four_pillars");
  });

  it("Luck Pillars are generated (8 pillars)", () => {
    expect(chart.luckPillars).toHaveLength(8);
  });

  it("First Luck Pillar starts at a reasonable age (1-15)", () => {
    expect(chart.luckPillars[0]?.startAge).toBeGreaterThanOrEqual(1);
    expect(chart.luckPillars[0]?.startAge).toBeLessThanOrEqual(15);
  });

  it("True Solar Time offset is small and positive (Hanoi near UTC+7 meridian)", () => {
    // Hanoi longitude 105.85° vs standard 105° → small positive offset
    expect(chart.trueSolarOffsetMinutes).toBeGreaterThan(-20);
    expect(chart.trueSolarOffsetMinutes).toBeLessThan(20);
  });

  it("Element balance produces valid percentages (sum ≈ 100)", () => {
    const { elementBalance } = chart;
    const total = elementBalance.Wood + elementBalance.Fire +
                  elementBalance.Earth + elementBalance.Metal + elementBalance.Water;
    expect(total).toBeGreaterThanOrEqual(95);
    expect(total).toBeLessThanOrEqual(105);
  });

  it("Useful God is set to a valid element", () => {
    const validElements = ["Wood", "Fire", "Earth", "Metal", "Water"];
    expect(validElements).toContain(chart.usefulGod);
  });
});

// ─── Fixture 2: Three Pillars mode (no birth time) ───────────────────────────

describe("Fixture 2: Three Pillars mode (no birth time)", () => {
  const input: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: null,
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const result = computeChart(input, "Asia/Ho_Chi_Minh", 420);
  const { chart, warnings } = result;

  it("Mode is three_pillars", () => {
    expect(chart.mode).toBe("three_pillars");
  });

  it("Hour pillar is null", () => {
    expect(chart.hourPillar).toBeNull();
  });

  it("Year, Month, Day pillars are still computed correctly", () => {
    expect(chart.yearPillar.stem).toBe("庚");
    expect(chart.monthPillar.stem).toBe("辛");
    expect(chart.dayPillar.stem).toBe("庚"); // 庚辰 same day
  });

  it("Warnings include Three Pillars notice", () => {
    expect(warnings.some(w => w.includes("Three Pillars"))).toBe(true);
  });
});

// ─── Fixture 3: Year boundary — born before LiChun ───────────────────────────
// tyme4ts ground truth: 1990-02-01 12:00 → Year 己巳

describe("Fixture 3: Pre-LiChun year boundary (born 1990-02-01)", () => {
  const input: BaziInput = {
    birthDate: "1990-02-01",
    birthTime: "12:00",
    birthLocationName: "Beijing, China",
    longitude: 116.4,
    latitude: 39.9,
    gender: "F",
  };

  const result = computeChart(input, "Asia/Shanghai", 480);
  const { chart } = result;

  it("Year pillar is 己巳 (1989 Bazi year, before LiChun)", () => {
    // tyme4ts ground truth: 己巳年
    expect(chart.yearPillar.stem).toBe("己");
    expect(chart.yearPillar.branch).toBe("巳");
  });

  it("Month pillar is 丁丑", () => {
    expect(chart.monthPillar.stem).toBe("丁");
    expect(chart.monthPillar.branch).toBe("丑");
  });
});

// ─── Fixture 4: Zi hour boundary ─────────────────────────────────────────────
// tyme4ts ground truth:
//   22:30 → 庚辰 day, 丁亥 hour
//   23:30 → 辛巳 day (advanced!), 戊子 hour

describe("Fixture 4: Zi hour (23:30) — day advances", () => {
  const inputEarly: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: "22:30",
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const inputLate: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: "23:30",
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const earlyResult = computeChart(inputEarly, "Asia/Ho_Chi_Minh", 420);
  const lateResult = computeChart(inputLate, "Asia/Ho_Chi_Minh", 420);

  it("22:30 is Hai hour (亥时)", () => {
    expect(earlyResult.chart.hourPillar?.branch).toBe("亥");
    expect(earlyResult.chart.hourPillar?.stem).toBe("丁");
  });

  it("23:30 is Zi hour (子时)", () => {
    expect(lateResult.chart.hourPillar?.branch).toBe("子");
    expect(lateResult.chart.hourPillar?.stem).toBe("戊");
  });

  it("Day pillar advances at 23:00 (庚辰 → 辛巳)", () => {
    expect(earlyResult.chart.dayPillar.stem).toBe("庚"); // 庚辰
    expect(earlyResult.chart.dayPillar.branch).toBe("辰");
    expect(lateResult.chart.dayPillar.stem).toBe("辛"); // 辛巳
    expect(lateResult.chart.dayPillar.branch).toBe("巳");
  });
});

// ─── Fixture 5: Western location (negative longitude) ────────────────────────
// tyme4ts ground truth: 1985-03-21 14:00 → 乙丑 year, 己卯 month, 己未 day, 辛未 hour

describe("Fixture 5: Western hemisphere (New York, 1985-03-21, 14:00)", () => {
  const input: BaziInput = {
    birthDate: "1985-03-21",
    birthTime: "14:00",
    birthLocationName: "New York, USA",
    longitude: -74.0,
    latitude: 40.7,
    gender: "F",
  };

  const result = computeChart(input, "America/New_York", -300);
  const { chart } = result;

  it("Year pillar is 乙丑", () => {
    expect(chart.yearPillar.stem).toBe("乙");
    expect(chart.yearPillar.branch).toBe("丑");
  });

  it("Month pillar is 己卯", () => {
    expect(chart.monthPillar.stem).toBe("己");
    expect(chart.monthPillar.branch).toBe("卯");
  });

  it("Day pillar is 己未", () => {
    expect(chart.dayPillar.stem).toBe("己");
    expect(chart.dayPillar.branch).toBe("未");
  });

  it("Hour pillar is 辛未 (14:00 = 未时)", () => {
    expect(chart.hourPillar?.stem).toBe("辛");
    expect(chart.hourPillar?.branch).toBe("未");
  });

  it("True Solar Time offset is small for NYC (near UTC-5 standard meridian)", () => {
    expect(Math.abs(chart.trueSolarOffsetMinutes)).toBeLessThan(20);
  });
});

// ─── Fixture 6: Ten Gods validation ──────────────────────────────────────────
// For the Zhang Wei chart — Day Master is 庚 (Yang Metal):
//   Year stem 庚 (Yang Metal) — same element, same polarity as DM → 比肩 (Friend)
//   Month stem 辛 (Yin Metal) — same element, opposite polarity → 劫财 (Rob Wealth)
//   Hour stem 壬 (Yang Water) — DM produces Water (Metal→Water), same polarity → 食神 (Eating God)

describe("Fixture 6: Ten Gods for Zhang Wei chart (庚 Metal DM)", () => {
  const input: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: "11:30",
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const result = computeChart(input, "Asia/Ho_Chi_Minh", 420);
  const { tenGods } = result.chart;

  it("庚 (Metal, Yang) vs 庚 (Metal, Yang) DM = 比肩 (Friend)", () => {
    expect(tenGods.yearStem).toBe("比肩");
  });

  it("辛 (Metal, Yin) vs 庚 (Metal, Yang) DM = 劫财 (Rob Wealth)", () => {
    expect(tenGods.monthStem).toBe("劫财");
  });

  it("壬 (Water, Yang) — Metal produces Water, same polarity → 食神 (Eating God)", () => {
    // 庚 Metal DM. Metal produces Water. Same polarity (Yang) → 食神
    expect(tenGods.hourStem).toBe("食神");
  });

  it("Day stem Ten God is null (Day Master has no self relationship)", () => {
    expect(tenGods.dayStem).toBeNull();
  });
});

// ─── Fixture 7: Hidden stems validation ──────────────────────────────────────

describe("Fixture 7: Hidden stems of Zhang Wei chart", () => {
  const input: BaziInput = {
    birthDate: "1990-05-15",
    birthTime: "11:30",
    birthLocationName: "Hanoi, Vietnam",
    longitude: 105.85,
    latitude: 21.03,
    gender: "M",
  };

  const result = computeChart(input, "Asia/Ho_Chi_Minh", 420);
  const { chart } = result;

  it("Year branch 午 has hidden stems [丁, 己]", () => {
    expect(chart.yearPillar.hiddenStems).toEqual(["丁", "己"]);
  });

  it("Month branch 巳 has hidden stems [丙, 庚, 戊]", () => {
    expect(chart.monthPillar.hiddenStems).toEqual(["丙", "庚", "戊"]);
  });

  it("Day branch 辰 has hidden stems [戊, 乙, 癸]", () => {
    expect(chart.dayPillar.hiddenStems).toEqual(["戊", "乙", "癸"]);
  });

  it("Hour branch 午 has hidden stems [丁, 己]", () => {
    expect(chart.hourPillar?.hiddenStems).toEqual(["丁", "己"]);
  });
});
