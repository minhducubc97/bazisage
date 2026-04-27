/**
 * Useful God (用神) determination heuristics.
 *
 * The Useful God is the most beneficial element for the day master,
 * determined by assessing the chart's elemental imbalance:
 *
 * - Strong DM: needs to be weakened → Output (produces DM's enemy) or
 *              Wealth (DM controls) or Power (controls DM) elements
 * - Weak DM: needs to be strengthened → Resource (produces DM) or
 *            Friend (same element as DM) elements
 * - Balanced: focus on suppressing excess, supporting what's lacking
 *
 * This is a simplified heuristic — real classical analysis is more nuanced
 * and considers many special chart structures (從格, 化氣格, etc.).
 */
import type { Element, DayMasterStrength, ElementBalance } from "./types.js";
import { PRODUCES, CONTROLLED_BY } from "./tables.js";

/** Inverse of PRODUCES: returns the element that produces `target`. */
function producerOf(target: Element): Element | undefined {
  return (Object.entries(PRODUCES) as [Element, Element][])
    .find(([, t]) => t === target)?.[0];
}

/**
 * Determine the Useful God element and an adverse element.
 *
 * @param dmElement - Day Master's element
 * @param strength - DM strength classification
 * @param balance - Five element balance percentages
 */
export function determineUsefulGod(
  dmElement: Element,
  strength: DayMasterStrength,
  balance: ElementBalance
): { usefulGod: Element; adverseElement: Element | null } {
  if (strength === "Weak") {
    // Weak DM needs support:
    // 1. Resource element (produces DM) — most helpful
    // 2. Companion element (same as DM) — parallel support
    // Adverse: element that the DM controls (wealth drains a weak DM further)
    const resourceElement = producerOf(dmElement);

    return {
      usefulGod: resourceElement ?? dmElement,
      adverseElement: CONTROLLED_BY[dmElement] ?? null,
    };
  }

  if (strength === "Strong") {
    // Strong DM needs restraint:
    // 1. Output element (DM produces this) — drains excess energy productively
    // 2. Wealth element (DM controls) — gives DM a focus
    // Adverse: Resource element (further strengthens already-strong DM)
    return {
      usefulGod: PRODUCES[dmElement],
      adverseElement: producerOf(dmElement) ?? null,
    };
  }

  // Balanced: find the most lacking element as the useful god
  const sorted = (Object.entries(balance) as [Element, number][])
    .sort((a, b) => a[1] - b[1]);

  // Most lacking element that isn't the day master itself
  const lacking = sorted.find(([el]) => el !== dmElement)?.[0] ?? dmElement;
  const excess = sorted[sorted.length - 1]?.[0] ?? null;

  return {
    usefulGod: lacking,
    adverseElement: excess === lacking ? null : (excess ?? null),
  };
}

// Re-export for convenience
export { PRODUCES, CONTROLLED_BY };
