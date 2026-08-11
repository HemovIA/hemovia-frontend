# 🩸 HEMOVIA — Especificação do Frontend

> **Projeto:** HEMOVIA
> **Produto:** Plataforma web para gestão inteligente da distribuição de hemocomponentes
> **Frontend:** React + TypeScript
> **Estilização:** Styled Components
> **Ícones:** Lucide React
> **Arquitetura:** Component-Based Architecture + princípios de Clean Code
> **Design:** UX/UI orientado à operação
> **Acessibilidade:** WCAG 2.2 — boas práticas de acessibilidade
> **Dados:** Exclusivamente sintéticos

---

# 1. Visão Geral

O frontend do **HEMOVIA** será responsável pela interface de interação entre os usuários e o backend da aplicação.

A interface deverá transformar informações operacionais complexas — estoque, requisições, compatibilidade, distribuição, rotas, transporte e telemetria — em uma experiência visual **clara, rápida, previsível e acessível**.

O frontend não deverá implementar regras de negócio que pertencem ao backend.

Seu papel será:

* Apresentar informações;
* Receber entradas do usuário;
* Validar dados de interface;
* Consumir a API;
* Apresentar estados;
* Exibir alertas;
* Permitir navegação;
* Representar visualmente os indicadores;
* Facilitar a tomada de decisão.

---

# 2. Objetivos do Frontend

O frontend deverá priorizar:

1. **Clareza**
2. **Hierarquia visual**
3. **Consistência**
4. **Acessibilidade**
5. **Responsividade**
6. **Feedback imediato**
7. **Previsibilidade**
8. **Baixa carga cognitiva**
9. **Eficiência operacional**
10. **Facilidade de manutenção**

O usuário deverá conseguir entender:

> **O que está acontecendo?**

> **O que precisa da minha atenção?**

> **Qual ação posso realizar?**

> **O que aconteceu depois da minha ação?**

sem precisar interpretar informações técnicas desnecessárias.

---

# 3. Stack

## Tecnologias principais

```text
React
TypeScript
Styled Components
Lucide React
```

## Integração

```text
Frontend
    ↓
HTTP/REST
    ↓
Spring Boot API
```

## Estrutura conceitual

```text
React
 │
 ├── Pages
 │
 ├── Components
 │
 ├── Hooks
 │
 ├── Services
 │
 ├── Contexts
 │
 ├── Types
 │
 └── Styles
```

---

# 4. Princípios Fundamentais de UX

## 4.1 Clareza antes de estética

O HEMOVIA é um sistema operacional e não apenas uma interface institucional.

A estética deverá apoiar a compreensão das informações.

Não utilizar:

* excesso de gradientes;
* animações desnecessárias;
* excesso de cores;
* textos longos em áreas críticas;
* elementos decorativos que competem com dados.

A pergunta principal deve ser:

> **Essa decisão visual ajuda o usuário a entender ou executar alguma coisa?**

Se não, ela provavelmente não precisa estar na interface.

---

# 5. Hierarquia Visual

As informações deverão possuir diferentes níveis de importância.

### Exemplo

```text
NÍVEL 1
Requisições pendentes: 08

NÍVEL 2
Hospital Central
O+ · Hemácias · 4 bolsas

NÍVEL 3
Solicitada às 14:32
Prazo: 18:00
```

O usuário deverá conseguir identificar rapidamente:

1. O problema;
2. A informação principal;
3. Os detalhes.

---

# 6. Lei da Proximidade

Informações relacionadas deverão permanecer visualmente próximas.

Exemplo:

```text
┌──────────────────────────────┐
│ Hospital Central             │
│                              │
│ O+ · Hemácias                │
│ 4 bolsas                     │
│                              │
│ Prazo: 18:00                 │
└──────────────────────────────┘
```

Evitar separar informações que pertencem ao mesmo contexto.

---

# 7. Consistência

Elementos que executam a mesma função deverão possuir a mesma aparência e comportamento.

Exemplo:

Todos os botões primários:

```text
[ Processar requisição ]
```

deverão seguir o mesmo padrão visual.

Todos os estados:

```text
Pendente
Em transporte
Entregue
Cancelada
```

