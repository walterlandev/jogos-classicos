// Menu: seletor de tema, nível e conquistas, abas do ranking e diálogos.
import { montarSeletor } from './temas.js';
import { progressoAtual } from './progresso.js';
import { nivelDaConta, CONQUISTAS } from './logica/progresso.js';

const seletor = document.getElementById('seletorTema');
if (seletor) montarSeletor(seletor);

/* --- Nível da conta e conquistas --- */
const SVG = 'http://www.w3.org/2000/svg';
function icone(obtida) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icone');
    svg.setAttribute('aria-hidden', 'true');
    const formas = obtida
        ? [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M8 12.5l2.8 2.8L16 9.8' }]]
        : [['rect', { x: 5, y: 11, width: 14, height: 9, rx: 1.5 }], ['path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }]];
    for (const [tag, attrs] of formas) {
        const el = document.createElementNS(SVG, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        svg.append(el);
    }
    return svg;
}

function desenharProgresso(prog) {
    const { nivel, xpNoNivel, xpDoNivel } = nivelDaConta(prog.xp);
    const pct = Math.round((xpNoNivel / xpDoNivel) * 100);
    document.getElementById('nivelConta').textContent = nivel;
    document.getElementById('barraNivelCheia').style.width = `${pct}%`;
    document.getElementById('barraNivel').setAttribute('aria-valuenow', pct);
    document.getElementById('textoNivel').textContent = `${xpNoNivel} de ${xpDoNivel} XP para o nível ${nivel + 1}`;

    const lista = document.getElementById('listaConquistas');
    lista.replaceChildren(...CONQUISTAS.map(c => {
        const obtida = prog.conquistas.includes(c.id);
        const li = document.createElement('li');
        li.className = obtida ? 'conquista obtida' : 'conquista';
        const texto = document.createElement('div');
        const nome = document.createElement('strong');
        nome.textContent = c.nome;
        const descricao = document.createElement('span');
        descricao.textContent = obtida ? c.descricao : `${c.descricao} (ainda não)`;
        texto.append(nome, descricao);
        li.append(icone(obtida), texto);
        return li;
    }));
    document.getElementById('contagemConquistas').textContent = `${prog.conquistas.length} de ${CONQUISTAS.length}`;
}

if (document.getElementById('listaConquistas')) {
    desenharProgresso(progressoAtual());
    window.addEventListener('progressomudou', e => desenharProgresso(e.detail));
}

// Abas (padrão WAI-ARIA: setas trocam de aba, só a aba ativa entra no Tab).
const abas = [...document.querySelectorAll('[role="tab"]')];
function selecionarAba(aba, focar = false) {
    for (const outra of abas) {
        const ativa = outra === aba;
        outra.setAttribute('aria-selected', String(ativa));
        outra.tabIndex = ativa ? 0 : -1;
        document.getElementById(outra.getAttribute('aria-controls')).hidden = !ativa;
    }
    if (focar) aba.focus();
}
abas.forEach((aba, i) => {
    aba.addEventListener('click', () => selecionarAba(aba));
    aba.addEventListener('keydown', e => {
        const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (passo) {
            e.preventDefault();
            selecionarAba(abas[(i + passo + abas.length) % abas.length], true);
        } else if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            selecionarAba(abas[e.key === 'Home' ? 0 : abas.length - 1], true);
        }
    });
});

// Diálogos de login e cadastro.
document.querySelectorAll('[data-abrir]').forEach(botao => {
    botao.addEventListener('click', () => {
        const dialogo = document.getElementById(botao.dataset.abrir);
        dialogo.querySelector('.mensagem').textContent = '';
        dialogo.showModal();
    });
});
document.querySelectorAll('[data-fechar]').forEach(botao => {
    botao.addEventListener('click', () => botao.closest('dialog').close());
});
