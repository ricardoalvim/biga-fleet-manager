const BASE_URL = 'http://localhost:2342'

async function updateDashboard() {
    try {
        const res = await fetch(`${BASE_URL}/fleet/overview`)
        const data = await res.json()

        console.clear()
        console.log('================================================')
        console.log('🏛️  Biga Fleet Manager - REAL-TIME MONITOR')
        console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`)
        console.log('================================================')
        console.log('\n📈 SAÚDE DA FROTA:')
        console.log(`   - Bigas Ativas agora:  ${data.fleetStatus.activeChariots}`)
        console.log(`   - Viagens hoje:        ${data.fleetStatus.totalTripsToday}`)
        console.log(`   - KM Total hoje:       ${data.fleetStatus.totalDistanceTodayKm} km`)

        console.log('\n💾 INFRAESTRUTURA (POLIGLOTA):')
        console.log(`   - Pontos no MongoDB:   ${data.infrastructure.totalTelemetryPoints.toLocaleString()}`)
        console.log(`   - Armazenamento:       ${data.infrastructure.storageType}`)
        console.log(`   - Cache:               ${data.infrastructure.caching}`)
        console.log('\n================================================')
        console.log('Pressione Ctrl+C para sair')

    } catch (e) {
        console.log('Aguardando API ficar online...')
        console.log('================================================')
        console.log('💥 Erro ao conectar: ', e.message)
    }
}

setInterval(updateDashboard, 1000)