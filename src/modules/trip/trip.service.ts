import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { CreateTripDto } from './dto/create-trip.dto'

@Injectable()
export class TripService {
    constructor(private readonly prisma: PrismaService) { }

    async startTrip(dto: CreateTripDto) {
        const chariot = await this.prisma.chariot.findUnique({
            where: { id: dto.chariotId },
        })

        if (!chariot) {
            throw new NotFoundException('Biga não encontrada nas garagens do Império.')
        }

        const activeTrip = await this.prisma.trip.findFirst({
            where: { chariotId: dto.chariotId, endedAt: null },
        })

        if (activeTrip) {
            throw new BadRequestException('Esta biga já está na rua em uma corrida ativa!')
        }

        return this.prisma.trip.create({
            data: {
                chariotId: dto.chariotId,
                isHitched: true,
            },
        })
    }

    async finishTrip(tripId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } })

        if (!trip) throw new NotFoundException('Corrida não encontrada.')
        if (trip.endedAt) throw new BadRequestException('Esta corrida já foi finalizada.')

        return this.prisma.trip.update({
            where: { id: tripId },
            data: {
                endedAt: new Date(),
                isHitched: false,
            },
        })
    }

    async findActiveTrips() {
        return this.prisma.trip.findMany({
            where: { endedAt: null },
            include: { chariot: true },
        })
    }
}