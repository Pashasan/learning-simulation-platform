-- ============================================================
-- SCHEMA — Survey Games: Course Feedback
-- ============================================================
-- Tables follow the survey_course_feedback_{type} naming convention.
-- Run this in your Supabase SQL editor to create the tables.

-- -----------------------------------------------------------
-- survey_course_feedback_responses
-- One row per question per submission. submission_id groups
-- all answers from one completion.
-- -----------------------------------------------------------
CREATE TABLE survey_course_feedback_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL,
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    user_email      TEXT,
    display_name    TEXT,
    module_id       TEXT NOT NULL,
    question_id     TEXT NOT NULL,
    question_type   TEXT NOT NULL,
    response_value  JSONB NOT NULL,
    question_index  INTEGER,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (submission_id, question_id)
);

ALTER TABLE survey_course_feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own responses"
    ON survey_course_feedback_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read responses"
    ON survey_course_feedback_responses FOR SELECT
    USING (true);

CREATE POLICY "Users can update own responses"
    ON survey_course_feedback_responses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_survey_cf_responses_module_question
    ON survey_course_feedback_responses (module_id, question_id);

CREATE INDEX idx_survey_cf_responses_user_module
    ON survey_course_feedback_responses (user_id, module_id);

CREATE INDEX idx_survey_cf_responses_submission
    ON survey_course_feedback_responses (submission_id);


-- -----------------------------------------------------------
-- survey_course_feedback_events
-- Standard tracking table. Batch flush (10 events / 30s).
-- -----------------------------------------------------------
CREATE TABLE survey_course_feedback_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    module_id           TEXT,
    run_number          INTEGER,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE survey_course_feedback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON survey_course_feedback_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON survey_course_feedback_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON survey_course_feedback_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_survey_cf_events_session
    ON survey_course_feedback_events (session_id, created_at);

CREATE INDEX idx_survey_cf_events_user_module
    ON survey_course_feedback_events (user_id, module_id);


-- -----------------------------------------------------------
-- MODULES
-- -----------------------------------------------------------
-- Both modules share the same tables above. No new tables needed.
--
-- analytics-midterm: One-time structured feedback (11 questions, lounge scene).
-- general-feedback:  Unlimited-retake open feedback (text + sentiment slider).
--                    Each submission gets a unique submission_id. Users can
--                    submit as many times as they want (no mode restriction).


-- -----------------------------------------------------------
-- Update delete_my_account() to anonymize survey tables
-- -----------------------------------------------------------
-- Add these lines to the existing delete_my_account() function body,
-- before the DELETE FROM auth.users statement:
--
--   UPDATE survey_course_feedback_responses
--     SET user_id = NULL, user_email = anon_label, display_name = anon_label
--     WHERE user_id = uid;
--
--   UPDATE survey_course_feedback_events
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
