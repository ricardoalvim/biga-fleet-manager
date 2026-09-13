import { db } from '../src/prisma/db.js'

const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001'

async function main() {
  console.log('--- Seed: tenant + frota ---')

  const tenant = await db.orm.public.Tenant.upsert({
    create: {
      id: DEFAULT_TENANT_ID,
      slug: 'default',
      name: 'Default Tenant',
    },
    update: {},
    conflictOn: { slug: 'default' },
  })

  const rental = await db.orm.public.Company.upsert({
    create: {
      tenantId: tenant.id,
      name: 'Locadora Central Ltda',
      taxId: '11111111000111',
      type: 'RENTAL',
    },
    update: {},
    conflictOn: { tenantId: tenant.id, taxId: '11111111000111' },
  })

  const maintenance = await db.orm.public.Company.upsert({
    create: {
      tenantId: tenant.id,
      name: 'Oficina Imperial Ltda',
      taxId: '22222222000122',
      type: 'MAINTENANCE',
    },
    update: {},
    conflictOn: { tenantId: tenant.id, taxId: '22222222000122' },
  })

  const client = await db.orm.public.Company.upsert({
    create: {
      tenantId: tenant.id,
      name: 'Transportes César',
      taxId: '33333333000133',
      type: 'CLIENT',
    },
    update: {},
    conflictOn: { tenantId: tenant.id, taxId: '33333333000133' },
  })

  await Promise.all(
    Array.from({ length: 20 }).map((_, i) => {
      const plate = `ROM${1000 + i}`
      return db.orm.public.Vehicle.upsert({
        create: {
          tenantId: tenant.id,
          plate,
          model: i % 2 === 0 ? 'Caminhão 3/4' : 'Van Cargo',
          ownerId: rental.id,
          custodianId: maintenance.id,
          contractorId: client.id,
        },
        update: {},
        conflictOn: { tenantId: tenant.id, plate },
      })
    }),
  )

  console.log(`--- Tenant ${tenant.slug} com 20 veículos ---`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.close()
  })
