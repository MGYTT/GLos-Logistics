export interface Job {
  id:           string
  created_by:   string
  title:        string
  from_city:    string
  to_city:      string
  cargo:        string
  cargo_weight: number
  trailer_type: string
  truck:        string | null
  distance_km:  number | null
  pay:          number | null
  priority:     'low' | 'normal' | 'high' | 'urgent'
  status:       'open' | 'taken' | 'in_progress' | 'completed' | 'cancelled'
  taken_by:     string | null
  taken_at:     string | null
  completed_at: string | null
  notes:        string | null
  server:       string
  created_at:   string
  creator?: { username: string; avatar_url: string | null; rank: string }
  taker?:   { username: string; avatar_url: string | null }
}
