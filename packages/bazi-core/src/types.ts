/**
 * BaziSage — Core Type Definitions
 * All fundamental types for the Bazi calculation engine.
 */

// ─── Stems & Branches ─────────────────────────────────────────────────────────

/** The 10 Heavenly Stems (天干) */
export type HeavenlyStem =
  | "甲" | "乙" | "丙" | "丁" | "戊"
  | "己" | "庚" | "辛" | "壬" | "癸";

/** The 12 Earthly Branches (地支) */
export type EarthlyBranch =
  | "子" | "丑" | "寅" | "卯" | "辰" | "巳"
  | "午" | "未" | "申" | "酉" | "戌" | "亥";

/** The 5 Elements (五行) */
export type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

/** Stem polarity */
export type Polarity = "Yang" | "Yin";

/** Day Master strength assessment */
export type DayMasterStrength = "Strong" | "Balanced" | "Weak";

/** Gender — used for Luck Pillar direction calculation */
export type Gender = "M" | "F";

/** Chart mode — Four Pillars (with hour) or Three Pillars (hour unknown) */
export type ChartMode = "four_pillars" | "three_pillars";

// ─── Stem/Branch Info ─────────────────────────────────────────────────────────

export interface StemInfo {
  stem: HeavenlyStem;
  element: Element;
  polarity: Polarity;
  romanization: string;       // e.g. "Jiǎ"
  englishName: string;        // e.g. "Yang Wood"
  season: string;
  direction: string;
}

export interface BranchInfo {
  branch: EarthlyBranch;
  element: Element;
  polarity: Polarity;
  romanization: string;
  animalSign: string;         // e.g. "Tiger"
  monthIndex: number;         // 1-12 (1=寅 month)
  hourRange: string;          // e.g. "23:00-01:00"
  hiddenStems: HeavenlyStem[]; // main stem first
}

// ─── Pillar ───────────────────────────────────────────────────────────────────

export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  hiddenStems: HeavenlyStem[];
  /** Stem element */
  stemElement: Element;
  /** Branch element (primary) */
  branchElement: Element;
}

export interface HourPillar extends Pillar {
  hourBranchIndex: number; // 0-11 (子=0)
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export interface BaziInput {
  /** ISO date string: YYYY-MM-DD (local calendar date) */
  birthDate: string;
  /** HH:MM string in local time, null for Three Pillars mode */
  birthTime: string | null;
  /** City name for display */
  birthLocationName: string;
  /** Decimal degrees East (+) or West (-). Used for True Solar Time. */
  longitude: number;
  /** Decimal degrees North (+) or South (-) */
  latitude: number;
  gender: Gender;
}

export interface BaziChart {
  input: BaziInput;
  mode: ChartMode;

  /** True Solar Time corrected birth time (minutes offset from local standard) */
  trueSolarOffsetMinutes: number;
  /** The corrected birth datetime used for calculations (ISO string, UTC) */
  calculationDatetime: string;

  /** The four (or three) pillars */
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null; // null in Three Pillars mode

  /** Day Master = stem of Day Pillar */
  dayMaster: HeavenlyStem;
  dayMasterElement: Element;
  dayMasterPolarity: Polarity;
  dayMasterStrength: DayMasterStrength;

  /** Five element balance across all stems + hidden stems (0-100, sums to 100) */
  elementBalance: ElementBalance;

  /** Ten Gods profile keyed by pillar position */
  tenGods: TenGodsProfile;

  /** Useful God (用神) — the element that most benefits/supports the chart */
  usefulGod: Element;
  /** Unfavorable element */
  adverseElement: Element | null;

  /** Current 10-year Luck Pillar cycle */
  luckPillars: LuckPillar[];

