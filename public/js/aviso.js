// Faixa de fim de jogo comum aos três jogos (substitui os alert).
// Todo texto entra por textContent: nada vindo do jogador vira HTML.

export function mostrarFimDeJogo(area, { titulo, pontos, recordeNovo }) {
    let faixa = area.querySelector('.fim-de-jogo');
    if (!faixa) {
        faixa = document.createElement('div');
        faixa.className = 'fim-de-jogo';
        faixa.setAttribute('role', 'status');
        area.appendChild(faixa);
    }
    const linha = (texto, classe) => {
        const p = document.createElement('p');
        p.textContent = texto;
        if (classe) p.className = classe;
        return p;
    };
    faixa.replaceChildren(linha(titulo, 'fim-titulo'), linha(`${pontos} pontos`));
    if (recordeNovo) faixa.append(linha('Recorde novo!', 'fim-recorde'));
    faixa.hidden = false;
}

export function esconderFimDeJogo(area) {
    const faixa = area.querySelector('.fim-de-jogo');
    if (faixa) faixa.hidden = true;
}
