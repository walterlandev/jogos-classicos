import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS, TEMA_PADRAO, IDS_TEMAS, podeUsar, resolverTema } from '../public/js/logica/temas.js';

test('os quatro temas existem, são grátis e têm paleta completa', () => {
    assert.deepEqual(IDS_TEMAS, ['fliperama', 'cartucho', 'lcd', 'lousa']);
    assert.equal(TEMA_PADRAO, 'fliperama');
    for (const id of IDS_TEMAS) {
        const c = TEMAS[id].canvas;
        assert.equal(TEMAS[id].gratis, true);
        assert.equal(c.pecas.length, 8);
        assert.equal(c.tijolos.length, 5);
        assert.equal(c.bonus.length, 2);
        for (const k of ['fundo', 'cobra', 'cabeca', 'comida', 'bola', 'raquete', 'texto', 'parede'])
            assert.match(c[k], /^#[0-9a-f]{6}$/i, `${id}.${k}`);
    }
});

test('podeUsar: grátis sempre; pago só se liberado; inexistente nunca', () => {
    assert.equal(podeUsar('lcd'), true);
    assert.equal(podeUsar('nao-existe'), false);
    TEMAS.teste_pago = { ...TEMAS.lcd, id: 'teste_pago', gratis: false };
    try {
        assert.equal(podeUsar('teste_pago'), false);
        assert.equal(podeUsar('teste_pago', ['tema:teste_pago']), true);
    } finally { delete TEMAS.teste_pago; }
});

test('resolverTema cai no padrão quando o salvo é inválido', () => {
    assert.equal(resolverTema('cartucho'), 'cartucho');
    assert.equal(resolverTema(null), 'fliperama');
    assert.equal(resolverTema('<script>'), 'fliperama');
});

test('Lousa da escola só a partir do nível 10 da conta', () => {
    assert.equal(TEMAS.lousa.nivelMinimo, 10);
    assert.equal(podeUsar('lousa'), false);
    assert.equal(podeUsar('lousa', [], 9), false);
    assert.equal(podeUsar('lousa', [], 10), true);
    assert.equal(resolverTema('lousa', [], 3), 'fliperama');
    assert.equal(resolverTema('lousa', [], 12), 'lousa');
});
