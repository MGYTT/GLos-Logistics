// Kolory embedów — GLos Logistics palette
const COLORS = {
  amber:   0xF59E0B,   // job delivered, sukces
  green:   0x22C55E,   // awans rangi
  blue:    0x3B82F6,   // nowy news
  red:     0xEF4444,   // ban, anulowanie
  purple:  0xA855F7,   // nowe podanie
  zinc:    0x52525B,   // neutralny
} as const

// ─── Typy ─────────────────────────────────────
interface DiscordEmbed {
  title?:       string
  description?: string
  color?:       number
  fields?:      { name: string; value: string; inline?: boolean }[]
  footer?:      { text: string; icon_url?: string }
  thumbnail?:   { url: string }
  timestamp?:   string
}

async function sendWebhook(
  webhookUrl: string,
  payload: { username?: string; avatar_url?: string; embeds: DiscordEmbed[] }
) {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        username:   payload.username   ?? 'GLos Logistics',
        avatar_url: payload.avatar_url ?? process.env.NEXT_PUBLIC_BOT_AVATAR_URL,
        embeds:     payload.embeds,
      }),
    })
  } catch (e) {
    console.error('[Discord Webhook] Error:', e)
  }
}

// ─── Job Delivered ────────────────────────────
export async function sendJobDeliveredWebhook(data: {
  username:         string
  avatar_url:       string | null
  rank:             string
  origin_city:      string
  destination_city: string
  distance_km:      number
  income:           number
  damage_percent:   number
  cargo:            string | null
}) {
  const url = process.env.DISCORD_WEBHOOK_JOBS
  if (!url) return

  const damageEmoji = data.damage_percent === 0 ? '✅' : data.damage_percent < 20 ? '⚠️' : '❌'
  const rankEmojis: Record<string, string> = {
    Owner: '👑', Manager: '🛡️', Elite: '💎',
    Senior: '⭐', Driver: '🚛', Recruit: '🔰',
  }

  await sendWebhook(url, {
    embeds: [{
      color:       COLORS.amber,
      title:       `🚛 Dostarczone zlecenie`,
      description: `**${data.username}** ukończył trasę`,
      thumbnail:   data.avatar_url ? { url: data.avatar_url } : undefined,
      fields: [
        {
          name:   '📍 Trasa',
          value:  `\`${data.origin_city}\` → \`${data.destination_city}\``,
          inline: false,
        },
        {
          name:   '📦 Ładunek',
          value:  data.cargo ?? '—',
          inline: true,
        },
        {
          name:   '📏 Dystans',
          value:  `${data.distance_km.toLocaleString('pl-PL')} km`,
          inline: true,
        },
        {
          name:   '💰 Wypłata',
          value:  `**${data.income.toLocaleString('pl-PL')} VTC€**`,
          inline: true,
        },
        {
          name:   `${damageEmoji} Uszkodzenia`,
          value:  `${data.damage_percent}%`,
          inline: true,
        },
        {
          name:   '🏅 Ranga',
          value:  `${rankEmojis[data.rank] ?? ''} ${data.rank}`,
          inline: true,
        },
      ],
      footer:    { text: 'GLos Logistics • VTC Bridge' },
      timestamp: new Date().toISOString(),
    }],
  })
}

// ─── Nowy news ────────────────────────────────
export async function sendNewsWebhook(data: {
  title:      string
  slug:       string
  excerpt?:   string
  author:     string
  featured:   boolean
}) {
  const url = process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS
  if (!url) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gloslogistics.pl'

  await sendWebhook(url, {
    embeds: [{
      color:       COLORS.blue,
      title:       `📰 ${data.featured ? '⭐ ' : ''}${data.title}`,
      description: data.excerpt
        ? `${data.excerpt.slice(0, 200)}${data.excerpt.length > 200 ? '...' : ''}`
        : 'Nowy artykuł na stronie VTC.',
      fields: [
        {
          name:   '✍️ Autor',
          value:  data.author,
          inline: true,
        },
        {
          name:   '🔗 Link',
          value:  `[Czytaj dalej](${siteUrl}/news/${data.slug})`,
          inline: true,
        },
      ],
      footer:    { text: 'GLos Logistics • Aktualności' },
      timestamp: new Date().toISOString(),
    }],
  })
}

// ─── Nowe podanie rekrutacyjne ─────────────────
export async function sendRecruitmentWebhook(data: {
  username:   string
  steam_name: string
  hours_ets2: number
  applied_at: string
  apply_id:   string
}) {
  const url = process.env.DISCORD_WEBHOOK_RECRUITMENT
  if (!url) return

  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gloslogistics.pl'

  await sendWebhook(url, {
    embeds: [{
      color:       COLORS.purple,
      title:       '📋 Nowe podanie rekrutacyjne',
      description: `Kandydat **${data.username}** złożył podanie do GLos Logistics.`,
      fields: [
        {
          name:   '👤 Nick Steam',
          value:  data.steam_name,
          inline: true,
        },
        {
          name:   '⏱️ Godziny ETS2',
          value:  `${data.hours_ets2.toLocaleString('pl-PL')} h`,
          inline: true,
        },
        {
          name:   '🔗 Panel admina',
          value:  `[Sprawdź podanie](${adminUrl}/admin/recruitment)`,
          inline: false,
        },
      ],
      footer:    { text: `ID: ${data.apply_id} • GLos Logistics` },
      timestamp: data.applied_at,
    }],
  })
}

// ─── Awans rangi ──────────────────────────────
export async function sendRankUpWebhook(data: {
  username:  string
  avatar_url: string | null
  old_rank:  string
  new_rank:  string
}) {
  const url = process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS
  if (!url) return

  const rankOrder = ['Recruit', 'Driver', 'Senior', 'Elite', 'Manager', 'Owner']
  const isPromo   = rankOrder.indexOf(data.new_rank) > rankOrder.indexOf(data.old_rank)

  await sendWebhook(url, {
    embeds: [{
      color:       isPromo ? COLORS.green : COLORS.red,
      title:       isPromo ? '🎉 Awans rangi!' : '📉 Zmiana rangi',
      description: isPromo
        ? `Gratulacje **${data.username}**! Awansował na rangę **${data.new_rank}**! 🏆`
        : `**${data.username}** zmienił rangę na **${data.new_rank}**.`,
      thumbnail:   data.avatar_url ? { url: data.avatar_url } : undefined,
      fields: [
        {
          name:   'Poprzednia ranga',
          value:  data.old_rank,
          inline: true,
        },
        {
          name:   'Nowa ranga',
          value:  `**${data.new_rank}**`,
          inline: true,
        },
      ],
      footer:    { text: 'GLos Logistics • System rang' },
      timestamp: new Date().toISOString(),
    }],
  })
}

// ─── Ban / Unban ──────────────────────────────
export async function sendBanWebhook(data: {
  username:   string
  banned_by:  string
  reason?:    string
  is_ban:     boolean
}) {
  const url = process.env.DISCORD_WEBHOOK_ADMIN_LOG
  if (!url) return

  await sendWebhook(url, {
    embeds: [{
      color:       data.is_ban ? COLORS.red : COLORS.green,
      title:       data.is_ban ? '🔨 Zbanowany kierowca' : '✅ Odbanowany kierowca',
      fields: [
        { name: 'Kierowca',   value: data.username,           inline: true },
        { name: 'Przez',      value: data.banned_by,          inline: true },
        { name: 'Powód',      value: data.reason ?? '—',      inline: false },
      ],
      footer:    { text: 'GLos Logistics • Admin Log' },
      timestamp: new Date().toISOString(),
    }],
  })
}
