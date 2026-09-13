export interface TenantCustomizationInternalDtoProps {
  readonly tenantId: string
  readonly displayName: string
  readonly logoUrl?: string | null
  readonly primaryColor: string
  readonly secondaryColor: string
  readonly enabledModules: readonly string[]
  readonly customTerminology: Readonly<Record<string, string>>
  readonly createdAt: string
  readonly updatedAt: string
}

export class TenantCustomizationInternalDto {
  readonly tenantId: string
  readonly displayName: string
  readonly logoUrl: string | null
  readonly primaryColor: string
  readonly secondaryColor: string
  readonly enabledModules: readonly string[]
  readonly customTerminology: Readonly<Record<string, string>>
  readonly createdAt: string
  readonly updatedAt: string

  constructor(props: TenantCustomizationInternalDtoProps) {
    this.tenantId = props.tenantId
    this.displayName = props.displayName
    this.logoUrl = props.logoUrl ?? null
    this.primaryColor = props.primaryColor
    this.secondaryColor = props.secondaryColor
    this.enabledModules = Object.freeze([...props.enabledModules])
    this.customTerminology = Object.freeze({ ...props.customTerminology })
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}
