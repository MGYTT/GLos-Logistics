-- MEMBERS
CREATE POLICY "Public read members" ON members FOR SELECT USING (is_banned = false);
CREATE POLICY "Own update"          ON members FOR UPDATE USING (auth.uid() = id);

-- JOBS
CREATE POLICY "Own jobs read"       ON jobs FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Service insert jobs" ON jobs FOR INSERT WITH CHECK (true);

-- DRIVER POSITIONS
CREATE POLICY "Public read positions" ON driver_positions FOR SELECT USING (true);
CREATE POLICY "Service upsert"        ON driver_positions FOR ALL USING (true);

-- FLEET
CREATE POLICY "Public read fleet" ON fleet FOR SELECT USING (true);

-- EVENTS
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);

-- APPLICATIONS
CREATE POLICY "Insert applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read apps"     ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members WHERE id = auth.uid() AND rank IN ('Manager','Owner')
  ));
CREATE POLICY "Admin update apps"   ON applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM members WHERE id = auth.uid() AND rank IN ('Manager','Owner')
  ));
