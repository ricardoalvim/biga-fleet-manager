import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator'
import { Transform } from 'class-transformer'
import { CompanyType } from '@prisma/client'

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @Length(14, 14, { message: 'O taxId deve ter exatamente 14 dígitos numéricos' })
  @Transform(({ value }) => value.replace(/\D/g, '')) // Limpa pontos, barras e traços
  taxId: string

  @IsEnum(CompanyType)
  @IsNotEmpty()
  type: CompanyType
}
