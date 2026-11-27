# Preparação da demo do Hemovia

Este roteiro é para quem administra a [demo do Hemovia](https://18.216.26.95/). Prepare as unidades e as contas antes de distribuir o trabalho. Use somente dados fictícios durante toda a atividade.

## Unidades e frota

1. Entre com sua conta de administrador. Em **Cadastros**, abra **Hemocentros** ou **Hospitais** e clique em **Novo cadastro** para cada linha. A prioridade é um campo do hospital.

   | Cadastro | Nome | Cidade | Latitude | Longitude | Prioridade |
   | --- | --- | --- | ---: | ---: | ---: |
   | Hemocentro | Hemocentro Demo Recife | Recife | -8.0649 | -34.8770 | |
   | Hospital | Hospital Demo Norte | Recife | -8.0433 | -34.8988 | 1 |
   | Hospital | Hospital Demo Sul | Recife | -8.1000 | -34.8870 | 2 |

2. Em **Cadastros → Veículos → Novo cadastro**, cadastre `DEMO-REC-01` e `DEMO-REC-02`, ambos com capacidade de **10 bolsas**.
3. Em **Cadastros → Rede logística**, use **Adicionar ponto** para criar um ponto do tipo **Hemocentro**, vinculado ao Hemocentro Demo Recife, e um ponto do tipo **Hospital** para cada hospital. Use o nome da unidade como nome do ponto.
4. Em **Adicionar conexão**, escolha o ponto do hemocentro como origem. Crie uma conexão para o Hospital Demo Norte e outra para o Hospital Demo Sul. Confira as duas conexões na tela antes de iniciar o roteiro de distribuição. Se houver erro no cálculo da conexão, registre a mensagem para o responsável pela demo.

## Contas operacionais do grupo

Em **Cadastros → Usuários → Novo cadastro**, preencha **Nome**, **E-mail**, **CPF**, **Senha inicial**, **Perfil** e **Vínculo**. Deixe o telefone em branco. Gere uma senha diferente para cada conta e envie apenas a credencial de cada pessoa por mensagem privada. Guarde a credencial de administrador com você. Essas contas entram diretamente pelo formulário de login.

| Nome de teste | E-mail | CPF de teste | Perfil | Vínculo |
| --- | --- | --- | --- | --- |
| Operador Estoque Demo | `estoque.recife@example.com` | `000.000.021-35` | Hemocentro | Hemocentro Demo Recife |
| Operador Distribuição Demo | `distribuicao.recife@example.com` | `000.000.022-16` | Hemocentro | Hemocentro Demo Recife |
| Operador Hospital Norte Demo | `hospital.norte@example.com` | `000.000.023-05` | Hospital | Hospital Demo Norte |
| Operador Hospital Sul Demo | `hospital.sul@example.com` | `000.000.024-88` | Hospital | Hospital Demo Sul |

## Ordem de execução

1. Envie [Doações e estoque](03-doacoes-e-estoque.md) para quem vai cadastrar os doadores fictícios e as oito doações. Combine quem cadastra cada linha para evitar duplicatas.
2. Com os seis doadores já cadastrados pelo hemocentro, envie [Contas de doador](02-contas-de-doador.md) para quem vai testar o cadastro público. Separe uma linha para cada pessoa. Quando pedirem os links, localize cada mensagem no Mailpit pelo destinatário e envie somente o link correspondente em privado.
3. Depois que o estoque estiver pronto, envie [Requisições e distribuição](04-requisicoes-e-distribuicao.md) aos operadores dos hospitais e ao operador de distribuição. Peça que compartilhem no grupo os identificadores e os estados das requisições.
