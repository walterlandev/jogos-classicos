# Jogos Clássicos — sistema visual

O jogador escolhe o tema. Todo tema veste a mesma estrutura (menu, moldura
dos jogos, diálogos); só muda os valores das variáveis e o acabamento.

## Como funciona

- `public/js/logica/temas.js`: registro dos temas (nome, se é grátis, amostra
  e **paleta do canvas**). É a única fonte das cores usadas dentro dos jogos.
- `public/js/temas.js`: aplica `data-tema` no `<html>`, publica a paleta como
  `--c-*` (usadas nas miniaturas do menu) e avisa os jogos (`temamudou`).
- `public/css/base.css`: estrutura e componentes, **sem cor ou fonte fixa**.
- `public/css/temas/<id>.css`: valores das variáveis + acabamento do mundo.
- Tema novo = entrada no registro + um arquivo CSS com **todas** as
  variáveis do `fliperama.css` + `<link>` nas páginas. Tema pago:
  `gratis: false`; só aparece liberado se o servidor gravar
  `tema:<id>` em `itens_liberados` (Etapa 6).

## Temas

### Fliperama do bairro (`fliperama`, padrão)
O fliperama de esquina dos anos 80/90: gabinete de madeira, letreiro
vermelho pintado, ficha amarela, noite azul.
- Cores: azul-noite `#1b2a6b`, ficha `#f6c026`, letreiro `#d7262e`,
  madeira `#8a5a33`, fórmica `#e9edf2`, tela `#0c1435`.
- Fontes: **Bungee** (letreiro, títulos, números, botão principal),
  **Barlow Semi Condensed** (texto).
- Acabamento: topo vermelho com filete amarelo; máquina = gabinete com
  marquise amarela; botão principal = ficha (pílula com degrau embaixo);
  campo com moldura de madeira.
- A sombra dura sob o botão principal (`0 4px 0`) é o degrau físico da
  ficha/botão de fliperama: intencional neste tema.
- Contraste: marca em creme `#fff6dc` sobre o vermelho; nome do jogo
  `#8f141a` sobre o amarelo (o amarelo sobre vermelho só passa em letra grande).
- Não pode: neon, brilho, gradiente.

### Manual do cartucho (`cartucho`)
Caixa e manual de cartucho dos anos 90: impresso, chapado, gráfico.
- Cores: papel `#e4e7ec`, tinta `#1a1c22`, cobalto `#2342d8`,
  tomate `#f04e30`/`#c8361a`, mostarda `#f2b807`, verde `#1f7a45`.
- Fontes: **Rubik Mono One** (títulos, números), **Rubik** (texto).
- Acabamento: contorno de 3px em tinta, sombra dura sem desfoque (é o mundo
  impresso deste tema, e só dele), cantos retos, rótulo diagonal em duas
  cores por jogo.
- Não pode: cantos arredondados, sombra suave.

### Portátil de LCD (`lcd`)
Minigame de bolso: corpo grafite, tela de cristal líquido, botões laranja.
- Cores: grafite `#2f3a4a`/`#3b4759`, moldura `#1c232d`, LCD `#a8b59a`,
  segmento `#26301f`, botão `#e8742c`.
- Fontes: **Silkscreen** (títulos, números; a Pixelify foi descartada porque o "C" parece "O" e o "B" parece "8"), **IBM Plex Sans
  Condensed** (texto).
- Acabamento: tela LCD com moldura preta grossa; jogos monocromáticos;
  cruz de direção preta, botões de ação redondos laranja.
- Não pode: cor dentro da tela LCD.

### Lousa da escola (`lousa`, liberado no nível 10 da conta)
Quadro-negro da escola: verde-escuro, escrita de giz, moldura de madeira.
Recompensa de progresso (`nivelMinimo: 10` no registro).
- Cores: quadro `#1d2b25`/`#2b3d35`, giz `#eef0e8`, giz amarelo `#f2df7a`,
  rosa `#f2a6b8`, azul `#9fd0f0`, verde `#b5e3a3`, madeira `#7a5233`.
- Fontes: **Cabin Sketch** (títulos, números), **Patrick Hand** (texto).
- Acabamento: máquina e campo com moldura de madeira; bordas de giz
  semitransparentes; fim de jogo com contorno tracejado de giz.
- Não pode: cores saturadas fora do giz, sombra suave.

## Regras comuns

- Texto com contraste ≥ 4,5:1 (títulos grandes ≥ 3:1) em todo tema.
- Ícones: SVG próprios em `stroke` 2.5 com pontas redondas; nada de
  caractere unicode ou emoji como ícone.
- Canvas sem `shadowBlur`; cores sempre de `paleta()`.
- Foco visível (`--foco`), seleção e barra de rolagem nas cores do tema.
- Celular: página de jogo cabe em `100dvh` sem rolagem.
