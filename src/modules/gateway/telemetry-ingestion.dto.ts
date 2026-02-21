import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  IsOptional,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class TelemetryIngestionDto {
  @ApiProperty({ example: '7e678e1e...', description: 'ID da Biga' })
  @IsUUID()
  @IsNotEmpty()
  bigaId: string

  @ApiProperty({ example: 'uuid-da-trip', description: 'ID da Corrida Ativa' })
  @IsUUID()
  @IsNotEmpty()
  tripId: string

  @ApiProperty({ example: 41.8902, description: 'Latitude atual' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number

  @ApiProperty({ example: 12.4922, description: 'Longitude atual' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number

  @ApiProperty({ example: 45.5, description: 'Velocidade da biga' })
  @IsNumber()
  @IsNotEmpty()
  speed: number

  @ApiProperty({ example: true, description: 'Cavalos atrelados (Ignição)' })
  @IsBoolean()
  isHitched: boolean

  @ApiProperty({ example: '2026-02-21T...', description: 'Data do sensor' })
  @IsString()
  @IsOptional()
  timestamp: string
}
