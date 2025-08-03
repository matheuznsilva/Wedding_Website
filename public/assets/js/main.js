
// 
document.addEventListener('DOMContentLoaded', () => {

    const dicasMenu = document.querySelector('.dicas-menu');
    if (dicasMenu) {
        dicasMenu.addEventListener('click', (event) => {
            const botao = event.target.closest('.dica-botao');
            if (botao) {
                const categoria = botao.dataset.categoria;
                const conteudoDica = document.getElementById('conteudo-dica');
                
                if (window.dicas && dicas[categoria]) {
                    const dica = dicas[categoria];
                    
                    let htmlConteudo = `<p>${dica.conteudo}</p>`;
                    
                    if (dica.imagem_url) {
                        htmlConteudo = `
                            <div class="dica-container">
                                <div class="dica-imagem">
                                    <img src="${dica.imagem_url}" alt="Imagem de Dica de ${categoria}">
                                </div>
                                <div class="dica-texto">
                                    <h3 class="dica-titulo">Traje</h3>
                                    <p>${dica.conteudo}</p>
                                </div>
                            </div>
                        `;
                    }
                    
                    conteudoDica.innerHTML = htmlConteudo;
                } else {
                    conteudoDica.innerHTML = '<p>Conteúdo não encontrado.</p>';
                }
            }
        });
    }

});