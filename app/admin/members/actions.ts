'use server'

import { createClient }      from '@/lib/supabase/server'
import { revalidatePath }    from 'next/cache'
import { syncDiscordRole }   from '@/lib/discord/roles'
import { sendRankUpWebhook, sendBanWebhook } from '@/lib/discord/webhooks'

// ─── Typy ─────────────────────────────────────
interface AdminContext {
  supabase: Awaited<ReturnType<typeof createClient>>
  admin:    { rank: string; username: string }   // ← nie null
}

// ─── Guard ────────────────────────────────────
async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nie jesteś zalogowany')

  const { data: admin } = await supabase
    .from('members')
    .select('rank, username')
    .eq('id', user.id)
    .single()

  // Najpierw sprawdź null — potem uprawnienia
  if (!admin) throw new Error('Nie znaleziono konta')

  if (!['Owner', 'Manager'].includes(admin.rank)) {
    throw new Error('Brak uprawnień')
  }

  // Tu TypeScript już wie że admin !== null
  return { supabase, admin }
}

// ─── Zmiana rangi ─────────────────────────────
export async function changeMemberRank(memberId: string, newRank: string) {
  const { supabase, admin } = await requireAdmin()

  const { data: member } = await supabase
    .from('members')
    .select('rank, username, avatar_url, discord_id')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Nie znaleziono członka')

  // Manager nie może zmieniać rangi Ownera
  if (member.rank === 'Owner' && admin.rank !== 'Owner') {
    throw new Error('Brak uprawnień do zmiany rangi Ownera')
  }

  // Nie można nadać rangi Owner przez panel
  if (newRank === 'Owner' && admin.rank !== 'Owner') {
    throw new Error('Tylko Owner może nadawać rangę Owner')
  }

  const { error } = await supabase
    .from('members')
    .update({ rank: newRank })
    .eq('id', memberId)

  if (error) throw new Error(`Błąd zmiany rangi: ${error.message}`)

  await Promise.all([
    member.discord_id
      ? syncDiscordRole({
          discord_id: member.discord_id,
          new_rank:   newRank,
          old_rank:   member.rank,
        })
      : Promise.resolve(),

    sendRankUpWebhook({
      username:   member.username,
      avatar_url: member.avatar_url ?? null,
      old_rank:   member.rank,
      new_rank:   newRank,
    }),
  ])

  revalidatePath('/admin/members')
  revalidatePath('/hub/profile')
}

// ─── Ban ──────────────────────────────────────
export async function banMember(memberId: string, reason?: string) {
  const { supabase, admin } = await requireAdmin()

  const { data: member } = await supabase
    .from('members')
    .select('username, rank')
    .eq('id', memberId)
    .single()

  if (!member)                   throw new Error('Nie znaleziono członka')
  if (member.rank === 'Owner')   throw new Error('Nie można zbanować Ownera')
  if (memberId === (await (await createClient()).auth.getUser()).data.user?.id) {
    throw new Error('Nie możesz zbanować samego siebie')
  }

  const { error } = await supabase
    .from('members')
    .update({ is_banned: true })
    .eq('id', memberId)

  if (error) throw new Error(`Błąd bana: ${error.message}`)

  await sendBanWebhook({
    username:  member.username,
    banned_by: admin.username,
    reason,
    is_ban:    true,
  })

  revalidatePath('/admin/members')
}

// ─── Unban ────────────────────────────────────
export async function unbanMember(memberId: string) {
  const { supabase, admin } = await requireAdmin()

  const { data: member } = await supabase
    .from('members')
    .select('username')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Nie znaleziono członka')

  const { error } = await supabase
    .from('members')
    .update({ is_banned: false })
    .eq('id', memberId)

  if (error) throw new Error(`Błąd odbana: ${error.message}`)

  await sendBanWebhook({
    username:  member.username,
    banned_by: admin.username,
    is_ban:    false,
  })

  revalidatePath('/admin/members')
}
