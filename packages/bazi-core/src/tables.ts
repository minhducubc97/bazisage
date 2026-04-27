/**
 * Static lookup tables for all Heavenly Stems, Earthly Branches,
 * and derived relationships. These are pure data — no calculation logic here.
 */
import type {
  HeavenlyStem, EarthlyBranch, Element, Polarity,
  StemInfo, BranchInfo, GrowthStage,
} from "./types.js";

// ─── Heavenly Stems ───────────────────────────────────────────────────────────

export const STEMS: HeavenlyStem[] = [
  "甲","乙","丙","丁","戊","己","庚","辛","壬","癸"
];

export const STEM_INFO: Record<HeavenlyStem, StemInfo> = {
  "甲": { stem: "甲", element: "Wood",  polarity: "Yang", romanization: "Jiǎ", englishName: "Yang Wood",  season: "Spring", direction: "East" },
  "乙": { stem: "乙", element: "Wood",  polarity: "Yin",  romanization: "Yǐ",  englishName: "Yin Wood",   season: "Spring", direction: "East" },
  "丙": { stem: "丙", element: "Fire",  polarity: "Yang", romanization: "Bǐng",englishName: "Yang Fire",  season: "Summer", direction: "South" },
  "丁": { stem: "丁", element: "Fire",  polarity: "Yin",  romanization: "Dīng",englishName: "Yin Fire",   season: "Summer", direction: "South" },
  "戊": { stem: "戊", element: "Earth", polarity: "Yang", romanization: "Wù",  englishName: "Yang Earth", season: "All",    direction: "Center" },
  "己": { stem: "己", element: "Earth", polarity: "Yin",  romanization: "Jǐ",  englishName: "Yin Earth",  season: "All",    direction: "Center" },
  "庚": { stem: "庚", element: "Metal", polarity: "Yang", romanization: "Gēng",englishName: "Yang Metal", season: "Autumn", direction: "West" },
  "辛": { stem: "辛", element: "Metal", polarity: "Yin",  romanization: "Xīn", englishName: "Yin Metal",  season: "Autumn", direction: "West" },
  "壬": { stem: "壬", element: "Water", polarity: "Yang", romanization: "Rén", englishName: "Yang Water", season: "Winter", direction: "North" },
  "癸": { stem: "癸", element: "Water", polarity: "Yin",  romanization: "Guǐ",englishName: "Yin Water",  season: "Winter", direction: "North" },
};

// ─── Earthly Branches ─────────────────────────────────────────────────────────

export const BRANCHES: EarthlyBranch[] = [
  "子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"
];

/**
 * Hidden stems within each Earthly Branch.
 * Order: [main stem, secondary stem?, tertiary stem?]
 * Main stem carries ~70% energy, secondary ~20%, tertiary ~10%.
 */
export const HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"],
};

