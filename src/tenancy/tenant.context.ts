import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable, UnauthorizedException } from '@nestjs/common'

type Store = { tenantId: string }

@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<Store>()

  run<T>(tenantId: string, fn: () => T): T {
    return this.als.run({ tenantId }, fn)
  }

  get tenantId(): string {
    const store = this.als.getStore()
    if (!store) {
      throw new UnauthorizedException('Missing tenant context', {
        errorCode: 'TENANT-0001',
      })
    }
    return store.tenantId
  }
}
