# CI/CD do Hemovia na AWS Tasks

## Execution Protocol

Executar com `tlc-spec-driven`. Validar cada mudança antes do commit e conferir a implantação no ambiente da demonstração.

**Design**: `.specs/features/cicd-aws-demo/design.md`
**Status**: Approved
**Approved**: 2026-11-26 - user: "Aprovo as tarefas"
**Build**: `npm run build`
**Run deploy**: `python ../hemovia-backend/deploy/lightsail/test_cicd.py --frontend .`

## Test Coverage Matrix

> Gerada de `package.json`, `api/pom.xml`, da esteira Maven existente e dos requisitos de deploy.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Aplicação | build e integração existente | TypeScript compila. Maven preserva a execução com PostgreSQL no runner. | Frontend e `api/src/test` | `npm run build` e `./mvnw -B -Pbase-entities-acceptance verify` |
| Workflows e infraestrutura | integração | Gatilhos, identidade, destino e etapas da esteira atendem aos requisitos. | `.github/workflows` e `deploy/lightsail` | `python ../hemovia-backend/deploy/lightsail/test_cicd.py --frontend .` |
| Aplicação de versões | integração | Gatilhos válidos, checagem de saúde, preservação do projeto Compose e recuperação em falhas. | `deploy/lightsail` | `python ../hemovia-backend/deploy/lightsail/test_cicd.py --frontend .` |
| Retirada do Render | configuração | Blueprint removido e instruções e workflows passam a apontar para AWS. | `README.md`, `render.yaml`, `.github/workflows` | `python ../hemovia-backend/deploy/lightsail/test_cicd.py --frontend .` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Build | Aplicação e CI | `npm run build`; compilação e testes Maven na esteira do backend |
| Quick | Mudança em um arquivo do workflow ou infraestrutura | Checagem do arquivo com linter, parser ou `git diff --check` |
| Full | Aplicação de versões e integração | `python ../hemovia-backend/deploy/lightsail/test_cicd.py --frontend .`; teste da VM após autorização |

## Execution Plan

### Phase 1: Retirada e CI

```
T1   T2   T3
```

### Phase 2: Publicação

```
T4 → T5 → T6 → T7 → T8
```

## Task Breakdown

### T1: Validar o frontend no GitHub

**What**: Rodar instalação pelo lockfile e build nas mudanças da `main`.
**Where**: `.github/workflows/ci.yml`
**Depends on**: None
**Requirement**: CICD-01
**Done when**:
- [x] O workflow cobre push e pull request e o build passa.
**Tests**: integração
**Gate**: build

### T2: Retirar o job de deploy do Render

**What**: Preservar a esteira de testes e imagem e retirar o hook do Render.
**Where**: `hemovia-backend/.github/workflows/ci-cd.yml`
**Depends on**: None
**Requirement**: CICD-02, CICD-07
**Done when**:
- [x] O workflow preserva Maven e GHCR e passa na revisão de diff.
**Tests**: integração
**Gate**: quick

### T3: Retirar o Blueprint do Render

**What**: Remover o Blueprint referenciado pelo deploy antigo.
**Where**: `hemovia-backend/render.yaml`
**Depends on**: None
**Requirement**: CICD-07
**Done when**:
- [x] O arquivo sai do checkout e o diff passa na checagem.
**Tests**: configuração
**Gate**: quick

### T4: Aplicar versões na VM

**What**: Aplicar uma versão imutável ao Compose existente, com bloqueio, verificação de saúde e recuperação.
**Where**: `hemovia-backend/deploy/lightsail/`
**Depends on**: None
**Requirement**: CICD-03, CICD-04, CICD-05, CICD-06, CICD-09
**Done when**:
- [x] O script e os testes de falha, recuperação e concorrência passam no gate full.
**Tests**: integração
**Gate**: full

### T5: Definir os recursos AWS do deploy

**What**: Definir o bucket, o documento SSM e as identidades restritas de publicação e da VM.
**Where**: `hemovia-backend/deploy/lightsail/aws-cicd.json`
**Depends on**: T4
**Requirement**: CICD-03, CICD-08
**Done when**:
- [x] A validação local e do CloudFormation confirma o template e a identidade alvo.
**Tests**: integração
**Gate**: quick

### T6: Publicar da main para a demo AWS

**What**: Criar o workflow manual que valida, empacota e publica os dois repositórios.
**Where**: `hemovia-backend/.github/workflows/deploy-aws-demo.yml`
**Depends on**: T5
**Requirement**: CICD-03, CICD-04, CICD-08
**Done when**:
- [x] O workflow está pronto para o disparo manual autenticado da `main`.
**Tests**: integração
**Gate**: full

### T7: Redirecionar o rollback para AWS

**What**: Acionar a última versão aprovada pela operação de rollback da demo.
**Where**: `hemovia-backend/.github/workflows/rollback.yml`
**Depends on**: T6
**Requirement**: CICD-06, CICD-07
**Done when**:
- [x] O rollback usa SSM e o workflow passa no gate full.
**Tests**: integração
**Gate**: full

### T8: Atualizar as instruções de deploy

**What**: Documentar publicação, rollback e verificação da demo AWS no guia existente.
**Where**: `hemovia-backend/README.md`
**Depends on**: T7
**Requirement**: CICD-07
**Done when**:
- [x] O guia mostra os comandos e destinos ativos e o diff passa na checagem.
**Tests**: configuração
**Gate**: quick

## Checks

**C1** - A CI do frontend executa instalação e build nas mudanças da main (CICD-01).
Proof: run deploy | PASS CICD-01

**C2** - A CI do backend mantém a verificação com PostgreSQL (CICD-02).
Proof: run deploy | PASS CICD-02

**C3** - A publicação aplica o par de commits identificado no workflow (CICD-03).
Proof: run deploy | PASS CICD-03

**C4** - O processo exige saúde do frontend, da API e dos contêineres (CICD-04).
Proof: run deploy | PASS CICD-04

**C5** - A falha reaplica a versão aprovada e retorna falha ao workflow (CICD-05).
Proof: run deploy | PASS CICD-05

**C6** - O rollback preserva o projeto e os volumes Compose (CICD-06).
Proof: run deploy | PASS CICD-06

**C7** - Os arquivos ativos de deploy deixam de chamar o Render (CICD-07).
Proof: run deploy | PASS CICD-07

**C8** - OIDC limita a função à `main` do backend (CICD-08).
Proof: run deploy | PASS CICD-08

**C9** - A segunda operação concorre pelo mesmo bloqueio na VM (CICD-09).
Proof: run deploy | PASS CICD-09

## Handoff

**Settled mid-build:** 2026-11-26 - user: "Autorizo na AWS e no GitHub" para provisionar IAM, S3 e Systems Manager, publicar e mesclar os PRs após os testes e executar uma publicação e um rollback de teste na demo.

**Promotion:** PR #80 aprovado para promover a API e o Compose de 532b5e2 da demo existente, condicionado à CI.

**Dispatched:** Verifier — HEMOVIA CI/CD, baseline `a153621`

**Walked:** 2026-11-26 — deploy 45883467828 e rollback 45883714627 aprovados na VM. Onze serviços ativos e nove volumes existentes verificados.
