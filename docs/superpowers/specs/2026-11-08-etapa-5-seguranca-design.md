# Etapa 5 — Regras do banco, privacidade, sons e revisão final

Data: 2026-11-08. Aprovado pelo usuário em conversa (Java instalado para o
emulador; sons ligados com botão de mudo).

## Problemas que esta etapa fecha

- **E-mails públicos:** o cadastro gravava `email` no perfil público e o
  ranking lê perfis inteiros → qualquer visitante lista os e-mails.
- **Recordes, XP e progresso forjáveis:** o navegador grava qualquer valor.
- **Item pago liberável pelo navegador** (`itens_liberados`).
- (Já corrigido e enviado: XP adulterado travava o menu — `ed1ca69`.)

## Regras (`firestore.rules`, versionado)

`usuarios/{uid}`:
- **Leitura:** pública (ranking). Por isso o perfil não guarda dado pessoal.
- **Criação:** só o dono; campos só `nome` (texto de 1 a 20) e recordes
  zerados. Sem `email`, sem `itens_liberados`, sem XP.
- **Atualização:** só o dono com e-mail confirmado; só os campos
  `recorde_blockix`, `recorde_snake_v2`, `recorde_breakout_v2`,
  `data_recorde`, `tema`, `progresso`, `xp`, `nivel_max_*` e a **remoção**
  de `email`. Recordes e níveis máximos inteiros, só sobem e têm teto.
  `xp` inteiro, só sobe, até + 50.000 por gravação, teto 1e9, igual a
  `progresso.xp`. `tema` texto curto.
- **Apagar:** ninguém. Qualquer outra coleção: negada.

## Privacidade no cliente

- Cadastro não grava mais `email`.
- Ao entrar, se o perfil ainda tem `email`, o próprio jogador apaga o campo.
- Perfis de quem não voltar: limpeza por script de administrador (pendente,
  precisa de credencial de serviço do usuário).

## Testes das regras

`tests-regras/` com `@firebase/rules-unit-testing` no emulador do Firestore
(`npm run test:regras`, projeto `demo-jogos-classicos`, sem tocar no real).
`npm test` continua só com a lógica pura.

## Sons

`public/js/som.js`: Web Audio, sem arquivos. Sons curtos para linha,
quatro linhas, peça travada, fruta, fruta dourada, tijolo, power-up, fase,
vida perdida e fim. Volume baixo; botão de som no topo de cada jogo (ícone
SVG), escolha salva no navegador. Começa ligado.

## Publicação (fora do código; com o usuário)

1. Publicar o **site** antes das regras (o site antigo grava `email` no
   cadastro e seria recusado pela regra nova).
2. `firebase login` pelo usuário; baixar as regras atuais para conferência.
3. Publicar as regras.

## Revisão final

`impeccable detect` nas páginas e `web-design-guidelines`; corrigir achados.
