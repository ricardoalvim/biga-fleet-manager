const BASE_URL = 'http://localhost:2342'

// Configurações de Stress
const MIN_POINTS = 5
const MAX_POINTS = 15
const PING_INTERVAL = 2000 // 2 segundos
const IDLE_BETWEEN_TRIPS = 5000 // 5 segundos de descanso no pátio

const routes = [
    { name: 'Rui Barbosa', points: [{ lat: -22.6614, lng: -50.4169 }, { lat: -22.6650, lng: -50.4190 }, { lat: -22.6700, lng: -50.4230 }] },
    { name: 'Centro/FEMA', points: [{ lat: -22.6500, lng: -50.4100 }, { lat: -22.6550, lng: -50.4150 }, { lat: -22.6600, lng: -50.4200 }] },
    { name: 'Vila Operária', points: [{ lat: -22.6450, lng: -50.4000 }, { lat: -22.6500, lng: -50.4050 }, { lat: -22.6550, lng: -50.4100 }] }
]

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Função para adicionar um "ruído" no GPS (pra não ficar estático)
const jitter = () => (Math.random() - 0.5) * 0.0005

async function chariotWorker(chariot, workerId) {
    let tripCount = 0

    while (true) { // LOOP INFINITO: A Biga não para!
        try {
            tripCount++
            console.log(`\n[Biga ${workerId}] 🚩 Iniciando Jornada #${tripCount} (Biga: ${chariot.plate})`)

            // 1. ABERTURA DE TRIP (Via Sensor/Ignição)
            // O Subscriber vai detectar o isHitched: true e abrir a trip no Postgres
            // Mas aqui batemos no ingest com o primeiro ponto de ignição

            const selectedRoute = routes[Math.floor(Math.random() * routes.length)]
            const numPoints = Math.floor(Math.random() * (MAX_POINTS - MIN_POINTS + 1)) + MIN_POINTS

            // Gerar um TRIP_ID falso apenas para o primeiro ping (o Subscriber vai ignorar e usar o do Postgres)
            // Na verdade, o ideal é deixar o Subscriber criar e a gente só mandar o bigaId

            console.log(`[Biga ${workerId}] Rota: ${selectedRoute.name} | Pontos planejados: ${numPoints}`)

            for (let i = 0; i < numPoints; i++) {
                const basePos = selectedRoute.points[i % selectedRoute.points.length]

                const payload = {
                    bigaId: chariot.id,
                    lat: basePos.lat + jitter(),
                    lng: basePos.lng + jitter(),
                    speed: Math.floor(Math.random() * 40) + 20,
                    isHitched: true, // Ignição ligada
                    timestamp: new Date().toISOString()
                }

                const res = await fetch(`${BASE_URL}/telemetry/ingest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (res.ok) {
                    console.log(`📡 [Biga ${workerId}] Ping ${i + 1}/${numPoints} enviado.`)
                } else {
                    console.error(`❌ [Biga ${workerId}] Falha no Ingest: ${res.status}`)
                }

                await sleep(PING_INTERVAL)
            }

            // 2. FINALIZAÇÃO (Desligando a ignição)
            console.log(`🏁 [Biga ${workerId}] Desligando ignição... Finalizando Trip.`)

            await fetch(`${BASE_URL}/telemetry/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bigaId: chariot.id,
                    lat: selectedRoute.points[numPoints % selectedRoute.points.length].lat,
                    lng: selectedRoute.points[numPoints % selectedRoute.points.length].lng,
                    speed: 0,
                    isHitched: false, // IS HITCHED FALSE: Gatilho para o finishTrip no Subscriber!
                    timestamp: new Date().toISOString()
                })
            })

            console.log(`[Biga ${workerId}] 🛌 Descansando no pátio por ${IDLE_BETWEEN_TRIPS / 1000}s...`)
            await sleep(IDLE_BETWEEN_TRIPS)

        } catch (e) {
            console.error(`💥 [Biga ${workerId}] Erro crítico:`, e.message)
            await sleep(10000) // Espera 10s pra tentar de novo se a API cair
        }
    }
}

async function runLegioSimulation() {
    console.log('🏛️  Mobilizando a Legião para teste de stress em Assis...')

    try {
        const fleetRes = await fetch(`${BASE_URL}/fleet`)
        if (!fleetRes.ok) throw new Error('Não foi possível acessar a garagem.')
        const fleet = await fleetRes.json()

        if (!fleet.length) return console.error('Garagem vazia. Rode o seed primeiro!')

        console.log(`🔥 Lançando ${fleet.length} bigas em modo de patrulha infinita!\n`)

        // Lança todos os workers em paralelo
        fleet.forEach((chariot, index) => {
            chariotWorker(chariot, index)
        })

    } catch (error) {
        console.error('💥 Falha ao convocar legião:', error.message)
    }
}

runLegioSimulation()