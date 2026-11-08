// Aplica o tema no navegador: data-tema no <html>, paleta do canvas como
// variáveis CSS --c-*, preferência salva no navegador e evento "temamudou".
// O registro e as regras ficam em logica/temas.js (testado).
import { TEMAS, IDS_TEMAS, resolverTema, podeUsar } from './logica/temas.js';

const raiz = document.documentElement;
let itensLiberados = [];
let nivelConta = 1;
let atual = resolverTema(raiz.dataset.tema);
let redesenharSeletor = null;

function preferenciaSalva() {
    try { return localStorage.getItem('tema'); } catch { return null; }
}

function publicarPaleta(c) {
    const s = raiz.style;
    s.setProperty('--c-fundo', c.fundo);
    s.setProperty('--c-vazio', c.vazio ?? 'transparent');
    c.pecas.forEach((cor, i) => { if (i) s.setProperty(`--c-peca-${i}`, cor); });
    c.tijolos.forEach((cor, i) => s.setProperty(`--c-tijolo-${i + 1}`, cor));
    for (const k of ['cobra', 'cabeca', 'comida', 'bola', 'raquete']) s.setProperty(`--c-${k}`, c[k]);
}

export const temaDisponivel = (id) => podeUsar(id, itensLiberados, nivelConta);

// origem: 'usuario' (escolheu agora), 'perfil' (veio do banco) ou 'inicio'.
export function aplicarTema(id, { salvar = true, origem = 'usuario' } = {}) {
    atual = resolverTema(id, itensLiberados, nivelConta);
    raiz.dataset.tema = atual;
    publicarPaleta(TEMAS[atual].canvas);
    // Barra do navegador no celular com a cor do topo do tema.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(raiz).getPropertyValue('--topo-fundo').trim() || meta.content;
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
    redesenharSeletor?.();
}

// Nível da conta (vem de progresso.js). Libera temas e devolve a preferência
// salva quando ela passa a valer (ex.: Lousa ao chegar no nível 10).
export function definirNivelConta(nivel) {
    nivelConta = nivel;
    const preferido = preferenciaSalva();
    if (preferido && preferido !== atual && temaDisponivel(preferido)) {
        aplicarTema(preferido, { salvar: false, origem: 'inicio' });
    }
    redesenharSeletor?.();
}

// Seletor do menu: grupo de rádio acessível, montado com DOM (sem innerHTML).
export function montarSeletor(container) {
    const desenhar = () => {
        const grupo = document.createElement('fieldset');
        grupo.className = 'seletor-tema';
        const legenda = document.createElement('legend');
        legenda.className = 'visualmente-oculto';
        legenda.textContent = 'Tema';
        grupo.append(legenda);

        for (const id of IDS_TEMAS) {
            const tema = TEMAS[id];
            const livre = temaDisponivel(id);
            const opcao = document.createElement('label');
            opcao.className = livre ? 'opcao-tema' : 'opcao-tema bloqueada';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'tema';
            radio.value = id;
            radio.checked = id === atual;
            radio.disabled = !livre;
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
            descricao.textContent = livre ? tema.descricao : `Libera no nível ${tema.nivelMinimo} da conta.`;
            opcao.append(radio, amostras, nome, descricao);
            grupo.append(opcao);
        }
        container.replaceChildren(grupo);
    };
    redesenharSeletor = desenhar;
    desenhar();
    aoMudarTema(id => {
        container.querySelectorAll('input').forEach(r => { r.checked = r.value === id; });
    });
}

// Botão das páginas de jogo: troca para o próximo tema liberado a cada toque.
export function ligarBotaoTema(botao) {
    const proximo = () => {
        for (let i = 1; i <= IDS_TEMAS.length; i++) {
            const id = IDS_TEMAS[(IDS_TEMAS.indexOf(atual) + i) % IDS_TEMAS.length];
            if (temaDisponivel(id)) return id;
        }
        return atual;
    };
    const rotular = () => {
        botao.setAttribute('aria-label', `Tema atual: ${TEMAS[atual].nome}. Trocar para ${TEMAS[proximo()].nome}`);
        botao.title = `Trocar tema (${TEMAS[proximo()].nome})`;
    };
    botao.addEventListener('click', () => aplicarTema(proximo()));
    aoMudarTema(rotular);
    rotular();
}

aplicarTema(atual, { salvar: false, origem: 'inicio' });
