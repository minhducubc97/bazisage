-- BaziSage — Initial Database Schema
-- Migration 001: All tables, indexes, and RLS policies
-- Apply via: supabase db push  OR  supabase migration up

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for Phase 2 KB

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users

CREATE TABLE profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name          text,
  subscription_tier     text DEFAULT 'free'
                          CHECK (subscription_tier IN ('free', 'pro', 'master')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  locale                text DEFAULT 'en',
  timezone              text DEFAULT 'UTC',
  monthly_briefing_day  int CHECK (monthly_briefing_day BETWEEN 1 AND 28),
  quiet_hours_start     time,
  quiet_hours_end       time,
  notification_time     time DEFAULT '07:00',  -- preferred delivery time (local)
  onboarding_completed  boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Bazi Charts ──────────────────────────────────────────────────────────────

CREATE TABLE bazi_charts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  subject_name            text NOT NULL,          -- "Me", "Mom", "Partner"
  relationship            text
                            CHECK (relationship IN ('self','partner','parent','child','friend','other')),
  birth_date              date NOT NULL,
  birth_time              time,                   -- NULL = Three Pillars mode
  birth_hour_branch       text,                   -- 子,丑,...,亥 (NULL in Three Pillars)
  birth_location_name     text NOT NULL,
  birth_longitude         numeric(9,6),           -- for True Solar Time correction
  birth_latitude          numeric(9,6),
  birth_gender            char(1) NOT NULL CHECK (birth_gender IN ('M', 'F')),
  timezone                text NOT NULL DEFAULT 'UTC',
  utc_offset_minutes      int NOT NULL DEFAULT 0,
  true_solar_offset_minutes int,                  -- computed
  day_master              text,                   -- denormalized: e.g. '庚'
  day_master_element      text,                   -- 'Metal','Wood','Water','Fire','Earth'
  day_master_strength     text
                            CHECK (day_master_strength IN ('Strong','Balanced','Weak')),
  useful_god              text,                   -- favorable element
  chart_data              jsonb NOT NULL,         -- full computed chart JSON
  mode                    text DEFAULT 'four_pillars'
                            CHECK (mode IN ('four_pillars', 'three_pillars')),
  rectification_meta      jsonb,                  -- Phase 2: interview responses + confidence
  is_primary              boolean DEFAULT false,  -- user's own chart
  deleted_at              timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_bazi_charts_owner
  ON bazi_charts(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bazi_charts_day_master
  ON bazi_charts(day_master, day_master_strength) WHERE deleted_at IS NULL;
CREATE INDEX idx_bazi_charts_primary
  ON bazi_charts(owner_id, is_primary) WHERE deleted_at IS NULL AND is_primary = true;

-- ─── AI Readings (cached) ──────────────────────────────────────────────────────

CREATE TABLE readings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id            uuid NOT NULL REFERENCES bazi_charts ON DELETE CASCADE,
  reading_type        text NOT NULL
                        CHECK (reading_type IN (
                          'full','yearly','monthly','compatibility',
                          'auspicious_date','deep_report'
                        )),
  reading_period      text,                       -- '2025', '2025-03', etc.
  partner_chart_id    uuid REFERENCES bazi_charts,
  content             text NOT NULL,
  model_used          text NOT NULL,
  input_tokens        int,
  output_tokens       int,
  cached_input_tokens int,
  created_at          timestamptz DEFAULT now()
);

-- Cache key: one reading per chart+type+period+partner combination
CREATE UNIQUE INDEX idx_readings_cache_key
  ON readings(
    chart_id,
    reading_type,
    COALESCE(reading_period, ''),
    COALESCE(partner_chart_id::text, '')
  );

-- ─── Grandmaster Chat ──────────────────────────────────────────────────────────

CREATE TABLE chat_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  chart_id          uuid NOT NULL REFERENCES bazi_charts,
  title             text,
  summary           text,                         -- LLM-generated rolling summary
  message_count     int DEFAULT 0,
  last_message_at   timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_sessions_user
  ON chat_sessions(user_id, last_message_at DESC);

CREATE TABLE chat_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES chat_sessions ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content           text NOT NULL,
  tool_calls        jsonb,
  model_used        text,
  input_tokens      int,
  output_tokens     int,
  cached_input_tokens int,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_messages_session
  ON chat_messages(session_id, created_at);

-- ─── Long-term User Memories ───────────────────────────────────────────────────

CREATE TABLE user_memories (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  kind              text NOT NULL
                      CHECK (kind IN ('life_event','preference','question_topic','goal')),
  content           text NOT NULL,
  source_session_id uuid REFERENCES chat_sessions,
  importance        int DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_user_memories_user
  ON user_memories(user_id, importance DESC);

-- ─── Daily Advice Templates (SHARED — 30/day) ─────────────────────────────────

CREATE TABLE daily_advice_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advice_date       date NOT NULL,
  day_master        text NOT NULL,                -- 甲,乙,...,癸
  strength_bucket   text NOT NULL
                      CHECK (strength_bucket IN ('Strong','Balanced','Weak')),
  daily_stem        text NOT NULL,
  daily_branch      text NOT NULL,
  content           jsonb NOT NULL,               -- {body, focus, caution, best_hours, personalization_template}
  model_used        text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(advice_date, day_master, strength_bucket)  -- max 30 rows/day
);

CREATE INDEX idx_daily_advice_date
  ON daily_advice_templates(advice_date, day_master, strength_bucket);

-- ─── Personal Day Alerts (chart-triggered) ────────────────────────────────────

CREATE TABLE personal_day_alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id            uuid NOT NULL REFERENCES bazi_charts ON DELETE CASCADE,
  alert_date          date NOT NULL,
  interaction_type    text NOT NULL
                        CHECK (interaction_type IN (
                          'clash','combination','penalty','harm',
                          'half_combo','destruction','activation'
                        )),
  interaction_details jsonb NOT NULL,
  severity            int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  content             text NOT NULL,
  push_sent           boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(chart_id, alert_date, interaction_type)
);

