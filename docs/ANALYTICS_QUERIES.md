# Analytics Query Examples

This document contains example SQL queries for analyzing user behavior from the `choice_analytics_events` table.

## Question Difficulty Analysis

Which questions have the lowest success rate?

```sql
SELECT
    volume_id,
    event_data->>'question_id' as question_id,
    COUNT(*) as attempts,
    SUM(CASE WHEN (event_data->>'is_correct')::boolean THEN 1 ELSE 0 END) as correct,
    ROUND(100.0 * SUM(CASE WHEN (event_data->>'is_correct')::boolean THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate,
    ROUND(AVG((event_data->>'time_to_answer_ms')::int) / 1000, 1) as avg_time_seconds
FROM choice_analytics_events
WHERE event_type = 'answer'
GROUP BY volume_id, event_data->>'question_id'
ORDER BY success_rate ASC;
```

## Dropoff Analysis

Where do users exit without completing?

```sql
WITH session_screens AS (
    SELECT
        session_id,
        volume_id,
        MAX(CASE WHEN event_type = 'volume_complete' THEN 1 ELSE 0 END) as completed,
        MAX(event_data->>'last_screen') FILTER (WHERE event_type = 'session_end') as last_screen
    FROM choice_analytics_events
    WHERE volume_id IS NOT NULL
    GROUP BY session_id, volume_id
)
SELECT
    volume_id,
    last_screen,
    COUNT(*) as dropoffs
FROM session_screens
WHERE completed = 0 AND last_screen IS NOT NULL
GROUP BY volume_id, last_screen
ORDER BY dropoffs DESC;
```

## Time Analysis by Chapter

How long does each chapter take on average?

```sql
SELECT
    volume_id,
    event_data->>'from_chapter' as chapter,
    ROUND(AVG((event_data->>'chapter_duration_seconds')::int), 0) as avg_duration_seconds,
    COUNT(*) as completions
FROM choice_analytics_events
WHERE event_type = 'chapter_transition'
GROUP BY volume_id, event_data->>'from_chapter'
ORDER BY volume_id, chapter;
```

## Badge Unlock Rates

What percentage of completions earn each badge?

```sql
WITH completions AS (
    SELECT session_id, volume_id
    FROM choice_analytics_events
    WHERE event_type = 'volume_complete'
),
badges AS (
    SELECT session_id, volume_id, event_data->>'badge_id' as badge_id
    FROM choice_analytics_events
    WHERE event_type = 'badge_unlock'
)
SELECT
    c.volume_id,
    b.badge_id,
    COUNT(DISTINCT b.session_id) as earned_count,
    COUNT(DISTINCT c.session_id) as total_completions,
    ROUND(100.0 * COUNT(DISTINCT b.session_id) / NULLIF(COUNT(DISTINCT c.session_id), 0), 1) as earn_rate
FROM completions c
LEFT JOIN badges b ON c.session_id = b.session_id AND c.volume_id = b.volume_id
GROUP BY c.volume_id, b.badge_id
ORDER BY c.volume_id, earn_rate DESC;
```

## Session Duration Distribution

Distribution of session lengths.

```sql
SELECT
    CASE
        WHEN (event_data->>'duration_seconds')::int < 60 THEN '< 1 min'
        WHEN (event_data->>'duration_seconds')::int < 300 THEN '1-5 min'
        WHEN (event_data->>'duration_seconds')::int < 900 THEN '5-15 min'
        WHEN (event_data->>'duration_seconds')::int < 1800 THEN '15-30 min'
        ELSE '30+ min'
    END as duration_bucket,
    COUNT(*) as sessions
FROM choice_analytics_events
WHERE event_type = 'session_end'
GROUP BY 1
ORDER BY MIN((event_data->>'duration_seconds')::int);
```

## Conversion Funnel

Funnel: Session -> Volume Start -> Complete

```sql
SELECT
    volume_id,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'volume_start') as started,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'answer') as answered_any,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'volume_complete') as completed
FROM choice_analytics_events
WHERE volume_id IS NOT NULL
GROUP BY volume_id;
```

## Daily Active Users

DAU trend over the last 30 days.

