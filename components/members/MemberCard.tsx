import { Member } from '@/types'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export function MemberCard({ member }: { member: Member }) {
  const cfg = getRankConfig(member.rank)

  return (
    <div className="glass rounded-xl p-5 hover:border-amber-500/20 transition-all hover:-translate-y-0.5 group">
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="w-12 h-12 border-2 border-zinc-700 group-hover:border-amber-500/40 transition-colors">
          <AvatarImage src={member.avatar_url ?? ''} />
          <AvatarFallback className="bg-zinc-800 text-amber-400 font-bold text-lg">
            {member.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{member.username}</div>
          <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs mt-0.5`}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400/60" />
          <span>{member.points} punktów</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
          <span>od {format(new Date(member.joined_at), 'MMM yyyy', { locale: pl })}</span>
        </div>
      </div>
    </div>
  )
}
