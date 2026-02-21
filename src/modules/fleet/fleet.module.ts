import { Module } from '@nestjs/common'
import { FleetService } from './fleet.service'
import { FleetController } from './fleet.controller'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'

@Module({
  controllers: [FleetController],
  providers: [FleetService, PrismaService],
})
export class FleetModule {}
