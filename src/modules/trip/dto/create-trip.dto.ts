import { IsNotEmpty, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateTripDto {
  @ApiProperty({ description: 'ID da Biga que vai iniciar a corrida' })
  @IsUUID()
  @IsNotEmpty()
  chariotId: string
}
