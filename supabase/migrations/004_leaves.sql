-- ─── Tabela urlopów ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_leaves (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL CHECK (type IN ('paid', 'unpaid', 'sick', 'forced')),
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'ended')),
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  reason        TEXT,
  admin_note    TEXT,
  approved_by   UUID        REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

-- ─── Indeksy ───────────────────────────────────────────────────────────
CREATE INDEX idx_leaves_member_id  ON member_leaves(member_id);
CREATE INDEX idx_leaves_status     ON member_leaves(status);
CREATE INDEX idx_leaves_start_date ON member_leaves(start_date);
CREATE INDEX idx_leaves_end_date   ON member_leaves(end_date);

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE member_leaves ENABLE ROW LEVEL SECURITY;

-- Każdy widzi swoje urlopy
CREATE POLICY "member_sees_own_leaves"
  ON member_leaves FOR SELECT
  USING (member_id = auth.uid());

-- Każdy może złożyć wniosek
CREATE POLICY "member_can_insert_leave"
  ON member_leaves FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND type IN ('paid', 'unpaid', 'sick')   -- forced tylko admin
  );

-- Tylko Owner/Manager może zmieniać statusy
CREATE POLICY "admin_manages_leaves"
  ON member_leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND rank IN ('Owner', 'Manager')
    )
  );

-- Admin widzi wszystko
CREATE POLICY "admin_sees_all_leaves"
  ON member_leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND rank IN ('Owner', 'Manager')
    )
  );

-- ─── Widok: aktywny urlop kierowcy ────────────────────────────────────
CREATE OR REPLACE VIEW active_leaves AS
SELECT
  ml.*,
  m.username,
  m.avatar_url,
  m.rank
FROM member_leaves ml
JOIN members m ON m.id = ml.member_id
WHERE
  ml.status IN ('approved', 'active')
  AND ml.start_date <= CURRENT_DATE
  AND ml.end_date   >= CURRENT_DATE;

-- ─── Funkcja: ile dni urlopu płatnego wykorzystano w roku ─────────────
CREATE OR REPLACE FUNCTION get_paid_leave_days_used(
  p_member_id UUID,
  p_year      INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS INT
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    SUM(
      (end_date - start_date)::INT + 1
    ), 0
  )::INT
  FROM member_leaves
  WHERE
    member_id = p_member_id
    AND type   = 'paid'
    AND status IN ('approved', 'active', 'ended')
    AND EXTRACT(YEAR FROM start_date) = p_year;
$$;

-- ─── Funkcja: czy kierowca jest obecnie na urlopie ────────────────────
CREATE OR REPLACE FUNCTION is_member_on_leave(p_member_id UUID)
RETURNS TABLE (
  on_leave   BOOLEAN,
  leave_type TEXT,
  ends_at    DATE
)
LANGUAGE sql STABLE AS $$
  SELECT
    TRUE,
    type,
    end_date
  FROM member_leaves
  WHERE
    member_id  = p_member_id
    AND status IN ('approved', 'active')
    AND start_date <= CURRENT_DATE
    AND end_date   >= CURRENT_DATE
  ORDER BY start_date DESC
  LIMIT 1;
$$;

-- ─── Auto-aktualizacja updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_leaves_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leaves_updated_at
  BEFORE UPDATE ON member_leaves
  FOR EACH ROW EXECUTE FUNCTION update_leaves_updated_at();
