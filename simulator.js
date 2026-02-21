const BASE_URL = 'http://localhost:2342'

// Rota expandida para simular trajetos diferentes
const routes = [
    [
        { lat: -22.6614, lng: -50.4169, pt: 'Catedral' },
        { lat: -22.6650, lng: -50.4190, pt: 'Avenida' },
        { lat: -22.6700, lng: -50.4230, pt: 'FEMA' }
    ],
    [
        { lat: -22.6500, lng: -50.4100, pt: 'Vila Operária' },
        { lat: -22.6550, lng: -50.4150, pt: 'Centro' },
        { lat: -22.6600, lng: -50.4200, pt: 'Parque Buracão' }
    ]
]

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Função que simula UMA biga individualmente
async function chariotWorker(chariot, workerId) {
    try {
        // 1. Inicia Trip
        const startRes = await fetch(`${BASE_URL}/trips/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chariotId: chariot.id })
        })

        if (!startRes.ok) return console.error(`[Biga ${workerId}] Erro ao iniciar`)
        const { id: tripId } = await startRes.json()
        console.log(`🚀 [Biga ${workerId}] Trip Iniciada: ${tripId}`)

        // 2. Ciclo de Telemetria (10 pings por biga)
        const myRoute = routes[workerId % routes.length]
        for (let i = 0; i < 10; i++) {
            const pos = myRoute[i % myRoute.length]
            const payload = {
                bigaId: chariot.id,
                tripId: tripId,
                lat: pos.lat + (Math.random() * 0.001), // Variando um pouco a posição
                lng: pos.lng + (Math.random() * 0.001),
                speed: Math.floor(Math.random() * 40) + 20,
                isHitched: true,
                timestamp: new Date().toISOString()
            }

            await fetch(`${BASE_URL}/telemetry/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            console.log(`📡 [Biga ${workerId}] Ping enviado (${i + 1}/10)`)
            await sleep(1000 + (Math.random() * 1000)) // Pings em tempos diferentes
        }

        // 3. Finaliza Trip
        await fetch(`${BASE_URL}/trips/${tripId}/finish`, { method: 'PATCH' })
        console.log(`🏁 [Biga ${workerId}] Trip Finalizada!`)

    } catch (e) {
        console.error(`💥 [Biga ${workerId}] Falhou:`, e.message)
    }
}

async function runMassiveSimulation() {
    console.log('🏛️  Convocando todas as bigas para o desfile...')

    const fleetRes = await fetch(`${BASE_URL}/fleet`)
    const fleet = await fleetRes.json()

    if (!fleet.length) return console.error('Garagem vazia. Rode o seed!')

    console.log(`🔥 Lançando ${fleet.length} bigas simultaneamente!\n`)

    await Promise.all(fleet.map((chariot, index) => chariotWorker(chariot, index)))

    console.log('\n🏆 Todas as bigas completaram o percurso!')
}

runMassiveSimulation()