import { Inject, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Redis } from 'ioredis'
import { firstValueFrom } from 'rxjs'
import { REDIS_PUBLISHER } from '../redis/redis.tokens.js'

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name)

  constructor(
    private readonly httpService: HttpService,
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
  ) {}

  async reverse(lat: number, lng: number): Promise<string> {
    const cacheKey = `geo:${lat.toFixed(4)}:${lng.toFixed(4)}`

    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) return cached

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      const { data } = await firstValueFrom(
        this.httpService.get<{ display_name?: string }>(url, {
          headers: { 'User-Agent': 'FleetManager/1.0' },
        }),
      )

      const address = data?.display_name || `Lat: ${lat}, Lng: ${lng}`
      await this.redis.set(cacheKey, address, 'EX', 86400)
      return address
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Georeverse failed: ${message}`)
      return 'Endereço Indisponível'
    }
  }
}
