export interface RolePermissionProps {
  id: string
  tenantId: string
  name: string
  description?: string
  permissions: string[]
  isSystemDefault?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class RolePermissionEntity {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly permissions: readonly string[]
  readonly isSystemDefault: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: RolePermissionProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID do papel é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do papel é obrigatório')
    }
    if (!props.permissions || props.permissions.length === 0) {
      throw new Error('Pelo menos uma permissão deve ser atribuída ao papel')
    }

    const uniquePermissions = Array.from(new Set(props.permissions.map((p) => p.trim())))

    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name.trim()
    this.description = props.description?.trim() ?? ''
    this.permissions = Object.freeze(uniquePermissions)
    this.isSystemDefault = Boolean(props.isSystemDefault)
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }

  hasPermission(permission: string): boolean {
    if (this.permissions.includes('*')) return true
    if (this.permissions.includes(permission)) return true

    // Suporte a wildcard por namespace (ex: fleet:vehicles:* cobre fleet:vehicles:read)
    const [namespace, resource] = permission.split(':')
    if (this.permissions.includes(`${namespace}:*`)) return true
    if (resource && this.permissions.includes(`${namespace}:${resource}:*`)) return true

    return false
  }
}
