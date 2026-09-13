import { z } from 'zod'

export const updateOnboardingStepSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateOnboardingStepDto = z.infer<typeof updateOnboardingStepSchema>
