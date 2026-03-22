import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  // Weryfikacja — tylko Vercel Cron może wywołać ten endpoint
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase.rpc('run_weekly_bonuses')

  if (error) {
    console.error('[Cron] weekly_bonuses error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('[Cron] weekly_bonuses result:', data)
  return NextResponse.json({ ok: true, result: data })
}
