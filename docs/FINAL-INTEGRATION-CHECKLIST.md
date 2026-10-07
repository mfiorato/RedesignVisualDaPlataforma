# Checklist crítico da integração final

Antes de executar este checklist, consultar
[`KV-MAJOR-SCRIMS.md`](./KV-MAJOR-SCRIMS.md). As regras do KV são obrigatórias
para todas as áreas visuais.

## P0 — Ranking conectado aos dados do bot

> **BLOQUEADOR DE RELEASE:** a integração não pode ser aprovada ou publicada se
> qualquer item desta seção estiver pendente, falhando ou sem evidência de teste.

O ranking do protótipo utiliza dados locais exclusivamente para apresentação
visual. Na integração com o frontend Next.js, esses dados devem ser removidos e
substituídos pela estrutura dinâmica já existente no projeto principal.

### Contrato que deve ser preservado

- `lib/leaderboard.ts` continua sendo a fonte de leitura e normalização.
- A season atual continua sendo determinada pelo bot, e não por valor fixo.
- `getBoard()` continua fornecendo `season`, `current`, `updatedAt`, `version`,
  `rows` e `rankByDiscordId`.
- A ordenação continua usando XP, kills e `playerKey`, nesta ordem.
- A home exibe `board.rows.slice(0, 5)`.
- A data exibida vem de `board.updatedAt`.
- A tabela completa continua usando `/api/leaderboard/[season]`.
- O parâmetro de versão continua sendo enviado para evitar dados antigos.
- As políticas atuais de cache, atualização e fallback devem ser preservadas.
- Nenhum dado sensível, incluindo Discord ID, pode ser enviado no JSON público.

### Proibido durante a integração

- Publicar os arrays `players` ou `liveRanking` deste protótipo.
- Fixar número de season, data de atualização, nomes, cargos ou XP no JSX.
- Reordenar jogadores no cliente usando uma regra diferente da usada pelo bot.
- Remover o campo `version` da requisição ou da resposta.
- Substituir a rota existente por uma chamada sem cache/versionamento.
- Alterar `getBoard()`, as coleções ou as consultas apenas para atender ao novo
  layout.
- Considerar a renderização visual correta como prova de sincronização.

## Critérios de aceite

### Home

- [ ] Mostra exatamente os cinco primeiros jogadores de `board.rows`.
- [ ] Nome, XP, posição e cargo correspondem à leaderboard completa.
- [ ] Season exibida corresponde a `board.season`.
- [ ] Horário exibido corresponde a `board.updatedAt`.
- [ ] “Ver ranking completo” abre a season correta.
- [ ] Ausência temporária de dados apresenta fallback sem quebrar a página.

### Atualização

- [ ] Um novo registro em `importlogs` gera uma nova versão da tabela.
- [ ] Mudança de XP aparece após a janela de atualização prevista.
- [ ] Mudança de posição aparece igualmente na home e na leaderboard.
- [ ] Uma resposta antiga nunca sobrescreve uma versão mais recente.
- [ ] Instâncias diferentes não exibem versões conflitantes após sincronização.
- [ ] Falha temporária no banco mantém a última tabela válida.

### Ordenação e consistência

- [ ] XP define a ordem principal.
- [ ] Kills desempata jogadores com o mesmo XP.
- [ ] `playerKey` mantém o desempate final determinístico.
- [ ] Posições começam em 1 e não possuem duplicações.
- [ ] Perfis, dashboard e leaderboard apontam para a mesma posição.
- [ ] Seasons encerradas permanecem congeladas.

### Segurança e privacidade

- [ ] O JSON público não contém Discord ID.
- [ ] O acesso ao banco do bot permanece somente leitura.
- [ ] Nenhum segredo ou URI aparece no cliente.
- [ ] Erros internos não expõem detalhes da conexão.

### Responsividade e estados visuais

- [ ] Os cinco registros permanecem legíveis em desktop e mobile.
- [ ] Nomes longos não deslocam XP ou posição.
- [ ] Valores grandes de XP não quebram a linha.
- [ ] Loading, indisponibilidade e tabela vazia possuem estados definidos.
- [ ] O CTA continua acessível por teclado e leitor de tela.

## Evidências exigidas antes do release

1. Captura da home e da leaderboard mostrando os mesmos cinco primeiros.
2. Registro de teste antes e depois de uma atualização de XP.
3. Confirmação da mudança de `version`.
4. Teste de empate por XP e desempate por kills.
5. Teste de resposta antiga contra versão mais recente.
6. Teste desktop e mobile.
7. Aprovação técnica de que apenas a camada de apresentação foi alterada.

## Regra de decisão

Se houver dúvida sobre a atualização, ordenação, cache ou origem dos dados, o
release deve ser interrompido. A aparência aprovada não tem precedência sobre a
integridade do ranking.

## P0 — Mapa vetorial e controles de zoom

> **BLOQUEADOR DE RELEASE:** o mapa raster presente no protótipo é apenas um
> placeholder. A versão final deve utilizar o arquivo vetorial fornecido pelo
> projeto para preservar a nitidez em todos os níveis de zoom.

### Requisitos

- [ ] Substituir o PNG temporário pelo mapa vetorial oficial.
- [ ] Preservar as coordenadas normalizadas das zonas e markers.
- [ ] Garantir que mapa, zonas e labels usem a mesma transformação de zoom.
- [ ] Zoom pelos botões `+` e `−`.
- [ ] Zoom pela roda do mouse quando o ponteiro estiver sobre o mapa.
- [ ] Limitar o zoom entre os valores mínimos e máximos definidos.
- [ ] Desabilitar o botão correspondente ao alcançar cada limite.
- [ ] Não exibir controle sem função associada.
- [ ] Manter gestos e rolagem da página utilizáveis em dispositivos touch.
- [ ] Validar nitidez, alinhamento e legibilidade em desktop e mobile.

### Não alterar

- Regras de ocupação, disputa ou seleção de spots.
- Coordenadas persistidas no banco.
- Ações de marcação e desmarcação.
- Permissões de jogador e staff.
- Atualização automática do mapa.
