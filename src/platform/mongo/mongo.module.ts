import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import dns from 'node:dns/promises'

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        let uri = config.getOrThrow<string>('MONGO_URL')
        if (uri.includes('mongodb:') || uri.includes('@mongodb:')) {
          try {
            await dns.lookup('mongodb')
          } catch {
            uri = uri.replace('//mongodb:', '//localhost:').replace('@mongodb:', '@localhost:')
          }
        }
        return { uri }
      },
    }),
  ],
})
export class MongoModule {}
