import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { CreateChariotDto } from './dto/create-chariot.dto'

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChariotDto) {
    const existing = await this.prisma.chariot.findUnique({
      where: { plate: dto.plate },
    })

    if (existing) {
      throw new ConflictException('Uma biga com esta placa já está registrada no Império.')
    }

    return this.prisma.chariot.create({
      data: dto,
    })
  }

  async findAll() {
    return this.prisma.chariot.findMany({
      include: {
        owner: true,
        contractor: true,
        custodian: true,
      },
    })
  }
}
