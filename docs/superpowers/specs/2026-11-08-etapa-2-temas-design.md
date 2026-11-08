# Etapa 2 — Sistema de temas, moldura comum e Blockix

Data: 2026-11-08. Aprovado pelo usuário em conversa. Roteiro geral em
`2026-11-08-melhoria-jogos-design.md` (esta etapa substitui a "Etapa 2" de lá).

## Decisões do usuário

- O jogador **escolhe o tema**. Lançamento com três temas grátis:
  **Fliperama do bairro** (padrão), **Manual do cartucho** e **Portátil de LCD**
  (propostas em `docs/design/propostas-etapa-2.html`).
- O jogo de blocos passa a se chamar **Blockix** (busca na web sem conflito;
  registro no INPI fica a cargo do usuário antes de vender).
- Futuro (Etapa 6): **venda de temas e de níveis difíceis** por PIX. Exige
  servidor; o navegador nunca libera item pago.

## Arquitetura dos temas

- `public/js/logica/temas.js` (puro, testável): registro `TEMAS` com `id`,
  `nome`, `gratis`, `fontes` e `canvas` (paleta usada dentro dos jogos);
  `TEMA_PADRAO = 'fliperama'`; `podeUsar(id, itensLiberados)`;
  `resolverTema(salvo, itensLiberados)` → id válido ou o padrão.
- `public/js/temas.js` (navegador): `aplicarTema(id)` (põe `data-tema` no
  `<html>`, publica a paleta do canvas como variáveis CSS `--c-*`, salva em
  `localStorage`, dispara o evento `temamudou`), `paleta()` (paleta atual),
  `aoMudarTema(fn)`, `montarSeletor(elemento)`.
- Um `<script>` mínimo no `<head>` aplica o `data-tema` salvo antes do CSS
  pintar (sem piscar o tema padrão).
- CSS: `public/css/base.css` (estrutura e componentes, só com variáveis) +
  `public/css/temas/<id>.css` (valores das variáveis e o acabamento de cada
  mundo: madeira e letreiro; cartucho com contorno grosso e sombra dura;
  aparelho com tela LCD e botões redondos).
- Perfil: campo `tema` (o jogador grava) e campo reservado
  `itens_liberados` (lista; **só o servidor grava**, travado nas regras na
  Etapa 5). Ao entrar, o tema do perfil vale se `podeUsar`.

## Moldura comum dos jogos

Mesma estrutura de HTML nos três jogos:

- `header.topo`: voltar ao menu, nome do jogo, botão de tema.
- `section.placar`: itens Pontos, Nível/Fase, Recorde (Blockix também
  "Próxima").
- `div.campo`: o canvas (tamanho fixo interno, escalado por CSS sem
  distorcer) + camadas de **início**, **pausa** e **fim** (a de fim é a
  `aviso.js`, agora estilizada pelo tema).
- `div.controles`: botões de toque com ícones SVG, ações por
  `pointerdown` (funcionam com dedo e mouse), segurar repete onde faz
  sentido (mover peça/raquete).
- Celular: a página inteira cabe em `100dvh` sem rolar durante o jogo.
- `<body data-jogo="blockix|snake|breakout">` diz ao `auth.js` qual recorde
  mostrar e salvar (fim da detecção pela URL).

O canvas desenha com `paleta()`; ao trocar o tema, o jogo redesenha na hora.
Sem brilho neon (`shadowBlur`) em nenhum tema.

## Menu

- Cabeçalho com a marca "Jogos Clássicos", conta (Entrar / Criar conta /
  Olá, nome / Sair).
- Os três jogos como máquinas do tema (gabinete, cartucho ou aparelho) com
  miniatura desenhada em CSS nas cores do tema, recorde do jogador e
  "Jogar".
- Ranking com abas por jogo (botões com `aria-selected`), top 10.
- Seletor de tema: três opções com amostra das cores (grupo de rádio
  acessível).
- Login e cadastro em `<dialog>`, mensagens dentro do formulário (fim dos
  `alert`), "Esqueci a senha" fora do escopo.

## Arquivos e nomes

- `tetris.html` → `blockix.html`, `js/tetris.js` → `js/blockix.js`,
  `Breakout.html` → `breakout.html`, `js/Breakout.js` → `js/breakout.js`
  (`git mv`). `firebase.json` redireciona (301) os endereços antigos.
- `salvarRecordeDB(pontos, 'blockix')` grava em `recorde_tetris` (campo do
  banco não muda).
- CSS antigo (`style.css`, `tetris.css`, `snake.css`, `Breakout.css`) e as
  imagens do menu deixam de ser usados; **a remoção dos arquivos só com OK
  do usuário**.
- `DESIGN.md` na raiz descreve os tokens e as regras de cada tema.

## Qualidade

- Contraste ≥ 4,5:1 no texto de cada tema; foco de teclado visível; seleção,
  foco e barra de rolagem com as cores do tema; `prefers-reduced-motion`
  respeitado; ícones SVG próprios (nenhum caractere unicode como ícone).

## Fora desta etapa

Fases novas, vidas, power-ups (Etapa 3), XP (4), regras do Firestore (5),
loja e pagamento (6).

## Verificação

1. `npm test` passa (inclui `tests/temas.test.js`).
2. Navegador, 1366×800 e 390×844, nos três temas: menu, troca de tema ao
   vivo (inclusive com o jogo aberto), os três jogos jogáveis do início ao
   fim, nada rola no celular durante o jogo, sem erros no console.
3. Revisão final com `web-design-guidelines`.
