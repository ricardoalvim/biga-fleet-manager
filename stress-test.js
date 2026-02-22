const axios = require('axios') // Se não tiver, use fetch nativo do Node 18+
const BASE_URL = 'http://localhost:2342'

async function burst(chariotId) {
    const promises = []
    for (let i = 0; i < 500; i++) {
        promises.push(fetch(`${BASE_URL}/telemetry/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bigaId: chariotId,
                lat: -22.66 + (Math.random() * 0.01),
                lng: -50.41 + (Math.random() * 0.01),
                speed: Math.floor(Math.random() * 60),
                isHitched: true
            })
        }))
    }
    await Promise.all(promises)
}

async function run() {
    const fleet = await (await fetch(`${BASE_URL}/fleet`)).json()
    console.log(`🚀 Iniciando bombardeio de dados com ${fleet.length} bigas...`)

    // Roda bursts constantes
    setInterval(() => {
        const randomChariot = fleet[Math.floor(Math.random() * fleet.length)]
        burst(randomChariot.id)
        console.log('🔥 Burst de 500 pontos enviado!')
    }, 1000)
}

run()