  /** Annual pillars for reference years */
  annualPillars: AnnualPillar[];
}

// ─── Element Balance ──────────────────────────────────────────────────────────

export interface ElementBalance {
  Wood: number;   // 0-100 percentage
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

// ─── Ten Gods ─────────────────────────────────────────────────────────────────

/**
 * Ten Gods (十神) express the relationship between each stem in the chart
 * and the Day Master (self).
 */
export type TenGod =
  | "比肩" // Friend/Companion (same element, same polarity)
  | "劫财" // Rob Wealth (same element, opposite polarity)
  | "食神" // Eating God / Output (DM produces, same polarity)
  | "伤官" // Hurting Officer / Output (DM produces, opposite polarity)
  | "偏财" // Indirect Wealth (DM controls, same polarity)
  | "正财" // Direct Wealth (DM controls, opposite polarity)
  | "七杀" // Seven Killings / Power (controls DM, same polarity)
  | "正官" // Direct Officer / Power (controls DM, opposite polarity)
  | "偏印" // Indirect Resource (produces DM, same polarity)
  | "正印"; // Direct Resource (produces DM, opposite polarity)

export const TEN_GOD_EN: Record<TenGod, string> = {
  "比肩": "Friend",
  "劫财": "Rob Wealth",
  "食神": "Eating God",
  "伤官": "Hurting Officer",
  "偏财": "Indirect Wealth",
  "正财": "Direct Wealth",
  "七杀": "Seven Killings",
  "正官": "Direct Officer",
  "偏印": "Indirect Resource",
  "正印": "Direct Resource",
};

export interface TenGodsProfile {
  yearStem: TenGod | null;
  monthStem: TenGod | null;
  dayStem: null; // Day stem IS the Day Master — no Ten God applies
  hourStem: TenGod | null;
  // Hidden stems within each branch also get Ten Gods
  yearBranchHidden: TenGod[];
  monthBranchHidden: TenGod[];
  dayBranchHidden: TenGod[];
  hourBranchHidden: TenGod[];
}

// ─── 12 Growth Stages (长生十二宫) ───────────────────────────────────────────

export type GrowthStage =
  | "长生" // Chang Sheng — Birth/Growth
  | "沐浴" // Mu Yu — Bath
  | "冠带" // Guan Dai — Adornment
  | "临官" // Lin Guan — Official
  | "帝旺" // Di Wang — Emperor/Peak
  | "衰"   // Shuai — Decline
  | "病"   // Bing — Sickness
  | "死"   // Si — Death
  | "墓"   // Mu — Tomb/Vault
  | "绝"   // Jue — Cessation
  | "胎"   // Tai — Embryo
  | "养"; // Yang — Nurturing

// ─── Luck Pillars (大运) ──────────────────────────────────────────────────────

export interface LuckPillar {
  pillar: Pillar;
  startAge: number;       // age in years when this luck pillar activates
  startYear: number;      // calendar year of activation
  endAge: number;
  /** Growth stage of Day Master's element in this luck pillar's branch */
  dayMasterGrowthStage: GrowthStage;
}

// ─── Annual Pillars ───────────────────────────────────────────────────────────

export interface AnnualPillar {
  year: number;
  pillar: Pillar;
  /** Interactions with the natal chart */
  interactions: ChartInteraction[];
}

// ─── Interactions (Clash, Combo, Penalty, Harm) ───────────────────────────────

export type InteractionType =
  | "clash"         // 冲 (liù chōng — 6 clashes between branches)
  | "combination"   // 合 (branch 3-combo, 6-combo, or stem 5-combo)
  | "penalty"       // 刑 (xíng — punishments)
  | "harm"          // 害 (hài — harms/hurts)
  | "half_combo"    // 半合 (half three-combination)
  | "destruction";  // 破 (pò — destruction)

export interface ChartInteraction {
  type: InteractionType;
  elements: (HeavenlyStem | EarthlyBranch)[];
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
}

// ─── Input/Output helpers ─────────────────────────────────────────────────────

export interface ChartComputeResult {
  chart: BaziChart;
  /** Any warnings (e.g., missing hour, longitude approximated) */
  warnings: string[];
}
