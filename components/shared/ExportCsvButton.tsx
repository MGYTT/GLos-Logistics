'use client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Job } from '@/types'
import { exportJobsToCSV } from '@/lib/utils/csv'

export function ExportCsvButton({ jobs, filename }: { jobs: Job[]; filename?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-zinc-700 gap-2 hover:border-amber-500 hover:text-amber-400"
      onClick={() => exportJobsToCSV(jobs, filename)}
    >
      <Download className="w-4 h-4" />
      Eksportuj CSV
    </Button>
  )
}
