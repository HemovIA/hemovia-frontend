# Requisições e distribuição na demo do Hemovia

Neste roteiro, duas pessoas abrem requisições pelos hospitais e uma pessoa trabalha pelo hemocentro. Use a conta operacional recebida em privado e abra a [demo do Hemovia](https://18.216.26.95/). Comece depois que o responsável confirmar as conexões da rede logística e as oito bolsas no estoque.

## Abertura das requisições pelo hospital

Em **Requisições → Nova requisição**, informe o tipo sanguíneo, o fator Rh, o hemocomponente, a quantidade e a prioridade. Use um **Prazo de entrega** de amanhã no mesmo horário. Clique em **Criar requisição** e informe no grupo o código da linha e o identificador exibido. Cada conta cria apenas as linhas do hospital ao qual está vinculada. Use os códigos abaixo para combinar as ações no grupo.

| Código | Hospital | Tipo e Rh | Hemocomponente | Bolsas | Prioridade | Estado final da demo |
| --- | --- | --- | --- | ---: | --- | --- |
| R01 | Hospital Demo Norte | O positivo | Hemácias | 2 | Alta | Entregue |
| R02 | Hospital Demo Sul | A positivo | Hemácias | 1 | Média | Alocado |
| R03 | Hospital Demo Norte | O negativo | Hemácias | 1 | Crítica | Em trânsito |
| R04 | Hospital Demo Sul | B positivo | Plasma | 1 | Baixa | Pendente |
| R05 | Hospital Demo Norte | O positivo | Hemácias | 1 | Baixa | Cancelado |

## Alocação e saída pelo hemocentro

1. Entre com a conta de **Hemocentro**. Em **Requisições**, abra **R03** usando o identificador recebido e selecione **Alocar bolsas**. Confirme e confira a rota. Em **Iniciar transporte**, selecione `DEMO-REC-02` e inicie a saída. Deixe essa viagem em trânsito. Faça esta alocação primeiro para reservar a única bolsa O negativo para R03.
2. Abra **R01**, aloque as bolsas e inicie o transporte com `DEMO-REC-01`. Avise o Hospital Demo Norte que pode confirmar a entrega.
3. Abra **R02**, aloque uma bolsa e deixe a requisição em **Alocado**. **R04** permanece **Pendente**. A alocação do Hemovia está disponível para requisições de hemácias.

Se a alocação falhar, confira o estoque do **Hemocentro Demo Recife**, o prazo de entrega e a conexão na direção do hemocentro para o hospital. Envie ao responsável o identificador e a mensagem exibida.

## Recebimento e cancelamento pelo Hospital Demo Norte

1. Abra **R01** quando o estado for **Em trânsito**. Clique em **Confirmar entrega** e confirme o recebimento. Verifique o estado **Entregue**.
2. Abra **R05** ainda pendente, clique em **Cancelar requisição** e confirme. Verifique o estado **Cancelado**.
3. Compare os cinco estados com a tabela e compartilhe no grupo o que foi concluído. Deixe **R02**, **R03** e **R04** nos estados combinados para que a demo mostre etapas diferentes do fluxo.
