# Etapa 3c — Snake: fases com mapas, vidas e bordas abertas

Data: 2026-11-08. Aprovado pelo usuário em conversa.

## Decisões do usuário

- **3 vidas:** bater recomeça a fase atual (frutas da fase zeram).
- **Bordas misturadas:** fases com borda aberta (sai de um lado, entra do
  outro) e fases com borda fechada.
- **Ranking novo:** `recorde_snake_v2`; fase máxima em `nivel_max_snake`.
- **Controle:** cruz de direção + deslizar o dedo no campo.

## Regras (lógica pura em `public/js/logica/cobra.js`, testada)

- Grade 20×20. Cada fase: `{ aberta, paredes, inicio }`.
- **15 mapas desenhados** com retângulos de parede; fase 16+ gerada
  (retângulos espelhados nos dois eixos, mais paredes com o tempo, borda
  aberta nas fases pares). A área de saída (x 1–8, y 9–11) fica sempre
  livre; células livres que a cobra não alcança viram parede (a fruta nunca
  nasce num lugar fechado).
- Meta de frutas: `min(30, 10 + 2 × (fase − 1))`.
- Velocidade: `max(60, 170 − 7 × (fase − 1))` ms por passo.
- Pontos: fruta 10 × fase; fruta dourada 50 × fase (aparece a cada 5
  frutas, dura 8 s, encolhe a cobra em 3, mínimo 3); fase concluída
  + 100 × fase.
- `passo` aceita `{ aberta, paredes }`: borda aberta dá a volta; parede
  mata.
- Fila de comandos e "pode entrar onde estava o rabo" continuam.

## Tela

- Placar: Pontos (com recorde), Fase (com "frutas x/meta"), Vidas.
- Camada de início com "Começar na fase" (1, 5, 10, … até a maior
  alcançada).
- Paredes na cor `parede` do tema (chave nova da paleta); borda fechada
  desenhada como moldura, aberta sem moldura.
- Avisos: "Fase N", "Borda aberta", "Fruta dourada!", "N vidas".
- Deslizar no campo (≥ 24 px) muda a direção.

## Verificação

`npm test`; navegador nos 3 temas, PC e celular: deslizar, cruz, fase
concluída (meta reduzida não; jogar por robô), perda de vida, borda
aberta, fim e fase inicial liberada.
