export type MemberRank = 'Recruit' | 'Driver' | 'Senior' | 'Elite' | 'Manager' | 'Owner'

export type LeaveType   = 'paid' | 'unpaid' | 'sick' | 'forced'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'ended'

export interface Member {
  id:             string
  steam_id:       string | null
  username:       string
  avatar_url:     string | null
  rank:           MemberRank
  points:         number
  truckershub_id: string | null
  discord_id:     string | null
  joined_at:      string
  is_banned:      boolean
}

export interface Job {
  id:                  string
  member_id:           string
  cargo:               string
  origin_city:         string
  destination_city:    string
  distance_km:         number
  income:              number
  fuel_used:           number
  damage_percent:      number
  truckershub_job_id:  string | null
  completed_at:        string
  members?: Pick<Member, 'username' | 'avatar_url' | 'rank'>
}

export interface DriverPosition {
  member_id:  string
  x:          number
  y:          number
  z:          number
  speed:      number
  game_time:  string
  online:     boolean
  updated_at: string
  members?: Pick<Member, 'username' | 'avatar_url' | 'rank'>
}

export interface FleetTruck {
  id:          string
  name:        string
  brand:       string
  model:       string
  livery_url:  string | null
  image_urls:  string[]
  assigned_to: string | null
  members?: Pick<Member, 'username' | 'avatar_url'>
}

export interface VTCEvent {
  id:           string
  title:        string
  description:  string
  start_at:     string
  end_at:       string
  bonus_points: number
  created_by:   string
  event_rsvp?: { member_id: string }[]
}

export interface RankingEntry {
  member_id:      string
  username:       string
  avatar_url:     string | null
  rank:           MemberRank
  total_distance: number
  total_income:   number
  job_count:      number
}

export interface WeekStats {
  distance_km: number
  income:      number
  job_count:   number
  fuel_used:   number
}

export interface MemberLeave {
  id:          string
  member_id:   string
  type:        LeaveType
  status:      LeaveStatus
  start_date:  string
  end_date:    string
  reason:      string | null
  admin_note:  string | null
  approved_by: string | null
  created_at:  string
  updated_at:  string
  member?: Pick<Member, 'username' | 'avatar_url' | 'rank'> | null
}

export interface LeaveStats {
  paid_used:      number
  paid_limit:     number
  paid_remaining: number
  sick_used:      number
  sick_limit:     number
  active_leave:   MemberLeave | null
}
