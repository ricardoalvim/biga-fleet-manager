import { z } from 'zod'

export const registerWebhookSchema = z.object({
  tenantId: z.string().uuid().optional(),
  name: z.string().min(3).max(120),
  targetUrl: z
    .string()
    .url()
    .regex(/^https?:\/\//, 'URL deve utilizar protocolo http ou https'),
  subscribedEvents: z.array(z.string().min(1)).min(1, 'Pelo menos um evento deve ser selecionado'),
  secretToken: z.string().min(16).max(128).optional(),
})

export type RegisterWebhookDto = z.infer<typeof registerWebhookSchema>
