import { IsString, IsNotEmpty, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateChariotDto {
  @ApiProperty({ example: 'SPQR-001', description: 'Placa de identificação única da Biga' })
  @IsString()
  @IsNotEmpty()
  plate: string

  @ApiProperty({ example: 'Biga de Combate V6', description: 'Modelo e especificação da Biga' })
  @IsString()
  @IsNotEmpty()
  model: string

  @ApiProperty({ description: 'ID da Empresa Locadora (Dona)' })
  @IsUUID()
  @IsNotEmpty()
  ownerId: string

  @ApiProperty({ description: 'ID da Empresa Cliente (Contratante)' })
  @IsUUID()
  @IsNotEmpty()
  contractorId: string

  @ApiProperty({ description: 'ID da Oficina (Custodiante)' })
  @IsUUID()
  @IsNotEmpty()
  custodianId: string
}
