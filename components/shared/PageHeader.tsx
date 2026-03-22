import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, iconColor = 'text-amber-400', children }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black">{title}</h1>
          {description && <p className="text-zinc-500 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
