export interface MenuItemInternalProps {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly icon: string
  readonly moduleKey: string
  readonly requiredPermission: string
  readonly badge?: string
  readonly children?: MenuItemInternalProps[]
}

export class MenuItemInternalDto {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly icon: string
  readonly moduleKey: string
  readonly requiredPermission: string
  readonly badge?: string
  readonly children?: readonly MenuItemInternalDto[]

  constructor(props: MenuItemInternalProps) {
    this.id = props.id
    this.label = props.label
    this.path = props.path
    this.icon = props.icon
    this.moduleKey = props.moduleKey
    this.requiredPermission = props.requiredPermission
    this.badge = props.badge
    this.children = props.children
      ? Object.freeze(props.children.map((c) => new MenuItemInternalDto(c)))
      : undefined

    Object.freeze(this)
  }
}

export interface PortalMenuTreeInternalProps {
  readonly tenantId: string
  readonly roleId?: string
  readonly roleName: string
  readonly branding: {
    readonly displayName: string
    readonly logoUrl?: string | null
    readonly primaryColor: string
    readonly secondaryColor: string
  }
  readonly items: MenuItemInternalProps[]
}

export class PortalMenuTreeInternalDto {
  readonly tenantId: string
  readonly roleId?: string
  readonly roleName: string
  readonly branding: {
    readonly displayName: string
    readonly logoUrl: string | null
    readonly primaryColor: string
    readonly secondaryColor: string
  }
  readonly items: readonly MenuItemInternalDto[]

  constructor(props: PortalMenuTreeInternalProps) {
    this.tenantId = props.tenantId
    this.roleId = props.roleId
    this.roleName = props.roleName
    this.branding = Object.freeze({
      displayName: props.branding.displayName,
      logoUrl: props.branding.logoUrl ?? null,
      primaryColor: props.branding.primaryColor,
      secondaryColor: props.branding.secondaryColor,
    })
    this.items = Object.freeze(props.items.map((i) => new MenuItemInternalDto(i)))

    Object.freeze(this)
  }
}