deverão possuir representação consistente em todo o sistema.

---

# 8. Feedback do Sistema

Toda ação importante deverá gerar feedback.

### Exemplo

Usuário clica:

```text
[ Processar requisição ]
```

A interface deverá indicar:

```text
Processando...
```

Após sucesso:

```text
✓ Requisição processada com sucesso.
```

Após erro:

```text
⚠ Não existem bolsas compatíveis suficientes.
```

Nunca deixar o usuário sem saber se uma ação foi executada.

---

# 9. Estados da Interface

Todo componente que depende de dados externos deverá considerar pelo menos:

```text
LOADING
SUCCESS
EMPTY
ERROR
```

Exemplo:

```text
┌──────────────────────┐
│      Loading...      │
└──────────────────────┘
```

Estado vazio:

```text
┌────────────────────────────┐
│                            │
│       Nenhuma requisição   │
│                            │
│ Ainda não existem          │
│ requisições cadastradas.   │
│                            │
│ [ Nova requisição ]        │
└────────────────────────────┘
```

Erro:

```text
⚠ Não foi possível carregar
as requisições.

[ Tentar novamente ]
```

---

# 10. Arquitetura de Componentes

O frontend deverá seguir uma arquitetura baseada em componentes reutilizáveis.

```text
src/
├── app/
├── pages/
├── components/
├── features/
├── hooks/
├── services/
├── contexts/
├── types/
├── utils/
├── styles/
└── assets/
```

---

# 11. Estrutura Recomendada

```text
src/
│
├── app/
│   ├── App.tsx
│   └── routes.tsx
│
├── pages/
│   ├── Dashboard/
│   ├── Inventory/
│   ├── Requests/
│   ├── Distribution/
│   ├── Routes/
│   ├── Telemetry/
│   └── Statistics/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── feedback/
│   ├── data-display/
│   └── forms/
│
├── features/
│   ├── inventory/
│   ├── requests/
│   ├── distribution/
│   ├── telemetry/
│   └── statistics/
│
├── hooks/
│
├── services/
│   ├── api/
│   ├── requests/
│   ├── inventory/
│   ├── telemetry/
│   └── statistics/
│
├── contexts/
│
├── types/
│
├── utils/
│
├── styles/
│   ├── GlobalStyles.ts
│   ├── theme.ts
│   └── tokens.ts
│
└── assets/
```

---

# 12. Separação por Features

Funcionalidades complexas deverão ser agrupadas por domínio.

Exemplo:

```text
features/
└── requests/
    ├── components/
    ├── hooks/
    ├── services/
    ├── types/
    └── utils/
```

Isso evita que o projeto tenha uma pasta `components` gigantesca contendo componentes sem relação.

---

# 13. Pages

As páginas representam telas completas.

Exemplo:

```text
pages/
├── Dashboard/
├── Inventory/
├── Requests/
├── Distribution/
├── Routes/
├── Telemetry/
└── Statistics/
```

Uma página deverá principalmente **compor componentes**.

Evitar colocar regras complexas diretamente dentro de uma página.

---

# 14. Componentes

Os componentes deverão possuir responsabilidades pequenas e claras.

Exemplo:

```text
Dashboard
│
├── Header
├── SummaryCards
├── PendingRequests
├── InventoryOverview
├── TransportStatus
└── AlertsPanel
```

---

# 15. Design System

O HEMOVIA deverá possuir um pequeno Design System próprio.

```text
Design System
│
├── Colors
├── Typography
├── Spacing
├── Border Radius
├── Shadows
├── Buttons
├── Inputs
├── Cards
├── Badges
├── Tables
├── Modals
├── Alerts
└── Tooltips
```

Isso garante consistência visual.

---

# 16. Styled Components

A estilização deverá utilizar `styled-components`.

Exemplo conceitual:

```text
Button
├── Primary
├── Secondary
├── Danger
└── Ghost
```

O componente deverá controlar suas próprias variações visuais.

Evitar espalhar estilos inline pelo projeto.

---

# 17. Design Tokens

Valores visuais deverão ser centralizados.

Exemplo:

