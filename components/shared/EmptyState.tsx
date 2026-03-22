import { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 glass rounded-2xl text-center px-6">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-zinc-600" />
      </div>
      <h3 className="font-bold text-lg text-zinc-400 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-600 max-w-xs">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
