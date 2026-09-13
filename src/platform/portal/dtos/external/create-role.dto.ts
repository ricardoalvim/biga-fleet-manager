import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(250).optional(),
  permissions: z.array(z.string().min(1)).min(1, 'Pelo menos uma permissão deve ser selecionada'),
})

export type CreateRoleDto = z.infer<typeof createRoleSchema>