```text
colors
spacing
fontSizes
fontWeights
borderRadius
shadows
transitions
```

Conceitualmente:

```text
theme
│
├── colors
├── typography
├── spacing
├── radius
├── shadows
└── breakpoints
```

Isso permite alterar a identidade visual sem precisar procurar valores espalhados pelo código.

---

# 18. Tipografia

A tipografia deverá possuir hierarquia clara.

Exemplo:

```text
H1
Página

H2
Seção

H3
Card

Body
Informação

Caption
Informação secundária
```

Evitar utilizar muitos tamanhos diferentes.

A tipografia deverá priorizar:

* legibilidade;
* contraste;
* espaçamento;
* leitura rápida.

---

# 19. Sistema de Cores

As cores deverão possuir significado semântico.

Exemplo:

```text
Primary
→ ações principais

Success
→ operação concluída

Warning
→ atenção

Danger
→ erro / risco

Info
→ informação

Neutral
→ informação sem estado crítico
```

A cor não deverá ser o único elemento responsável por transmitir significado.

Errado:

```text
🟢
🟡
🔴
```

Preferir:

```text
✓ Normal
⚠ Atenção
! Crítico
```

---

# 20. Acessibilidade

A acessibilidade será um requisito estrutural do frontend.

A interface deverá buscar conformidade com princípios da **WCAG 2.2**, especialmente:

* Perceptível;
* Operável;
* Compreensível;
* Robusto.

---

# 21. HTML Semântico

Utilizar elementos HTML de acordo com sua função.

Preferir:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
<button>
<form>
<label>
```

Evitar construir toda a interface utilizando:

```html
<div>
```

sem significado semântico.

---

# 22. Navegação por Teclado

Todas as funcionalidades importantes deverão ser acessíveis utilizando teclado.

O usuário deverá conseguir:

```text
TAB
↓
Próximo elemento

SHIFT + TAB
↓
Elemento anterior

ENTER / SPACE
↓
Ativar ação

ESC
↓
Fechar modal
```

Não criar componentes que só funcionam com mouse.

---

# 23. Focus State

Elementos interativos deverão possuir estado de foco visível.

Exemplo:

```text
┌──────────────────────────┐
│ [ Processar requisição ] │
└──────────────────────────┘
          ↑
      Focus visível
```

Nunca remover completamente o `outline` sem criar uma alternativa acessível.

---

# 24. Contraste

Textos e elementos importantes deverão possuir contraste suficiente com o fundo.

O contraste deverá ser considerado para:

* texto;
* botões;
* links;
* badges;
* tabelas;
* estados;
* mensagens;
* gráficos.

Não utilizar:

```text
cinza muito claro
```

para informações importantes.

---

# 25. Não Depender Apenas de Cor

Um alerta crítico não deverá ser representado apenas por vermelho.

Preferir:

```text
┌────────────────────────────────────┐
│ ⚠ Temperatura fora da faixa        │
│ Veículo V001 — 9,2 °C              │
└────────────────────────────────────┘
```

A informação possui:

* ícone;
* texto;
* estado;
* valor.

---

# 26. Lucide React

Os ícones serão fornecidos pelo **Lucide React**.

Exemplos conceituais:

```text
Dashboard       → LayoutDashboard
Estoque         → Package
Hospital        → Hospital
Requisição      → ClipboardList
Transporte      → Truck
Rota            → Route
Temperatura     → Thermometer
Alerta          → TriangleAlert
Sucesso         → CircleCheck
Erro            → CircleX
Pesquisar       → Search
```

Os ícones deverão complementar o texto.

Não utilizar ícone sozinho quando a ação não for facilmente compreensível.

---

# 27. Ícones Acessíveis

Ícones decorativos deverão ser ocultados de tecnologias assistivas quando necessário.

Ícones que representam ações deverão possuir nome acessível.

Exemplo conceitual:

```text
[ 🔍 ]
```

deverá possuir:

```text
aria-label="Pesquisar"
```

quando não houver texto visível equivalente.

---

# 28. Formulários

Formulários deverão possuir:

```text
Label
Input
Hint
Error
```

Exemplo:

```text
Tipo sanguíneo *