export const BRANCH_INFO: Record<EarthlyBranch, BranchInfo> = {
  "子": { branch: "子", element: "Water", polarity: "Yang", romanization: "Zǐ",  animalSign: "Rat",     monthIndex: 11, hourRange: "23:00-01:00", hiddenStems: HIDDEN_STEMS["子"] },
  "丑": { branch: "丑", element: "Earth", polarity: "Yin",  romanization: "Chǒu",animalSign: "Ox",      monthIndex: 12, hourRange: "01:00-03:00", hiddenStems: HIDDEN_STEMS["丑"] },
  "寅": { branch: "寅", element: "Wood",  polarity: "Yang", romanization: "Yín", animalSign: "Tiger",   monthIndex: 1,  hourRange: "03:00-05:00", hiddenStems: HIDDEN_STEMS["寅"] },
  "卯": { branch: "卯", element: "Wood",  polarity: "Yin",  romanization: "Mǎo", animalSign: "Rabbit",  monthIndex: 2,  hourRange: "05:00-07:00", hiddenStems: HIDDEN_STEMS["卯"] },
  "辰": { branch: "辰", element: "Earth", polarity: "Yang", romanization: "Chén",animalSign: "Dragon",  monthIndex: 3,  hourRange: "07:00-09:00", hiddenStems: HIDDEN_STEMS["辰"] },
  "巳": { branch: "巳", element: "Fire",  polarity: "Yin",  romanization: "Sì",  animalSign: "Snake",   monthIndex: 4,  hourRange: "09:00-11:00", hiddenStems: HIDDEN_STEMS["巳"] },
  "午": { branch: "午", element: "Fire",  polarity: "Yang", romanization: "Wǔ",  animalSign: "Horse",   monthIndex: 5,  hourRange: "11:00-13:00", hiddenStems: HIDDEN_STEMS["午"] },
  "未": { branch: "未", element: "Earth", polarity: "Yin",  romanization: "Wèi", animalSign: "Goat",    monthIndex: 6,  hourRange: "13:00-15:00", hiddenStems: HIDDEN_STEMS["未"] },
  "申": { branch: "申", element: "Metal", polarity: "Yang", romanization: "Shēn",animalSign: "Monkey",  monthIndex: 7,  hourRange: "15:00-17:00", hiddenStems: HIDDEN_STEMS["申"] },
  "酉": { branch: "酉", element: "Metal", polarity: "Yin",  romanization: "Yǒu", animalSign: "Rooster", monthIndex: 8,  hourRange: "17:00-19:00", hiddenStems: HIDDEN_STEMS["酉"] },
  "戌": { branch: "戌", element: "Earth", polarity: "Yang", romanization: "Xū",  animalSign: "Dog",     monthIndex: 9,  hourRange: "19:00-21:00", hiddenStems: HIDDEN_STEMS["戌"] },
  "亥": { branch: "亥", element: "Water", polarity: "Yin",  romanization: "Hài", animalSign: "Pig",     monthIndex: 10, hourRange: "21:00-23:00", hiddenStems: HIDDEN_STEMS["亥"] },
};

// ─── 60 Jiǎzǐ cycle ───────────────────────────────────────────────────────────

/** Returns the 60-cycle index (0-59) from stem index (0-9) and branch index (0-11). */
export function jiaziBIndex(stemIdx: number, branchIdx: number): number {
  return (stemIdx * 6 + branchIdx * 5) % 60;
}

/** Index of a stem in STEMS array (0-9) */
export function stemIndex(s: HeavenlyStem): number {
  return STEMS.indexOf(s);
}

/** Index of a branch in BRANCHES array (0-11) */
export function branchIndex(b: EarthlyBranch): number {
  return BRANCHES.indexOf(b);
}

// ─── Element relationships ────────────────────────────────────────────────────

/** Production cycle: Wood→Fire→Earth→Metal→Water→Wood */
export const PRODUCES: Record<Element, Element> = {
  Wood: "Fire", Fire: "Earth", Earth: "Metal", Metal: "Water", Water: "Wood",
};

/** Control/Overcome cycle: Wood→Earth→Water→Fire→Metal→Wood */
export const CONTROLS: Record<Element, Element> = {
  Wood: "Earth", Earth: "Water", Water: "Fire", Fire: "Metal", Metal: "Wood",
};

/** What element produces this element (inverse of PRODUCES) */
export const PRODUCED_BY: Record<Element, Element> = {
  Fire: "Wood", Earth: "Fire", Metal: "Earth", Water: "Metal", Wood: "Water",
};

/** What element this element is controlled by (inverse of CONTROLS) */
export const CONTROLLED_BY: Record<Element, Element> = {
  Earth: "Wood", Water: "Earth", Fire: "Water", Metal: "Fire", Wood: "Metal",
};

// ─── 12 Growth Stages per element ─────────────────────────────────────────────

/**
 * For each element (Yang polarity), the Growth Stage in each branch.
 * Yin elements use reversed polarity (their strong positions are offset).
 *
 * Lookup: GROWTH_STAGES_YANG[element][branch] = GrowthStage
 */
