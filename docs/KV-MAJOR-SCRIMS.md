# KV Major Scrims — diretrizes obrigatórias

Este documento resume o KV entregue pelo cliente e deve ser consultado antes de
qualquer alteração visual. Em caso de divergência, o código do frontend em
produção (`app/globals.css` e `app/layout.tsx`) é a fonte final.

## Princípio de marca

- O produto possui apenas tema escuro.
- Não criar tema claro.
- A interface deve permanecer sóbria.
- O verde é sinalização, não decoração.

## Tokens de cor

### Fundos

- `ground`: `#090E0B`
- `ground-2`: `#0D130F`
- `surface`: `#111A14`

### Verde de sinal

- `signal`: `#22D962`
- `signal-deep`: `#17A64A`
- `signal-soft`: `#7EF0A6`

Usos permitidos: ação principal, foco, estado positivo, confirmação e presença
do próprio usuário.

### Texto

- `ink`: branco 100%
- `ink-2`: branco 70%
- `ink-3`: branco 50%
- `ink-4`: branco 40%

Hierarquia de texto deve ser construída por opacidade. Branco abaixo de 40% não
deve ser usado para informação relevante.

### Bordas

- `edge`: branco 10%
- `edge-strong`: verde 35%

### Acentos semânticos

- `gold`: `#FFD700`
- `bronze`: `#C8703A`
- `amber`: `#FFB020`
- `danger`: `#FF3A3A`
- `sky`: `#50C8FF`
- `violet`: `#C060FF`
- `magenta`: `#FF2D8A`
- Discord: `#5865F2`, apenas no botão específico de login com Discord

Não introduzir novas cores diretamente no componente. Um novo significado exige
um token.

## Tipografia

Somente duas famílias:

- Outfit: títulos, botões, labels e números de destaque.
- Inter: textos corridos.

### Pesos

- Outfit: 500, 600 e 700.
- Inter: 400, 500 e 600.

### Escala

- 36/30px: título de página.
- 24/20px: título de seção ou card grande.
- 18px: subtítulo e nome de evento.
- 16px: texto corrido.
- 14px: listas, botões e formulários.
- 12px: labels, pills, legendas e eyebrows.

### Regras

- Títulos usam Outfit.
- Números em colunas usam `tabular-nums`.
- Eyebrow: Outfit 12px, peso 600, uppercase, tracking `0.18em`, `signal`.
- Textos longos devem permanecer próximos de 65 caracteres por linha.

## Layout

- Conteúdo padrão: 1152px.
- Área do mapa: até 1440px.
- Textos longos: 42–48rem.
- Gutter mínimo: 16–20px.
- Header: 64px, sticky, translúcido, blur e borda inferior.
- Espaço entre seções: 32–48px.
- Espaço interno: 8–16px.
- Evitar caixas quando o espaçamento resolver a hierarquia.
- Nunca gerar rolagem horizontal involuntária.

## Raios

- 8px: botões, campos e itens de lista.
- 12px: cards e painéis.
- 16px: grandes blocos e formulários.
- Full: pills, avatares e markers redondos.
- Não usar raio superior a 16px.

## Componentes

- `.btn-primary`: uma ação principal por tela.
- `.btn-ghost`: ações secundárias.
- `.btn-discord`: apenas login com Discord.
- `.pill`: estados e categorias curtas.
- Cards: borda discreta, branco 3%, raio de 12px e respiro interno consistente.
- Cards repetidos devem manter altura e alinhamento internos.

## Mapa

Estados obrigatórios:

- Livre: branco 5%, borda branca 42%, 1.5px.
- Sua equipe: verde 34%, borda verde sólida, 3px.
- Ocupado: preto 38%, borda branca, 2.5px.
- Disputado: vermelho pulsante, 3.5px.
- Seu, disputado: preenchimento vermelho e borda verde.

Regras:

- Nomes usam halo preto em quatro direções e sombra.
- Estado é comunicado por cor e espessura.
- Disputado pulsa em 2.4s.
- Selecionado pulsa em ciano em 1.1s.
- Com redução de movimento, usar opacidade fixa.

## Regras da casa

- Foco sempre visível: verde 2px com offset de 2px.
- Não usar emoji como ícone.
- Todo texto precisa ter versão em português e espanhol.
- Toda animação deve respeitar `prefers-reduced-motion`.
- Não criar tema claro.
- Não criar cor sem token.
- Não usar raio acima de 16px.
- Não empilhar sombras.

## Prototipação versus integração

Exceções temporárias usadas apenas para demonstrar uma animação no visualizador
do Figma Make devem ser identificadas e removidas antes da integração final.
Produção precisa respeitar `prefers-reduced-motion`, mesmo que o visualizador do
protótipo anuncie essa preferência por padrão.

## Checklist visual por alteração

- [ ] Usa apenas cores/tokens permitidos.
- [ ] Outfit e Inter mantêm seus papéis.
- [ ] Informações relevantes têm no mínimo 40% de branco.
- [ ] Raios não passam de 16px.
- [ ] Existe apenas uma ação primária por tela.
- [ ] Foco de teclado está visível.
- [ ] Não há emoji.
- [ ] Desktop e mobile foram considerados.
- [ ] A animação possui estado de movimento reduzido.
- [ ] Textos poderão ser traduzidos para PT e ES.
- [ ] Regras de mapa e dados não foram alteradas.
