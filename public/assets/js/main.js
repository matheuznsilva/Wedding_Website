document.addEventListener('DOMContentLoaded', () => {

	// Lógica para a página de Dicas (continua aqui)
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

	// Lógica para a página de Presentes (novo)
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