```sql
SELECT
    created_at as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT session_id) as total_sessions
FROM choice_analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY created_at
ORDER BY date;
```

## Replay Analysis

How many users replay volumes?

```sql
SELECT
    volume_id,
    run_number,
    COUNT(DISTINCT user_id) as users
FROM choice_analytics_events
WHERE event_type = 'volume_complete' AND run_number IS NOT NULL
GROUP BY volume_id, run_number
ORDER BY volume_id, run_number;
```

## Average Time to Answer by Question

Which questions take the longest to answer?

```sql
SELECT
    volume_id,
    event_data->>'question_id' as question_id,
    ROUND(AVG((event_data->>'time_to_answer_ms')::int) / 1000, 1) as avg_seconds,
    MIN((event_data->>'time_to_answer_ms')::int) / 1000 as min_seconds,
    MAX((event_data->>'time_to_answer_ms')::int) / 1000 as max_seconds
FROM choice_analytics_events
WHERE event_type = 'answer' AND event_data->>'time_to_answer_ms' IS NOT NULL
GROUP BY volume_id, event_data->>'question_id'
ORDER BY avg_seconds DESC;
```

---

## Brew & Budget: Adventure Mode Queries

The following queries target `sim_resource_alloc_scores` where `difficulty = 'adventure'`, reading from the `adventure_data` JSONB column.

### Adventure Grade Distribution

```sql
SELECT
    grade,
    COUNT(*) as runs,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM sim_resource_alloc_scores
WHERE difficulty = 'adventure' AND game_id = 'brew-and-budget'
GROUP BY grade
ORDER BY CASE grade
    WHEN 'A+' THEN 1 WHEN 'A' THEN 2 WHEN 'B+' THEN 3 WHEN 'B' THEN 4
    WHEN 'C+' THEN 5 WHEN 'C' THEN 6 WHEN 'D' THEN 7 ELSE 8 END;
```

### Modifier Usage & Performance

Which modifiers are used most, and how do they affect grades?

```sql
SELECT
    mod.value as modifier,
    COUNT(*) as uses,
    ROUND(AVG(total_revenue)) as avg_revenue,
    MODE() WITHIN GROUP (ORDER BY grade) as most_common_grade
FROM sim_resource_alloc_scores,
     jsonb_array_elements_text(adventure_data->'modifiers') AS mod(value)
WHERE difficulty = 'adventure' AND game_id = 'brew-and-budget'
GROUP BY mod.value
ORDER BY uses DESC;
```

### Scenario Difficulty Ranking

Which scenarios are hardest (lowest avg revenue)?

```sql
SELECT
    adventure_data->>'scenario_name' as scenario,
    COUNT(*) as runs,
    ROUND(AVG(total_revenue)) as avg_revenue,
    MODE() WITHIN GROUP (ORDER BY grade) as most_common_grade
FROM sim_resource_alloc_scores
WHERE difficulty = 'adventure' AND adventure_data IS NOT NULL
GROUP BY adventure_data->>'scenario_name'
ORDER BY avg_revenue ASC;
```

### Badge Rarity

How many unique players have earned each badge?

```sql
WITH latest_runs AS (
    SELECT DISTINCT ON (user_id)
        user_id, adventure_data->'all_badges' as badges
    FROM sim_resource_alloc_scores
    WHERE difficulty = 'adventure' AND adventure_data IS NOT NULL
    ORDER BY user_id, created_at DESC
)
SELECT
    badge.value as badge_id,
    COUNT(*) as players_earned,
    (SELECT COUNT(DISTINCT user_id) FROM latest_runs) as total_players,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(DISTINCT user_id) FROM latest_runs), 1) as pct
FROM latest_runs,
     jsonb_array_elements_text(badges) AS badge(value)
GROUP BY badge.value
ORDER BY players_earned ASC;
```

### Player Progression Leaderboard

Top players by reputation.

```sql
SELECT DISTINCT ON (user_id)
    display_name,
    (adventure_data->>'reputation')::int as reputation,
    adventure_data->>'tier' as tier,
    (adventure_data->>'total_runs')::int as total_runs,
    (adventure_data->>'streak')::int as current_streak,
    jsonb_array_length(adventure_data->'all_badges') as badge_count
FROM sim_resource_alloc_scores
WHERE difficulty = 'adventure' AND adventure_data IS NOT NULL
ORDER BY user_id, created_at DESC;
```

