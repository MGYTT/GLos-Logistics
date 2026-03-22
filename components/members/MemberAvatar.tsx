import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

interface Props {
  username: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export function MemberAvatar({ username, avatarUrl, size = 'md', className }: Props) {
  return (
    <Avatar className={cn(sizes[size], 'border border-zinc-700', className)}>
      <AvatarImage src={avatarUrl ?? ''} alt={username} />
      <AvatarFallback className="bg-zinc-800 text-amber-400 font-bold">
        {username[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