CREATE INDEX idx_personal_alerts_date
  ON personal_day_alerts(alert_date, chart_id);
CREATE INDEX idx_personal_alerts_pending
  ON personal_day_alerts(alert_date, push_sent) WHERE push_sent = false;

-- ─── Notification Deliveries ───────────────────────────────────────────────────

CREATE TABLE notification_deliveries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  kind              text NOT NULL
                      CHECK (kind IN ('daily','monthly_briefing','personal_alert','annual')),
  source_id         uuid,                         -- reference to template/alert/briefing
  delivered_at      timestamptz,
  push_sent         boolean DEFAULT false,
  email_sent        boolean DEFAULT false,
  opened_at         timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_deliveries_user
  ON notification_deliveries(user_id, created_at DESC);

-- ─── Monthly Briefings ────────────────────────────────────────────────────────

CREATE TABLE monthly_briefings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id          uuid NOT NULL REFERENCES bazi_charts ON DELETE CASCADE,
  year              int NOT NULL,
  month             int NOT NULL,
  content           jsonb NOT NULL,               -- {overview, chart_interaction, focus, avoid, auspicious_dates, caution_dates}
  model_used        text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(chart_id, year, month)
);

-- ─── Auspicious Date Queries ──────────────────────────────────────────────────

CREATE TABLE auspicious_date_queries (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES profiles,
  chart_id                  uuid NOT NULL REFERENCES bazi_charts,
  partner_chart_id          uuid REFERENCES bazi_charts,
  event_type                text NOT NULL
                              CHECK (event_type IN (
                                'wedding','business_launch','moving',
                                'surgery','travel','signing','other'
                              )),
  date_range_start          date NOT NULL,
  date_range_end            date NOT NULL,
  results                   jsonb,                -- {top_dates, avoid_dates, best_hours}
  stripe_payment_intent_id  text,                 -- NULL if under subscription
  created_at                timestamptz DEFAULT now()
);

-- ─── Educational Lesson Progress ──────────────────────────────────────────────

CREATE TABLE lesson_progress (
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  lesson_id         text NOT NULL,
  completed_at      timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ─── Stripe Webhook Idempotency ───────────────────────────────────────────────

CREATE TABLE stripe_events (
  event_id          text PRIMARY KEY,
  processed_at      timestamptz DEFAULT now()
);

-- ─── Web Push Subscriptions ───────────────────────────────────────────────────

CREATE TABLE push_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  endpoint          text NOT NULL UNIQUE,
  p256dh            text NOT NULL,
  auth              text NOT NULL,
  user_agent        text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user
  ON push_subscriptions(user_id);

-- ─── KB Documents (Phase 2 — empty at launch) ────────────────────────────────

CREATE TABLE kb_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content           text NOT NULL,
  metadata          jsonb NOT NULL,               -- {tier:1|2|3, topic, source}
  embedding         vector(1536),
  created_at        timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: users manage own"
  ON profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- bazi_charts
ALTER TABLE bazi_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charts: owner access"
  ON bazi_charts FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- readings: select only (inserts via service_role in API routes)
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "readings: owner select"
  ON readings FOR SELECT
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sessions: user access"
  ON chat_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages: via owned session"
  ON chat_messages FOR ALL
  USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  ));

-- user_memories
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memories: user access"
  ON user_memories FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- daily_advice_templates: public read, service_role write
ALTER TABLE daily_advice_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_advice: public read"
  ON daily_advice_templates FOR SELECT USING (true);

-- personal_day_alerts: via owned chart
ALTER TABLE personal_day_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts: owner select"
  ON personal_day_alerts FOR SELECT
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- notification_deliveries
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries: user select"
  ON notification_deliveries FOR SELECT
  USING (user_id = auth.uid());

-- monthly_briefings
ALTER TABLE monthly_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefings: owner select"
  ON monthly_briefings FOR SELECT
  USING (chart_id IN (
    SELECT id FROM bazi_charts WHERE owner_id = auth.uid()
  ));

-- auspicious_date_queries
ALTER TABLE auspicious_date_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auspicious: user access"
  ON auspicious_date_queries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons: user access"
  ON lesson_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push: user access"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- kb_documents: authenticated read
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb: authed read"
  ON kb_documents FOR SELECT
  TO authenticated USING (true);

-- stripe_events: service_role only (no client access — no policy = deny all)
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP FUNCTIONS (called by pg_cron in production)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION prune_old_deliveries()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_deliveries
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION prune_old_daily_advice()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_advice_templates
  WHERE advice_date < CURRENT_DATE - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
