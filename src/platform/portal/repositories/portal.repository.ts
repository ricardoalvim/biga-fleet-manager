import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PortalRoleDocument } from '../schemas/portal-role.document.js'
import { PortalOnboardingDocument } from '../schemas/portal-onboarding.document.js'
import { PortalTicketDocument } from '../schemas/portal-ticket.document.js'
import { RoleInternalDto } from '../dtos/internal/role.internal.dto.js'
import {
  OnboardingJourneyInternalDto,
  OnboardingStepInternalDto,
} from '../dtos/internal/onboarding-journey.internal.dto.js'
import {
  SupportTicketInternalDto,
  TicketMessageInternalDto,
} from '../dtos/internal/support-ticket.internal.dto.js'
import type { StepStatus } from '../entities/onboarding-journey.entity.js'
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../entities/support-ticket.entity.js'

interface RawRoleRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly name: string
  readonly description: string
  readonly permissions: ReadonlyArray<string>
  readonly isSystemDefault: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

interface RawOnboardingStep {
  readonly stepIndex: number
  readonly code: string
  readonly title: string
  readonly status: StepStatus
  readonly completedAt?: Date | null
  readonly metadata?: Record<string, unknown>
}

interface RawOnboardingRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly currentStepIndex: number
  readonly steps: ReadonlyArray<RawOnboardingStep>
  readonly isCompleted: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

interface RawTicketMessage {
  readonly messageId: string
  readonly authorId: string
  readonly authorName: string
  readonly text: string
  readonly isStaff: boolean
  readonly sentAt: Date
}

interface RawTicketRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly openedByUserId: string
  readonly title: string
  readonly description: string
  readonly category: TicketCategory
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly messages: ReadonlyArray<RawTicketMessage>
  readonly assignedToAgent?: string | null
  readonly resolvedAt?: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface TicketFilterOptions {
  readonly tenantId?: string
  readonly status?: string
  readonly category?: string
}

@Injectable()
export class PortalRepository {
  constructor(
    @InjectModel(PortalRoleDocument.name)
    private readonly roleModel: Model<PortalRoleDocument>,
    @InjectModel(PortalOnboardingDocument.name)
    private readonly onboardingModel: Model<PortalOnboardingDocument>,
    @InjectModel(PortalTicketDocument.name)
    private readonly ticketModel: Model<PortalTicketDocument>,
  ) {}

  // ----------------- ROLES -----------------

  async createRole(dto: {
    id: string
    tenantId: string
    name: string
    description?: string
    permissions: readonly string[]
    isSystemDefault?: boolean
  }): Promise<Readonly<RoleInternalDto>> {
    const doc = await this.roleModel.create({
      _id: dto.id,
      tenantId: dto.tenantId,
      name: dto.name,
      description: dto.description ?? '',
      permissions: [...dto.permissions],
      isSystemDefault: Boolean(dto.isSystemDefault),
    })

    return this.mapRoleToDto(doc.toObject())
  }

  async findRoleById(tenantId: string, id: string): Promise<Readonly<RoleInternalDto> | null> {
    const doc = await this.roleModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapRoleToDto(doc) : null
  }

  async findRoles(tenantId: string): Promise<ReadonlyArray<Readonly<RoleInternalDto>>> {
    const docs = await this.roleModel
      .find({ $or: [{ tenantId }, { isSystemDefault: true }] })
      .sort({ createdAt: -1 })
      .lean()

    return Object.freeze(docs.map((d) => this.mapRoleToDto(d as unknown as RawRoleRecord)))
  }

  // ----------------- ONBOARDING -----------------

  async findOnboardingJourney(
    tenantId: string,
  ): Promise<Readonly<OnboardingJourneyInternalDto> | null> {
    const doc = await this.onboardingModel.findOne({ tenantId }).lean()
    return doc ? this.mapOnboardingToDto(doc) : null
  }

  async saveOnboardingJourney(dto: {
    id: string
    tenantId: string
    currentStepIndex: number
    steps: readonly {
      stepIndex: number
      code: string
      title: string
      status: StepStatus
      completedAt?: Date | null
      metadata?: Record<string, unknown>
    }[]
    isCompleted: boolean
  }): Promise<Readonly<OnboardingJourneyInternalDto>> {
    const doc = await this.onboardingModel
      .findOneAndUpdate(
        { tenantId: dto.tenantId },
        {
          $set: {
            currentStepIndex: dto.currentStepIndex,
            steps: dto.steps.map((s) => ({
              stepIndex: s.stepIndex,
              code: s.code,
              title: s.title,
              status: s.status,
              completedAt: s.completedAt ?? null,
              metadata: s.metadata ?? {},
            })),
            isCompleted: dto.isCompleted,
          },
          $setOnInsert: { _id: dto.id },
        },
        { upsert: true, new: true },
      )
      .lean()

    return this.mapOnboardingToDto(doc)
  }

  // ----------------- SUPPORT TICKETS -----------------

