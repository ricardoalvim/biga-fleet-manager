# Specification: Company Module (Módulo de Empresas / Parceiros)

## 1. Visão Geral
O **CompanyModule** é o coração comercial e relacional do **Biga Fleet Manager**. Ele gerencia as entidades corporativas que participam do ecossistema de frotas, divididas estritamente por papéis regulatórios e vinculadas ao escopo de multi-tenancy (`tenantId`).

## 2. Regras de Negócio e Domínio
* **Tipos de Empresa (`CompanyType`):**
  * `CLIENT`: O contratante final da operação de frota.
  * `RENTAL`: A locadora detentora ou gestora dos ativos (as "bigas").
  * `MAINTENANCE`: Oficinas ou centros de suporte técnico credenciados.
* **Isolamento Multi-Tenant:**
  * Toda empresa pertence obrigatoriamente a um `Tenant`.
  * A combinação de `tenantId` + `taxId` (CNPJ/CPF) deve ser estritamente única no sistema. Tentativas de duplicidade devem disparar uma `ConflictException`.
* **Relacionamentos com Veículos:**
  * Uma empresa pode atuar como proprietária (`owner`), contratante (`contractor`) ou custodiante (`custodian`) de frotas.

## 3. Contratos de API (Endpoints)

### 3.1. Cadastrar Empresa
* **Método:** `POST /companies`
* **Payload (DTO):**
  ```json
  {
    "tenantId": "uuid-v4",
    "name": "Oficina do Vulcano Ltda",
    "taxId": "12345678000199",
    "type": "MAINTENANCE"
  }
  ```
* **Respostas:**
  * `201 Created`: Empresa registrada com sucesso no escopo do tenant.
  * `400 Bad Request`: Falha de validação nos campos (ex: CNPJ/CPF com formato ou dígitos inválidos).
  * `409 Conflict`: Empresa com este `taxId` já existente no tenant (`FLEET-0001`).

### 3.2. Listar Empresas
* **Método:** `GET /companies`
* **Query Params (opcional):** `?type=CLIENT|RENTAL|MAINTENANCE`
* **Headers:** `x-tenant-id` ou `x-tenant-slug` (obrigatório)
* **Respostas:**
  * `200 OK`: Array com as empresas do tenant em ordem alfabética.

### 3.3. Buscar Empresa por ID
* **Método:** `GET /companies/:id`
* **Headers:** `x-tenant-id` ou `x-tenant-slug` (obrigatório)
* **Respostas:**
  * `200 OK`: Dados da empresa incluindo seus relacionamentos veiculares (`ownedVehicles`, `contractedVehicles`, `custodiedVehicles`).
  * `404 Not Found`: Empresa não encontrada no tenant (`FLEET-0005`).