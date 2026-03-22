import { z } from 'zod'

export const memberUpdateSchema = z.object({
  username:       z.string().min(3).max(32),
  steam_id:       z.string().optional(),
  truckershub_id: z.string().optional(),
  discord_id:     z.string().optional(),
})

export type MemberUpdate = z.infer<typeof memberUpdateSchema>
