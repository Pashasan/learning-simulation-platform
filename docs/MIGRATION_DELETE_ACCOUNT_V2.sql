-- ============================================================
-- Migration V2: Update delete_my_account() to cover ALL tables
-- ============================================================
-- Run this in the Supabase SQL Editor.
--
-- Changes from V1:
-- 1. Adds support for all new game tables (quant marketing,
--    robo-vault, survey feedback, code labs)
-- 2. Clears feedback_text from ALL feedback tables
-- 3. Clears response_value from survey responses (free-text)
-- 4. Makes user_id nullable + ON DELETE SET NULL on new tables
-- ============================================================


-- ============================================================
-- Step 1: Make user_id nullable on new tables
-- ============================================================

-- Quantitative Marketing
ALTER TABLE choice_quant_mktg_scores
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE choice_quant_mktg_feedback
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE choice_quant_mktg_events
    ALTER COLUMN user_id DROP NOT NULL;

-- RoboVault
ALTER TABLE sim_product_design_scores
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sim_product_design_feedback
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sim_product_design_events
    ALTER COLUMN user_id DROP NOT NULL;

-- Code Labs
ALTER TABLE code_lab_scores
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE code_lab_events
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE code_lab_feedback
    ALTER COLUMN user_id DROP NOT NULL;

-- Survey Course Feedback (already nullable via schema, but ensure)
ALTER TABLE survey_course_feedback_responses
    ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE survey_course_feedback_events
    ALTER COLUMN user_id DROP NOT NULL;


-- ============================================================
-- Step 2: Replace FK constraints with ON DELETE SET NULL
-- ============================================================

-- Quantitative Marketing
ALTER TABLE choice_quant_mktg_scores
    DROP CONSTRAINT IF EXISTS choice_quant_mktg_scores_user_id_fkey;
ALTER TABLE choice_quant_mktg_scores
    ADD CONSTRAINT choice_quant_mktg_scores_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE choice_quant_mktg_feedback
    DROP CONSTRAINT IF EXISTS choice_quant_mktg_feedback_user_id_fkey;
ALTER TABLE choice_quant_mktg_feedback
    ADD CONSTRAINT choice_quant_mktg_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE choice_quant_mktg_events
    DROP CONSTRAINT IF EXISTS choice_quant_mktg_events_user_id_fkey;
ALTER TABLE choice_quant_mktg_events
    ADD CONSTRAINT choice_quant_mktg_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- RoboVault
ALTER TABLE sim_product_design_scores
    DROP CONSTRAINT IF EXISTS sim_product_design_scores_user_id_fkey;
ALTER TABLE sim_product_design_scores
    ADD CONSTRAINT sim_product_design_scores_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE sim_product_design_feedback
    DROP CONSTRAINT IF EXISTS sim_product_design_feedback_user_id_fkey;
ALTER TABLE sim_product_design_feedback
    ADD CONSTRAINT sim_product_design_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE sim_product_design_events
    DROP CONSTRAINT IF EXISTS sim_product_design_events_user_id_fkey;
ALTER TABLE sim_product_design_events
    ADD CONSTRAINT sim_product_design_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Code Labs
ALTER TABLE code_lab_scores
    DROP CONSTRAINT IF EXISTS code_lab_scores_user_id_fkey;
ALTER TABLE code_lab_scores
    ADD CONSTRAINT code_lab_scores_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE code_lab_events
    DROP CONSTRAINT IF EXISTS code_lab_events_user_id_fkey;
ALTER TABLE code_lab_events
    ADD CONSTRAINT code_lab_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE code_lab_feedback
    DROP CONSTRAINT IF EXISTS code_lab_feedback_user_id_fkey;
ALTER TABLE code_lab_feedback
    ADD CONSTRAINT code_lab_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Survey Course Feedback (already ON DELETE SET NULL via schema, but ensure)
ALTER TABLE survey_course_feedback_responses
    DROP CONSTRAINT IF EXISTS survey_course_feedback_responses_user_id_fkey;
