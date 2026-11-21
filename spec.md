# Hemovia — frontend operacional

Especificação da implementação baseada no backend local, revisão `c74c062`.

## Tecnologias e apresentação

React 18, TypeScript, Vite, React Router e Lucide React. O tema usa CSS com variáveis semânticas, tipografia Inter, vermelho como cor de ação, superfícies claras e tema escuro. A navegação lateral se recolhe em telas pequenas. Tabelas se apresentam como registros com rótulos no mobile.

## Telas

| Caminho                 | Finalidade                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `/`                     | Resumo operacional, estoque e ações do perfil              |
| `/estoque`              | Lista e filtro local de bolsas                             |
| `/estoque/novo`         | Cadastro de bolsa                                          |
| `/doacoes`              | Lista de doações                                           |
| `/doacoes/nova`         | Registro de coleta com bolsa nova ou existente             |
| `/pedidos`              | Requisições acompanhadas e operação por UUID               |
| `/pedidos/novo`         | Requisição vinculada ao hospital autenticado               |
| `/pedidos/:id`          | Alocação, cancelamento, início do transporte e recebimento |
| `/logistica`            | Prévia de rota por hospital, componente e prazo            |
| `/rastreio`             | Comprovantes de transportes acompanhados                   |
| `/relatorios`           | Estoque e estatística da demanda por período               |
| `/unidades`             | Acesso aos cadastros administrativos                       |
| `/unidades/hemocentros` | Cadastro, lista, edição e exclusão                         |
| `/unidades/hospitais`   | Cadastro e comprovantes desta sessão                       |
| `/unidades/veiculos`    | Cadastro e lista de veículos                               |
| `/unidades/usuarios`    | Cadastro, lista, edição e desativação                      |
| `/unidades/grafo`       | Cadastro e lista de pontos e conexões                      |

## Contratos da integração

A base padrão é `/api/v1`. Durante o desenvolvimento, o proxy do Vite encaminha `/api` para `http://localhost:8080`. `VITE_API_BASE_URL` permite ajustar a base por ambiente.

A sessão usa os cookies HttpOnly emitidos pelo backend, com `credentials: include`. O login envia `identifier` e `password` para `/auth/login`. A inicialização consulta `/auth/me`. Mutações protegidas usam o cookie `XSRF-TOKEN` no header `X-XSRF-TOKEN`, obtido com `/auth/csrf`. Um 401 aciona uma tentativa de renovação por `/auth/refresh`, compartilhada entre chamadas concorrentes. Falhas de conexão em mutações orientam conferir o resultado antes de repetir.

Os erros da API apresentam `message` e, quando fornecido, o mapa `fieldErrors`. Requisições exibem carregamento, ausência de dados e nova tentativa. Botões de ação bloqueiam submissões concorrentes.

O formulário de requisição envia `bloodType`, `rhFactor`, `component`, `quantity`, `priority` e `deliveryDeadline`. O backend resolve o hospital pelo usuário autenticado. Datas com hora usam ISO 8601 em UTC na transmissão e hora local na entrada e apresentação. Datas civis das doações mantêm `YYYY-MM-DD`.

O cadastro de bolsa usa o campo `bloodTypeEnum`. Doações usam `bloodType` e podem vincular `bloodBagId`. Os enums enviados preservam os nomes da API. A interface traduz seus rótulos para português.

## Fluxo e permissões

O hospital cria uma requisição. O hemocentro solicita a alocação ao backend, que resolve compatibilidade, disponibilidade, reserva e rota. O hemocentro inicia o transporte usando `allocationId` e `vehicleId`. O hospital confirma o recebimento pelo identificador do transporte.

O hospital pode solicitar cancelamento enquanto a requisição está pendente ou alocada. A interface solicita confirmação para alocação, cancelamento, recebimento, exclusão de hemocentro e desativação de usuário. A API valida os papéis, vínculos e transições a cada chamada.

Os perfis são `ADMIN`, `HEMOCENTRO`, `HOSPITAL` e `TRANSPORTADOR`. Estatísticas ficam acessíveis a administrador e hemocentro. Administração dos cadastros fica acessível ao administrador. Cálculo de rota e início do transporte ficam acessíveis ao hemocentro. Criação da requisição e confirmação de entrega ficam acessíveis ao hospital.

## Limites da API atual

Os controllers inspecionados oferecem criação, alocação e cancelamento de requisições, início e conclusão de transportes. As consultas de leitura histórica desses recursos ainda precisam ser disponibilizadas. Em integração, a interface mantém em memória os comprovantes obtidos na sessão e permite informar UUIDs recebidos por outro canal.

Hospitais têm endpoint de criação. A interface lista seus comprovantes locais após o cadastro. O planejamento aceita o UUID do hospital de destino. Telemetria em tempo real depende de endpoints adicionais.

A estatística do estoque usa `InventorySummaryResponse`, incluindo `totalBags`, `byBloodType`, `byComponent` e `byBloodTypeAndComponent`. A demanda usa `DemandSummaryResponse`, incluindo `overall` e `byHospital`. Os valores estatísticos em integração vêm do backend.

## Demonstração

O acesso demonstrativo é explícito na tela de entrada. Os dados fictícios ficam em `hemovia.demo.v1` no armazenamento local do navegador. Trocar o perfil permite exercitar o fluxo entre hospital e hemocentro. O simulador oferece um trajeto de exemplo e regras simplificadas para explorar a interface. Os dados da integração real ficam em memória na sessão.

## Acessibilidade

Campos possuem rótulos, ações com ícones possuem nomes acessíveis, estados de erro usam `role=alert`, carregamentos usam `role=status`, links permitem pular a navegação e o foco é destacado. Confirmações usam o elemento nativo `dialog`. O layout respeita a preferência por redução de movimento. Situações usam rótulos textuais junto às cores.

## Validação realizada

O build de produção inclui checagem TypeScript. Foram exercitados no simulador os fluxos de alocação, reserva, transporte, entrega, cancelamento, liberação do estoque e rejeição de ações por perfil incompatível.

A integração com uma API em execução e a verificação visual no navegador permanecem pendentes. O acesso HTTP local do ambiente de validação apresentou timeout.
