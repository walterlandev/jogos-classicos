// Lógica pura do Breakout: sem DOM e sem canvas, testada em tests/bola.test.js.
// Velocidades em pixels por segundo (iguais em 60 Hz, 144 Hz ou qualquer tela).

// Mesma rapidez da versão antiga a 60 quadros por segundo.
export const velocidadeDoNivel = (nivel) => Math.round((2 + nivel * 0.5) * Math.SQRT2 * 60);

// A ponta esquerda da raquete manda a bola a 160°, a direita a 20°, o centro a 90°.
// A velocidade total nunca muda na rebatida.
export function rebaterNaRaquete(bolaX, raqueteX, larguraRaquete, velocidade) {
    const relativo = Math.min(1, Math.max(0, (bolaX - raqueteX) / larguraRaquete));
    const angulo = (160 - relativo * 140) * Math.PI / 180;
    return { vx: Math.cos(angulo) * velocidade, vy: -Math.sin(angulo) * velocidade };
}
