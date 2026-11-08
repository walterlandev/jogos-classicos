# Etapa 3b — Breakout: vidas, fases, tijolos, power-ups e campo em pé

Data: 2026-11-08. Aprovado pelo usuário em conversa.

## Decisões do usuário

- **Campo em pé em todo aparelho:** canvas 400×560 (proporção 5:7).
- **Raquete segue o dedo/mouse** em qualquer ponto do campo; no celular
  só fica o botão de pausa. Setas continuam no teclado.
- **Ranking novo:** `recorde_breakout_v2` (o antigo fica no banco).
- **Fases 21+ geradas sem fim, grátis.**
- Fase inicial liberada jogando (1, 5, 10, 15, … até a maior alcançada),
  salva em `nivel_max_breakout`.

## Regras (lógica pura, testada)

`public/js/logica/breakout.js`:
- Grade de 10 colunas; tijolo 36×14 px, espaço 4 px, topo em 64 px.
- **20 fases desenhadas** como mapas de texto: `.` vazio, `1`/`2`/`3`
  golpes, `#` indestrutível (a partir da fase 6).
- **Fase gerada** (21+): simétrica, com mais linhas e mais tijolos duros e
  indestrutíveis conforme a fase; sempre há tijolo quebrável. Recebe a
  função aleatória (testável).
- Pontos: 10 por golpe; ao quebrar, + 50 × golpes do tijolo; ao concluir a
  fase, + 500 + 100 × fase.
- **Vidas:** 3; + 1 a cada 10.000 pontos.
- **Power-ups:** 12 % dos tijolos quebrados soltam um: raquete larga
  (15 s), multibola (+ 2 bolas), bola lenta (10 s, × 0,7), vida extra (só
  1 % dos tijolos). A cápsula cai a 120 px/s; pega com a raquete.
- Colisão bola × retângulo indica o eixo a refletir (menor penetração).

`public/js/logica/bola.js`:
- `velocidadeDaFase(f) = min(520, 250 + 12 × (f − 1))` px/s.
- A cada rebatida na raquete dentro da fase, + 1,5 % (teto + 35 %).
- `rebaterNaRaquete` continua (ângulo 20°–160°).

## Tela

- Bola presa na raquete no início da fase e depois de perder vida; lança
  com toque/clique no campo ou Espaço.
- Placar: Pontos (com recorde), Fase, Vidas.
- Tijolos: cor do tema por linha; golpes restantes marcados por barras
  na cor do fundo; indestrutível em contorno.
- Avisos: "Fase 7", "Vida extra!", nome do power-up.

## Fora desta etapa

Laser, chefes, editor de fases, sons.

## Verificação

`npm test`; navegador nos 3 temas, PC e celular: lançar, arrastar,
perder vida, power-ups, fase concluída, fim, recorde no campo novo, fase
inicial liberada.
