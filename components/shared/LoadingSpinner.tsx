import { cn } from '@/lib/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: Props) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'rounded-full border-2 border-zinc-700 border-t-amber-400 animate-spin',
        sizes[size]
      )} />
    </div>
  )
}
