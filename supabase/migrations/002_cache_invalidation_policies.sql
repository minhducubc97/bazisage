-- ────────────────────────────────────────────────────────────────────────────
-- Migration 002: Cache invalidation policies
--
-- The original schema only granted SELECT on `readings`, `personal_day_alerts`,
-- and `monthly_briefings` — meaning owners could not delete their own cached
-- AI-generated content. The chart-recompute route worked around this by
-- importing a service-role admin client to wipe stale rows, which is both a
-- security smell (any leak of SUPABASE_SERVICE_ROLE_KEY = full DB access)
-- and unnecessary: the data being deleted is owned by the user anyway.
--
-- This migration grants owner DELETE on these cache tables so the regular
-- RLS-scoped client can invalidate caches when a chart is updated.
--
-- It also adds ON DELETE CASCADE to chat_sessions.chart_id so deleting a
-- chart cleanly tears down its conversation history (previously left orphaned).
-- ────────────────────────────────────────────────────────────────────────────

-- ─── readings: allow owner delete ──────────────────────────────────────────
CREATE POLICY "readings: owner delete"
  ON readings FOR DELETE
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- ─── personal_day_alerts: allow owner delete ──────────────────────────────
CREATE POLICY "alerts: owner delete"
  ON personal_day_alerts FOR DELETE
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- ─── monthly_briefings: allow owner delete ────────────────────────────────
CREATE POLICY "briefings: owner delete"
  ON monthly_briefings FOR DELETE
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- ─── chat_sessions: cascade on chart delete ───────────────────────────────
-- Drop the existing FK and re-create with ON DELETE CASCADE.
ALTER TABLE chat_sessions
  DROP CONSTRAINT IF EXISTS chat_sessions_chart_id_fkey;

ALTER TABLE chat_sessions
  ADD CONSTRAINT chat_sessions_chart_id_fkey
  FOREIGN KEY (chart_id) REFERENCES bazi_charts(id) ON DELETE CASCADE;
