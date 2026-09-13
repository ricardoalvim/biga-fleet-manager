export interface RoleInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly permissions: readonly string[]
  readonly isSystemDefault: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export class RoleInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly permissions: readonly string[]
  readonly isSystemDefault: boolean
  readonly createdAt: string
  readonly updatedAt: string

  constructor(props: RoleInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name
    this.description = props.description
    this.permissions = Object.freeze([...props.permissions])
    this.isSystemDefault = props.isSystemDefault
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}
