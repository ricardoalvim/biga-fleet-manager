# 🏛️ DIRETRIZES DE ARQUITETURA E PADRÃO DE MÓDULOS (Biga Fleet Manager)

Você é o Arquiteto Sênior de Backend responsável por este monólito modular (NestJS 12 + Prisma 8 RC). A partir de agora, **todo e qualquer módulo** criado ou modificado deve seguir rigidamente o padrão arquitetural abaixo, sem exceções.

## 1. Estrutura Obrigatória de Pastas por Módulo
Cada módulo de domínio (ex: `vehicle`, `trip`, `company`) deve obrigatoriamente seguir esta árvore de diretórios:

src/
  └── [module-name]/
        ├── controllers/
        │     └── [module].controller.ts       # Camada HTTP REST + Swagger OpenAPI
        ├── services/
        │     ├── [module].internal.service.ts   # Regras de negócio puras, transações e persistência
        │     └── [module].external.service.ts   # Orquestração de integrações externas / adapters (se houver)
        ├── repositories/
        │     └── [module].repository.ts       # Abstração de acesso a dados (Prisma / Mongoose)
        ├── dtos/
        │     ├── internal/                    # DTOs de domínio / manipulação interna (imutáveis / estilo record)
        │     └── external/                    # DTOs de contrato HTTP (Request/Response com class-validator/Zod)
        ├── entities/                          # Modelos de domínio puro (se aplicável)
        └── [module].module.ts                 # Declaração do NestJS Module

## 2. Padrão de DTOs e Tipagem de Saída (Estilo Record / Imutável)
* **DTOs Internos:** Devem ser tipados estritamente como `readonly` ou utilizando classes com propriedades `readonly` (imitando o comportamento de *records* do TypeScript), garantindo que os dados de trânsito interno não sejam mutados acidentalmente.
* **Tipagem de Saída:** Nenhuma função de serviço ou repositório pode retornar `any` ou tipos implícitos. Todas as assinaturas de métodos devem declarar explicitamente o tipo de retorno (ex: `Promise<Readonly<CompanyInternalDto>>`).

## 3. OBRIGAÇÃO CRÍTICA: Testes Unitários Mandatórios (Vitest)
* **Regra de Ouro:** **NENHUMA** alteração de código, criação de método ou refatoração será considerada completa se não vier acompanhada de seus respectivos testes unitários no Vitest.
* Todo arquivo de serviço (`*.internal.service.ts`, `*.external.service.ts`) deve ter um arquivo de spec correspondente (`*.spec.ts`) cobrindo:
  1. Caminho feliz (Happy path).
  2. Casos de exceção de negócio (Ex: `ConflictException`, `NotFoundException`).
  3. Isolamento multi-tenant (`tenantId`).
* O agente deve rodar a suíte de testes (`npm test`) e garantir que **100% dos testes passem** antes de finalizar a tarefa.

## 4. OBRIGAÇÃO CRÍTICA: Documentação e Changelog de Negócio
* Sempre que um módulo for criado ou alterado de forma a modificar regras de domínio ou contratos, o agente deve obrigatoriamente **atualizar ou criar** um arquivo de spec/documentação na pasta `docs/specs/[module-name].md`.
* No final de cada entrega, o agente deve gerar um relatório detalhado no arquivo `walkthrough.md` contendo:
  1. O que mudou em termos de **regra de negócio** (explicando o "porquê" técnico e funcional).
  2. Os contratos afetados (payloads de entrada e saída).
  3. A confirmação de que os testes unitários e o linter (`npm run lint`) estão verdes.