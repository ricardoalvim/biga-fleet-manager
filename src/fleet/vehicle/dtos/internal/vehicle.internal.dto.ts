export class VehicleCompanySummaryDto {
  readonly id!: string
  readonly name!: string
  readonly type!: string

  constructor(init: Readonly<VehicleCompanySummaryDto>) {
    Object.assign(this, init)
    Object.freeze(this)
  }
}

export class VehicleInternalDto {
  readonly id!: string
  readonly tenantId!: string
  readonly plate!: string
  readonly model!: string
  readonly ownerId!: string
  readonly contractorId!: string
  readonly custodianId!: string
  readonly createdAt!: string
  readonly owner?: VehicleCompanySummaryDto
  readonly contractor?: VehicleCompanySummaryDto
  readonly custodian?: VehicleCompanySummaryDto

  constructor(init: Readonly<VehicleInternalDto>) {
    Object.assign(this, init)
    Object.freeze(this)
  }
}
