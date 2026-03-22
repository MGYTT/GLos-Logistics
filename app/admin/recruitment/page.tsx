import { createClient }       from '@/lib/supabase/server'
import { ApplicationsPanel }  from '@/components/admin/JobsModerationTable'
import { FileText }           from 'lucide-react'

export const metadata = { title: 'Admin — Rekrutacja' }
export const dynamic  = 'force-dynamic'

export default async function AdminRecruitmentPage() {
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = applications?.filter(a => a.status === 'pending').length ?? 0

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
          border ${pending > 0
            ? 'bg-red-400/10 border-red-400/20'
            : 'bg-zinc-700/10 border-zinc-700/20'
          }`}>
          <FileText className={`w-5 h-5 ${
            pending > 0 ? 'text-red-400' : 'text-zinc-500'
          }`} />
        </div>
        <div>
          <h1 className="text-2xl font-black">Rekrutacja</h1>
          <p className="text-zinc-500 text-sm">
            {pending > 0
              ? `${pending} oczekujących podań`
              : 'Brak nowych podań'}
          </p>
        </div>
      </div>
      <ApplicationsPanel applications={applications ?? []} />
    </div>
  )
}
