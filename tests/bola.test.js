import { test } from 'node:test';
import assert from 'node:assert/strict';
import { velocidadeDaFase, aceleracao, rebaterNaRaquete } from '../public/js/logica/bola.js';

const grau = (vx, vy) => Math.atan2(-vy, vx) * 180 / Math.PI;

test('rebatida mantém a velocidade e o ângulo entre 20° e 160°', () => {
    for (const x of [-50, 0, 37.5, 75, 200]) {
        const { vx, vy } = rebaterNaRaquete(x, 0, 75, 300);
        assert.ok(Math.abs(Math.hypot(vx, vy) - 300) < 1e-9);
        assert.ok(vy < 0);
        const a = grau(vx, vy);
        assert.ok(a >= 20 - 1e-9 && a <= 160 + 1e-9, `ângulo ${a}`);
    }
});

test('centro da raquete sobe reto; pontas abrem o ângulo', () => {
    assert.ok(Math.abs(rebaterNaRaquete(37.5, 0, 75, 300).vx) < 1e-9);
    assert.ok(rebaterNaRaquete(0, 0, 75, 300).vx < 0);
    assert.ok(rebaterNaRaquete(75, 0, 75, 300).vx > 0);
});

test('velocidade por fase com teto e aceleração por rebatida', () => {
    assert.equal(velocidadeDaFase(1), 250);
    assert.equal(velocidadeDaFase(10), 358);
    assert.equal(velocidadeDaFase(99), 520);
    assert.equal(aceleracao(0), 1);
    assert.ok(Math.abs(aceleracao(10) - 1.15) < 1e-9);
    assert.equal(aceleracao(100), 1.35);
});
