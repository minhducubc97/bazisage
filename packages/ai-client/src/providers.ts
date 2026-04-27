/**
 * BaziSage AI Client — provider-agnostic wrapper
 *
 * Defaults to DeepSeek V3 (cheap, high quality). Swap providers by
 * setting AI_PROVIDER env var: "deepseek" | "claude" | "grok" | "openai"
 *
 * All providers exposed through a single unified interface via Vercel AI SDK.
 */

import { createDeepSeek } from "@ai-sdk/deepseek";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";

export type AIProvider = "deepseek" | "claude" | "grok" | "openai";

// ─── Model IDs ────────────────────────────────────────────────────────────────

const MODELS: Record<AIProvider, { main: string; fast: string }> = {
  deepseek: {
    main: "deepseek-chat",       // DeepSeek V3 — main readings + chat
    fast: "deepseek-chat",       // same model, cheaper than claude haiku
  },
  claude: {
    main: "claude-sonnet-4-5",   // Claude Sonnet — best persona maintenance
    fast: "claude-haiku-4-5",    // Claude Haiku — fast/cheap for templates
  },
  grok: {
    main: "grok-3",              // Grok 3
    fast: "grok-3-mini",         // Grok 3 Mini — fast tasks
  },
  openai: {
    main: "gpt-4o",
    fast: "gpt-4o-mini",
  },
};

// ─── Provider factory ─────────────────────────────────────────────────────────

export function getModel(tier: "main" | "fast" = "main"): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "deepseek") as AIProvider;
  const modelId = MODELS[provider]?.[tier] ?? MODELS.deepseek[tier];

  switch (provider) {
    case "deepseek": {
      const deepseek = createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY!,
      });
      return deepseek(modelId);
    }
    case "claude": {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });
      return anthropic(modelId);
    }
    case "grok": {
      const xai = createXai({
        apiKey: process.env.XAI_API_KEY!,
      });
      return xai(modelId);
    }
    default: {
      // Fallback: DeepSeek
      const deepseek = createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY ?? process.env.ANTHROPIC_API_KEY!,
      });
      return deepseek("deepseek-chat");
    }
  }
}
