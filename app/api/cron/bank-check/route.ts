import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse('Unauthorized', { status: 401 })

  // Oznacz przeterminowane pożyczki i dojrzałe lokaty
  await admin.rpc('mark_overdue_loans')

  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
