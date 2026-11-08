// Progresso do jogador no navegador: guarda, mescla com o perfil e avisa as telas.
// Regras (XP, nível, conquistas) em logica/progresso.js.
import { novoProgresso, aplicarPartida, mesclar, nivelDaConta, CONQUISTAS } from './logica/progresso.js';
import { definirNivelConta } from './temas.js';

const CHAVE = 'progresso';

function ler() {
    try { return mesclar(novoProgresso(), JSON.parse(localStorage.getItem(CHAVE))); } catch { return novoProgresso(); }
}

let prog = ler();

function salvarLocal() {
    try { localStorage.setItem(CHAVE, JSON.stringify(prog)); } catch { /* navegação privada */ }
}

function publicar() {
    definirNivelConta(nivelDaConta(prog.xp).nivel);
    window.dispatchEvent(new CustomEvent('progressomudou', { detail: prog }));
}

export const progressoAtual = () => prog;

// Chamado pelos jogos no fim da partida.
export function registrarPartida(jogo, resumo) {
    const r = aplicarPartida(prog, jogo, resumo);
    prog = r.progresso;
    salvarLocal();
    window.salvarProgressoDB?.(prog);
    publicar();
    return r;
}

// Linhas extras da faixa de fim de jogo.
export function textosDoFim(r) {
    const linhas = [`+${r.xpGanho} XP`];
    if (r.nivelDepois > r.nivelAntes) linhas.push(`Você chegou ao nível ${r.nivelDepois}!`);
    for (const id of r.novas) linhas.push(`Conquista: ${CONQUISTAS.find(c => c.id === id).nome}`);
    return linhas;
}

// Ao entrar na conta: soma o progresso deste navegador com o do perfil.
window.addEventListener('perfilcarregado', e => {
    const doPerfil = e.detail?.progresso;
    const mesclado = mesclar(prog, doPerfil);
    const perfilDesatualizado = JSON.stringify(mesclado) !== JSON.stringify(mesclar(novoProgresso(), doPerfil));
    prog = mesclado;
    salvarLocal();
    if (perfilDesatualizado) window.salvarProgressoDB?.(prog);
    publicar();
});

publicar();
