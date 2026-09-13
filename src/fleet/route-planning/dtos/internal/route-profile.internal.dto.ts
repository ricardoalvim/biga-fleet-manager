import type {
  BusinessContext,
  CustomTerminology,
  PhysicalConstraints,
} from '../../entities/route-profile.entity.js'

export interface RouteProfileInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: CustomTerminology
  readonly physicalConstraints: PhysicalConstraints
  readonly createdAt: string
  readonly updatedAt: string
}

export class RouteProfileInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: CustomTerminology
  readonly physicalConstraints: PhysicalConstraints
  readonly createdAt: string
  readonly updatedAt: string

  constructor(props: RouteProfileInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name
    this.businessContext = props.businessContext
    this.customTerminology = Object.freeze({ ...props.customTerminology })
    this.physicalConstraints = Object.freeze({ ...props.physicalConstraints })
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}
