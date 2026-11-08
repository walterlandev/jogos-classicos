# Etapa 3a — Blockix: mecânicas, pontuação e níveis

Data: 2026-11-08. Aprovado pelo usuário em conversa.

## Decisões do usuário

- **Ranking novo:** campo `recorde_blockix` (começa zerado). `recorde_tetris`
  fica no banco, fora da tela.
- **Nível inicial liberado jogando:** opções 1, 5, 10, 15, 20, cada uma
  liberada quando o jogador já alcançou aquele nível. Na Etapa 6 poderá
  haver atalhos pagos.

## Mecânicas

- **Saco de 7:** cada sequência de 7 peças contém uma de cada tipo.
- **Fila de 3 próximas** (no celular só a primeira aparece).
- **Peça-fantasma:** contorno onde a peça cairia.
- **Queda instantânea** (Espaço; botão "Cair") e **guardar peça** (C ou
  Shift; botão "Guardar"; uma vez por peça).
- **Tempo de encaixe:** 500 ms ao tocar o chão; mover ou girar reinicia o
  tempo, até 15 vezes por peça.

## Pontuação (lógica pura, testada)

- Linhas: 1 = 100, 2 = 300, 3 = 500, 4 = 800, × nível.
- Quatro linhas seguidas de outras quatro (sem limpeza menor no meio):
  × 1,5 (arredondado para baixo).
- Combo: limpezas em peças seguidas; a partir da 2ª, + 50 × combo × nível.
- Queda suave: 1 ponto por linha descida; queda instantânea: 2 por linha.

## Níveis e velocidade

- `nivel = inicial + floor(linhas / 10)`, sem teto (Maratona).
- Intervalo de queda: `max(50, round(1000 × 0,85^(nivel − 1)))` ms
  (nível 1 = 1000 ms; 5 ≈ 522; 10 ≈ 232; 20 ≈ 50, e para aí).
- `nivel_max_blockix`: maior nível alcançado. Fica no navegador e, logado,
  no perfil (só sobe). Libera os níveis iniciais.

## Retorno visual

- Linhas limpas brilham por 250 ms (sem efeito com `prefers-reduced-motion`).
- Aviso curto no campo (`aria-live="polite"`): "Nível 5", "Combo ×3",
  "Quatro linhas!", "Quatro linhas seguidas!".

## Tela

- Placar: Pontos (com o recorde embaixo), Nível (com as linhas embaixo),
  Guardada, Próxima; no PC, mais a fila de 3.
- Camada de início: seletor "Começar no nível" (só os liberados).
- Controles de toque: linha de ações pequenas (Guardar, Pausa, Cair) e
  linha principal (Esquerda, Descer, Direita, Girar).

## Fora desta etapa

Modos extras, sons, efeitos de partículas, multiplayer.

## Verificação

`npm test`; no navegador, nos três temas, PC e celular: jogar, guardar,
cair, fantasma, nível subindo, aviso, fim, recorde novo no campo novo,
nível inicial liberado após alcançar o nível 5 (forçado em teste).
