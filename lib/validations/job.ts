import { z } from 'zod'

export const jobSchema = z.object({
  cargo:            z.string().min(1),
  origin_city:      z.string().min(1),
  destination_city: z.string().min(1),
  distance_km:      z.coerce.number().min(1).max(10000),
  income:           z.coerce.number().min(0),
  fuel_used:        z.coerce.number().min(0),
  damage_percent:   z.coerce.number().min(0).max(100),
})

export type JobForm = z.infer<typeof jobSchema>
