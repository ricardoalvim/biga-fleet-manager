import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { GeocodingService } from './geocoding.service.js'

@Module({
  imports: [HttpModule],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeoModule {}
