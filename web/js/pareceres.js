document.addEventListener('DOMContentLoaded', function() {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        window.location.href = 'index.html';
        return;
    }
    
    let currentUser;
    try {
        currentUser = JSON.parse(currentUserStr);
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }
    
    if (!currentUser || !currentUser.token) {
        window.location.href = 'index.html';
        return;
    }
    
    const tipo = currentUser.tipo ? currentUser.tipo.toUpperCase() : '';
    if (tipo !== 'DOCENTE') {
        window.location.replace('dashboard.html');
        return;
    }

    const logoutBtn = document.getElementById('logout');
    const userWelcome = document.getElementById('user-welcome');
    const peiListContainer = document.getElementById('pei-list-container');
    const pareceresList = document.getElementById('pareceres-list');
    const pareceresHeader = document.getElementById('pareceres-header');
    const selectedPeiTitle = document.getElementById('selected-pei-title');
    const selectedPeiInfo = document.getElementById('selected-pei-info');
    const addParecerBtn = document.getElementById('addParecerBtn');
    const parecerModal = document.getElementById('parecerModal');
    const parecerForm = document.getElementById('parecerForm');
    const cancelParecerBtn = document.getElementById('cancelParecer');
    
    let peisAdaptacao = [];
    let peisGeral = [];
    let students = [];
    let courses = [];
    let subjects = [];
    let matriculas = [];
    let pareceres = [];
    let selectedPeiAdaptacaoId = null;
    let selectedCourse = null;

    userWelcome.textContent = `Bem-vindo, Professor ${currentUser.username || currentUser.name || 'Professor'}`;

    async function loadData() {
        try {
            const professorSiape = currentUser.siape;
            
            const results = await Promise.allSettled([
                professorSiape ? API_CONFIG.get(`peis?professor=${professorSiape}`) : API_CONFIG.get('peis'),
                API_CONFIG.get('adaptacoes'),
                API_CONFIG.get('estudantes'),
                API_CONFIG.get('cursos'),
                API_CONFIG.get('componentes'),
                API_CONFIG.get('matriculas')
            ]);
            
            peisGeral = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
            peisAdaptacao = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
            students = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
            courses = results[3].status === 'fulfilled' 
                ? (results[3].value || []).map(c => ({
                    codigo: c.codigo || c.code || '',
                    nome: c.nome || c.name || '',
                    modalidade: c.modalidade || c.level || 'Técnico'
                }))
                : [];
            subjects = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
            matriculas = results[5].status === 'fulfilled' ? (results[5].value || []) : [];
            
            loadPeiList();
        } catch (error) {
            peisAdaptacao = [];
            peisGeral = [];
            students = [];
            courses = [];
            subjects = [];
            matriculas = [];
        }
    }

    function loadPeiList() {
        if (!peiListContainer) return;
        
        const professorSiape = currentUser.siape;
        const peisDoProfessor = peisAdaptacao.filter(pa => pa.professor_siape == professorSiape);
        
        if (peisDoProfessor.length === 0) {
            peiListContainer.innerHTML = '<p class="empty-state">Você não possui PEIs Adaptativos cadastrados.</p>';
            return;
        }
        
        peiListContainer.innerHTML = '';
        
        peisDoProfessor.forEach(peiAdaptacao => {
            const peiGeral = peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id);
            const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const subject = subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente);
            
            const peiItem = document.createElement('div');
            peiItem.className = 'pei-item';
            peiItem.dataset.peiAdaptacaoId = peiAdaptacao.id;
            peiItem.innerHTML = `
                <h4>${student ? student.nome : 'N/A'}</h4>
                <p><strong>Curso:</strong> ${course ? course.nome : 'N/A'}</p>
                <p><strong>Componente:</strong> ${subject ? subject.componente : 'N/A'}</p>
                <p><strong>Período:</strong> ${peiGeral ? peiGeral.periodo : 'N/A'}</p>
            `;
            
            peiItem.addEventListener('click', () => {
                selectPei(peiAdaptacao.id, peiAdaptacao, peiGeral, student, course, subject);
                document.querySelectorAll('.pei-item').forEach(item => item.classList.remove('active'));
                peiItem.classList.add('active');
            });
            
            peiListContainer.appendChild(peiItem);
        });
    }

    async function selectPei(peiAdaptacaoId, peiAdaptacao, peiGeral, student, course, subject) {
        selectedPeiAdaptacaoId = peiAdaptacaoId;
        selectedCourse = course;
        
        if (pareceresHeader) {
            pareceresHeader.style.display = 'flex';
        }
        
        if (selectedPeiTitle) {
            selectedPeiTitle.textContent = `${student ? student.nome : 'N/A'} - ${subject ? subject.componente : 'N/A'}`;
        }
        
        if (selectedPeiInfo) {
            selectedPeiInfo.textContent = `${course ? course.nome : 'N/A'} - ${peiGeral ? peiGeral.periodo : 'N/A'}`;
        }
        
        if (addParecerBtn) {
            addParecerBtn.style.display = 'inline-block';
            addParecerBtn.onclick = () => openParecerModal(null, peiAdaptacaoId);
        }
        
        await loadPareceres(peiAdaptacaoId);
    }

    async function loadPareceres(peiAdaptacaoId) {
        try {
            const pareceresList = await API_CONFIG.get(`pareceres?pei_adaptacao=${peiAdaptacaoId}`);
            const pareceresContainer = document.getElementById('pareceres-list');
            
            if (!pareceresContainer) return;
            
            if (pareceresList && pareceresList.length > 0) {
                pareceresContainer.innerHTML = '';
                pareceresList.forEach(parecer => {
                    const parecerDiv = document.createElement('div');
                    parecerDiv.className = 'parecer-item';
                    
                    const periodo = document.createElement('h4');
                    periodo.textContent = parecer.periodo || 'Período não informado';
                    
                    const descricao = document.createElement('p');
                    descricao.textContent = parecer.descricao || 'Sem descrição';
                    
                    const data = document.createElement('small');
                    data.textContent = parecer.data_criacao ? `Data: ${new Date(parecer.data_criacao).toLocaleDateString('pt-BR')}` : '';
                    
                    const actions = document.createElement('div');
                    actions.className = 'parecer-actions';
                    
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Editar';
                    editBtn.className = 'btn btn-sm btn-primary';
                    editBtn.style.cssText = 'margin-right: 10px;';
                    editBtn.onclick = () => openParecerModal(parecer, peiAdaptacaoId);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Excluir';
                    deleteBtn.className = 'btn btn-sm btn-danger';
                    deleteBtn.onclick = () => deleteParecer(parecer.id, peiAdaptacaoId);
                    
                    actions.appendChild(editBtn);
                    actions.appendChild(deleteBtn);
                    
                    parecerDiv.appendChild(periodo);
                    parecerDiv.appendChild(descricao);
                    parecerDiv.appendChild(data);
                    parecerDiv.appendChild(actions);
                    
                    pareceresContainer.appendChild(parecerDiv);
                });
            } else {
                pareceresContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <p>Nenhum parecer cadastrado ainda para este PEI.</p>
                    </div>
                `;
            }
        } catch (error) {
            const pareceresContainer = document.getElementById('pareceres-list');
            if (pareceresContainer) {
                pareceresContainer.innerHTML = '<p class="empty-state" style="color: #d32f2f;">Erro ao carregar pareceres.</p>';
            }
        }
    }

    function openParecerModal(parecer = null, peiAdaptacaoId = null) {
        const modalTitle = document.getElementById('parecerModalTitle');
        const parecerIdInput = document.getElementById('parecerId');
        const parecerPeiAdaptacaoIdInput = document.getElementById('parecerPeiAdaptacaoId');
        const parecerPeriodo = document.getElementById('parecerPeriodo');
        const parecerDescricao = document.getElementById('parecerDescricao');
        
        if (!parecerModal) return;
        
        
        if (parecerPeriodo) {
            parecerPeriodo.innerHTML = '<option value="">Selecione o período</option>';
            
            const modalidade = selectedCourse ? (selectedCourse.modalidade || selectedCourse.level || '').toLowerCase() : '';
            
            if (modalidade === 'superior' || modalidade === 'graduação') {
                
                parecerPeriodo.innerHTML += '<option value="1">1</option>';
                parecerPeriodo.innerHTML += '<option value="2">2</option>';
            } else {
                
                parecerPeriodo.innerHTML += '<option value="1">1</option>';
                parecerPeriodo.innerHTML += '<option value="2">2</option>';
                parecerPeriodo.innerHTML += '<option value="3">3</option>';
            }
        }
        
        if (parecer) {
            if (modalTitle) modalTitle.textContent = 'Editar Parecer';
            if (parecerIdInput) parecerIdInput.value = parecer.id;
            if (parecerPeiAdaptacaoIdInput) parecerPeiAdaptacaoIdInput.value = parecer.pei_adaptacao_id || peiAdaptacaoId;
            if (parecerPeriodo) parecerPeriodo.value = parecer.periodo || '';
            if (parecerDescricao) parecerDescricao.value = parecer.descricao || '';
        } else {
            if (modalTitle) modalTitle.textContent = 'Adicionar Parecer';
            if (parecerIdInput) parecerIdInput.value = '';
            if (parecerPeiAdaptacaoIdInput) parecerPeiAdaptacaoIdInput.value = peiAdaptacaoId;
            if (parecerPeriodo) parecerPeriodo.value = '';
            if (parecerDescricao) parecerDescricao.value = '';
        }
        
        parecerModal.style.display = 'block';
    }

    async function saveParecer() {
        const parecerId = document.getElementById('parecerId')?.value;
        const peiAdaptacaoId = document.getElementById('parecerPeiAdaptacaoId')?.value;
        const periodo = document.getElementById('parecerPeriodo')?.value;
        const descricao = document.getElementById('parecerDescricao')?.value;
        
        if (!peiAdaptacaoId || !periodo || !descricao) {
            return;
        }
        
        try {
            const parecerData = {
                pei_adaptacao_id: parseInt(peiAdaptacaoId),
                professor_siape: currentUser.siape,
                periodo: periodo,
                descricao: descricao
            };
            
            if (parecerId) {
                await API_CONFIG.put(`pareceres/${parecerId}`, parecerData);
            } else {
                await API_CONFIG.post('pareceres', parecerData);
            }
            
            await loadPareceres(peiAdaptacaoId);
            
            if (parecerModal) {
                parecerModal.style.display = 'none';
            }
        } catch (error) {
        }
    }

    async function deleteParecer(parecerId, peiAdaptacaoId) {
        try {
            await API_CONFIG.delete(`pareceres/${parecerId}`);
            await loadPareceres(peiAdaptacaoId);
        } catch (error) {
        }
    }

    if (parecerForm) {
        parecerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveParecer();
        });
    }

    if (cancelParecerBtn) {
        cancelParecerBtn.addEventListener('click', () => {
            if (parecerModal) {
                parecerModal.style.display = 'none';
            }
        });
    }

    if (parecerModal) {
        const parecerModalClose = parecerModal.querySelector('.close');
        if (parecerModalClose) {
            parecerModalClose.addEventListener('click', () => {
                parecerModal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === parecerModal) {
                parecerModal.style.display = 'none';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    loadData();
});

