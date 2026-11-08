// Registro dos temas: puro (sem DOM), testado em tests/temas.test.js.
// A paleta "canvas" é a única fonte das cores usadas dentro dos jogos;
// temas.js (navegador) também a publica como variáveis CSS --c-*.
//
// Índices de pecas (valores das células em logica/blocos.js):
// 1 = I, 2 = T, 3 = Z, 4 = S, 5 = L, 6 = J, 7 = O.

export const TEMAS = {
    fliperama: {
        id: 'fliperama',
        nome: 'Fliperama do bairro',
        descricao: 'Gabinete de madeira, letreiro pintado e ficha amarela.',
        gratis: true,
        amostra: ['#1b2a6b', '#f6c026', '#d7262e', '#8a5a33'],
        canvas: {
            fundo: '#0c1435', vazio: null,
            pecas: [null, '#4aa3ff', '#c56cf0', '#d7262e', '#3fbf6a', '#ff8a2a', '#e9edf2', '#f6c026'],
            cobra: '#f6c026', cabeca: '#e9edf2', comida: '#d7262e', bonus: ['#f6c026', '#ff8a2a'],
            tijolos: ['#d7262e', '#ff8a2a', '#f6c026', '#3fbf6a', '#4aa3ff'],
            bola: '#e9edf2', raquete: '#f6c026', texto: '#e9edf2',
        },
    },
    cartucho: {
        id: 'cartucho',
        nome: 'Manual do cartucho',
        descricao: 'Cor chapada, contorno grosso e sombra dura de impresso.',
        gratis: true,
        amostra: ['#e4e7ec', '#2342d8', '#f04e30', '#f2b807'],
        canvas: {
            fundo: '#1a1c22', vazio: '#2a2d35',
            pecas: [null, '#3b5bff', '#f04e30', '#f2b807', '#2e9e5b', '#e4e7ec', '#ff7ab6', '#00b3c7'],
            cobra: '#2e9e5b', cabeca: '#e4e7ec', comida: '#f04e30', bonus: ['#f2b807', '#3b5bff'],
            tijolos: ['#f04e30', '#f2b807', '#2e9e5b', '#3b5bff', '#e4e7ec'],
            bola: '#e4e7ec', raquete: '#f2b807', texto: '#e4e7ec',
        },
    },
    lcd: {
        id: 'lcd',
        nome: 'Portátil de LCD',
        descricao: 'Tela de cristal líquido esverdeada e botões laranja.',
        gratis: true,
        amostra: ['#2f3a4a', '#a8b59a', '#26301f', '#e8742c'],
        canvas: {
            fundo: '#a8b59a', vazio: '#9daa8f',
            pecas: [null, '#26301f', '#26301f', '#26301f', '#26301f', '#26301f', '#26301f', '#26301f'],
            cobra: '#26301f', cabeca: '#26301f', comida: '#26301f', bonus: ['#26301f', '#6b7a5e'],
            tijolos: ['#26301f', '#26301f', '#26301f', '#26301f', '#26301f'],
            bola: '#26301f', raquete: '#26301f', texto: '#26301f',
        },
    },
};

export const IDS_TEMAS = ['fliperama', 'cartucho', 'lcd'];
export const TEMA_PADRAO = 'fliperama';

// Tema pago só vale se o servidor tiver liberado o item "tema:<id>".
export function podeUsar(id, itensLiberados = []) {
    const tema = Object.hasOwn(TEMAS, id) ? TEMAS[id] : null;
    if (!tema) return false;
    return tema.gratis || (Array.isArray(itensLiberados) && itensLiberados.includes(`tema:${id}`));
}

export function resolverTema(salvo, itensLiberados = []) {
    return podeUsar(salvo, itensLiberados) ? salvo : TEMA_PADRAO;
}
