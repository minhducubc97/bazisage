/**
 * Branch and Stem Interactions
 * Detects: Clash (冲), Combination (合), Penalty (刑), Harm (害), Destruction (破)
 *
 * Used for personal day alerts, compatibility analysis, and annual chart interactions.
 */
import type { EarthlyBranch, HeavenlyStem, ChartInteraction, InteractionType } from "./types.js";
import {
  BRANCH_CLASHES, BRANCH_THREE_COMBOS, BRANCH_HALF_COMBOS,
  BRANCH_SIX_COMBOS, BRANCH_PENALTIES, BRANCH_HARMS,
  BRANCH_DESTRUCTIONS, STEM_COMBOS,
} from "./tables.js";

/**
 * Check if two branches clash (六冲).
 */
export function checkClash(
  a: EarthlyBranch,
  b: EarthlyBranch
): ChartInteraction | null {
  for (const [x, y] of BRANCH_CLASHES) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return {
        type: "clash",
        elements: [a, b],
        description: `${a}${b} 相冲 (Six Clash)`,
        severity: 4,
      };
    }
  }
  return null;
}

/**
 * Check for Branch Three-Combination (三合) given a set of branches.
 * Returns all detected combos.
 */
export function checkThreeCombos(branches: EarthlyBranch[]): ChartInteraction[] {
  const results: ChartInteraction[] = [];
  const set = new Set(branches);
  for (const combo of BRANCH_THREE_COMBOS) {
    if (combo.branches.every(b => set.has(b))) {
      results.push({
        type: "combination",
        elements: [...combo.branches],
        description: `${combo.branches.join("")} 三合 → ${combo.element}`,
        severity: 3,
      });
    }
  }
  return results;
}

/**
 * Check for Half Three-Combination (半三合) between two branches.
 */
export function checkHalfCombos(
  a: EarthlyBranch,
  b: EarthlyBranch
): ChartInteraction[] {
  const results: ChartInteraction[] = [];
  for (const combo of BRANCH_HALF_COMBOS) {
    const [x, y] = combo.branches;
    if ((a === x && b === y) || (a === y && b === x)) {
      results.push({
        type: "half_combo",
        elements: [a, b],
        description: `${a}${b} 半三合 → ${combo.element}`,
        severity: 2,
      });
    }
  }
  return results;
}

/**
 * Check for Branch Six-Combination (六合) between two branches.
 */
export function checkSixCombo(
  a: EarthlyBranch,
  b: EarthlyBranch
): ChartInteraction | null {
  for (const combo of BRANCH_SIX_COMBOS) {
    const [x, y] = combo.branches;
    if ((a === x && b === y) || (a === y && b === x)) {
      return {
        type: "combination",
        elements: [a, b],
        description: `${a}${b} 六合 → ${combo.element}`,
        severity: 2,
      };
    }
  }
  return null;
}

/**
 * Check for Penalties (刑) given a set of branches.
 */
export function checkPenalties(branches: EarthlyBranch[]): ChartInteraction[] {
  const results: ChartInteraction[] = [];
  const set = new Set(branches);

  for (const penalty of BRANCH_PENALTIES) {
    if (penalty.kind === "self") {
      // Self-penalty: same branch appears twice
      const branch = penalty.branches[0]!;
      const count = branches.filter(b => b === branch).length;
      if (count >= 2) {
        results.push({
          type: "penalty",
          elements: [branch, branch],
          description: `${branch}${branch} 自刑 (Self Penalty)`,
          severity: 3,
        });
      }
    } else {
      // Mutual penalty: all branches of the group present
      if (penalty.branches.every(b => set.has(b))) {
        results.push({
          type: "penalty",
          elements: [...penalty.branches],
          description: `${penalty.branches.join("")} 三刑 (${penalty.kind === "mutual" ? "Mutual" : "Ungrateful"} Penalty)`,
          severity: 4,
        });
      }
    }
  }
  return results;
}

/**
 * Check for Harm (害) between two branches.
 */
export function checkHarm(
  a: EarthlyBranch,
  b: EarthlyBranch
): ChartInteraction | null {
  for (const [x, y] of BRANCH_HARMS) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return {
        type: "harm",
        elements: [a, b],
        description: `${a}${b} 相害 (Harm)`,
        severity: 2,
      };
    }
  }
  return null;
}

/**
 * Check for Destruction (破) between two branches.
 */
export function checkDestruction(
  a: EarthlyBranch,
  b: EarthlyBranch
): ChartInteraction | null {
  for (const [x, y] of BRANCH_DESTRUCTIONS) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return {
        type: "destruction",
        elements: [a, b],
        description: `${a}${b} 相破 (Destruction)`,
        severity: 2,
      };
    }
  }
  return null;
}

/**
 * Check for Heavenly Stem Combination (天干五合) between two stems.
 */
export function checkStemCombo(
  a: HeavenlyStem,
  b: HeavenlyStem
): ChartInteraction | null {
  for (const combo of STEM_COMBOS) {
    const [x, y] = combo.stems;
    if ((a === x && b === y) || (a === y && b === x)) {
      return {
        type: "combination",
        elements: [a, b],
        description: `${a}${b} 天干合 → ${combo.result}`,
        severity: 2,
      };
    }
  }
  return null;
}

/**
 * Find ALL interactions between a set of chart branches and a single incoming branch.
 * Used for personal day alert detection.
 */
export function findBranchInteractions(
  chartBranches: EarthlyBranch[],
  incomingBranch: EarthlyBranch
): ChartInteraction[] {
  const results: ChartInteraction[] = [];

  for (const cb of chartBranches) {
    const clash = checkClash(cb, incomingBranch);
    if (clash) results.push(clash);

    const sixCombo = checkSixCombo(cb, incomingBranch);
    if (sixCombo) results.push(sixCombo);

    const halfCombos = checkHalfCombos(cb, incomingBranch);
    results.push(...halfCombos);

    const harm = checkHarm(cb, incomingBranch);
    if (harm) results.push(harm);

    const dest = checkDestruction(cb, incomingBranch);
    if (dest) results.push(dest);
  }

  // Check three-way combinations
  const allBranches = [...chartBranches, incomingBranch];
  const threeCombos = checkThreeCombos(allBranches);
  results.push(...threeCombos);

  // Check penalties
  const penalties = checkPenalties(allBranches);
  results.push(...penalties);

  return results;
}