ALTER TABLE survey_course_feedback_responses
    ADD CONSTRAINT survey_course_feedback_responses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE survey_course_feedback_events
    DROP CONSTRAINT IF EXISTS survey_course_feedback_events_user_id_fkey;
ALTER TABLE survey_course_feedback_events
    ADD CONSTRAINT survey_course_feedback_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


-- ============================================================
-- Step 3: Drop unique constraints that include user_id
-- ============================================================

ALTER TABLE choice_quant_mktg_scores
    DROP CONSTRAINT IF EXISTS choice_quant_mktg_scores_user_id_volume_id_run_number_key;

ALTER TABLE sim_product_design_scores
    DROP CONSTRAINT IF EXISTS sim_product_design_scores_user_id_game_id_difficulty_run_num_key;

ALTER TABLE code_lab_scores
    DROP CONSTRAINT IF EXISTS code_lab_scores_user_id_game_id_level_id_run_number_key;


-- ============================================================
-- Step 4: Add UPDATE RLS policies for tables that need
--         client-side pre-cleanup (defense in depth)
-- ============================================================

-- Code lab feedback needs UPDATE policy so client can clear text
CREATE POLICY "Users can update own feedback"
    ON code_lab_feedback FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- Step 5: Replace delete_my_account() function
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _uid UUID;
    _anon_id TEXT;
BEGIN
    -- Get the calling user's ID
    _uid := auth.uid();
    IF _uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate anonymous identifier
    _anon_id := 'deleted_user_' || substr(md5(random()::text), 1, 8);

    -- ========================================
    -- Analytics Quiz Game (3 tables)
    -- ========================================
    UPDATE choice_analytics_scores
        SET user_email = _anon_id, display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    UPDATE choice_analytics_feedback
        SET user_email = _anon_id, display_name = _anon_id, feedback_text = NULL, user_id = NULL
        WHERE user_id = _uid;

    UPDATE choice_analytics_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- Quantitative Marketing Methods (3 tables)
    -- ========================================
    UPDATE choice_quant_mktg_scores
        SET user_email = _anon_id, display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    UPDATE choice_quant_mktg_feedback
        SET user_email = _anon_id, display_name = _anon_id, feedback_text = NULL, user_id = NULL
        WHERE user_id = _uid;

    UPDATE choice_quant_mktg_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- Brew & Budget (3 tables)
    -- ========================================
    UPDATE sim_resource_alloc_scores
        SET user_email = _anon_id, display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    UPDATE sim_resource_alloc_feedback
        SET user_email = _anon_id, display_name = _anon_id, feedback_text = NULL, user_id = NULL
        WHERE user_id = _uid;

    UPDATE sim_resource_alloc_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- RoboVault (3 tables)
    -- ========================================
    UPDATE sim_product_design_scores
        SET user_email = _anon_id, display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    UPDATE sim_product_design_feedback
        SET user_email = _anon_id, display_name = _anon_id, feedback_text = NULL, user_id = NULL
        WHERE user_id = _uid;

    UPDATE sim_product_design_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- Survey Course Feedback (2 tables)
    -- Clear response_value to remove free-text answers
    -- ========================================
    UPDATE survey_course_feedback_responses
        SET user_email = _anon_id, display_name = _anon_id, response_value = '{}', user_id = NULL
        WHERE user_id = _uid;

    UPDATE survey_course_feedback_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- Code Labs — all 10 labs share 3 tables (3 tables)
    -- Clear feedback_text to remove free-text comments
    -- ========================================
    UPDATE code_lab_scores
        SET user_email = _anon_id, display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    UPDATE code_lab_feedback
        SET user_email = _anon_id, display_name = _anon_id, feedback_text = NULL, user_id = NULL
        WHERE user_id = _uid;

    UPDATE code_lab_events
        SET display_name = _anon_id, user_id = NULL
        WHERE user_id = _uid;

    -- ========================================
    -- Delete the user from Supabase Auth
    -- ========================================
    DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Grant execute to authenticated users (anon cannot call this)
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
