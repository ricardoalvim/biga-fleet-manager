import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class TelemetryIngestionDto {
    @ApiProperty({ example: 'B-XCVII', description: 'Identificador único da Biga' })
    @IsString()
    @IsNotEmpty()
    bigaId: string

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
}