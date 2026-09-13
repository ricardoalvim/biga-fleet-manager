# Specification: Biga AI Assistant Module (Copilot Conversacional da Frota)

## 1. Visão Geral
O **BigaAiAssistantModule** introduz capacidades de Inteligência Artificial Generativa e agentes baseados em **Model Context Protocol (MCP)** no **Biga Fleet Manager**. Ele permite que gestores de frotas façam consultas complexas em linguagem natural diretamente na interface do painel, obtendo análises instantâneas sobre custos, desvios de rota, manutenções pendentes e comportamento de motoristas.

## 2. Regras de Negócio e Domínio
* **Segurança e Contexto (Tenant Boundaries):** O agente de IA opera estritamente dentro do escopo do `tenantId` do usuário logado, impedindo vazamento de dados entre empresas distintas.
* **Ferramentas de Contexto (MCP Tools):** O LLM é acoplado a ferramentas internas seguras para buscar dados em tempo real no PostgreSQL e MongoDB (ex: buscar veículos próximos, calcular TCO de uma filial, verificar manutenções vencidas).
* **Exemplos de Interações Suportadas:**
  * *"Quais caminhões da filial de Assis estão a menos de 1.000 km da revisão preventiva e tiveram desvio de rota esta semana?"*
  * *"Qual foi o custo total de pedágios e combustível da frota pesada no mês passado?"*

## 3. Contratos de API (Endpoints)

### 3.1. Enviar Pergunta ao Copilot
* **Método:** `POST /api/v1/ai/chat`
* **Payload (DTO Externo - JSON Normalizado):**
  ```json
  {
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
    "query": "Quais veículos estão com manutenção preventiva atrasada?",
    "conversationId": "c9e8d7f6-a5b4-3210-fedc-ba9876543210"
  }
  ```
* **Respostas:**
  * `200 OK`:
  ```json
  {
    "answer": "Identifiquei 2 veículos com manutenção preventiva pendente: A Van Cargo (ROM1001) ultrapassou o limite em 450 km e o Caminhão 3/4 (ROM2002) está na iminência da revisão de 20.000 km.",
    "suggestedActions": [
      { "label": "Abrir Ordem de Serviço", "actionUrl": "/maintenances/new?vehicleId=..." }
    ]
  }
  ```

## 4. Diretrizes de Implementação
* **Integração LLM:** Utilização de provedores via API (OpenAI / Anthropic / Gemini) com injeção segura de prompts orientados ao domínio de frotas e validação estrita de schema de saída.

