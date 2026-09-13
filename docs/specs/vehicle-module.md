# Specification: Vehicle Module (Módulo de Gestão de Veículos e Frotas)

## 1. Visão Geral
O **VehicleModule** é o componente responsável pelo gerenciamento de ativos móveis ("veículos") do **Biga Fleet Manager**. Ele estrutura a frota operacional vinculada a cada organização (`Tenant`), conectando os veículos aos seus respectivos agentes comerciais e operacionais (empresas proprietárias, contratantes e custodiantes).

## 2. Regras de Negócio e Domínio

### 2.1. Papéis das Empresas Associadas
Cada veículo cadastrado deve obrigatoriamente possuir três vínculos empresariais distintos dentro do mesmo `Tenant`:
1. **Proprietária (`ownerId`):** A empresa detentora do ativo (ex: empresa do tipo `RENTAL` ou `CLIENT`).
2. **Contratante (`contractorId`):** A empresa que opera ou aluga o veículo para suas rotas logísticas (`CLIENT`).
3. **Custodiante (`custodianId`):** A entidade responsável pela guarda técnica, manutenção ou garagem física do veículo (`MAINTENANCE` ou `RENTAL`).

*Todas as três empresas devem pertencer ao mesmo `tenantId` do veículo. Tentativas de vincular empresas de outros tenants resultam em `400 Bad Request` (`FLEET-0006`).*

### 2.2. Unicidade e Validação de Placa
* A placa (`plate`) deve ser única dentro do escopo de um mesmo tenant (`tenantId` + `plate`).
* Tentativas de cadastrar uma placa já existente para o tenant disparam `ConflictException` (`409 Conflict`, código `FLEET-0002`).
* A placa é normalizada automaticamente para caixa alta (*uppercase*) e espaços extras são removidos.
* Deve conter entre 5 e 10 caracteres alfanuméricos válidos.

### 2.3. Integrações Externas e Eventos
* No momento do cadastro do veículo, o serviço externo (`VehicleExternalService`) transmite um evento `VEHICLE_REGISTERED` através do canal Pub/Sub `vehicle_events_stream` no Redis, permitindo que os gateways de telemetria e rastreadores reconheçam imediatamente a nova unidade.

---

## 3. Contratos de API (Endpoints)

### 3.1. Cadastrar Veículo
* **Método:** `POST /vehicles`
* **Headers:** `x-tenant-id` ou `x-tenant-slug` (obrigatório)
* **Payload (JSON):**
  ```json
  {
    "tenantId": "00000000-0000-4000-8000-000000000001",
    "plate": "ROM1001",
    "model": "Van Cargo Mercedes Sprinter",
    "ownerId": "uuid-empresa-locadora",
    "contractorId": "uuid-empresa-cliente",
    "custodianId": "uuid-oficina-manutencao"
  }
  ```
* **Respostas:**
  * `201 Created`: Veículo registrado e evento de integração emitido.
  * `400 Bad Request`: Dados inválidos ou empresas parceiras não pertencentes ao tenant (`FLEET-0006`).
  * `409 Conflict`: Veículo com esta placa já cadastrado para o tenant (`FLEET-0002`).

### 3.2. Listar Veículos
* **Método:** `GET /vehicles`
* **Headers:** `x-tenant-id` (obrigatório)
* **Query Params (opcionais):**
  * `?ownerId=uuid`: Filtra veículos de determinado proprietário.
  * `?contractorId=uuid`: Filtra veículos sob contrato de determinada empresa.
  * `?custodianId=uuid`: Filtra veículos em custódia de determinada oficina/locadora.
* **Respostas:**
  * `200 OK`: Array de veículos com detalhes resumidos das empresas parceiras vinculadas.

### 3.3. Buscar Veículo por Placa
* **Método:** `GET /vehicles/by-plate/:plate`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Dados completos do veículo e relacionamentos.
  * `404 Not Found`: Veículo não encontrado para a placa informada no tenant (`FLEET-0008`).

### 3.4. Buscar Veículo por ID
* **Método:** `GET /vehicles/:id`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Dados detalhados do veículo.
  * `404 Not Found`: Veículo não localizado (`FLEET-0007`).


