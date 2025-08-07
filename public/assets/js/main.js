// public/assets/js/main.js

// Lógica para a página de Local (agora no escopo global)
function initMap() {
    if (window.localizacao && window.localizacao.rua) {
        const localizacao = window.localizacao;
        const enderecoCompleto = `${localizacao.rua}, ${localizacao.numero} - ${localizacao.bairro}, ${localizacao.cidade} - ${localizacao.estado}`;
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'address': enderecoCompleto }, (results, status) => {
            if (status === 'OK') {
                const map = new google.maps.Map(document.getElementById('mapa-container'), {
                    zoom: 15,
                    center: results[0].geometry.location
                });
                new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
            } else {
                console.error('Geocoder falhou com o erro: ' + status);
            }
        });
    } else {
        console.error('Localização não encontrada.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para o Contador Regressivo
    const countdown = document.getElementById('countdown');
    if (countdown) {
        const weddingDateStr = countdown.dataset.date;
        
        if (weddingDateStr) {
            const weddingDate = new Date(weddingDateStr);

            if (isNaN(weddingDate.getTime())) {
                console.error("Erro: A data do casamento é inválida. Verifique o formato no dashboard.");
                return;
            }

            const updateCountdown = () => {
                const now = new Date();
                const timeDifference = weddingDate - now;

                if (timeDifference > 0) {
                    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

                    document.getElementById('days').textContent = days;
                    document.getElementById('hours').textContent = hours;
                    document.getElementById('minutes').textContent = minutes;
                    document.getElementById('seconds').textContent = seconds;
                } else {
                    document.getElementById('days').textContent = 0;
                    document.getElementById('hours').textContent = 0;
                    document.getElementById('minutes').textContent = 0;
                    document.getElementById('seconds').textContent = 0;
                    clearInterval(countdownInterval);
                }
            };

            const countdownInterval = setInterval(updateCountdown, 1000);
            updateCountdown();
        } else {
            console.error("Erro: A data do casamento não foi definida no dashboard.");
        }
    }
    
    // Lógica para a página de Dicas
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

    // Lógica para a página de Presentes
    const presenteGrid = document.querySelector('.presentes-grid');
    const presenteModal = document.getElementById('presenteModal');
    const closeButton = document.querySelector('.close-button');
    const modalPagamento = document.getElementById('modal-pagamento');
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const botaoSim = document.getElementById('confirmar-sim');
    const botaoNao = document.getElementById('confirmar-nao');
    let presenteIdParaReservar = null;

    if (presenteGrid) {
        presenteGrid.addEventListener('click', (event) => {
            const button = event.target.closest('.presente-button');
            if (button && !button.disabled) {
                presenteIdParaReservar = button.dataset.id;
                modalPagamento.style.display = 'none';
                modalConfirmacao.style.display = 'block';
                presenteModal.style.display = 'flex';
            }
        });
    }

    if (botaoSim) {
        botaoSim.addEventListener('click', async () => {
            if (presenteIdParaReservar) {
                try {
                    const response = await fetch(`/api/presentes/reservar/${presenteIdParaReservar}`, {
                        method: 'POST'
                    });
                    const data = await response.json();

                    if (response.ok) {
                        const button = document.querySelector(`[data-id="${presenteIdParaReservar}"]`);
                        if (button) {
                            const nome = button.dataset.nome;
                            const valor = button.dataset.valor;
                            const pix = button.dataset.pix;
                            const marketplace = button.dataset.marketplace;

                            document.getElementById('modal-nome').textContent = nome;
                            document.getElementById('modal-valor').textContent = `R$ ${valor}`;
                            document.getElementById('modal-pix').textContent = pix || 'Nenhuma informação de PIX.';

                            const marketplaceLink = document.getElementById('modal-marketplace');
                            if (marketplace && marketplace !== 'null' && marketplace !== 'undefined') {
                                marketplaceLink.href = marketplace;
                                marketplaceLink.style.display = 'block';
                            } else {
                                marketplaceLink.style.display = 'none';
                            }

                            modalConfirmacao.style.display = 'none';
                            modalPagamento.style.display = 'block';

                            button.disabled = true;
                            button.textContent = 'Reservado';
                            button.parentElement.classList.add('comprado');
                        }
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Houve um erro ao tentar reservar o presente.');
                }
            }
        });
    }

    if (botaoNao) {
        botaoNao.addEventListener('click', () => {
            presenteModal.style.display = 'none';
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            presenteModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === presenteModal) {
            presenteModal.style.display = 'none';
        }
    });
});