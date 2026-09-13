export class CreateVehicleInternalDto {
  readonly tenantId!: string
  readonly plate!: string
  readonly model!: string
  readonly ownerId!: string
  readonly contractorId!: string
  readonly custodianId!: string

  constructor(init: Readonly<CreateVehicleInternalDto>) {
    Object.assign(this, init)
    Object.freeze(this)
  }
}
