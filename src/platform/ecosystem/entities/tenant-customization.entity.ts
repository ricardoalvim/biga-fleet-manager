export interface TenantCustomizationProps {
  tenantId: string
  displayName: string
  logoUrl?: string | null
  primaryColor?: string
  secondaryColor?: string
  enabledModules?: string[]
  customTerminology?: Record<string, string>
  createdAt?: Date
  updatedAt?: Date
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

export const DEFAULT_ENABLED_MODULES = [
  'VEHICLES',
  'TRIPS',
  'MAINTENANCE',
  'INCIDENTS_TOLLS',
  'ROUTE_PLANNING',
  'TELEMETRY',
]

export class TenantCustomizationEntity {
  readonly tenantId: string
  readonly displayName: string
  readonly logoUrl: string | null
  readonly primaryColor: string
  readonly secondaryColor: string
  readonly enabledModules: readonly string[]
  readonly customTerminology: Readonly<Record<string, string>>
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: TenantCustomizationProps) {
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.displayName || props.displayName.trim().length === 0) {
      throw new Error('Nome de exibição (displayName) é obrigatório')
    }

    const primaryColor = props.primaryColor ?? '#1E3A8A'
    const secondaryColor = props.secondaryColor ?? '#3B82F6'

    if (!HEX_COLOR_REGEX.test(primaryColor)) {
      throw new Error(`Cor primária inválida: ${primaryColor}. Formato esperado: #RRGGBB`)
    }
    if (!HEX_COLOR_REGEX.test(secondaryColor)) {
      throw new Error(`Cor secundária inválida: ${secondaryColor}. Formato esperado: #RRGGBB`)
    }

    this.tenantId = props.tenantId
    this.displayName = props.displayName.trim()
    this.logoUrl = props.logoUrl ? props.logoUrl.trim() : null
    this.primaryColor = primaryColor.toUpperCase()
    this.secondaryColor = secondaryColor.toUpperCase()
    this.enabledModules = Object.freeze([...(props.enabledModules ?? DEFAULT_ENABLED_MODULES)])
    this.customTerminology = Object.freeze({
      ...(props.customTerminology ?? {}),
    })
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }
}
