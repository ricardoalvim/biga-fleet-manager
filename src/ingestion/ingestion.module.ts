import { Module } from '@nestjs/common'
import { IngestionController } from './ingestion.controller.js'
import { IngestionPublisher } from './ingestion.publisher.js'

@Module({
  controllers: [IngestionController],
  providers: [IngestionPublisher],
})
export class IngestionModule {}
