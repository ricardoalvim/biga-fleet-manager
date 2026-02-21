import { PrismaClient, CompanyType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- Starting Imperial Seeding (Raw Numbers) ---')

    // 1. Rental (Owner)
    const rental = await prisma.company.upsert({
        where: { taxId: '11111111000111' },
        update: {},
        create: {
            name: 'Locabigas Ltda',
            taxId: '11111111000111',
            type: CompanyType.RENTAL
        }
    })

    // 2. Maintenance (Custodian)
    const maintenance = await prisma.company.upsert({
        where: { taxId: '22222222000122' },
        update: {},
        create: {
            name: 'Companhia de Ferreiros S/A',
            taxId: '22222222000122',
            type: CompanyType.MAINTENANCE
        }
    })

    // 3. Client (Contractor)
    const client = await prisma.company.upsert({
        where: { taxId: '33333333000133' },
        update: {},
        create: {
            name: 'Império Transportes Ltda',
            taxId: '33333333000133',
            type: CompanyType.CLIENT
        }
    })

    // 4. Chariot (ABC-1234)
    const chariot = await prisma.chariot.upsert({
        where: { plate: 'ABC1234' },
        update: {},
        create: {
            plate: 'ABC1234',
            model: 'Biga Premium V8',
            ownerId: rental.id,
            custodianId: maintenance.id,
            contractorId: client.id
        }
    })

    console.log('--- Seed Finished Successfully ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })