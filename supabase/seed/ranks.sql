INSERT INTO rank_thresholds VALUES
  ('Recruit',  0,    0,    0),
  ('Driver',   50,   10,   5000),
  ('Senior',   200,  50,   25000),
  ('Elite',    500,  150,  75000),
  ('Manager',  1000, 300,  150000)
ON CONFLICT DO NOTHING;