[ O+                 ]

Selecione o tipo sanguíneo.

⚠ Campo obrigatório.
```

O `label` deverá estar associado ao campo.

---

# 29. Validação de Formulário

A validação deverá ser clara e próxima do campo.

Errado:

```text
Erro!
```

Preferir:

```text
Quantidade de bolsas

[ -2 ]

⚠ A quantidade deve ser maior que zero.
```

---

# 30. Mensagens de Erro

Erros deverão explicar:

1. O que aconteceu;
2. Por que aconteceu, quando possível;
3. O que o usuário pode fazer.

Exemplo ruim:

```text
Erro 400.
```

Exemplo melhor:

```text
Não foi possível processar a requisição.

Não existem bolsas compatíveis suficientes
no estoque atual.

[ Atualizar estoque ]
```

---

# 31. Dashboard

O Dashboard será a tela operacional principal.

Estrutura:

```text
┌───────────────────────────────────────────────┐
│ Header                                        │
├──────────────┬────────────────────────────────┤
│              │                                │
│ Sidebar      │ Dashboard                      │
│              │                                │
│              │ ┌──────┐ ┌──────┐ ┌──────┐   │
│              │ │Estoque│ │Pedidos│ │Alertas│ │
│              │ └──────┘ └──────┘ └──────┘   │
│              │                                │
│              │ ┌────────────┐ ┌────────────┐ │
│              │ │ Requisições│ │ Estoque    │ │
│              │ │ pendentes  │ │             │ │
│              │ └────────────┘ └────────────┘ │
│              │                                │
└──────────────┴────────────────────────────────┘
```

---

# 32. Dashboard — Hierarquia

A ordem das informações deverá seguir:

```text
1. Alertas críticos
2. Requisições pendentes
3. Estado do estoque
4. Transportes
5. Indicadores
6. Informações secundárias
```

O usuário deverá identificar situações críticas rapidamente.

---

# 33. Tela de Estoque

Deverá apresentar:

```text
Estoque
│
├── Filtros
├── Indicadores
├── Tabela de bolsas
└── Paginação
```

Tabela:

| Bolsa | Tipo | Componente | Validade | Status     |
| ----- | ---- | ---------- | -------- | ---------- |
| H001  | O+   | Hemácias   | 12/08    | Disponível |
| H002  | A+   | Plasma     | 14/08    | Reservada  |

---

# 34. Filtros

Filtros deverão ser simples e previsíveis.

Exemplo:

```text
Buscar bolsa...

Tipo sanguíneo
[ Todos ▼ ]

Componente
[ Todos ▼ ]

Status
[ Todos ▼ ]

[ Filtrar ] [ Limpar ]
```

---

# 35. Requisições

Tela:

```text
Requisições
│
├── Resumo
├── Filtros
├── Tabela
└── Ações
```

Ações:

```text
Visualizar
Processar
Cancelar
```

Ações destrutivas deverão exigir confirmação quando necessário.

---

# 36. Status Visual

Status deverão ser apresentados com badges.

Exemplo:

```text
[Pendente]
[Em análise]
[Alocada]
[Em transporte]
[Entregue]
[Cancelada]
```

O texto deverá permanecer visível mesmo sem a cor.

---

# 37. Tela de Distribuição

A tela de distribuição deverá representar visualmente:

```text
REQUISIÇÃO
    ↓
BOLSAS
    ↓
ROTA
    ↓
TRANSPORTE
    ↓
TELEMETRIA
```

Isso permite que o usuário acompanhe o ciclo operacional.

---

# 38. Tela de Rota

A tela deverá apresentar:

```text
Origem
   ↓
Ponto intermediário
   ↓
Destino
```

Além de:

* distância;
* tempo estimado;
* status;
* veículo.

---

# 39. Telemetria

A tela de telemetria deverá priorizar informações críticas.

Exemplo:

```text
Veículo V001

Temperatura
4,3 °C

Status
✓ Normal

Localização
Recife

