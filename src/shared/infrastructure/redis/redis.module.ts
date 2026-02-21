import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_PUBLISHER_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        })
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUBSCRIBER_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        })
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_PUBLISHER_CLIENT', 'REDIS_SUBSCRIBER_CLIENT'],
})
export class RedisModule {}
