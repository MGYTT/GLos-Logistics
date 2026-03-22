-- Tygodniowe statystyki konkretnego kierowcy
CREATE OR REPLACE FUNCTION get_week_stats(p_member_id UUID)
RETURNS TABLE(distance_km BIGINT, income BIGINT, job_count BIGINT, fuel_used REAL) AS $$
  SELECT
    COALESCE(SUM(j.distance_km), 0)::BIGINT,
    COALESCE(SUM(j.income), 0)::BIGINT,
    COUNT(j.id)::BIGINT,
    COALESCE(SUM(j.fuel_used), 0)::REAL
  FROM jobs j
  WHERE j.member_id = p_member_id
    AND j.completed_at >= date_trunc('week', NOW());
$$ LANGUAGE SQL STABLE;

-- Ranking tygodniowy całego VTC
CREATE OR REPLACE FUNCTION get_weekly_rankings()
RETURNS TABLE(
  member_id UUID, username TEXT, avatar_url TEXT, rank TEXT,
  total_distance BIGINT, total_income BIGINT, job_count BIGINT
) AS $$
  SELECT
    m.id, m.username, m.avatar_url, m.rank,
    COALESCE(SUM(j.distance_km), 0)::BIGINT,
    COALESCE(SUM(j.income), 0)::BIGINT,
    COUNT(j.id)::BIGINT
  FROM members m
  LEFT JOIN jobs j ON j.member_id = m.id
    AND j.completed_at >= date_trunc('week', NOW())
  WHERE m.is_banned = FALSE
  GROUP BY m.id, m.username, m.avatar_url, m.rank
  ORDER BY SUM(j.distance_km) DESC NULLS LAST;
$$ LANGUAGE SQL STABLE;
