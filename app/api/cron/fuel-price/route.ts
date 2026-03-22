import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Losowa zmiana ceny paliwa ±12%
  const { data: current } = await supabase
    .from('fuel_prices')
    .select('price')
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  const basePrice    = current?.price ?? 2.8
  const changePct    = (Math.random() * 0.24) - 0.12  // -12% do +12%
  const newPrice     = Math.max(1.5, Math.min(5.0,
    Math.round(basePrice * (1 + changePct) * 100) / 100
  ))

  const now  = new Date()
  const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  await supabase.from('fuel_prices').insert({
    price:       newPrice,
    valid_from:  now.toISOString(),
    valid_until: next.toISOString(),
  })

  return NextResponse.json({
    ok:        true,
    old_price: basePrice,
    new_price: newPrice,
    change_pct: (changePct * 100).toFixed(1) + '%',
  })
}
