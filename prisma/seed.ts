import { PrismaClient, CompanyType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- ⚔️  Iniciando Seed da Legião Romana ---')

    const rental = await prisma.company.upsert({
        where: { taxId: '11111111000111' },
        update: {},
        create: { name: 'Locabigas Ltda', taxId: '11111111000111', type: CompanyType.RENTAL }
    })

    const maintenance = await prisma.company.upsert({
        where: { taxId: '22222222000122' },
        update: {},
        create: { name: 'Ferreiros do Império', taxId: '22222222000122', type: CompanyType.MAINTENANCE }
    })

    const client = await prisma.company.upsert({
        where: { taxId: '33333333000133' },
        update: {},
        create: { name: 'Transportes César', taxId: '33333333000133', type: CompanyType.CLIENT }
    })

    // Criando 20 bigas automaticamente
    const chariotPromises = Array.from({ length: 20 }).map((_, i) => {
        const plate = `ROM${1000 + i}`
        return prisma.chariot.upsert({
            where: { plate },
            update: {},
            create: {
                plate,
                model: i % 2 === 0 ? 'Biga Premium V8' : 'Quadriga Sport V12',
                ownerId: rental.id,
                custodianId: maintenance.id,
                contractorId: client.id
            }
        })
    })

    await Promise.all(chariotPromises)
    console.log('--- ✅ Frota de 20 bigas pronta para o combate ---')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })