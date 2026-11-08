// Lógica pura da bola do Breakout: sem DOM e sem canvas, testada em tests/bola.test.js.
// Velocidades em pixels por segundo (iguais em 60 Hz, 144 Hz ou qualquer tela).

// Velocidade base da fase, com teto para continuar jogável nas fases geradas.
export const velocidadeDaFase = (fase) => Math.min(520, 250 + 12 * (fase - 1));

// Cada rebatida na raquete acelera 1,5 %, até + 35 % (reinicia a cada fase/vida).
export const aceleracao = (rebatidas) => Math.min(1.35, 1 + 0.015 * rebatidas);

// A ponta esquerda da raquete manda a bola a 160°, a direita a 20°, o centro a 90°.
// A velocidade total nunca muda na rebatida.
export function rebaterNaRaquete(bolaX, raqueteX, larguraRaquete, velocidade) {
    const relativo = Math.min(1, Math.max(0, (bolaX - raqueteX) / larguraRaquete));
    const angulo = (160 - relativo * 140) * Math.PI / 180;
    return { vx: Math.cos(angulo) * velocidade, vy: -Math.sin(angulo) * velocidade };
}
