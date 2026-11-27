# CI/CD do Hemovia na AWS Specification

**Approved**: 2026-11-26 - user: "Aprovo esse escopo"

## Problem Statement

O backend valida e empacota a API no GitHub Actions, mas os workflows de publicação e rollback ainda apontam para o Render. A demonstração no Lightsail recebe versões manualmente e o frontend ainda não tem CI no GitHub.

## Goals

- [x] Publicar versões verificadas dos dois repositórios na demonstração `hemovia-demo` em `us-east-2`.
- [x] Remover a integração ativa com o Render dos workflows, da configuração e da documentação de deploy do backend.
- [x] Validar a saúde da aplicação após a publicação e permitir voltar a uma versão anterior da aplicação.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Administração do serviço hospedado no Render | O usuário delimitou a remoção à integração do GitHub e do código. |
| Migração de banco ou alteração da topologia da demonstração | O destino aprovado é a VM existente com Docker Compose e volumes persistentes. |
| Reversão de migrações SQL | O rollback acordado é de aplicação. Alterações de schema têm ciclo próprio. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Destino e gatilho inicial | Publicação manual a partir da `main` para `hemovia-demo` por GitHub Actions, OIDC e Systems Manager. | Corresponde ao primeiro ciclo que o usuário aceitou configurar. | y |
| Escopo do Render | Remover a integração dos repositórios. | O usuário respondeu “Remover a integração do GitHub e do código (recomendado)”. | y |
| Identificação e retenção | Identificar cada versão pelo par de commits e conservar a última versão aprovada para recuperação. | A versão implantada e a versão recuperável precisam ser identificáveis. | n |
| Publicações concorrentes | Serializar mudanças na mesma instância. | Deploy e rollback alteram o mesmo runtime e os mesmos volumes. | n |
| Limites de confiança | Vincular a função de deploy ao repositório e à `main` responsáveis, com acesso ao destino da demo. | Os dois repositórios são públicos e o deploy usa credenciais temporárias. | n |
| Validação e observabilidade | Registrar os commits publicados e verificar a página, a API e os containers essenciais. | A publicação deve ser demonstrável pelo run e por checagens de saúde. | n |

**Open questions:** none. O escopo do Render foi respondido e o gatilho manual veio da opção aceita no plano anterior.

## User Stories

### P1: Validar alterações no GitHub

**User Story**: Como mantenedor, quero saber se as mudanças dos dois repositórios passam pela CI antes da publicação.

**Acceptance Criteria**:

1. WHEN uma alteração do frontend entra na `main` ou abre um pull request para ela THEN o GitHub Actions SHALL executar `npm ci` e `npm run build`.
2. WHEN um push ou pull request cobre as branches atendidas pela CI existente do backend THEN o GitHub Actions SHALL executar os testes Maven com PostgreSQL conforme a esteira atual.

**Independent Test**: Verificar os gatilhos e executar os comandos de build e teste em cada repositório.

### P1: Publicar e recuperar a demonstração

**User Story**: Como mantenedor, quero publicar versões verificadas na demo e recuperar a versão anterior quando uma publicação falhar.

**Acceptance Criteria**:

1. WHEN o workflow manual de publicação roda a partir da `main` THEN a esteira SHALL usar OIDC e Systems Manager para aplicar na VM o par de commits registrado no run.
2. WHEN uma versão é aplicada THEN a esteira SHALL verificar a página HTTPS, a prontidão da API e o estado dos containers essenciais antes de marcar a publicação como aprovada.
3. IF a aplicação da versão falhar ou a verificação de saúde falhar THEN a operação SHALL registrar a falha e, quando houver uma versão anterior aprovada, reaplicá-la.
4. WHEN o mantenedor executa o rollback manual THEN a operação SHALL reaplicar a versão anterior aprovada com os volumes existentes do Compose.

**Independent Test**: Executar uma publicação e um rollback controlado, conferindo os identificadores das versões, os resultados do Systems Manager e os volumes.

### P1: Retirar a integração do Render

**User Story**: Como mantenedor, quero que os arquivos de deploy do backend apontem para o ambiente que a equipe usa.

**Acceptance Criteria**:

1. O repositório do backend SHALL oferecer os workflows de deploy e rollback para AWS e retirar o Blueprint e as instruções operacionais do Render.

**Independent Test**: Inspecionar os workflows e os arquivos de deploy e verificar a ausência de chamadas ao hook do Render.

## Edge Cases

- IF uma execução ocorre fora da `main` THEN a configuração de acesso SHALL impedir que a execução assuma a função AWS de deploy da demonstração.
- WHILE a VM aplica uma publicação ou rollback o mecanismo de deploy SHALL impedir uma segunda alteração simultânea do runtime.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CICD-01 | P1: Validar alterações no GitHub | Execute | Verified |
| CICD-02 | P1: Validar alterações no GitHub | Execute | Verified |
| CICD-03 | P1: Publicar e recuperar a demonstração | Execute | Verified |
| CICD-04 | P1: Publicar e recuperar a demonstração | Execute | Verified |
| CICD-05 | P1: Publicar e recuperar a demonstração | Execute | Verified |
| CICD-06 | P1: Publicar e recuperar a demonstração | Execute | Verified |
| CICD-07 | P1: Retirar a integração do Render | Execute | Verified |
| CICD-08 | P1: Publicar e recuperar a demonstração, limite de acesso | Execute | Verified |
| CICD-09 | P1: Publicar e recuperar a demonstração, concorrência | Execute | Verified |

## Sources

- Conversa do usuário sobre a demonstração e a decisão de remover a integração do Render do GitHub e do código.
- [GitHub Actions OIDC para AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) para autenticação com credenciais temporárias.
- [Systems Manager Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html) para execução de operações no host.

## Success Criteria

- [x] O GitHub valida os dois projetos e registra o par de commits publicado na demonstração.
- [x] Uma publicação e um rollback controlado preservam o banco e os painéis existentes.
- [x] A configuração ativa do repositório do backend deixa de acionar o Render.
