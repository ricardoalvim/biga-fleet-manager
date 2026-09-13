import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import dns from 'node:dns/promises'
import { REDIS_PUBLISHER, REDIS_SUBSCRIBER } from './redis.tokens.js'

async function resolveRedisHost(configuredHost: string): Promise<string> {
  if (configuredHost === 'redis') {
    try {
      await dns.lookup('redis')
      return configuredHost
    } catch {
      return 'localhost'
    }
  }
  return configuredHost
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_PUBLISHER,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) =>
        new Redis({
          host: await resolveRedisHost(config.get('REDIS_HOST', 'localhost')),
          port: config.get('REDIS_PORT', 6379),
        }),
    },
    {
      provide: REDIS_SUBSCRIBER,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) =>
        new Redis({
          host: await resolveRedisHost(config.get('REDIS_HOST', 'localhost')),
          port: config.get('REDIS_PORT', 6379),
        }),
    },
  ],
  exports: [REDIS_PUBLISHER, REDIS_SUBSCRIBER],
})
export class RedisModule {}