Última atualização
14:32:12
```

---

# 40. Alerta de Temperatura

Quando a temperatura estiver fora da faixa configurada para o cenário simulado:

```text
┌────────────────────────────────────┐
│ ⚠ ALERTA DE TEMPERATURA            │
│                                    │
│ Veículo: V001                      │
│ Temperatura: 9,2 °C                │
│                                    │
│ Atualização: 14:32                 │
└────────────────────────────────────┘
```

O alerta deverá possuir:

* ícone;
* título;
* informação;
* valor;
* timestamp;
* estado textual.

---

# 41. Gráficos

Os gráficos deverão existir para facilitar interpretação, e não apenas para decorar o dashboard.

Exemplos:

### Estoque

```text
Quantidade por tipo sanguíneo
```

### Demanda

```text
Requisições por período
```

### Perdas

```text
Bolsas descartadas
```

### Operação

```text
Tempo médio de atendimento
```

---

# 42. Acessibilidade em Gráficos

Informações importantes dos gráficos deverão possuir alternativa textual.

Não depender apenas da visualização gráfica.

Exemplo:

```text
Gráfico: Requisições por tipo sanguíneo

O+: 32
A+: 27
B+: 14
AB+: 7
```

Isso também melhora a compreensão para usuários que tenham dificuldade com gráficos.

---

# 43. Responsividade

O sistema deverá funcionar em:

```text
Desktop
Tablet
Mobile
```

A prioridade visual poderá ser:

```text
Desktop
   ↓
Tablet
   ↓
Mobile
```

Como o sistema possui grande quantidade de informações, o desktop será a experiência operacional principal.

---

# 44. Mobile

No mobile, a interface deverá priorizar:

```text
1. Alertas
2. Requisições
3. Status
4. Ações principais
5. Detalhes
```

Tabelas extensas poderão ser transformadas em cards.

---

# 45. Sidebar Responsiva

Desktop:

```text
┌──────────────┬──────────────────────┐
│              │                      │
│ Dashboard    │                      │
│ Estoque      │       Conteúdo       │
│ Requisições  │                      │
│ Distribuição │                      │
│ Telemetria   │                      │
│ Estatísticas │                      │
│              │                      │
└──────────────┴──────────────────────┘
```

Mobile:

```text
☰
```

O menu deverá poder ser aberto e fechado pelo teclado e por tecnologias assistivas.

---

# 46. Responsividade de Dados

Não reduzir simplesmente o tamanho da tabela.

Em telas menores:

```text
Tabela
   ↓
Card
   ↓
Informações essenciais
   ↓
Detalhes expansíveis
```

---

# 47. Loading

Evitar uma tela branca durante carregamentos.

Preferir:

```text
Skeleton
```

para estruturas conhecidas.

Exemplo:

```text
┌─────────────────────────┐
│ █████████████           │
│ ████████                │
│ █████████████████       │
└─────────────────────────┘
```

---

# 48. Empty State

Todo módulo deverá possuir um estado vazio pensado para o usuário.

Exemplo:

```text
📦

Nenhuma bolsa encontrada

Não existem bolsas correspondentes
aos filtros selecionados.

[ Limpar filtros ]
```

---

# 49. Modais

Modais deverão ser utilizados apenas para decisões que realmente exigem foco.

Exemplo:

```text
Cancelar requisição?

Essa ação não poderá ser desfeita.

[ Voltar ] [ Cancelar requisição ]
```

O modal deverá:

* possuir título;
* possuir descrição;
* possuir foco inicial;
* permitir ESC;
* devolver foco ao elemento que o abriu.

---

# 50. Toasts

Toasts poderão ser utilizados para feedback rápido.

Sucesso:

```text
✓ Bolsa cadastrada com sucesso.
```

Erro:

```text
⚠ Não foi possível salvar a bolsa.
```

Porém, informações críticas não deverão existir somente em um toast que desaparece.

---

# 51. Microinterações

Animações deverão ser discretas.

Exemplos:

* hover;
* focus;
* abertura de modal;
* expansão de card;
* atualização de status.

Evitar:

* animações contínuas desnecessárias;
* elementos piscando;
* transições longas;
* efeitos que dificultem a leitura.

---

# 52. Reduced Motion

A interface deverá respeitar preferências de redução de movimento.

Conceitualmente:

```text
prefers-reduced-motion
```

Quando ativado:

```text
animações → reduzidas
transições → simplificadas
movimentos → minimizados
```

---

# 53. Navegação

A navegação deverá ser previsível.

Menu:

```text
Dashboard
Estoque
Requisições
Distribuição
Rotas
Telemetria
Estatísticas
```

A página atual deverá possuir indicação visual e semântica.

---

# 54. Breadcrumb

Para páginas profundas:

```text
Dashboard
  /
