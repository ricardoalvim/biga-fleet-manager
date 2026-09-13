import { z } from 'zod'

export const createVehicleSchema = z.object({
  tenantId: z.string().uuid('tenantId deve ser um UUID válido').optional(),
  plate: z
    .string()
    .min(5, 'Placa deve conter ao menos 5 caracteres')
    .max(10, 'Placa deve conter no máximo 10 caracteres')
    .transform((value) => value.toUpperCase().trim()),
  model: z.string().min(1, 'Modelo do veículo é obrigatório'),
  ownerId: z.string().uuid('ownerId deve ser um UUID válido de uma empresa proprietária'),
  contractorId: z.string().uuid('contractorId deve ser um UUID válido de uma empresa contratante'),
  custodianId: z.string().uuid('custodianId deve ser um UUID válido de uma empresa custodiante'),
})

export type CreateVehicleRequestDto = z.infer<typeof createVehicleSchema>
