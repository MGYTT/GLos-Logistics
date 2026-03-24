'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDiscordWebhook } from '@/lib/discord/bot'

export async function acceptApplication(appId: string) {
  const supabase = await createClient()

  // Sprawdź admina
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Brak autoryzacji')

  const { data: admin } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!['Owner', 'Manager'].includes(admin?.rank ?? '')) {
    throw new Error('Brak uprawnień')
  }

  // Pobierz podanie
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('*')
    .eq('id', appId)
    .single()

  if (appErr || !app) throw new Error('Nie znaleziono podania')

  // Zaktualizuj status
  const { error: updateErr } = await supabase
    .from('applications')
    .update({ status: 'accepted' })
    .eq('id', appId)

  if (updateErr) throw new Error('Błąd aktualizacji: ' + updateErr.message)

  // Utwórz rekord w members (server-side = omija RLS)
  const { error: memberErr } = await supabase
    .from('members')
    .upsert({
      id:        app.user_id,
      username:  app.username,
      steam_id:  app.steam_id,
      discord_id: app.discord_tag,
      rank:      'Recruit',
      points:    0,
      joined_at: new Date().toISOString(),
      is_banned: false,
    }, { onConflict: 'id', ignoreDuplicates: true })

  if (memberErr) throw new Error('Błąd tworzenia konta: ' + memberErr.message)

  await sendDiscordWebhook({
    title: '✅ Nowy kierowca dołączył do VTC!',
    color: 0x22c55e,
    fields: [
      { name: 'Nick',     value: app.username,              inline: true  },
      { name: 'Discord',  value: app.discord_tag,           inline: true  },
      { name: 'Steam ID', value: app.steam_id,              inline: false },
      { name: 'Godziny',  value: `${app.ets2_hours}h ETS2`, inline: true  },
    ],
  })

  revalidatePath('/admin/recruitment')
  revalidatePath('/admin/members')
}

export async function rejectApplication(appId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Brak autoryzacji')

  const { data: app } = await supabase
    .from('applications')
    .select('username, discord_tag')
    .eq('id', appId)
    .single()

  const { error } = await supabase
    .from('applications')
    .update({ status: 'rejected' })
    .eq('id', appId)

  if (error) throw new Error('Błąd aktualizacji: ' + error.message)

  await sendDiscordWebhook({
    title: '❌ Podanie odrzucone',
    color: 0xef4444,
    fields: [
      { name: 'Nick',    value: app?.username    ?? '—', inline: true },
      { name: 'Discord', value: app?.discord_tag ?? '—', inline: true },
    ],
  })

  revalidatePath('/admin/recruitment')
}
