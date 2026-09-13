import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { db } from '../../prisma/db.js'

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly orm = db.orm.public

  transaction(...args: Parameters<typeof db.transaction>) {
    return db.transaction(...args)
  }

  async onModuleDestroy() {
    await db.close()
  }
}
