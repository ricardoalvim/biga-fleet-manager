import { z } from 'zod'

export const tripIdParamSchema = z.string().uuid()
