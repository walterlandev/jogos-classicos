// Botões de toque dos jogos. Usam pointer events: funcionam com dedo e mouse.

const ATRASO_MS = 170;
const REPETICAO_MS = 50;

// Toque único; com repetir = true, segurar repete a ação (mover peça, descer).
export function ligarToque(botao, acao, { repetir = false } = {}) {
    let atraso = null;
    let intervalo = null;
    const parar = () => {
        clearTimeout(atraso);
        clearInterval(intervalo);
        botao.classList.remove('apertado');
    };
    botao.addEventListener('pointerdown', e => {
        e.preventDefault();
        botao.setPointerCapture?.(e.pointerId);
        botao.classList.add('apertado');
        acao();
        if (repetir) atraso = setTimeout(() => { intervalo = setInterval(acao, REPETICAO_MS); }, ATRASO_MS);
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) botao.addEventListener(ev, parar);
    // Teclado (Enter/Espaço no botão focado) continua funcionando pelo click.
    botao.addEventListener('click', e => { if (e.detail === 0) acao(); });
}

// Enquanto segura: aoApertar ao encostar, aoSoltar ao tirar (raquete).
export function ligarSegurar(botao, aoApertar, aoSoltar) {
    const soltar = () => { botao.classList.remove('apertado'); aoSoltar(); };
    botao.addEventListener('pointerdown', e => {
        e.preventDefault();
        botao.setPointerCapture?.(e.pointerId);
        botao.classList.add('apertado');
        aoApertar();
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) botao.addEventListener(ev, soltar);
}