  async createTicket(dto: {
    id: string
    tenantId: string
    openedByUserId: string
    title: string
    description: string
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    messages: readonly {
      messageId: string
      authorId: string
      authorName: string
      text: string
      isStaff: boolean
      sentAt: Date
    }[]
  }): Promise<Readonly<SupportTicketInternalDto>> {
    const doc = await this.ticketModel.create({
      _id: dto.id,
      tenantId: dto.tenantId,
      openedByUserId: dto.openedByUserId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      status: dto.status,
      messages: dto.messages.map((m) => ({
        messageId: m.messageId,
        authorId: m.authorId,
        authorName: m.authorName,
        text: m.text,
        isStaff: m.isStaff,
        sentAt: m.sentAt,
      })),
    })

    return this.mapTicketToDto(doc.toObject())
  }

  async findTicketById(
    tenantId: string | null,
    id: string,
  ): Promise<Readonly<SupportTicketInternalDto> | null> {
    const query: Record<string, unknown> = { _id: id }
    if (tenantId) {
      query.tenantId = tenantId
    }

    const doc = await this.ticketModel.findOne(query).lean()
    return doc ? this.mapTicketToDto(doc) : null
  }

  async findTickets(
    filter?: TicketFilterOptions,
  ): Promise<ReadonlyArray<Readonly<SupportTicketInternalDto>>> {
    const query: Record<string, unknown> = {}
    if (filter?.tenantId) query.tenantId = filter.tenantId
    if (filter?.status) query.status = filter.status
    if (filter?.category) query.category = filter.category

    const docs = await this.ticketModel.find(query).sort({ createdAt: -1 }).lean()
    return Object.freeze(docs.map((d) => this.mapTicketToDto(d as unknown as RawTicketRecord)))
  }

  async updateTicket(
    id: string,
    update: {
      status?: TicketStatus
      messages?: readonly {
        messageId: string
        authorId: string
        authorName: string
        text: string
        isStaff: boolean
        sentAt: Date
      }[]
      assignedToAgent?: string | null
      resolvedAt?: Date | null
    },
  ): Promise<Readonly<SupportTicketInternalDto> | null> {
    const updateQuery: Record<string, unknown> = {}
    if (update.status) updateQuery.status = update.status
    if (update.assignedToAgent !== undefined) updateQuery.assignedToAgent = update.assignedToAgent
    if (update.resolvedAt !== undefined) updateQuery.resolvedAt = update.resolvedAt
    if (update.messages) {
      updateQuery.messages = update.messages.map((m) => ({
        messageId: m.messageId,
        authorId: m.authorId,
        authorName: m.authorName,
        text: m.text,
        isStaff: m.isStaff,
        sentAt: m.sentAt,
      }))
    }

    const doc = await this.ticketModel
      .findOneAndUpdate({ _id: id }, { $set: updateQuery }, { new: true })
      .lean()

    return doc ? this.mapTicketToDto(doc) : null
  }

  // ----------------- MAPPERS -----------------

  private mapRoleToDto(raw: RawRoleRecord): Readonly<RoleInternalDto> {
    return new RoleInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      name: raw.name,
      description: raw.description,
      permissions: [...raw.permissions],
      isSystemDefault: raw.isSystemDefault,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }

  private mapOnboardingToDto(raw: RawOnboardingRecord): Readonly<OnboardingJourneyInternalDto> {
    const steps = raw.steps.map(
      (s) =>
        new OnboardingStepInternalDto({
          stepIndex: s.stepIndex,
          code: s.code,
          title: s.title,
          status: s.status,
          completedAt: s.completedAt
            ? s.completedAt instanceof Date
              ? s.completedAt.toISOString()
              : String(s.completedAt)
            : null,
          metadata: { ...(s.metadata ?? {}) },
        }),
    )

    const completedCount = steps.filter((s) => s.status === 'COMPLETED').length
    const progressPercentage = Math.round((completedCount / steps.length) * 100)

    return new OnboardingJourneyInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      currentStepIndex: raw.currentStepIndex,
      progressPercentage,
      steps,
      isCompleted: raw.isCompleted,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }

  private mapTicketToDto(raw: RawTicketRecord): Readonly<SupportTicketInternalDto> {
    return new SupportTicketInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      openedByUserId: raw.openedByUserId,
      title: raw.title,
      description: raw.description,
      category: raw.category,
      priority: raw.priority,
      status: raw.status,
      messages: raw.messages.map(
        (m) =>
          new TicketMessageInternalDto({
            messageId: m.messageId,
            authorId: m.authorId,
            authorName: m.authorName,
            text: m.text,
            isStaff: m.isStaff,
            sentAt: m.sentAt instanceof Date ? m.sentAt.toISOString() : String(m.sentAt),
          }),
      ),
      assignedToAgent: raw.assignedToAgent ?? null,
      resolvedAt: raw.resolvedAt
        ? raw.resolvedAt instanceof Date
          ? raw.resolvedAt.toISOString()
          : String(raw.resolvedAt)
        : null,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }
}
