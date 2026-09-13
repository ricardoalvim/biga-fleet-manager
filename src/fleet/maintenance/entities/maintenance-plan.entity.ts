export type MaintenanceAction = 'INSPECTION' | 'REPLACEMENT'

export interface MaintenancePlanItem {
  readonly description: string
  readonly action: MaintenanceAction
}

export interface MaintenancePlanEntityProps {
  id: string
  tenantId: string
  name: string
  triggerKm: number
  items: ReadonlyArray<MaintenancePlanItem>
}

export class MaintenancePlanEntity {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItem>

  constructor(props: MaintenancePlanEntityProps) {
    if (!props.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório para o plano de manutenção')
    }
    if (!props.name?.trim()) {
      throw new Error('Nome do plano de manutenção é obrigatório')
    }
    if (props.triggerKm <= 0) {
      throw new Error('O gatilho de quilometragem (triggerKm) deve ser maior que zero')
    }
    if (!props.items || props.items.length === 0) {
      throw new Error('O plano de manutenção deve possuir ao menos um item de checklist')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name.trim()
    this.triggerKm = props.triggerKm
    this.items = Object.freeze([...props.items])

    Object.freeze(this)
  }
}
