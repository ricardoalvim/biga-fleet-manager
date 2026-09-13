import type {
  BusinessContext,
  CustomTerminology,
  PhysicalConstraints,
} from '../../entities/route-profile.entity.js'

export interface CreateRouteProfileInternalProps {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: CustomTerminology
  readonly physicalConstraints: PhysicalConstraints
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class CreateRouteProfileInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: CustomTerminology
  readonly physicalConstraints: PhysicalConstraints
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: CreateRouteProfileInternalProps) {
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
