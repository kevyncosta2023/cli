document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DOS ELEMENTOS DO HTML ---
    const form = document.getElementById('formCliente');
    const nomeInput = document.getElementById('nomeInput');
    const dataInput = document.getElementById('dataInput');
    const editIndexInput = document.getElementById('editIndex');
    const clientListDiv = document.getElementById('clientList');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnSubmitText = btnSubmit.querySelector('span');
    const btnSubmitIcon = btnSubmit.querySelector('i');
    const btnCancel = document.getElementById('btnCancel');
    const toast = document.getElementById('toast');

    // --- ESTADO DA APLICAÇÃO ---
    // Carrega clientes do localStorage ou inicializa com um array vazio
    let clientes = JSON.parse(localStorage.getItem('gestorVencimentos')) || [];

    // --- FUNÇÕES AUXILIARES ---

    // Salva a lista de clientes no localStorage
    const salvarClientes = () => {
        localStorage.setItem('gestorVencimentos', JSON.stringify(clientes));
    };

    // Mostra uma notificação (toast) de feedback
    const mostrarToast = (mensagem) => {
        toast.textContent = mensagem;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000); // A notificação some após 3 segundos
    };

    // Calcula a diferença de dias entre hoje e a data de vencimento
    const calcularDiferencaDias = (dataVencimento) => {
        const hoje = new Date();
        // Adiciona 'T00:00:00' para evitar problemas com fuso horário
        const vencimento = new Date(dataVencimento + 'T00:00:00');
        
        // Zera as horas para comparar apenas os dias
        hoje.setHours(0, 0, 0, 0);
        vencimento.setHours(0, 0, 0, 0);

        const diffTempo = vencimento.getTime() - hoje.getTime();
        return Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
    };

    // Determina o status (classe CSS e texto) com base nos dias restantes
    const getStatus = (dias) => {
        if (dias < 0) {
            return { texto: `Vencido há ${Math.abs(dias)} dia(s)`, classe: 'status-vencido' };
        }
        if (dias === 0) {
            return { texto: 'Vence Hoje!', classe: 'status-alerta' };
        }
        if (dias <= 5) {
            return { texto: `Vence em ${dias} dia(s)`, classe: 'status-alerta' };
        }
        return { texto: 'Em dia', classe: 'status-ok' };
    };
    
    // --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---

    // Desenha/Atualiza a lista de clientes na tela
    const renderizarClientes = () => {
        // Limpa a lista atual para evitar duplicatas
        clientListDiv.innerHTML = '';
        
        // Ordena os clientes: os com menor data de vencimento (mais próximos) vêm primeiro
        clientes.sort((a, b) => new Date(a.data) - new Date(b.data));

        if (clientes.length === 0) {
            clientListDiv.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Nenhum cliente cadastrado ainda.</p>';
            return;
        }

        clientes.forEach((cliente, index) => {
            const diasRestantes = calcularDiferencaDias(cliente.data);
            const status = getStatus(diasRestantes);
            const dataFormatada = new Date(cliente.data + 'T00:00:00').toLocaleDateString('pt-BR');

            // Cria o elemento do card do cliente
            const card = document.createElement('div');
            card.className = `client-card ${status.classe}`;
            card.innerHTML = `
                <div class="client-info">
                    <h3>${cliente.nome}</h3>
                    <p>Vencimento: ${dataFormatada}</p>
                </div>
                <div class="client-status">
                    <span class="status-text">${status.texto}</span>
                    <div class="client-actions">
                        <button class="action-btn" data-action="edit" data-index="${index}" title="Editar">
                            <i data-feather="edit-2"></i>
                        </button>
                        <button class="action-btn" data-action="delete" data-index="${index}" title="Excluir">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
            clientListDiv.appendChild(card);
        });

        // Reativa os ícones após renderizar
        feather.replace();
    };

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS E FORMULÁRIO ---

    // Reseta o formulário para o estado inicial
    const resetarFormulario = () => {
        form.reset();
        editIndexInput.value = '';
        btnSubmitText.textContent = 'Adicionar';
        btnSubmitIcon.outerHTML = '<i data-feather="plus-circle"></i>';
        btnCancel.classList.add('hidden');
        nomeInput.focus();
        feather.replace(); // Atualiza o ícone
    };

    // Prepara o formulário para editar um cliente existente
    const prepararEdicao = (index) => {
        nomeInput.value = clientes[index].nome;
        dataInput.value = clientes[index].data;
        editIndexInput.value = index;
        
        btnSubmitText.textContent = 'Atualizar';
        btnSubmitIcon.outerHTML = '<i data-feather="check-circle"></i>';
        btnCancel.classList.remove('hidden');
        nomeInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola a tela para o topo
        feather.replace(); // Atualiza o ícone
    };

    // --- EVENT LISTENERS ---

    // Lida com a submissão do formulário (Adicionar ou Atualizar)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const data = dataInput.value;
        const editIndex = editIndexInput.value;

        if (!nome || !data) return;

        const cliente = { nome, data };

        if (editIndex === '') {
            // Adicionando novo cliente
            clientes.push(cliente);
            mostrarToast('Cliente adicionado com sucesso!');
        } else {
            // Atualizando cliente existente
            clientes[editIndex] = cliente;
            mostrarToast('Cliente atualizado com sucesso!');
        }

        salvarClientes();
        renderizarClientes();
        resetarFormulario();
    });

    // Lida com os cliques nos botões de editar e excluir na lista
    clientListDiv.addEventListener('click', (e) => {
        // Usamos .closest para garantir que pegamos o botão, mesmo se o clique for no ícone dentro dele
        const actionButton = e.target.closest('.action-btn');
        if (!actionButton) return;

        const action = actionButton.dataset.action;
        const index = actionButton.dataset.index;

        if (action === 'edit') {
            prepararEdicao(index);
        } else if (action === 'delete') {
            if (confirm(`Tem certeza que deseja excluir "${clientes[index].nome}"?`)) {
                clientes.splice(index, 1);
                salvarClientes();
                renderizarClientes();
                mostrarToast('Cliente excluído.');
            }
        }
    });
    
    // Lida com o clique no botão de cancelar edição
    btnCancel.addEventListener('click', resetarFormulario);

    // --- INICIALIZAÇÃO ---
    // Renderiza a lista de clientes pela primeira vez quando a página carrega
    renderizarClientes();
});