Requisições
  /
REQ-001
```

Isso ajuda o usuário a compreender onde está.

---

# 55. Busca

A busca deverá possuir:

* label;
* placeholder explicativo;
* ícone;
* feedback;
* estado vazio;
* possibilidade de limpar.

Exemplo:

```text
🔍 Buscar por bolsa, hospital ou requisição...
```

O placeholder não substitui o label quando a acessibilidade exigir identificação persistente.

---

# 56. UX para Ações Críticas

Ações que alteram dados deverão ser claras.

Exemplo:

```text
[ Processar requisição ]
```

deve ser visualmente diferente de:

```text
[ Cancelar requisição ]
```

A ação destrutiva não deve possuir o mesmo destaque visual da ação principal.

---

# 57. Prevenção de Erros

A interface deverá prevenir erros antes que eles aconteçam.

Exemplo:

```text
Quantidade

[ 0 ]
```

deverá impedir o envio e explicar:

```text
A quantidade deve ser maior que zero.
```

---

# 58. Confirmação de Ações

Para ações irreversíveis:

```text
Usuário
  ↓
Cancelar requisição
  ↓
Modal de confirmação
  ↓
Confirmar
  ↓
Backend
  ↓
Feedback
```

---

# 59. Arquitetura de Estado

O frontend deverá diferenciar:

```text
UI State
```

de:

```text
Server State
```

### UI State

Exemplos:

```text
modalOpen
sidebarOpen
selectedFilter
activeTab
```

### Server State

Exemplos:

```text
requests
inventory
telemetry
statistics
```

Isso evita misturar estado de interface com dados vindos da API.

---

# 60. Services

As chamadas HTTP deverão ficar isoladas.

Exemplo:

```text
services/
└── requests/
    └── requestService.ts
```

A página não deverá fazer chamadas HTTP diretamente em vários lugares.

Conceitualmente:

```text
Page
 ↓
Hook
 ↓
Service
 ↓
API
```

---

# 61. Hooks

Hooks deverão encapsular lógica reutilizável.

Exemplos:

```text
useRequests()
useInventory()
useTelemetry()
useDashboard()
useStatistics()
useDebounce()
useMediaQuery()
```

---

# 62. Types

Os contratos da API deverão ser tipados.

Exemplo:

```text
types/
├── Hospital.ts
├── BloodBag.ts
├── Request.ts
├── Allocation.ts
├── Route.ts
├── Transport.ts
└── Telemetry.ts
```

Isso reduz erros de integração com o backend.

---

# 63. Contrato Frontend ↔ Backend

O frontend deverá consumir os endpoints definidos no backend.

Exemplo:

```text
GET /api/v1/requests
```

↓

```text
RequestResponse[]
```

↓

```text
useRequests()
```

↓

```text
RequestTable
```

---

# 64. Segurança no Frontend

Mesmo sendo um MVP acadêmico:

* não armazenar senhas;
* não expor secrets;
* não colocar credenciais no código;
* não confiar na validação do frontend;
* tratar dados recebidos da API como externos;
* não utilizar `dangerouslySetInnerHTML` sem necessidade.

A validação do frontend é para experiência do usuário.

A validação definitiva pertence ao backend.

---

# 65. Performance

O frontend deverá evitar renderizações desnecessárias.

Prioridades:

* componentes pequenos;
* listas eficientes;
* paginação;
* debounce em buscas;
* lazy loading quando necessário;
* imagens otimizadas;
* evitar estados globais desnecessários.

Não realizar otimização prematura sem necessidade.

---

# 66. UX para o Fluxo Principal

O principal fluxo da aplicação deverá ser extremamente claro.

```text
Hospital cria requisição
          ↓
