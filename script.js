document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DOS ELEMENTOS DO HTML ---
    const form = document.getElementById('formCliente');
    const nomeInput = document.getElementById('nomeInput');
    const dataInput = document.getElementById('dataInput');
    const tipoInput = document.getElementById('tipoInput');
    const valorInput = document.getElementById('valorInput');
    
    const editIndexInput = document.getElementById('editIndex');
    const clientListDiv = document.getElementById('clientList');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnSubmitText = btnSubmit.querySelector('span');
    const btnSubmitIcon = btnSubmit.querySelector('i');
    const btnCancel = document.getElementById('btnCancel');
    const toast = document.getElementById('toast');

    // DASHBOARD
    const lucroMensalEl = document.getElementById('lucroMensal');
    const aReceberEmBreveEl = document.getElementById('aReceberEmBreve');
    // NOVOS: Stats de Clientes
    const clientesAtivosEl = document.getElementById('clientesAtivos');
    const clientesVencidosEl = document.getElementById('clientesVencidos');

    // IMPORT/EXPORT
    const btnExportar = document.getElementById('btnExportar');
    const fileImportar = document.getElementById('fileImportar');

    // NOVO: Busca
    const searchInput = document.getElementById('searchInput');

    // --- CONSTANTES DE CUSTO ---
    const CUSTO_UNITV = 12;
    const CUSTO_IPTV = 10;

    // --- ESTADO DA APLICAÇÃO ---
    let clientes = JSON.parse(localStorage.getItem('gestorVencimentos')) || [];

    // --- FUNÇÕES AUXILIARES ---

    const salvarClientes = () => {
        localStorage.setItem('gestorVencimentos', JSON.stringify(clientes));
    };

    const mostrarToast = (mensagem, tipo = 'success') => {
        toast.textContent = mensagem;
        toast.style.backgroundColor = tipo === 'success' ? 'var(--success)' : 'var(--danger)';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    const calcularDiferencaDias = (dataVencimento) => {
        const hoje = new Date();
        const vencimento = new Date(dataVencimento + 'T00:00:00');
        hoje.setHours(0, 0, 0, 0);
        vencimento.setHours(0, 0, 0, 0);
        const diffTempo = vencimento.getTime() - hoje.getTime();
        return Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
    };

    const getStatus = (dias) => {
        if (dias < 0) {
            return { texto: `Vencido há ${Math.abs(dias)} dia(s)`, classe: 'status-vencido' };
        }
        if (dias === 0) {
            return { texto: 'Vence Hoje!', classe: 'status-alerta' };
        }
        if (dias <= 7) { 
            return { texto: `Vence em ${dias} dia(s)`, classe: 'status-alerta' };
        }
        return { texto: 'Em dia', classe: 'status-ok' };
    };
    
    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    // ATUALIZADO: Renderiza o dashboard com contagem de clientes
    const renderizarDashboard = () => {
        let lucroTotal = 0;
        let aReceberTotal = 0;
        let ativos = 0;
        let vencidos = 0;

        clientes.forEach(cliente => {
            const valorPlano = parseFloat(cliente.valorPlano) || 0; 
            
            // 1. Lucro
            let custo = 0;
            if (cliente.tipo === 'unitv') {
                custo = CUSTO_UNITV;
            } else if (cliente.tipo === 'iptv') {
                custo = CUSTO_IPTV;
            }
            if (valorPlano > custo) {
                lucroTotal += (valorPlano - custo);
            }

            // 2. A Receber e Contagem de Clientes
            const diasRestantes = calcularDiferencaDias(cliente.data);
            if (diasRestantes >= 0 && diasRestantes <= 7) {
                aReceberTotal += valorPlano;
            }
            
            // 3. Contagem de Ativos/Vencidos
            if (diasRestantes >= 0) {
                ativos++;
            } else {
                vencidos++;
            }
        });

        lucroMensalEl.textContent = `R$ ${lucroTotal.toFixed(2).replace('.', ',')}`;
        aReceberEmBreveEl.textContent = `R$ ${aReceberTotal.toFixed(2).replace('.', ',')}`;
        clientesAtivosEl.textContent = ativos;
        clientesVencidosEl.textContent = vencidos;
    };

    // ATUALIZADO: Renderiza os clientes com base em um filtro de busca
    const renderizarClientes = (filtroNome = '') => {
        clientListDiv.innerHTML = '';

        const filtroLower = filtroNome.toLowerCase();
        
        // 1. Filtra os clientes
        const clientesFiltrados = clientes
            .map((cliente, index) => ({ ...cliente, originalIndex: index })) // Guarda o índice original
            .filter(cliente => cliente.nome.toLowerCase().includes(filtroLower));

        // 2. Ordena os clientes filtrados
        clientesFiltrados.sort((a, b) => new Date(a.data) - new Date(b.data));

        if (clientesFiltrados.length === 0) {
            if (filtroNome) {
                clientListDiv.innerHTML = `<p style="text-align:center; color: var(--text-secondary);">Nenhum cliente encontrado com "${filtroNome}".</p>`;
            } else {
                clientListDiv.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Nenhum cliente cadastrado ainda.</p>';
            }
            return;
        }

        // 3. Renderiza os clientes filtrados
        clientesFiltrados.forEach((cliente) => {
            const diasRestantes = calcularDiferencaDias(cliente.data);
            const status = getStatus(diasRestantes);
            const dataFormatada = new Date(cliente.data + 'T00:00:00').toLocaleDateString('pt-BR');
            
            const valorPlanoFormatado = (parseFloat(cliente.valorPlano) || 0).toFixed(2).replace('.', ',');
            const tipoPlano = (cliente.tipo || 'N/A').toUpperCase();

            const card = document.createElement('div');
            card.className = `client-card ${status.classe}`;
            card.innerHTML = `
                <div class="client-info">
                    <h3>${cliente.nome}</h3>
                    <p>Vencimento: ${dataFormatada}</p>
                    <p class="client-details">Plano: ${tipoPlano} - R$ ${valorPlanoFormatado}</p>
                </div>
                <div class="client-status">
                    <span class="status-text">${status.texto}</span>
                    <div class="client-actions">
                        <button class="action-btn" data-action="edit" data-index="${cliente.originalIndex}" title="Editar">
                            <i data-feather="edit-2"></i>
                        </button>
                        <button class="action-btn" data-action="delete" data-index="${cliente.originalIndex}" title="Excluir">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
            clientListDiv.appendChild(card);
        });

        feather.replace();
    };

    // ATUALIZADO: A função principal de UI agora passa o filtro de busca
    const updateUI = () => {
        const filtroAtual = searchInput.value;
        renderizarClientes(filtroAtual); // Renderiza a lista com o filtro
        renderizarDashboard(); // Dashboard não é afetado pelo filtro
        feather.replace(); 
    };

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS E FORMULÁRIO ---

    const resetarFormulario = () => {
        form.reset();
        editIndexInput.value = '';
        btnSubmitText.textContent = 'Adicionar';
        btnSubmitIcon.outerHTML = '<i data-feather="plus-circle"></i>';
        btnCancel.classList.add('hidden');
        nomeInput.focus();
        feather.replace();
    };

    const prepararEdicao = (index) => {
        const cliente = clientes[index]; // Pega o cliente do array *original*
        nomeInput.value = cliente.nome;
        dataInput.value = cliente.data;
        tipoInput.value = cliente.tipo || 'unitv';
        valorInput.value = cliente.valorPlano || '';
        
        editIndexInput.value = index;
        
        btnSubmitText.textContent = 'Atualizar';
        btnSubmitIcon.outerHTML = '<i data-feather="check-circle"></i>';
        btnCancel.classList.remove('hidden');
        nomeInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        feather.replace();
    };

    // --- FUNÇÕES DE IMPORTAR/EXPORTAR ---

    const exportarClientes = () => {
        if (clientes.length === 0) {
            mostrarToast('Não há clientes para exportar.', 'danger');
            return;
        }
        const dataStr = JSON.stringify(clientes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestor_vencimentos_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Clientes exportados com sucesso!');
    };

    const importarClientes = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const novosClientes = JSON.parse(e.target.result);
                
                if (!Array.isArray(novosClientes)) {
                    throw new Error('O arquivo não contém uma lista de clientes válida.');
                }
                
                if (novosClientes.length > 0) {
                    const primeiroCliente = novosClientes[0];
                    if (typeof primeiroCliente.nome === 'undefined' || 
                        typeof primeiroCliente.data === 'undefined' || 
                        typeof primeiroCliente.tipo === 'undefined' || 
                        typeof primeiroCliente.valorPlano === 'undefined') {
                        
                        throw new Error('Formato de cliente inválido no arquivo.');
                    }
                } else {
                     throw new Error('O arquivo está vazio.');
                }

                if (confirm(`IMPORTAÇÃO PERIGOSA: \n\nIsso substituirá seus ${clientes.length} clientes atuais por ${novosClientes.length} clientes do arquivo. \n\nVocê tem certeza?`)) {
                    clientes = novosClientes;
                    salvarClientes();
                    updateUI();
                    mostrarToast('Clientes importados com sucesso!');
                }
            } catch (err) {
                console.error('Erro ao importar:', err);
                mostrarToast(`${err.message}`, 'danger');
            } finally {
                event.target.value = null;
            }
        };
        reader.readAsText(file);
    };

    // --- EVENT LISTENERS ---

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const data = dataInput.value;
        const tipo = tipoInput.value;
        const valorPlano = valorInput.value;
        const editIndex = editIndexInput.value;

        if (!nome || !data || !tipo || !valorPlano) {
            mostrarToast('Preencha todos os campos!', 'danger');
            return;
        }

        const cliente = { nome, data, tipo, valorPlano };

        if (editIndex === '') {
            clientes.push(cliente);
            mostrarToast('Cliente adicionado com sucesso!');
        } else {
            clientes[editIndex] = cliente;
            mostrarToast('Cliente atualizado com sucesso!');
        }

        salvarClientes();
        updateUI(); // Atualiza a UI (que agora respeita a busca)
        resetarFormulario();
    });

    clientListDiv.addEventListener('click', (e) => {
        const actionButton = e.target.closest('.action-btn');
        if (!actionButton) return;

        const action = actionButton.dataset.action;
        const index = actionButton.dataset.index; // Este é o índice original

        if (action === 'edit') {
            prepararEdicao(index);
        } else if (action === 'delete') {
            if (confirm(`Tem certeza que deseja excluir "${clientes[index].nome}"?`)) {
                clientes.splice(index, 1);
                salvarClientes();
                updateUI(); // Atualiza a UI (que agora respeita a busca)
                mostrarToast('Cliente excluído.');
                if (editIndexInput.value === index) {
                    resetarFormulario();
                }
            }
        }
    });
    
    // NOVO: Event listener para a barra de busca
    searchInput.addEventListener('input', (e) => {
        renderizarClientes(e.target.value);
    });
    
    btnCancel.addEventListener('click', resetarFormulario);
    btnExportar.addEventListener('click', exportarClientes);
    fileImportar.addEventListener('change', importarClientes);

    // --- INICIALIZAÇÃO ---
    updateUI(); // Renderiza tudo pela primeira vez
});
