---
name: grow
description: >-
  Use esta skill quando o usuário pedir para expandir e auto-aprimorar o sistema,
  analisar lacunas de arquitetura ou criar novos módulos operacionais orientados a boas práticas.
---

# Skill Grow: Expansão Contínua e Refinamento de Arquitetura

Esta skill orienta o assistente a analisar o estado atual do repositório e sugerir
ou executar melhorias iterativas sem introduzir débitos técnicos.

## Procedimento Padrão:

1. **Diagnóstico**:
   - Verificar a suíte de testes (`npm test`).
   - Identificar contratos pendentes ou especificações em `docs/specs/`.

2. **Diretrizes de Execução**:
   - Seguir a arquitetura hexagonal com separação `InternalService` e `ExternalService`.
   - Utilizar DTOs imutáveis com `Object.freeze()`.
   - Garantir 100% de cobertura nos testes com Vitest.

3. **Validação**:
   - Executar `npm test`, `npm run build` e `npm run lint`.