Requisição aparece como PENDENTE
          ↓
Operador abre requisição
          ↓
Sistema apresenta informações
          ↓
[ Processar requisição ]
          ↓
Backend executa:
    Compatibilidade
          ↓
        FEFO
          ↓
      Alocação
          ↓
       Dijkstra
          ↓
      Transporte
          ↓
    Telemetria
          ↓
Frontend atualiza status
```

---

# 67. Tela de Detalhes da Requisição

Deverá apresentar:

```text
REQ-001

Hospital Central

O+
Concentrado de Hemácias

Quantidade solicitada
4

Status
Em transporte
```

Depois:

```text
Bolsas alocadas

H001
H005
H009
H012
```

E:

```text
Rota

Hemocentro
   ↓
Hospital Central

8,4 km
22 min
```

---

# 68. Timeline

O processamento poderá ser representado por uma timeline.

```text
✓ Requisição criada
│
✓ Compatibilidade verificada
│
✓ Bolsas selecionadas
│
✓ Rota calculada
│
● Em transporte
│
○ Entrega
```

Isso fornece ao usuário uma percepção clara de progresso.

---

# 69. Acessibilidade da Timeline

Não utilizar somente linhas e cores.

Cada etapa deverá possuir texto:

```text
Concluído
Em andamento
Pendente
```

Assim, a informação permanece compreensível sem depender da percepção visual.

---

# 70. Dashboard de Alertas

Os alertas deverão possuir prioridade.

```text
CRÍTICO
⚠ Temperatura fora da faixa

ATENÇÃO
⚠ 5 bolsas próximas do vencimento

