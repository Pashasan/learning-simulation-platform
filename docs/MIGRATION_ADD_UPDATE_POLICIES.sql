-- Migration: Add UPDATE RLS policies for account deletion (self-service anonymization)
-- Run this in the Supabase SQL Editor
-- Date: 2026-02-14

-- Allow users to update their own rows (for account deletion/anonymization)
-- These policies enable the Settings page "Delete Account" feature,
-- which anonymizes user_email and display_name across all tables.

-- Analytics Quiz tables
CREATE POLICY "Users can update own scores"
    ON choice_analytics_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
    ON choice_analytics_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
    ON choice_analytics_feedback FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Resource Allocation Simulation tables
CREATE POLICY "Users can update own scores"
    ON sim_resource_alloc_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
    ON sim_resource_alloc_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
