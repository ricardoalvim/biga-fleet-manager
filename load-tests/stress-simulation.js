import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up: Sobe para 50 usuários virtuais (VUs)
    { duration: '1m', target: 200 },   // Carga sustentada: 200 VUs simultâneos (Pico de Telemetria/Frota)
    { duration: '30s', target: 500 },   // Estresse Máximo: 500 VUs simultâneos (Simulando 50.000 pacotes/s)
    { duration: '20s', target: 0 },    // Ramp-down: Resfriamento
  ],
  thresholds: {
    http_req_duration: ['p(95)<250', 'p(99)<500'], // 95% das requisições abaixo de 250ms, 99% abaixo de 500ms
    http_req_failed: ['rate<0.01'],              // Taxa de erro inferior a 1%
  },
};

const PORT = __ENV.PORT || '2342';
const BASE_URL = __ENV.BASE_URL || `http://localhost:${PORT}/api/v1`;
const METRICS_URL = __ENV.METRICS_URL || `http://localhost:${PORT}/metrics`;
const TENANT_ID = __ENV.TENANT_ID || '00000000-0000-4000-8000-000000000001';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
  };

  // Cenário 1: Consulta de listagem de veículos (Alta frequência no PostgreSQL/Prisma)
  const resVehicles = http.get(`${BASE_URL}/vehicles`, { headers });
  check(resVehicles, {
    'listar veículos status 200': (r) => r.status === 200,
    'tempo de resposta < 100ms': (r) => r.timings.duration < 100,
  });

  // Cenário 2: Ingestão simulada de evento de telemetria / streaming (Redis + Worker)
  const payloadTelemetry = JSON.stringify({
    event: 'vehicle.position.updated',
    vehicleId: 'f1e2d3c4-b5a6-7890-abcd-ef0123456789',
    data: {
      latitude: -22.6582 + (Math.random() * 0.01),
      longitude: -50.4183 + (Math.random() * 0.01),
      speed: randomIntBetween(0, 110),
      heading: randomIntBetween(0, 360),
      ignition: true,
      timestamp: new Date().toISOString(),
    },
  });

  const resTelemetry = http.post(`${BASE_URL}/stream/events/publish`, payloadTelemetry, { headers });
  check(resTelemetry, {
    'publicação de telemetria status 200': (r) => r.status === 200,
  });

  // Cenário 3: Consulta de métricas Prometheus (Observabilidade em tempo real)
  const resMetrics = http.get(METRICS_URL);
  check(resMetrics, {
    'coleta de métricas Prometheus ok': (r) => r.status === 200,
  });

  sleep(randomIntBetween(1, 3) / 10); // Intervalo humanizado / rajada controlada
}