export const GROWTH_STAGES_YANG: Record<Element, Record<EarthlyBranch, GrowthStage>> = {
  Wood: {
    "亥": "长生", "子": "沐浴", "丑": "冠带", "寅": "临官", "卯": "帝旺",
    "辰": "衰",   "巳": "病",   "午": "死",   "未": "墓",   "申": "绝",
    "酉": "胎",   "戌": "养",
  },
  Fire: {
    "寅": "长生", "卯": "沐浴", "辰": "冠带", "巳": "临官", "午": "帝旺",
    "未": "衰",   "申": "病",   "酉": "死",   "戌": "墓",   "亥": "绝",
    "子": "胎",   "丑": "养",
  },
  Earth: {
    "寅": "长生", "卯": "沐浴", "辰": "冠带", "巳": "临官", "午": "帝旺",
    "未": "衰",   "申": "病",   "酉": "死",   "戌": "墓",   "亥": "绝",
    "子": "胎",   "丑": "养",
  },
  Metal: {
    "巳": "长生", "午": "沐浴", "未": "冠带", "申": "临官", "酉": "帝旺",
    "戌": "衰",   "亥": "病",   "子": "死",   "丑": "墓",   "寅": "绝",
    "卯": "胎",   "辰": "养",
  },
  Water: {
    "申": "长生", "酉": "沐浴", "戌": "冠带", "亥": "临官", "子": "帝旺",
    "丑": "衰",   "寅": "病",   "卯": "死",   "辰": "墓",   "巳": "绝",
    "午": "胎",   "未": "养",
  },
};

/**
 * Yin-polarity elements have inverted growth stage direction.
 * In the classical system, Yin elements start from 午 (for Wood) vs 亥 (for Yang Wood).
 * We compute this by reversing the branch sequence from the Yang starting point.
 */
export function getGrowthStage(
  element: Element,
  polarity: Polarity,
  branch: EarthlyBranch
): GrowthStage {
  if (polarity === "Yang") {
    return GROWTH_STAGES_YANG[element][branch];
  }
  // Yin elements: same cycle but starting from the opposite direction
  // The Yin element's 长生 is in the branch diametrically opposite to Yang's 死
  // In practice: find where Yang has 死, the Yin 长生 starts there
  const GROWTH_STAGES_YIN: Record<Element, Record<EarthlyBranch, GrowthStage>> = {
    Wood: {
      "午": "长生", "巳": "沐浴", "辰": "冠带", "卯": "临官", "寅": "帝旺",
      "丑": "衰",   "子": "病",   "亥": "死",   "戌": "墓",   "酉": "绝",
      "申": "胎",   "未": "养",
    },
    Fire: {
      "酉": "长生", "申": "沐浴", "未": "冠带", "午": "临官", "巳": "帝旺",
      "辰": "衰",   "卯": "病",   "寅": "死",   "丑": "墓",   "子": "绝",
      "亥": "胎",   "戌": "养",
    },
    Earth: {
      "酉": "长生", "申": "沐浴", "未": "冠带", "午": "临官", "巳": "帝旺",
      "辰": "衰",   "卯": "病",   "寅": "死",   "丑": "墓",   "子": "绝",
      "亥": "胎",   "戌": "养",
    },
    Metal: {
      "子": "长生", "亥": "沐浴", "戌": "冠带", "酉": "临官", "申": "帝旺",
      "未": "衰",   "午": "病",   "巳": "死",   "辰": "墓",   "卯": "绝",
      "寅": "胎",   "丑": "养",
    },
    Water: {
      "卯": "长生", "寅": "沐浴", "丑": "冠带", "子": "临官", "亥": "帝旺",
      "戌": "衰",   "酉": "病",   "申": "死",   "未": "墓",   "午": "绝",
      "巳": "胎",   "辰": "养",
    },
  };
  return GROWTH_STAGES_YIN[element][branch];
}

/** Growth stage strength score (higher = stronger for Day Master) */
export const GROWTH_STAGE_STRENGTH: Record<GrowthStage, number> = {
  "帝旺": 10, "临官": 9, "长生": 7, "冠带": 6, "沐浴": 5,
  "养":   4,  "胎":   3, "衰":   2, "病":   1, "死":   0,
  "墓":   1,  "绝":   0,
};

// ─── Branch clash / combination tables ───────────────────────────────────────

/** Six Clashes (六冲): pairs that clash with each other */
export const BRANCH_CLASHES: [EarthlyBranch, EarthlyBranch][] = [
  ["子", "午"], // Rat-Horse
  ["丑", "未"], // Ox-Goat
  ["寅", "申"], // Tiger-Monkey
  ["卯", "酉"], // Rabbit-Rooster
  ["辰", "戌"], // Dragon-Dog
  ["巳", "亥"], // Snake-Pig
];

