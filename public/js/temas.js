// Aplica o tema no navegador: data-tema no <html>, paleta do canvas como
// variáveis CSS --c-*, preferência salva no navegador e evento "temamudou".
// O registro e as regras ficam em logica/temas.js (testado).
import { TEMAS, IDS_TEMAS, resolverTema } from './logica/temas.js';

const raiz = document.documentElement;
let itensLiberados = [];
let atual = resolverTema(raiz.dataset.tema);

function publicarPaleta(c) {
    const s = raiz.style;
    s.setProperty('--c-fundo', c.fundo);
    s.setProperty('--c-vazio', c.vazio ?? 'transparent');
    c.pecas.forEach((cor, i) => { if (i) s.setProperty(`--c-peca-${i}`, cor); });
    c.tijolos.forEach((cor, i) => s.setProperty(`--c-tijolo-${i + 1}`, cor));
    for (const k of ['cobra', 'cabeca', 'comida', 'bola', 'raquete']) s.setProperty(`--c-${k}`, c[k]);
}

// origem: 'usuario' (escolheu agora), 'perfil' (veio do banco) ou 'inicio'.
export function aplicarTema(id, { salvar = true, origem = 'usuario' } = {}) {
    atual = resolverTema(id, itensLiberados);
    raiz.dataset.tema = atual;
    publicarPaleta(TEMAS[atual].canvas);
    if (salvar) {
        try { localStorage.setItem('tema', atual); } catch { /* navegação privada */ }
    }
    window.dispatchEvent(new CustomEvent('temamudou', { detail: { id: atual, origem } }));
}

export const temaAtual = () => atual;
export const paleta = () => TEMAS[atual].canvas;

export function aoMudarTema(fn) {
    window.addEventListener('temamudou', e => fn(e.detail.id, e.detail.origem));
}

export function definirItensLiberados(lista) {
    itensLiberados = Array.isArray(lista) ? lista : [];
}

// Seletor do menu: grupo de rádio acessível, montado com DOM (sem innerHTML).
export function montarSeletor(container) {
    const grupo = document.createElement('fieldset');
    grupo.className = 'seletor-tema';
    const legenda = document.createElement('legend');
    legenda.className = 'visualmente-oculto';
    legenda.textContent = 'Tema';
    grupo.append(legenda);

    for (const id of IDS_TEMAS) {
        const tema = TEMAS[id];
        const opcao = document.createElement('label');
        opcao.className = 'opcao-tema';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'tema';
        radio.value = id;
        radio.checked = id === atual;
        radio.addEventListener('change', () => aplicarTema(id));
        const amostras = document.createElement('span');
        amostras.className = 'amostras';
        amostras.setAttribute('aria-hidden', 'true');
        for (const cor of tema.amostra) {
            const s = document.createElement('span');
            s.style.background = cor;
            amostras.append(s);
        }
        const nome = document.createElement('span');
        nome.className = 'opcao-nome';
        nome.textContent = tema.nome;
        const descricao = document.createElement('span');
        descricao.className = 'opcao-descricao';
        descricao.textContent = tema.descricao;
        opcao.append(radio, amostras, nome, descricao);
        grupo.append(opcao);
    }
    container.replaceChildren(grupo);
    aoMudarTema(id => {
        grupo.querySelectorAll('input').forEach(r => { r.checked = r.value === id; });
    });
}

// Botão das páginas de jogo: troca para o próximo tema a cada toque.
export function ligarBotaoTema(botao) {
    const rotular = () => {
        const proximo = IDS_TEMAS[(IDS_TEMAS.indexOf(atual) + 1) % IDS_TEMAS.length];
        botao.setAttribute('aria-label', `Tema atual: ${TEMAS[atual].nome}. Trocar para ${TEMAS[proximo].nome}`);
        botao.title = `Trocar tema (${TEMAS[proximo].nome})`;
    };
    botao.addEventListener('click', () => {
        aplicarTema(IDS_TEMAS[(IDS_TEMAS.indexOf(atual) + 1) % IDS_TEMAS.length]);
    });
    aoMudarTema(rotular);
    rotular();
}

aplicarTema(atual, { salvar: false, origem: 'inicio' });
