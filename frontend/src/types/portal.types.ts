export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES' | 'de-DE'

export interface PortalBranding {
  readonly displayName: string
  readonly logoUrl: string | null
  readonly primaryColor: string
  readonly secondaryColor: string
}

export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly icon: string
  readonly moduleKey: string
  readonly requiredPermission: string
  readonly badge?: string
}

export interface PortalMenuTree {
  readonly tenantId: string
  readonly roleId?: string
  readonly roleName: string
  readonly branding: PortalBranding
  readonly items: readonly MenuItem[]
}

export interface Role {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly description?: string
  readonly permissions: readonly string[]
  readonly isSystemDefault: boolean
}

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

export interface OnboardingStep {
  readonly stepIndex: number
  readonly code: string
  readonly title: string
  readonly status: StepStatus
  readonly completedAt: string | null
  readonly metadata?: Record<string, unknown>
}

export interface OnboardingJourney {
  readonly id: string
  readonly tenantId: string
  readonly currentStepIndex: number
  readonly steps: readonly OnboardingStep[]
  readonly isCompleted: boolean
  readonly progressPercentage: number
}

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'RESOLVED'
  | 'CLOSED'

export type TicketCategory =
  | 'BILLING'
  | 'TECHNICAL'
  | 'DEVICE_INTEGRATION'
  | 'ONBOARDING'
  | 'GENERAL'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface TicketMessage {
  readonly messageId: string
  readonly authorId: string
  readonly authorName: string
  readonly text: string
  readonly isStaff: boolean
  readonly sentAt: string
}

export interface SupportTicket {
  readonly id: string
  readonly tenantId: string
  readonly openedByUserId: string
  readonly title: string
  readonly description: string
  readonly category: TicketCategory
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly messages: readonly TicketMessage[]
  readonly assignedToAgent?: string
  readonly resolvedAt?: string | null
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface TenantAdminOverview {
  readonly tenantId: string
  readonly displayName: string
  readonly enabledModules: readonly string[]
  readonly isWhiteLabelConfigured: boolean
}

export interface MarketplaceIntegration {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: string
  readonly icon: string
  readonly requiredModule: string
  readonly apiDocsUrl: string
  readonly status: 'AVAILABLE' | 'ACTIVE' | 'REQUIRES_MODULE'
}

export interface MarketplaceCatalog {
  readonly title: string
  readonly version: string
  readonly openApiSpecUrl: string
  readonly integrations: readonly MarketplaceIntegration[]
}

