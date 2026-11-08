import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    xpDaPartida, xpTotalParaNivel, nivelDaConta, novoProgresso, aplicarPartida, mesclar, CONQUISTAS,
} from '../public/js/logica/progresso.js';

test('XP de cada jogo', () => {
    assert.equal(xpDaPartida('blockix', { linhas: 12 }), 10 + 24);
    assert.equal(xpDaPartida('breakout', { tijolos: 40, fasesConcluidas: 2 }), 10 + 40 + 40);
    assert.equal(xpDaPartida('snake', { frutas: 15, fasesConcluidas: 1 }), 10 + 30 + 20);
    assert.equal(xpDaPartida('blockix', {}), 10);
});

test('curva de nível', () => {
    assert.equal(xpTotalParaNivel(1), 0);
    assert.equal(xpTotalParaNivel(2), 100);
    assert.equal(xpTotalParaNivel(10), 4500);
    assert.deepEqual(nivelDaConta(0), { nivel: 1, xpNoNivel: 0, xpDoNivel: 100 });
    assert.deepEqual(nivelDaConta(350), { nivel: 3, xpNoNivel: 50, xpDoNivel: 300 });
    assert.equal(nivelDaConta(19000).nivel, 20);
});

test('15 conquistas com ids únicos', () => {
    assert.equal(CONQUISTAS.length, 15);
    assert.equal(new Set(CONQUISTAS.map(c => c.id)).size, 15);
    for (const c of CONQUISTAS) assert.ok(c.nome && c.descricao && typeof c.teste === 'function');
});

test('aplicarPartida soma XP, estatísticas e conquistas sem repetir', () => {
    let r = aplicarPartida(novoProgresso(), 'blockix', { linhas: 4, quatros: 1, maiorCombo: 0, nivelMax: 1 });
    assert.equal(r.xpGanho, 18);
    assert.equal(r.progresso.xp, 18);
    assert.deepEqual(r.novas.sort(), ['primeira-linha', 'quatro-linhas']);
    assert.equal(r.progresso.est.linhas, 4);
    assert.deepEqual(r.progresso.est.jogos, ['blockix']);
    r = aplicarPartida(r.progresso, 'blockix', { linhas: 1, quatros: 0, maiorCombo: 0, nivelMax: 1 });
    assert.deepEqual(r.novas, []);
    assert.equal(r.progresso.est.partidas, 2);
});

test('conquistas gerais e de subida de nível', () => {
    let p = novoProgresso();
    p = aplicarPartida(p, 'blockix', { linhas: 0 }).progresso;
    p = aplicarPartida(p, 'snake', { frutas: 0, fasesConcluidas: 0, faseMax: 1, douradas: 1, maiorTamanho: 3 }).progresso;
    const r = aplicarPartida(p, 'breakout', { tijolos: 0, fasesConcluidas: 0, faseMax: 1, pegouMulti: false });
    assert.ok(r.novas.includes('tres-jogos'));
    assert.ok(r.progresso.conquistas.includes('fruta-dourada'));
    const alto = aplicarPartida({ ...novoProgresso(), xp: 4490 }, 'snake', { frutas: 0 });
    assert.equal(alto.nivelAntes, 9);
    assert.equal(alto.nivelDepois, 10);
    assert.ok(alto.novas.includes('nivel-10'));
});

test('mesclar fica com o melhor de cada lado', () => {
    const a = { xp: 300, conquistas: ['x'], est: { partidas: 5, jogos: ['snake'], linhas: 10, tijolos: 0 } };
    const b = { xp: 120, conquistas: ['y'], est: { partidas: 9, jogos: ['blockix'], linhas: 2, tijolos: 50 } };
    assert.deepEqual(mesclar(a, b), {
        xp: 300, conquistas: ['x', 'y'],
        est: { partidas: 9, jogos: ['blockix', 'snake'], linhas: 10, tijolos: 50 },
    });
    assert.deepEqual(mesclar(novoProgresso(), null), novoProgresso());
});
