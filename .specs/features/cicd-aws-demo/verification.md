# Verificação do CI/CD do Hemovia na AWS

**Verdict**: PASS após as correções
**Proofs**: `proofs.md` no frontend d1df2a0. Publicação e rollback na main do backend 95bc497.
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `deploy/lightsail/test_cicd.py`, `test_workflows`, `PASS CICD-01` | no — conta ocorrências de `branches: [main]` e busca comandos como texto. O workflow atual tem os gatilhos e as etapas esperados. |
| C2 | `deploy/lightsail/test_cicd.py`, `test_workflows`, `PASS CICD-02` | no — busca PostgreSQL e Maven como texto e aceita uma alteração dos gatilhos. O diff preserva o job de testes e os gatilhos anteriores. |
| C3 | `deploy/lightsail/test_cicd.py`, `test_release`, `PASS CICD-03` | no — o teste fornece um pacote artificial diretamente ao script e verifica seu identificador no estado. O workflow falha ao montar o pacote com o checkout auditado. |
| C4 | `deploy/lightsail/test_cicd.py`, `test_release`, `PASS CICD-04` | no — o teste busca `--wait` e nomes de serviços. O curl simulado responde sucesso por padrão e o Docker simulado sempre lista os 11 serviços. |
| C5 | `deploy/lightsail/test_cicd.py`, `test_release`, `PASS CICD-05` | no — simula falha em `compose up` e verifica a mensagem e o estado. Uma falha após o `up` passa sem cobertura. |
| C6 | `deploy/lightsail/test_cicd.py`, `test_release`, `PASS CICD-06` | no — o teste verifica o nome do projeto e o `.env`. O log usado para procurar `down` registra apenas chamadas de `up`, e a fixture não declara volumes. |
| C7 | `deploy/lightsail/test_cicd.py`, `test_workflows`, `PASS CICD-07` | no — verificações negativas cobrem os marcadores da implementação anterior. O teste aceitaria a ausência dos workflows AWS e das instruções de deploy. |
| C8 | `deploy/lightsail/test_cicd.py`, `test_workflows`, `PASS CICD-08` | no — confirma audiência e condição da primeira declaração, e aceitaria uma segunda declaração com acesso fora da main. O template auditado contém uma declaração de confiança. |
| C9 | `deploy/lightsail/test_cicd.py`, `test_release`, `PASS CICD-09` | no — um bloqueio real impede o rollback. Ainda falta provar que o deploy também falha sem alterar o runtime quando o mesmo bloqueio está ocupado. |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| O checkout do workflow carece dos arquivos empacotados e da prontidão exigida | `.github/workflows/deploy-aws-demo.yml:82` copia `docker-compose.yml`, `prometheus`, `grafana`, `loki` e `tempo`, todos ausentes no Git em `a153621`. A API desse commit também carece de `/readyz`, exigido em `release.sh:51`. Ambos estão presentes em `532b5e2`. | Promover à main a árvore da API e do Compose usada pela demo, com CI. Provar o empacotamento a partir de um checkout limpo. | 8f83ead — C3, pacote real da main no run 45883467828. |
| Um redirecionamento vazio do frontend é aprovado | O curl real recebeu 302 com corpo vazio em uma fixture local. `release.sh:53` retornou 0 e gravou o par novo como versão atual. | Exigir status 200 e resposta HTML com conteúdo. Testar redirecionamento e erro do frontend e ausência de um contêiner essencial. | 10dab13 — C4, 302 e 200 sem corpo rejeitados. |
| Erro ao gravar o estado deixa a versão ativa divergente da registrada | Ao substituir `.deploy/versions.next` por um diretório em uma fixture local, `up` aplicou o candidato, `record_version` falhou e a operação terminou com status 1, sem reaplicar a versão registrada. O rollback usa a mesma gravação em `release.sh:143`. | Tratar a falha de persistência em deploy e rollback reaplicando a última versão aprovada. Provar a última operação de Compose e o estado registrado. | 10dab13 — C5 e C6, recuperação em falha de persistência. |
| Os testes de workflow e confiança aceitam alterações que quebrariam o contrato | `test_workflows` verifica substrings dos arquivos de CI e Render e parte da primeira declaração de confiança. `test_release` ignora a montagem e o envio ao SSM. | Afirmar os gatilhos, os comandos nos jobs, os workflows AWS e o contrato de confiança completo. Conferir como os dois commits chegam ao pacote e à chamada SSM. | 21e0e6d — C1, C2, C3, C7 e C8, reforço do teste local e execuções reais da main. |
| Os testes de recuperação, volumes e bloqueio precisam de casos adicionais | `test_release` só provoca falha de `up`, só registra operações `up` e só disputa o lock pelo rollback. | Provocar uma falha de prontidão, afirmar a reaplicação efetiva da versão anterior, conferir os volumes do modelo Compose e testar deploy e rollback com o lock ocupado. | 21e0e6d — C5, C6 e C9, falhas locais e nove volumes confirmados no rollback real. |

## Provas independentes

- Uma falha de prontidão depois de `compose up` retornou 1, executou `up` para a versão anterior e preservou o estado. O servidor e os comandos simulados ficaram restritos a uma fixture local.
- Com a base de `532b5e2`, o Compose 5.7.0 renderizou os 11 serviços e os mesmos nove volumes nomeados em dois diretórios de release, com um bind de frontend próprio para cada versão.

## Provas após as correções

- C1 e C2: os workflows da main concluíram o build Vite e os testes Maven com PostgreSQL. O workflow do backend publicou a imagem do SHA validado. [CI do frontend](https://github.com/HemovIA/hemovia-frontend/actions/runs/45880544591) · [CI do backend](https://github.com/HemovIA/hemovia-backend/actions/runs/45883071364)
- C3 e C8: a publicação usou o checkout da main, assumiu a função AWS por OIDC e registrou o par `95bc4978c7fcd76c357c2e21dd8385317114df04-914e39851333d358aaaa21fd780a59688c958247`. O teste local confirma que há uma única declaração de confiança, vinculada à main do backend. [Publicação](https://github.com/HemovIA/hemovia-backend/actions/runs/45883467828)
- C4 e C5: os testes locais cobrem falhas do Compose, de prontidão da API, de status e conteúdo da página, de serviço ausente e de persistência após a ativação.
- C6: a operação voltou à imagem `hemovia-api:demo-baseline`. A aplicação, a API, o Grafana e o Mailpit responderam com HTTP 200. Os 11 serviços permaneceram ativos e os nove volumes mantiveram os mesmos nomes e datas de criação. [Rollback](https://github.com/HemovIA/hemovia-backend/actions/runs/45883714627)
- C7 e C9: os arquivos da main apontam para a AWS e dispensam o Blueprint e os hooks antigos. A suíte usa o mesmo bloqueio em uma tentativa de deploy e outra de rollback e confirma que ambas deixam a lista de operações do Compose intacta.
