import { MemberRank } from '@/types'

export const RANK_CONFIG: Record<MemberRank, {
  label:     string
  color:     string
  bg:        string
  minPoints: number
  gradient:  string
}> = {
  Recruit: {
    label:     'Rekrut',
    color:     'text-zinc-400',
    bg:        'bg-zinc-700',
    minPoints: 0,
    gradient:  'from-zinc-600/30 via-zinc-800/20 to-zinc-950',
  },
  Driver: {
    label:     'Kierowca',
    color:     'text-blue-400',
    bg:        'bg-blue-900/40',
    minPoints: 50,
    gradient:  'from-blue-600/25 via-blue-900/10 to-zinc-950',
  },
  Senior: {
    label:     'Senior',
    color:     'text-green-400',
    bg:        'bg-green-900/40',
    minPoints: 200,
    gradient:  'from-green-600/25 via-green-900/10 to-zinc-950',
  },
  Elite: {
    label:     'Elite',
    color:     'text-amber-400',
    bg:        'bg-amber-900/40',
    minPoints: 500,
    gradient:  'from-amber-600/25 via-amber-900/10 to-zinc-950',
  },
  Manager: {
    label:     'Manager',
    color:     'text-purple-400',
    bg:        'bg-purple-900/40',
    minPoints: 1000,
    gradient:  'from-purple-600/25 via-purple-900/10 to-zinc-950',
  },
  Owner: {
    label:     'Właściciel',
    color:     'text-red-400',
    bg:        'bg-red-900/40',
    minPoints: 9999,
    gradient:  'from-red-600/25 via-red-900/10 to-zinc-950',
  },
}

export function getRankConfig(rank: MemberRank) {
  return RANK_CONFIG[rank] ?? RANK_CONFIG['Recruit']
}

export function getNextRank(rank: MemberRank): MemberRank | null {
  const order: MemberRank[] = [
    'Recruit', 'Driver', 'Senior', 'Elite', 'Manager', 'Owner',
  ]
  const idx = order.indexOf(rank)
  return idx < order.length - 1 ? order[idx + 1] : null
}

export function pointsToNextRank(rank: MemberRank, points: number): number {
  const next = getNextRank(rank)
  if (!next) return 0
  return Math.max(0, RANK_CONFIG[next].minPoints - points)
}
