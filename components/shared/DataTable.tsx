import { cn } from '@/lib/utils/cn'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyText?: string
}

export function DataTable<T>({ columns, data, keyExtractor, emptyText = 'Brak danych' }: Props<T>) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map(row => (
            <tr key={keyExtractor(row)} className="hover:bg-white/2 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-zinc-600">{emptyText}</div>
      )}
    </div>
  )
}
