import { z } from 'zod'

export const createSupportTicketSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(['TECHNICAL', 'BILLING', 'INTEGRATION', 'FEATURE_REQUEST', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

export const replySupportTicketSchema = z.object({
  text: z.string().min(2).max(2000),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED']).optional(),
})

export type CreateSupportTicketDto = z.infer<typeof createSupportTicketSchema>
export type ReplySupportTicketDto = z.infer<typeof replySupportTicketSchema>
