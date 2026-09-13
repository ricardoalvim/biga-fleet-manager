import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { TenantService } from './tenant.service.js'
import { TenantContext } from './tenant.context.js'

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenants: TenantService,
    private readonly context: TenantContext,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const header = req.header('x-tenant-id') ?? req.header('x-tenant-slug')
      if (!header) {
        throw new UnauthorizedException('Provide x-tenant-id or x-tenant-slug', {
          errorCode: 'TENANT-0002',
        })
      }

      const tenant = await this.tenants.resolve(header)
      if (!tenant) {
        throw new UnauthorizedException('Unknown tenant', { errorCode: 'TENANT-0003' })
      }

      this.context.run(tenant.id, () => next())
    } catch (error) {
      next(error)
    }
  }
}
