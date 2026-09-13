import { z } from 'zod'

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(2342),
    DATABASE_URL: z
      .string()
      .min(1)
      .default('postgresql://postgres:postgres@localhost:5432/biga_fleet?schema=public'),
    MONGO_URL: z
      .string()
      .min(1)
      .default('mongodb://admin:admin@localhost:27017/biga_fleet?authSource=admin'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_TELEMETRY_CHANNEL: z.string().default('vehicle_telemetry_stream'),
  })
  .passthrough()

export type Env = z.infer<typeof envSchema>
