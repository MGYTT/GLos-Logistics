import { z } from 'zod'

export const recruitmentSchema = z.object({
  username: z.string().min(3, 'Minimum 3 znaki').max(32),
  steam_id: z.string().min(10, 'Podaj Steam ID').max(20),
  truckershub_id: z.string().optional(),
  discord_tag: z.string().min(2, 'Podaj Discord tag'),
  ets2_hours: z.coerce.number().min(100, 'Minimum 100h w ETS2'),
  motivation: z.string().min(50, 'Napisz co najmniej 50 znaków').max(1000),
  accepted_rules: z.boolean().refine(v => v === true, 'Musisz zaakceptować regulamin'),
})

export type RecruitmentForm = z.infer<typeof recruitmentSchema>
