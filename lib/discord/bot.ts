export async function sendDiscordWebhook(content: {
  title: string
  description?: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: content.title,
        description: content.description,
        color: content.color ?? 0xf59e0b,
        fields: content.fields ?? [],
        timestamp: new Date().toISOString(),
      }],
    }),
  })
}

export async function assignDiscordRole(userId: string, roleId: string) {
  const guildId = process.env.DISCORD_GUILD_ID
  const token   = process.env.DISCORD_BOT_TOKEN
  if (!guildId || !token) return

  await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
  })
}
