// Sons dos jogos com Web Audio: gerados na hora, sem arquivos.
// Curtos e baixos; o jogador liga e desliga no botão do topo (fica salvo).

const CHAVE = 'som';
let ligado = (() => { try { return localStorage.getItem(CHAVE) !== 'desligado'; } catch { return true; } })();
let contexto = null;

function audio() {
    if (!contexto) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        contexto = new Ctx();
    }
    if (contexto.state === 'suspended') contexto.resume();
    return contexto;
}

function tom(freq, duracao = 0.08, { tipo = 'square', volume = 0.05, ate = null, atraso = 0 } = {}) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + atraso;
    const osc = a.createOscillator();
    const ganho = a.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t + duracao);
    ganho.gain.setValueAtTime(volume, t);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    osc.connect(ganho).connect(a.destination);
    osc.start(t);
    osc.stop(t + duracao + 0.02);
}

const SONS = {
    travar: () => tom(140, 0.05, { volume: 0.03 }),
    linha: () => tom(520, 0.09, { ate: 780 }),
    quatro: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.09, { atraso: i * 0.07 })),
    nivel: () => [392, 523, 659].forEach((f, i) => tom(f, 0.12, { atraso: i * 0.09, tipo: 'triangle', volume: 0.06 })),
    fruta: () => tom(660, 0.06, { ate: 880 }),
    dourada: () => [880, 1175].forEach((f, i) => tom(f, 0.08, { atraso: i * 0.06, tipo: 'triangle' })),
    tijolo: () => tom(330 + Math.random() * 60, 0.04, { volume: 0.035 }),
    raquete: () => tom(220, 0.04, { volume: 0.03, tipo: 'triangle' }),
    poder: () => tom(440, 0.15, { ate: 990, tipo: 'triangle' }),
    vida: () => tom(300, 0.25, { ate: 110, tipo: 'sawtooth', volume: 0.04 }),
    fim: () => [392, 330, 262].forEach((f, i) => tom(f, 0.18, { atraso: i * 0.15, tipo: 'triangle', volume: 0.06 })),
};

export function tocar(nome) {
    if (!ligado) return;
    try { SONS[nome]?.(); } catch { /* áudio indisponível: o jogo segue sem som */ }
}

// Botão de som no topo dos jogos (dois ícones: ligado e desligado).
export function ligarBotaoSom(botao) {
    const atualizar = () => {
        botao.setAttribute('aria-pressed', String(ligado));
        botao.setAttribute('aria-label', ligado ? 'Som ligado. Desligar' : 'Som desligado. Ligar');
        botao.title = ligado ? 'Desligar som' : 'Ligar som';
        botao.querySelector('.som-ligado').hidden = !ligado;
        botao.querySelector('.som-desligado').hidden = ligado;
    };
    botao.addEventListener('click', () => {
        ligado = !ligado;
        try { localStorage.setItem(CHAVE, ligado ? 'ligado' : 'desligado'); } catch { /* navegação privada */ }
        atualizar();
        if (ligado) tocar('fruta');
    });
    atualizar();
}
