export type BusinessContext = 'DELIVERY' | 'PASSENGER' | 'HEAVY_CARGO' | 'AGRICULTURAL'

export interface CustomTerminology {
  readonly stopPointLabel: string
  readonly assetLabel: string
  readonly routeLabel: string
}

export interface PhysicalConstraints {
  readonly maxWeightTons: number
  readonly maxHeightMeters: number
  readonly allowUnpavedRoads: boolean
  readonly maxSpeedKmh: number
}

export interface RouteProfileProps {
  id: string
  tenantId: string
  name: string
  businessContext: BusinessContext
  customTerminology: CustomTerminology
  physicalConstraints: PhysicalConstraints
  createdAt?: Date
  updatedAt?: Date
}

export class RouteProfileEntity {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: CustomTerminology
  readonly physicalConstraints: PhysicalConstraints
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: RouteProfileProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID do perfil de rota é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do perfil é obrigatório')
    }

    const validContexts: BusinessContext[] = [
      'DELIVERY',
      'PASSENGER',
      'HEAVY_CARGO',
      'AGRICULTURAL',
    ]
    if (!validContexts.includes(props.businessContext)) {
      throw new Error(`Contexto de negócio inválido: ${props.businessContext}`)
    }

    if (!props.customTerminology) {
      throw new Error('Terminologia customizada é obrigatória')
    }
    if (
      !props.customTerminology.stopPointLabel ||
      !props.customTerminology.assetLabel ||
      !props.customTerminology.routeLabel
    ) {
      throw new Error('Todos os rótulos de terminologia devem ser preenchidos')
    }

    if (!props.physicalConstraints) {
      throw new Error('Restrições físicas são obrigatórias')
    }
    if (props.physicalConstraints.maxWeightTons < 0) {
      throw new Error('Peso máximo não pode ser negativo')
    }
    if (props.physicalConstraints.maxHeightMeters < 0) {
      throw new Error('Altura máxima não pode ser negativa')
    }
    if (props.physicalConstraints.maxSpeedKmh <= 0) {
      throw new Error('Velocidade máxima deve ser maior que zero')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name.trim()
    this.businessContext = props.businessContext
    this.customTerminology = {
      stopPointLabel: props.customTerminology.stopPointLabel.trim(),
      assetLabel: props.customTerminology.assetLabel.trim(),
      routeLabel: props.customTerminology.routeLabel.trim(),
    }
    this.physicalConstraints = {
      maxWeightTons: Number(props.physicalConstraints.maxWeightTons),
      maxHeightMeters: Number(props.physicalConstraints.maxHeightMeters),
      allowUnpavedRoads: Boolean(props.physicalConstraints.allowUnpavedRoads),
      maxSpeedKmh: Number(props.physicalConstraints.maxSpeedKmh),
    }
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
    Object.freeze(this.customTerminology)
    Object.freeze(this.physicalConstraints)
  }
}
