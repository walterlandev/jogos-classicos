import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMatriz, criarPeca, girar, colide, fundir, varrerLinhas,
         novoSaco, pontuar, nivelPorLinhas, intervaloQueda, linhaFantasma,
         niveisIniciais } from '../public/js/logica/blocos.js';

test('varrerLinhas remove linhas cheias, inclusive a do topo, e desce o resto', () => {
    const t = criarMatriz(3, 4);
    t[0] = [1, 1, 1]; t[2] = [0, 2, 0]; t[3] = [3, 3, 3];
    assert.equal(varrerLinhas(t), 2);
    assert.deepEqual(t, [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 2, 0]]);
});

test('girar devolve uma matriz nova girada 90° no sentido horário', () => {
    const t = criarPeca('T');
    assert.deepEqual(girar(t), [[0, 2, 0], [0, 2, 2], [0, 2, 0]]);
    assert.deepEqual(criarPeca('T'), t);
});

test('colide detecta parede, chão e bloco fixo', () => {
    const t = criarMatriz(10, 20);
    const o = criarPeca('O');
    assert.equal(colide(t, o, { x: -1, y: 0 }), true);
    assert.equal(colide(t, o, { x: 0, y: 19 }), true);
    assert.equal(colide(t, o, { x: 4, y: 0 }), false);
    fundir(t, o, { x: 4, y: 18 });
    assert.equal(colide(t, o, { x: 4, y: 17 }), true);
});

test('saco de 7 tem uma peça de cada', () => {
    const saco = novoSaco();
    assert.equal(saco.length, 7);
    assert.deepEqual([...saco].sort(), [...'IJLOSTZ']);
});

test('pontuar: tabela, combo e quatro linhas seguidas', () => {
    let r = pontuar(1, 2, { combo: -1, b2b: false });
    assert.deepEqual(r, { pontos: 200, combo: 0, b2b: false, quatroSeguidas: false });
    r = pontuar(2, 2, r);                 // segunda limpeza seguida: combo 1
    assert.equal(r.pontos, 600 + 100);
    r = pontuar(0, 2, r);                 // peça sem linha zera o combo
    assert.equal(r.combo, -1);
    r = pontuar(4, 1, r);
    assert.equal(r.pontos, 800);
    assert.equal(r.b2b, true);
    r = pontuar(4, 1, r);                 // quatro seguidas de quatro: ×1,5 + combo 1
    assert.equal(r.pontos, 1200 + 50);
    assert.equal(r.quatroSeguidas, true);
    r = pontuar(1, 1, r);                 // limpeza menor quebra a sequência
    assert.equal(r.b2b, false);
});

test('nível com início escolhido e curva de velocidade', () => {
    assert.equal(nivelPorLinhas(0), 1);
    assert.equal(nivelPorLinhas(25), 3);
    assert.equal(nivelPorLinhas(25, 10), 12);
    assert.equal(intervaloQueda(1), 1000);
    assert.equal(intervaloQueda(5), 522);
    assert.equal(intervaloQueda(20), 50);
    assert.equal(intervaloQueda(99), 50);
});

test('fantasma cai até o chão ou até um bloco', () => {
    const t = criarMatriz(10, 20);
    const o = criarPeca('O');
    assert.equal(linhaFantasma(t, o, { x: 4, y: 0 }), 18);
    fundir(t, o, { x: 4, y: 18 });
    assert.equal(linhaFantasma(t, o, { x: 4, y: 0 }), 16);
});

test('níveis iniciais liberados', () => {
    assert.deepEqual(niveisIniciais(1), [1]);
    assert.deepEqual(niveisIniciais(7), [1, 5]);
    assert.deepEqual(niveisIniciais(23), [1, 5, 10, 15, 20]);
});
