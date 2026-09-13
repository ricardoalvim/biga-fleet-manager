export class VehicleEntity {
  readonly id: string
  readonly tenantId: string
  readonly plate: string
  readonly model: string
  readonly ownerId: string
  readonly contractorId: string
  readonly custodianId: string
  readonly createdAt: string

  constructor(params: {
    id: string
    tenantId: string
    plate: string
    model: string
    ownerId: string
    contractorId: string
    custodianId: string
    createdAt?: string
  }) {
    this.validatePlate(params.plate)
    this.id = params.id
    this.tenantId = params.tenantId
    this.plate = params.plate.toUpperCase().trim()
    this.model = params.model.trim()
    this.ownerId = params.ownerId
    this.contractorId = params.contractorId
    this.custodianId = params.custodianId
    this.createdAt = params.createdAt ?? new Date().toISOString()
    Object.freeze(this)
  }

  private validatePlate(plate: string): void {
    const cleaned = plate.toUpperCase().trim()
    if (!cleaned || cleaned.length < 5 || cleaned.length > 10) {
      throw new Error(
        `Placa inválida: "${plate}". Deve possuir entre 5 e 10 caracteres alfanuméricos.`,
      )
    }
  }
}
