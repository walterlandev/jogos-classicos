// Menu: seletor de tema, abas do ranking e abertura/fechamento dos diálogos.
import { montarSeletor } from './temas.js';

const seletor = document.getElementById('seletorTema');
if (seletor) montarSeletor(seletor);

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
