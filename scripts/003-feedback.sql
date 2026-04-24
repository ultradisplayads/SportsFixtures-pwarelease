CREATE TABLE IF NOT EXISTS feedback (
  id         BIGSERIAL PRIMARY KEY,
  score      SMALLINT,
  tags       JSONB,
  comment    TEXT,
  user_id    TEXT,
  email      TEXT,
  page       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_score_idx ON feedback (score);