/** Three Combinations (三合): form a strong element combination */
export const BRANCH_THREE_COMBOS: { branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch]; element: Element }[] = [
  { branches: ["申", "子", "辰"], element: "Water" },
  { branches: ["亥", "卯", "未"], element: "Wood"  },
  { branches: ["寅", "午", "戌"], element: "Fire"  },
  { branches: ["巳", "酉", "丑"], element: "Metal" },
];

/** Half Three-Combinations (半三合) — two of the three */
export const BRANCH_HALF_COMBOS: { branches: [EarthlyBranch, EarthlyBranch]; element: Element }[] = [
  { branches: ["申", "子"], element: "Water" },
  { branches: ["子", "辰"], element: "Water" },
  { branches: ["亥", "卯"], element: "Wood"  },
  { branches: ["卯", "未"], element: "Wood"  },
  { branches: ["寅", "午"], element: "Fire"  },
  { branches: ["午", "戌"], element: "Fire"  },
  { branches: ["巳", "酉"], element: "Metal" },
  { branches: ["酉", "丑"], element: "Metal" },
];

/** Six Combinations (六合): pairs that harmoniously combine */
export const BRANCH_SIX_COMBOS: { branches: [EarthlyBranch, EarthlyBranch]; element: Element }[] = [
  { branches: ["子", "丑"], element: "Earth" },
  { branches: ["寅", "亥"], element: "Wood"  },
  { branches: ["卯", "戌"], element: "Fire"  },
  { branches: ["辰", "酉"], element: "Metal" },
  { branches: ["巳", "申"], element: "Water" },
  { branches: ["午", "未"], element: "Fire"  }, // some schools say Earth
];

/** Punishments (刑): Self-penalty or mutual penalty */
export const BRANCH_PENALTIES: { branches: EarthlyBranch[]; kind: "self" | "mutual" | "ungrateful" }[] = [
  { branches: ["子", "卯"], kind: "mutual"     }, // Rat-Rabbit: Li-Xing (无礼之刑)
  { branches: ["寅", "巳", "申"], kind: "ungrateful" }, // Tiger-Snake-Monkey: Chi-Shi (恃势之刑)
  { branches: ["丑", "戌", "未"], kind: "ungrateful" }, // Ox-Dog-Goat: Wu-En (无恩之刑)
  { branches: ["辰"], kind: "self"        }, // Dragon self-penalty
  { branches: ["午"], kind: "self"        }, // Horse self-penalty
  { branches: ["酉"], kind: "self"        }, // Rooster self-penalty
  { branches: ["亥"], kind: "self"        }, // Pig self-penalty
];

/** Harms (害): pairs that harm each other */
export const BRANCH_HARMS: [EarthlyBranch, EarthlyBranch][] = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"],
  ["卯", "辰"], ["申", "亥"], ["酉", "戌"],
];

/** Destructions (破): pairs that destroy each other */
export const BRANCH_DESTRUCTIONS: [EarthlyBranch, EarthlyBranch][] = [
  ["子", "酉"], ["丑", "辰"], ["寅", "亥"],
  ["卯", "午"], ["巳", "申"], ["未", "戌"],
];

/** Heavenly Stem Five Combinations (天干五合) — combine to form a new element */
export const STEM_COMBOS: { stems: [HeavenlyStem, HeavenlyStem]; result: Element }[] = [
  { stems: ["甲", "己"], result: "Earth" },
  { stems: ["乙", "庚"], result: "Metal" },
  { stems: ["丙", "辛"], result: "Water" },
  { stems: ["丁", "壬"], result: "Wood"  },
  { stems: ["戊", "癸"], result: "Fire"  },
];

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function stemElement(s: HeavenlyStem): Element {
  return STEM_INFO[s].element;
}

export function stemPolarity(s: HeavenlyStem): Polarity {
  return STEM_INFO[s].polarity;
}

export function branchElement(b: EarthlyBranch): Element {
  return BRANCH_INFO[b].element;
}
