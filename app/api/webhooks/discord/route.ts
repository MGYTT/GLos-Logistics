import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignDiscordRole } from '@/lib/discord/bot'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  if (body.type === 'APPLICATION_ACCEPTED') {
    const { discord_id, member_id } = body

    const roleId = process.env.DISCORD_DRIVER_ROLE_ID
    if (discord_id && roleId) {
      await assignDiscordRole(discord_id, roleId)
    }

    await supabase.from('members').update({ discord_id }).eq('id', member_id)
  }

  return NextResponse.json({ ok: true })
}
