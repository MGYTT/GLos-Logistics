const RANK_TO_ROLE: Record<string, string> = {
  Recruit: process.env.DISCORD_ROLE_RECRUIT  ?? '',
  Driver:  process.env.DISCORD_ROLE_DRIVER   ?? '',
  Senior:  process.env.DISCORD_ROLE_SENIOR   ?? '',
  Elite:   process.env.DISCORD_ROLE_ELITE    ?? '',
  Manager: process.env.DISCORD_ROLE_MANAGER  ?? '',
  Owner:   process.env.DISCORD_ROLE_OWNER    ?? '',
}

export async function syncDiscordRole(data: {
  discord_id: string
  new_rank:   string
  old_rank?:  string
}) {
  const token   = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID
  if (!token || !guildId || !data.discord_id) return

  const base = `https://discord.com/api/v10/guilds/${guildId}/members/${data.discord_id}/roles`
  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
    'X-Audit-Log-Reason': `GLos Logistics rank sync: ${data.new_rank}`,
  }

  // Usuń starą rolę
  if (data.old_rank && RANK_TO_ROLE[data.old_rank]) {
    await fetch(`${base}/${RANK_TO_ROLE[data.old_rank]}`, {
      method: 'DELETE', headers,
    })
  }

  // Nadaj nową rolę
  if (RANK_TO_ROLE[data.new_rank]) {
    await fetch(`${base}/${RANK_TO_ROLE[data.new_rank]}`, {
      method: 'PUT', headers,
    })
  }
}
