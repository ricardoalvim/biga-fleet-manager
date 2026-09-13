import type {
  OnboardingJourney,
  PortalMenuTree,
  Role,
  StepStatus,
  SupportTicket,
  TenantAdminOverview,
  MarketplaceCatalog,
} from '../types/portal.types.js'

export class PortalApiClient {
  constructor(
    private readonly baseUrl: string = '/api/v1/portal',
    private readonly getTenantId: () => string = () =>
      '00000000-0000-4000-8000-000000000001',
  ) {}

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': this.getTenantId(),
    }
  }

  async getMenuTree(roleId?: string): Promise<PortalMenuTree> {
    const url = new URL(`${this.baseUrl}/menus/me`, window.location.origin)
    if (roleId) url.searchParams.set('roleId', roleId)

    const response = await fetch(url.toString(), {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch menu tree: ${response.statusText}`)
    }
    return response.json()
  }

  async listRoles(): Promise<Role[]> {
    const response = await fetch(`${this.baseUrl}/roles`, {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`)
    }
    return response.json()
  }

  async getOnboardingJourney(): Promise<OnboardingJourney> {
    const response = await fetch(`${this.baseUrl}/onboarding`, {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch onboarding: ${response.statusText}`)
    }
    return response.json()
  }

  async updateOnboardingStep(
    stepIndex: number,
    status: StepStatus,
    metadata?: Record<string, unknown>,
  ): Promise<OnboardingJourney> {
    const response = await fetch(
      `${this.baseUrl}/onboarding/steps/${stepIndex}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ status, metadata }),
      },
    )
    if (!response.ok) {
      throw new Error(`Failed to update onboarding step: ${response.statusText}`)
    }
    return response.json()
  }

  async listSupportTickets(
    status?: string,
    category?: string,
  ): Promise<SupportTicket[]> {
    const url = new URL(`${this.baseUrl}/support/tickets`, window.location.origin)
    if (status) url.searchParams.set('status', status)
    if (category) url.searchParams.set('category', category)

    const response = await fetch(url.toString(), {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch support tickets: ${response.statusText}`)
    }
    return response.json()
  }

  async createSupportTicket(ticket: {
    title: string
    description: string
    category: string
    priority: string
  }): Promise<SupportTicket> {
    const response = await fetch(`${this.baseUrl}/support/tickets`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(ticket),
    })
    if (!response.ok) {
      throw new Error(`Failed to create ticket: ${response.statusText}`)
    }
    return response.json()
  }

  async replySupportTicket(
    ticketId: string,
    reply: { text: string; status?: string },
  ): Promise<SupportTicket> {
    const response = await fetch(
      `${this.baseUrl}/support/tickets/${ticketId}/reply`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(reply),
      },
    )
    if (!response.ok) {
      throw new Error(`Failed to reply to ticket: ${response.statusText}`)
    }
    return response.json()
  }

  async listTenantsForAdmin(): Promise<TenantAdminOverview[]> {
    const response = await fetch(`${this.baseUrl}/admin/tenants`, {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch admin tenants: ${response.statusText}`)
    }
    return response.json()
  }

  async updateTenantLicenses(
    tenantId: string,
    enabledModules: string[],
  ): Promise<unknown> {
    const response = await fetch(
      `${this.baseUrl}/admin/tenants/${tenantId}/licenses`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ enabledModules }),
      },
    )
    if (!response.ok) {
      throw new Error(`Failed to update licenses: ${response.statusText}`)
    }
    return response.json()
  }

  async getMarketplaceCatalog(): Promise<MarketplaceCatalog> {
    const response = await fetch(`${this.baseUrl}/marketplace/catalog`, {
      headers: this.headers,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch marketplace: ${response.statusText}`)
    }
    return response.json()
  }
}

export const portalApi = new PortalApiClient()

