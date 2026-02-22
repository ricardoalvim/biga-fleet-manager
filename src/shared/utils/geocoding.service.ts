import { Injectable, Inject, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Redis } from 'ioredis'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name)

    constructor(
        private readonly httpService: HttpService,
        @Inject('REDIS_PUBLISHER_CLIENT') private readonly redis: Redis
    ) { }

    async reverse(lat: number, lng: number): Promise<string> {
        const cacheKey = `geo:${lat.toFixed(4)}:${lng.toFixed(4)}`

        try {
            const cached = await this.redis.get(cacheKey)
            if (cached) return cached

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
            const { data } = await firstValueFrom(
                this.httpService.get(url, { headers: { 'User-Agent': 'BigaFleet/1.0' } })
            )

            const address = data?.display_name || `Lat: ${lat}, Lng: ${lng}`

            await this.redis.set(cacheKey, address, 'EX', 86400)

            return address
        } catch (error) {
            this.logger.error(`Erro no Georeverse: ${error.message}`)
            return 'Endereço Indisponível'
        }
    }
}