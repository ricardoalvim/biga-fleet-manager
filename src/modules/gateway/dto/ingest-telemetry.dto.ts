import { IsString, IsNumber, IsUUID, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class IngestTelemetryDto {
    @ApiProperty({ description: 'ID da Biga que está gerando a telemetria' })
    @IsUUID()
    @IsNotEmpty()
    chariotId: string

    @ApiProperty({ description: 'ID da Corrida Ativa (Trip)' })
    @IsUUID()
    @IsNotEmpty()
    tripId: string

    @ApiProperty({ example: -22.6614, description: 'Latitude atual (ex: Assis, SP)' })
    @IsNumber()
    @IsNotEmpty()
    latitude: number

    @ApiProperty({ example: -50.4169, description: 'Longitude atual' })
    @IsNumber()
    @IsNotEmpty()
    longitude: number

    @ApiProperty({ example: 45.5, description: 'Velocidade em km/h' })
    @IsNumber()
    @IsNotEmpty()
    speed: number

    @ApiProperty({ example: '2026-02-21T22:00:00Z', description: 'Timestamp do sensor GPS' })
    @IsString()
    @IsNotEmpty()
    timestamp: string
}