INFO
ℹ Nova requisição recebida
```

A prioridade deverá ser textual e visual.

---

# 71. Princípios de UX Aplicados

O projeto deverá utilizar conscientemente princípios fundamentais de UX:

### Visibilidade do estado do sistema

O usuário sempre deverá saber o estado atual.

### Correspondência com o mundo real

Termos como:

```text
Bolsa
Estoque
Hospital
Transporte
Entrega
```

deverão ser utilizados de maneira consistente.

### Controle do usuário

O usuário deverá poder:

* cancelar ações quando possível;
* voltar;
* limpar filtros;
* repetir operações.

### Consistência

Mesmas ações → mesmos padrões.

### Prevenção de erros

Evitar que o usuário consiga realizar ações inválidas.

### Reconhecimento em vez de memorização

Mostrar informações necessárias no contexto.

### Flexibilidade

Filtros, busca e atalhos devem facilitar usuários recorrentes.

### Design minimalista

Mostrar somente informações relevantes para a tarefa atual.

---

# 72. Checklist de Acessibilidade

Antes de considerar uma tela concluída:

* [ ] HTML semântico;
* [ ] Navegação por teclado;
* [ ] Focus visível;
* [ ] Labels associados aos inputs;
* [ ] Mensagens de erro claras;
* [ ] Contraste adequado;
* [ ] Não depender somente de cor;
* [ ] Ícones com nomes acessíveis quando necessários;
* [ ] Imagens com texto alternativo quando relevantes;
* [ ] Modais acessíveis;
* [ ] Ordem de foco lógica;
* [ ] Estados de loading acessíveis;
* [ ] Estados vazios compreensíveis;
* [ ] Respeito a reduced motion;
* [ ] Interface responsiva;
* [ ] Conteúdo compreensível sem mouse.

---

# 73. Checklist de UX

* [ ] Usuário entende onde está;
* [ ] Usuário sabe o que fazer;
* [ ] Ação principal está evidente;
* [ ] Informações importantes possuem hierarquia;
* [ ] Feedback aparece após ações;
* [ ] Erros explicam como resolver;
* [ ] Estados vazios possuem orientação;
* [ ] Loading não deixa tela aparentemente quebrada;
* [ ] A interface não depende de memória;
* [ ] Elementos semelhantes possuem comportamento semelhante;
* [ ] Informações críticas possuem destaque adequado.

---

# 74. Checklist de UI

* [ ] Design tokens centralizados;
* [ ] Tipografia consistente;
* [ ] Espaçamentos consistentes;
* [ ] Botões padronizados;
* [ ] Inputs padronizados;
* [ ] Badges padronizados;
* [ ] Cards padronizados;
* [ ] Ícones Lucide;
* [ ] Estados hover;
* [ ] Estados focus;
* [ ] Estados disabled;
* [ ] Estados loading;
* [ ] Estados error;
* [ ] Estados empty;
* [ ] Responsividade.

---

# 75. Definition of Done — Frontend

Uma tela será considerada pronta quando:

* [ ] Layout implementado;
* [ ] Componentes reutilizáveis;
* [ ] Styled Components utilizado;
* [ ] Lucide utilizado para ícones;
* [ ] Responsividade implementada;
* [ ] Loading implementado;
* [ ] Empty state implementado;
* [ ] Error state implementado;
* [ ] Feedback de ações implementado;
* [ ] Navegação por teclado testada;
* [ ] Focus visível;
* [ ] Contraste verificado;
* [ ] Labels e semântica revisados;
* [ ] API integrada;
* [ ] Estados de servidor tratados;
* [ ] Testes necessários implementados.

---

# 76. Estrutura Final do Frontend

```text
src/
│
├── app/
│   ├── App.tsx
│   └── routes.tsx
│
├── pages/
│   ├── Dashboard/
│   ├── Inventory/
│   ├── Requests/
│   ├── Distribution/
│   ├── Routes/
│   ├── Telemetry/
│   └── Statistics/
│
├── features/
│   ├── inventory/
│   ├── requests/
│   ├── distribution/
│   ├── routes/
│   ├── telemetry/
│   └── statistics/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── feedback/
│   └── data-display/
│
├── hooks/
│
├── services/
│   ├── api/
│   ├── inventory/
│   ├── requests/
│   ├── distribution/
│   ├── telemetry/
│   └── statistics/
│
├── types/
│
├── contexts/
│
├── utils/
│
├── styles/
│   ├── theme.ts
│   ├── tokens.ts
│   └── GlobalStyles.ts
│
└── assets/
```

---

# 77. Fluxo Arquitetural

```text
                    USER
                     │
                     ▼
                  PAGE
                     │
                     ▼
               COMPONENTS
                     │
                     ▼
                   HOOK
                     │
                     ▼
                 SERVICE
                     │
                     ▼
                  REST API
                     │
                     ▼
                 BACKEND
                     │
                     ▼
                RESPONSE
                     │
                     ▼
                  HOOK
                     │
                     ▼
               COMPONENT
                     │
                     ▼
                   USER
```

---

# 78. Princípio Central do Frontend

> **O frontend do HEMOVIA não deve apenas mostrar dados. Ele deve transformar informações operacionais complexas em decisões visuais claras, acessíveis e acionáveis.**

A interface deverá responder rapidamente às quatro perguntas fundamentais:

```text
O que está acontecendo?
        ↓
Qual é o nível de prioridade?
        ↓
O que eu posso fazer?
        ↓
O que aconteceu depois da ação?
```

---

# 79. Resultado Esperado

Ao final do desenvolvimento, o frontend deverá oferecer uma experiência integrada com o backend capaz de:

```text
🏥 Gerenciar hospitais
        ↓
📦 Visualizar estoque
        ↓
📋 Criar e acompanhar requisições
        ↓
🧬 Visualizar compatibilidade
        ↓
⏳ Acompanhar FEFO
        ↓
🚚 Acompanhar distribuição
        ↓
🗺️ Visualizar rotas
        ↓
🌡️ Monitorar telemetria
        ↓
📊 Interpretar indicadores
```

Tudo isso deverá ser apresentado em uma interface:

> **clara + consistente + responsiva + acessível + orientada à tarefa.**

---

# 80. Regra de Ouro do Frontend

> **Se o usuário precisa pensar sobre como a interface funciona, a interface está fazendo o usuário trabalhar mais do que deveria.**

O HEMOVIA deverá utilizar UX/UI para reduzir essa carga cognitiva, mantendo a complexidade necessária **dentro do sistema** e apresentando ao usuário apenas a informação necessária para tomar a próxima decisão.
