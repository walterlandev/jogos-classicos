// Nível do jogador: XP, curva de nível, conquistas e mescla de progresso.
// Puro (sem DOM); testado em tests/progresso.test.js.

export function xpDaPartida(jogo, r = {}) {
    let xp = 10;
    if (jogo === 'blockix') xp += 2 * (r.linhas || 0);
    if (jogo === 'breakout') xp += (r.tijolos || 0) + 20 * (r.fasesConcluidas || 0);
    if (jogo === 'snake') xp += 2 * (r.frutas || 0) + 20 * (r.fasesConcluidas || 0);
    return xp;
}

// XP total para chegar ao nível n (2 = 100, 10 = 4.500, 20 = 19.000).
export const xpTotalParaNivel = (n) => 50 * (n - 1) * n;

// Teto de XP: valor adulterado no banco (1e300, Infinity) não pode travar ninguém.
export const XP_MAXIMO = 1e9;
const xpSeguro = (xp) => {
    const n = Number(xp);
    return Number.isFinite(n) ? Math.min(XP_MAXIMO, Math.max(0, Math.floor(n))) : 0;
};

// Fórmula fechada (sem laço): maior n com 50·(n−1)·n ≤ xp.
export function nivelDaConta(xpBruto) {
    const xp = xpSeguro(xpBruto);
    let nivel = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2));
    if (xpTotalParaNivel(nivel) > xp) nivel--;           // corrige arredondamento
    else if (xpTotalParaNivel(nivel + 1) <= xp) nivel++;
    return {
        nivel,
        xpNoNivel: xp - xpTotalParaNivel(nivel),
        xpDoNivel: xpTotalParaNivel(nivel + 1) - xpTotalParaNivel(nivel),
    };
}

export const novoProgresso = () => ({ xp: 0, conquistas: [], est: { partidas: 0, jogos: [], linhas: 0, tijolos: 0 } });

// ctx: { jogo, r (resumo da partida), est (já somadas), nivel (depois da partida) }
export const CONQUISTAS = [
    { id: 'primeira-linha', jogo: 'blockix', nome: 'Primeira linha', descricao: 'Limpe uma linha no Blockix.', teste: c => c.jogo === 'blockix' && c.r.linhas >= 1 },
    { id: 'quatro-linhas', jogo: 'blockix', nome: 'Quatro de uma vez', descricao: 'Limpe quatro linhas com uma peça.', teste: c => c.jogo === 'blockix' && c.r.quatros >= 1 },
    { id: 'combo-5', jogo: 'blockix', nome: 'Combo ×5', descricao: 'Limpe linhas em seis peças seguidas.', teste: c => c.jogo === 'blockix' && c.r.maiorCombo >= 5 },
    { id: 'blockix-nivel-10', jogo: 'blockix', nome: 'Nível 10 no Blockix', descricao: 'Chegue ao nível 10 numa partida.', teste: c => c.jogo === 'blockix' && c.r.nivelMax >= 10 },
    { id: 'cem-linhas', jogo: 'blockix', nome: 'Cem linhas', descricao: 'Some 100 linhas no Blockix.', teste: c => c.est.linhas >= 100 },
    { id: 'fase-1-breakout', jogo: 'breakout', nome: 'Primeira parede', descricao: 'Conclua uma fase do Breakout.', teste: c => c.jogo === 'breakout' && c.r.fasesConcluidas >= 1 },
    { id: 'breakout-fase-10', jogo: 'breakout', nome: 'Fase 10 no Breakout', descricao: 'Chegue à fase 10.', teste: c => c.jogo === 'breakout' && c.r.faseMax >= 10 },
    { id: 'multibola', jogo: 'breakout', nome: 'Multibola', descricao: 'Pegue o power-up de multibola.', teste: c => c.jogo === 'breakout' && !!c.r.pegouMulti },
    { id: 'mil-tijolos', jogo: 'breakout', nome: 'Mil tijolos', descricao: 'Quebre 1.000 tijolos no total.', teste: c => c.est.tijolos >= 1000 },
    { id: 'snake-fase-5', jogo: 'snake', nome: 'Fase 5 na Snake', descricao: 'Chegue à fase 5.', teste: c => c.jogo === 'snake' && c.r.faseMax >= 5 },
    { id: 'fruta-dourada', jogo: 'snake', nome: 'Fruta dourada', descricao: 'Coma uma fruta dourada.', teste: c => c.jogo === 'snake' && c.r.douradas >= 1 },
    { id: 'cobra-30', jogo: 'snake', nome: 'Cobra comprida', descricao: 'Chegue a 30 partes de cobra.', teste: c => c.jogo === 'snake' && c.r.maiorTamanho >= 30 },
    { id: 'tres-jogos', jogo: 'geral', nome: 'Freguês da casa', descricao: 'Jogue os três jogos.', teste: c => c.est.jogos.length >= 3 },
    { id: 'cinquenta-partidas', jogo: 'geral', nome: 'Cinquenta partidas', descricao: 'Jogue 50 partidas.', teste: c => c.est.partidas >= 50 },
    { id: 'nivel-10', jogo: 'geral', nome: 'Nível 10', descricao: 'Chegue ao nível 10 da conta.', teste: c => c.nivel >= 10 },
];

// Soma uma partida ao progresso (sem alterar o original).
export function aplicarPartida(progresso, jogo, r = {}) {
    const base = mesclar(novoProgresso(), progresso);
    const xpGanho = xpDaPartida(jogo, r);
    const est = {
        partidas: base.est.partidas + 1,
        jogos: [...new Set([...base.est.jogos, jogo])].sort(),
        linhas: base.est.linhas + (jogo === 'blockix' ? r.linhas || 0 : 0),
        tijolos: base.est.tijolos + (jogo === 'breakout' ? r.tijolos || 0 : 0),
    };
    const xp = base.xp + xpGanho;
    const nivelAntes = nivelDaConta(base.xp).nivel;
    const nivelDepois = nivelDaConta(xp).nivel;
    const ctx = { jogo, r, est, nivel: nivelDepois };
    const novas = CONQUISTAS.filter(c => !base.conquistas.includes(c.id) && c.teste(ctx)).map(c => c.id);
    return {
        progresso: { xp, conquistas: [...base.conquistas, ...novas].sort(), est },
        xpGanho, nivelAntes, nivelDepois, novas,
    };
}

// Junta progresso do navegador e do perfil: maior XP, união de listas, maior contador.
export function mesclar(a, b) {
    const x = a || novoProgresso();
    if (!b) return { xp: x.xp, conquistas: [...x.conquistas], est: { ...x.est, jogos: [...x.est.jogos] } };
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const lista = (v) => (Array.isArray(v) ? v.filter(i => typeof i === 'string') : []);
    const eb = b.est || {};
    return {
        xp: Math.min(XP_MAXIMO, Math.max(num(x.xp), num(b.xp))),
        conquistas: [...new Set([...lista(x.conquistas), ...lista(b.conquistas)])].sort(),
        est: {
            partidas: Math.max(num(x.est.partidas), num(eb.partidas)),
            jogos: [...new Set([...lista(x.est.jogos), ...lista(eb.jogos)])].sort(),
            linhas: Math.max(num(x.est.linhas), num(eb.linhas)),
            tijolos: Math.max(num(x.est.tijolos), num(eb.tijolos)),
        },
    };
}
