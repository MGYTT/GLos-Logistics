import Papa from 'papaparse'
import { Job } from '@/types'

export function exportJobsToCSV(jobs: Job[], filename = 'jobs-export.csv') {
  const data = jobs.map(j => ({
    Data: new Date(j.completed_at).toLocaleDateString('pl-PL'),
    Ładunek: j.cargo,
    'Miasto startowe': j.origin_city,
    'Miasto docelowe': j.destination_city,
    'Dystans (km)': j.distance_km,
    'Zarobki (€)': j.income,
    'Paliwo (L)': j.fuel_used.toFixed(1),
    'Uszkodzenie (%)': j.damage_percent.toFixed(1),
  }))
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
