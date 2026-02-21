import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { CreateCompanyDto } from './dto/create-company.dto'

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCompanyDto) {
        const existing = await this.prisma.company.findUnique({
            where: { taxId: dto.taxId },
        })

        if (existing) {
            throw new ConflictException('Uma empresa com este documento já existe')
        }

        return this.prisma.company.create({
            data: {
                name: dto.name,
                taxId: dto.taxId,
                type: dto.type,
            },
        })
    }

    async findAll() {
        return this.prisma.company.findMany({
            orderBy: { name: 'asc' },
        })
    }
}