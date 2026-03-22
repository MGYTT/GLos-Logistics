import { NextRequest, NextResponse }    from 'next/server'
import { createClient }                 from '@/lib/supabase/server'
import { recruitmentSchema }            from '@/lib/validations/recruitment'
import { sendRecruitmentWebhook }       from '@/lib/discord/webhooks'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = recruitmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: inserted, error } = await supabase
    .from('applications')
    .insert({
      username:       parsed.data.username,
      steam_id:       parsed.data.steam_id,
      discord_tag:    parsed.data.discord_tag,
      truckershub_id: parsed.data.truckershub_id ?? null,
      ets2_hours:     parsed.data.ets2_hours,
      motivation:     parsed.data.motivation,
      status:         'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Recruitment] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // ── Discord webhook ─────────────────────────
  await sendRecruitmentWebhook({
    username:   parsed.data.username,
    steam_name: parsed.data.steam_id ?? parsed.data.username,
    hours_ets2: parsed.data.ets2_hours,
    applied_at: new Date().toISOString(),
    apply_id:   inserted.id,
  })

  return NextResponse.json({ success: true })
}