### Role Permutation Performance

Which channel role assignments are hardest?

```sql
SELECT
    adventure_data->'roles'->>'a' as ch_a_role,
    adventure_data->'roles'->>'b' as ch_b_role,
    adventure_data->'roles'->>'c' as ch_c_role,
    COUNT(*) as runs,
    ROUND(AVG(total_revenue)) as avg_revenue
FROM sim_resource_alloc_scores
WHERE difficulty = 'adventure' AND adventure_data IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY avg_revenue ASC;
```

---

## RoboVault: Product Design Simulation Queries

The following queries target `sim_product_design_scores` for RoboVault game analytics.

### Profit Efficiency Distribution

How efficiently do players capture the oracle's optimal profit?

```sql
SELECT
    grade,
    COUNT(*) as runs,
    ROUND(AVG(player_profit)) as avg_profit,
    ROUND(AVG(oracle_profit)) as avg_oracle,
    ROUND(100.0 * AVG(player_profit::numeric / NULLIF(oracle_profit, 0)), 1) as avg_efficiency_pct
FROM sim_product_design_scores
WHERE game_id = 'robo_vault'
GROUP BY grade
ORDER BY CASE grade
    WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3
    WHEN 'C' THEN 4 WHEN 'D' THEN 5 WHEN 'F' THEN 6 END;
```

### Per-Round Improvement

Do players improve across rounds within a game?

```sql
SELECT
    r.ord as round_number,
    COUNT(*) as games,
    ROUND(AVG((r.val->>'profit_ratio')::numeric), 3) as avg_profit_ratio
FROM sim_product_design_scores,
     jsonb_array_elements(rounds_data) WITH ORDINALITY AS r(val, ord)
WHERE game_id = 'robo_vault'
GROUP BY r.ord
ORDER BY r.ord;
```

### Most Popular Robot Configurations

Which attribute combinations do players choose most?

```sql
SELECT
    r.val->'config'->>'function' as robot_function,
    r.val->'config'->>'personality' as personality,
    r.val->'config'->>'form' as form_factor,
    COUNT(*) as times_chosen,
    ROUND(AVG((r.val->>'profit_ratio')::numeric), 3) as avg_profit_ratio
FROM sim_product_design_scores,
     jsonb_array_elements(rounds_data) AS r(val)
WHERE game_id = 'robo_vault'
GROUP BY 1, 2, 3
ORDER BY times_chosen DESC
LIMIT 15;
```

### Quiz Performance

How well do players understand the market structure?

```sql
SELECT
    quiz_score,
    COUNT(*) as players,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct,
    ROUND(AVG(player_profit)) as avg_profit
FROM sim_product_design_scores
WHERE game_id = 'robo_vault'
GROUP BY quiz_score
ORDER BY quiz_score;
```

### Research Method Usage

Which research methods do players purchase, and do they help?

```sql
WITH research_events AS (
    SELECT
        session_id,
        event_data->>'method' as method,
        COUNT(*) as purchases
    FROM sim_product_design_events
    WHERE event_type = 'research_buy' AND game_id = 'robo_vault'
    GROUP BY session_id, event_data->>'method'
)
SELECT
    method,
    COUNT(*) as total_purchases,
    COUNT(DISTINCT session_id) as unique_sessions
FROM research_events
GROUP BY method
ORDER BY total_purchases DESC;
```

---

## Score Distribution

Distribution of final scores.

```sql
SELECT
    volume_id,
    CASE
        WHEN (event_data->>'score')::int < 200 THEN '0-199'
        WHEN (event_data->>'score')::int < 400 THEN '200-399'
        WHEN (event_data->>'score')::int < 600 THEN '400-599'
        WHEN (event_data->>'score')::int < 800 THEN '600-799'
        ELSE '800+'
    END as score_range,
    COUNT(*) as completions
FROM choice_analytics_events
WHERE event_type = 'volume_complete'
GROUP BY volume_id, 2
ORDER BY volume_id, MIN((event_data->>'score')::int);
```
