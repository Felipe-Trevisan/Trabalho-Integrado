
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
    const tabBtns = document.querySelectorAll('.tab-btn');
    const peiModal = document.getElementById('peiModal');
    const responseModal = document.getElementById('responseModal');
    const closeModal = document.querySelector('.close');
    const closeResponseModal = document.querySelector('#responseModal .close');
    const cancelResponseBtn = document.getElementById('cancelResponse');
    const responseForm = document.getElementById('responseForm');
    
    
    let peisAdaptacao = [];
    let peisGeral = [];
    let students = [];
    let courses = [];
    let subjects = [];
    let matriculas = [];
    let necessidades = [];
    let estudantesNecessidades = [];

    userWelcome.textContent = `Bem-vindo, Professor ${currentUser.username || currentUser.name || 'Professor'}`;

    
    const peiViewContainer = document.getElementById('peiViewContainer');
    const peiDetails = document.getElementById('peiDetails');
    
    
    if (peiDetails) {
        peiDetails.style.display = 'none';
    }

    
    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>"']/g, function(match) {
            const entities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return entities[match] || match;
        });
    }

    function formatMultiline(value) {
        const safe = escapeHtml(value || '');
        return safe.replace(/\r\n|\r|\n/g, '<br>');
    }

    function formatDateTime(value) {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function getStudentNeeds(student) {
        if (!student || !student.cpf) return '';
        const cpf = student.cpf.replace(/\D/g, '');
        const relacoes = Array.isArray(estudantesNecessidades)
            ? estudantesNecessidades.filter(en => {
                const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                return cpfRelacao === cpf;
            })
            : [];
        if (!relacoes.length) return '';
        const nomes = relacoes.map(relacao => {
            const necessidade = necessidades.find(n => n.id === relacao.necessidade_id);
            return necessidade ? necessidade.nome : null;
        }).filter(Boolean);
        return nomes.join(', ');
    }

    function buildStatusChip(status) {
        const statusMap = {
            'rascunho': { text: 'Rascunho', className: 'chip-info' },
            'enviado_para_napne': { text: 'Enviado para NAPNE', className: 'chip-warning' },
            'em_avaliacao': { text: 'Em Avaliação', className: 'chip-warning' },
            'aprovado': { text: 'Aprovado', className: 'chip-success' },
            'rejeitado': { text: 'Rejeitado', className: 'chip-danger' },
            'pendente': { text: 'Sem adaptação', className: 'chip-neutral' }
        };
        return statusMap[status] || statusMap['pendente'];
    }

    function resetPeiView() {
        if (peiViewContainer) {
            peiViewContainer.innerHTML = '';
            peiViewContainer.style.display = 'none';
        }
        
        if (peiDetails) {
            peiDetails.style.display = 'none';
        }
    }

    function renderPeiView(config) {
        if (!peiViewContainer) return;
        
        
        if (peiDetails) {
            peiDetails.style.display = 'none';
        }
        const {
            title,
            subtitle,
            updatedAt,
            statusChip,
            basicInfo = [],
            sections = []
        } = config || {};

        const infoHtml = basicInfo
            .filter(item => item && item.label)
            .map(item => {
                const value = item.value && String(item.value).trim() !== '' ? formatMultiline(item.value) : '<span class="pei-view__placeholder">—</span>';
                return `
                    <div class="pei-view__info">
                        <span class="pei-view__label">${escapeHtml(item.label)}</span>
                        <span class="pei-view__value">${value}</span>
                    </div>
                `;
            })
            .join('');

        const sectionsHtml = sections.map(section => {
            const items = (section.items || []).filter(item => item && item.value && String(item.value).trim() !== '');
            let content = '';
            if (items.length > 0) {
                content = items.map(item => `
                    <div class="pei-view__card ${item.highlight ? 'pei-view__card--highlight' : ''}">
                        <span class="pei-view__card-label">${escapeHtml(item.label)}</span>
                        <p class="pei-view__card-value">${formatMultiline(item.value)}</p>
                    </div>
                `).join('');
            } else if (section.emptyMessage) {
                content = `<p class="pei-view__empty">${escapeHtml(section.emptyMessage)}</p>`;
            }
            return `
                <section class="pei-view__section">
                    <h3>${escapeHtml(section.title || '')}</h3>
                    ${content}
                </section>
            `;
        }).join('');

        const statusHtml = statusChip ? `
            <div class="pei-view__meta">
                <span class="pei-view__chip ${escapeHtml(statusChip.className || '')}">${escapeHtml(statusChip.text || '')}</span>
                ${updatedAt ? `<span class="pei-view__date">${escapeHtml(updatedAt)}</span>` : ''}
            </div>
        ` : (updatedAt ? `<div class="pei-view__meta"><span class="pei-view__date">${escapeHtml(updatedAt)}</span></div>` : '');

        peiViewContainer.innerHTML = `
            <div class="pei-view">
                <div class="pei-view__header">
                    <div>
                        <h2>${escapeHtml(title || 'Plano Educacional Individualizado')}</h2>
                        ${subtitle ? `<p class="pei-view__subtitle">${escapeHtml(subtitle)}</p>` : ''}
                    </div>
                    ${statusHtml}
                </div>
                ${basicInfo.length ? `
                    <section class="pei-view__section">
                        <h3>Informações Básicas</h3>
                        <div class="pei-view__grid">
                            ${infoHtml}
                        </div>
                    </section>
                ` : ''}
                ${sectionsHtml}
            </div>
        `;

        
        if (peiDetails) {
            peiDetails.style.display = 'none';
        }
        if (peiViewContainer) {
            peiViewContainer.style.display = 'block';
        }
    }

    function createPeiViewConfig({ peiGeral, peiAdaptacao, student, course, subject, historico }) {
        const subjectName = subject ? (subject.componente || subject.name || '') : '';
        const subjectEmenta = subject ? (subject.ementa || subject.description || '') : '';
        const necessidadeNome = peiGeral?.necessidade_especifica || (student ? getStudentNeeds(student) : '');
        const updatedAt = formatDateTime(peiAdaptacao?.data_atualizacao || peiGeral?.data_atualizacao);
        const statusChip = buildStatusChip(peiAdaptacao ? peiAdaptacao.status : 'pendente');

        const basicInfo = [
            { label: 'Estudante', value: student ? student.nome : 'N/A' },
            { label: 'Curso', value: course ? (course.name || course.nome) : 'N/A' },
            { label: 'Componente Curricular', value: subjectName || 'Não definido' },
            { label: 'Ano/Semestre', value: peiGeral?.periodo || 'N/A' },
            { label: 'Necessidade Específica', value: necessidadeNome || 'Não informado' },
            { label: 'Status do PEI', value: statusChip.text }
        ];

        const generalItems = [];
        if (subjectEmenta) {
            generalItems.push({ label: 'Ementa do Componente Curricular', value: subjectEmenta });
        }
        
        if (historico && historico.trim()) {
            generalItems.push({ label: 'Histórico do Aluno', value: historico, highlight: true });
        }
        generalItems.push(
            { label: 'Objetivo Geral', value: peiGeral?.objetivo_geral },
            { label: 'Conteúdos', value: peiGeral?.conteudos },
            { label: 'Parecer do NAPNE', value: peiGeral?.parecer },
            { label: 'Dificuldades', value: peiGeral?.dificuldades },
            { label: 'Interesses e Habilidades', value: peiGeral?.interesses_habilidades },
            { label: 'Estratégias', value: peiGeral?.estrategias },
            { label: 'Observações', value: peiGeral?.observacoes }
        );

        const sections = [
            {
                title: 'PEI Geral (NAPNE)',
                items: generalItems
            }
        ];

        if (peiAdaptacao) {
            const adaptItems = [
                { label: 'Objetivos Específicos', value: peiAdaptacao.objetivos_especificos },
                { label: 'Metodologia', value: peiAdaptacao.metodologia },
                { label: 'Avaliação', value: peiAdaptacao.avaliacao },
                { label: 'Parecer do Professor', value: peiAdaptacao.parecer },
                { label: 'Ementa Complementar', value: peiAdaptacao.ementa }
            ];
            sections.push({
                title: 'PEI Adaptação (Professor)',
                items: adaptItems
            });

            if (peiAdaptacao.comentarios_napne && peiAdaptacao.comentarios_napne.trim()) {
                sections.push({
                    title: 'Comentários do NAPNE',
                    items: [
                        { label: 'Registro', value: peiAdaptacao.comentarios_napne, highlight: true }
                    ]
                });
            }
        } else {
            sections.push({
                title: 'PEI Adaptação (Professor)',
                items: [],
                emptyMessage: 'Nenhum PEI de adaptação foi cadastrado pelo professor até o momento.'
            });
        }

        return {
            title: subjectName ? `PEI - ${subjectName}` : 'PEI Geral',
            subtitle: course ? `Curso: ${course.name || course.nome || ''}` : '',
            updatedAt,
            statusChip,
            basicInfo,
            sections
        };
    }

    
    initPage();

    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            closeModalWindow();
        });
    }

    if (closeResponseModal) {
        closeResponseModal.addEventListener('click', function() {
            closeModalWindow();
        });
    }

    if (cancelResponseBtn) {
        cancelResponseBtn.addEventListener('click', function() {
            closeModalWindow();
        });
    }

    
    window.addEventListener('click', function(event) {
        if (event.target === peiModal) {
            closeModalWindow();
        }
        if (event.target === responseModal) {
            closeModalWindow();
        }
    });

    
    if (responseForm) {
        responseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveResponse();
        });
    }

    
    async function initPage() {
        await loadData();
        loadPeis();
        
        
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const id = urlParams.get('id');
        
        if (action && id) {
            if (action === 'view') {
                viewPei(id);
            } else if (action === 'respond') {
                respondToPei(id);
            }
        }
    }

    
    async function loadData() {
        try {
            
            const professorSiape = currentUser.siape || currentUser.siape;
            
            
            const results = await Promise.allSettled([
                professorSiape ? API_CONFIG.get(`peis?professor=${professorSiape}`) : API_CONFIG.get('peis'),
                API_CONFIG.get('adaptacoes'),
                API_CONFIG.get('estudantes'),
                API_CONFIG.get('cursos'),
                API_CONFIG.get('componentes'),
                API_CONFIG.get('matriculas'),
                API_CONFIG.get('necessidades'),
                API_CONFIG.get('estudantes-necessidades')
            ]);
            
            
            peisGeral = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
            peisAdaptacao = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
            students = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
            courses = results[3].status === 'fulfilled' ? (results[3].value || []) : [];
            subjects = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
            matriculas = results[5].status === 'fulfilled' ? (results[5].value || []) : [];
            necessidades = results[6].status === 'fulfilled'
                ? (results[6].value || []).map(n => ({
                    id: n.necessidade_id || n.id,
                    nome: n.nome || n.descricao || ''
                }))
                : [];
            estudantesNecessidades = results[7].status === 'fulfilled' ? (results[7].value || []) : [];
            
            
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const endpoints = ['peis', 'adaptacoes', 'estudantes', 'cursos', 'componentes', 'matriculas', 'necessidades', 'estudantes-necessidades'];
                }
            });
        } catch (error) {
            
            peisGeral = [];
            peisAdaptacao = [];
            students = [];
            courses = [];
            subjects = [];
            matriculas = [];
            necessidades = [];
            estudantesNecessidades = [];
        }
    }

    
    function loadPeis() {
        const pendingTableBody = document.getElementById('pending-table-body');
        const respondedTableBody = document.getElementById('responded-table-body');
        
        if (!pendingTableBody || !respondedTableBody) return;
        
        
        pendingTableBody.innerHTML = '';
        respondedTableBody.innerHTML = '';
        
        
        
        const peisCompletos = peisGeral.map(pg => {
            const matricula = matriculas.find(m => m.matricula === pg.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const peiAdaptacao = peisAdaptacao.find(pa => pa.pei_geral_id === pg.id);
            const subjectFromGeral = pg && pg.codigo_componente ? subjects.find(s => s.codigo_componente === pg.codigo_componente) : null;
            const subject = peiAdaptacao
                ? subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente)
                : subjectFromGeral;
            const necessidadeDescricao = pg.necessidade_especifica || (student ? getStudentNeeds(student) : '');
            
            return {
                id: pg.id,
                pei_adaptacao_id: peiAdaptacao ? peiAdaptacao.id : null,
                studentName: student ? student.nome : 'N/A',
                course: course ? course.nome : 'N/A',
                subject: subject ? subject.componente : 'Não definido',
                subjectId: subject ? subject.codigo_componente : null,
                yearSemester: pg.periodo || 'N/A',
                necessidade_especifica: necessidadeDescricao || 'N/A',
                
                objetivo_geral: pg.objetivo_geral || '',
                conteudos: pg.conteudos || '',
                parecer_napne: pg.parecer || '',
                
                objetivos_especificos: peiAdaptacao ? peiAdaptacao.objetivos_especificos : '',
                metodologia: peiAdaptacao ? peiAdaptacao.metodologia : '',
                avaliacao: peiAdaptacao ? peiAdaptacao.avaliacao : '',
                parecer_professor: peiAdaptacao ? peiAdaptacao.parecer : '',
                status: peiAdaptacao ? peiAdaptacao.status : 'pendente',
                tem_adaptacao: !!peiAdaptacao
            };
        });
        
        
        const pendingPeis = peisCompletos.filter(pei => !pei.tem_adaptacao);
        const respondedPeis = peisCompletos.filter(pei => pei.tem_adaptacao);
        
        
        if (pendingPeis.length === 0) {
            pendingTableBody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum PEI pendente.</td></tr>';
        } else {
            pendingPeis.forEach(pei => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pei.studentName}</td>
                    <td>${pei.course}</td>
                    <td>${pei.subject}</td>
                    <td>${pei.yearSemester}</td>
                    <td>${pei.necessidade_especifica}</td>
                    <td><span class="status-badge status-pending">Pendente</span></td>
                    <td>
                        <button class="btn btn-view" onclick="viewPei(${pei.id})">Ver PEI Geral</button>
                        <button class="btn btn-respond" onclick="respondToPei(${pei.id})">Criar Adaptação</button>
                    </td>
                `;
                pendingTableBody.appendChild(row);
            });
        }
        
        
        if (respondedPeis.length === 0) {
            respondedTableBody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum PEI respondido.</td></tr>';
        } else {
            respondedPeis.forEach(pei => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pei.studentName}</td>
                    <td>${pei.course}</td>
                    <td>${pei.subject}</td>
                    <td>${pei.yearSemester}</td>
                    <td>${pei.necessidade_especifica}</td>
                    <td><span class="status-badge status-${pei.status}">${getStatusText(pei.status)}</span></td>
                    <td>
                        <button class="btn btn-view" onclick="viewPei(${pei.id}, ${pei.pei_adaptacao_id})">Ver</button>
                        <button class="btn btn-edit" onclick="respondToPei(${pei.id})">Editar</button>
                    </td>
                `;
                respondedTableBody.appendChild(row);
            });
        }
    }
    
    
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'in_progress': 'Em Andamento',
            'completed': 'Concluído',
            'rejected': 'Rejeitado'
        };
        return statusMap[status] || 'Pendente';
    }
    
    
    window.viewPei = async function(peiGeralId, peiAdaptacaoId = null) {
        const peiGeral = peisGeral.find(pg => pg.id == peiGeralId);
        
        if (peiGeral) {
            const peiAdaptacao = peiAdaptacaoId ? peisAdaptacao.find(p => p.id == peiAdaptacaoId) : null;
            const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const subject = peiAdaptacao
                ? subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente)
                : (peiGeral && peiGeral.codigo_componente ? subjects.find(s => s.codigo_componente === peiGeral.codigo_componente) : null);
            
            
            let historico = '';
            if (student && student.id_aluno) {
                try {
                    const alunoResponse = await API_CONFIG.get(`estudantes/${student.id_aluno}`);
                    if (alunoResponse && alunoResponse.historico) {
                        historico = alunoResponse.historico;
                    }
                } catch (error) {
                }
            }
            
            
            resetPeiView();
            
            
            const viewConfig = createPeiViewConfig({
                peiGeral,
                peiAdaptacao,
                student,
                course,
                subject,
                historico
            });
            
            
            renderPeiView(viewConfig);
            
            
            if (document.getElementById('modalTitle')) {
                document.getElementById('modalTitle').textContent = viewConfig.title;
            }
            
            
            const generatePdfBtn = document.getElementById('generatePdf');
            if (generatePdfBtn) {
                generatePdfBtn.style.display = 'inline-block';
                
                generatePdfBtn.setAttribute('data-pei-geral-id', peiGeralId);
                generatePdfBtn.setAttribute('data-pei-adaptacao-id', peiAdaptacaoId || '');
            }
            
            
            if (peiModal) {
                peiModal.style.display = 'block';
            }
        }
    };
    
    
    window.respondToPei = function(peiGeralId) {
        const peiGeral = peisGeral.find(pg => pg.id == peiGeralId);
        
        if (peiGeral) {
            const matricula = matriculas.find(m => m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            
            if (document.getElementById('responseModalTitle')) {
                document.getElementById('responseModalTitle').textContent = `Criar PEI Adaptação - ${student ? student.nome : 'N/A'}`;
            }
            if (document.getElementById('responsePeiId')) {
                document.getElementById('responsePeiId').value = peiGeralId; 
            }
            
            
            if (document.getElementById('response-student')) {
                document.getElementById('response-student').textContent = student ? student.nome : 'N/A';
            }
            if (document.getElementById('response-course')) {
                document.getElementById('response-course').textContent = course ? course.nome : 'N/A';
            }
            
            const subjectSelect = document.getElementById('response-subject-select');
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">Selecione a matéria</option>';
                subjects.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.codigo_componente || s.id;
                    option.textContent = s.componente || s.name || '';
                    option.dataset.ementa = s.ementa || '';
                    subjectSelect.appendChild(option);
                });
                
                
                subjectSelect.onchange = function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const ementaField = document.getElementById('ementa-response');
                    if (ementaField && selectedOption.dataset.ementa) {
                        ementaField.value = selectedOption.dataset.ementa;
                    }
                };

                const subjectFromGeral = peiGeral && peiGeral.codigo_componente
                    ? subjects.find(s => s.codigo_componente === peiGeral.codigo_componente)
                    : null;
                if (subjectFromGeral) {
                    subjectSelect.value = subjectFromGeral.codigo_componente;
                    subjectSelect.disabled = true;
                    subjectSelect.classList.add('select-locked');
                    subjectSelect.title = 'Componente curricular definido pelo NAPNE';
                    subjectSelect.dispatchEvent(new Event('change'));
                    const ementaField = document.getElementById('ementa-response');
                    if (ementaField) {
                        ementaField.value = subjectFromGeral.ementa || subjectFromGeral.description || '';
                    }
                } else {
                    subjectSelect.disabled = false;
                    subjectSelect.classList.remove('select-locked');
                    subjectSelect.title = '';
                }
            }
            
            
            if (document.getElementById('specificObjectives')) {
                document.getElementById('specificObjectives').value = '';
            }
            if (document.getElementById('methodology')) {
                document.getElementById('methodology').value = '';
            }
            if (document.getElementById('evaluation')) {
                document.getElementById('evaluation').value = '';
            }
            if (document.getElementById('parecer')) {
                document.getElementById('parecer').value = '';
            }
            
            
            if (responseModal) {
                responseModal.style.display = 'block';
            }
        }
    };
    
    
    async function saveResponse() {
        const peiGeralId = document.getElementById('responsePeiId')?.value;
        const codigoComponente = document.getElementById('response-subject-select')?.value;
        const ementa = document.getElementById('ementa-response')?.value || '';
        const objetivosEspecificos = document.getElementById('specificObjectives')?.value || '';
        const methodology = document.getElementById('methodology')?.value || '';
        const evaluation = document.getElementById('evaluation')?.value || '';
        const parecer = document.getElementById('parecer')?.value || '';
        
        if (!peiGeralId) {
            alert('Erro: ID do PEI Geral não encontrado');
            return;
        }
        
        if (!codigoComponente) {
            alert('Por favor, selecione um componente curricular');
            return;
        }
        
        try {
            
            const peiAdaptacaoExistente = peisAdaptacao.find(pa => pa.pei_geral_id == peiGeralId);
            
            const peiGeral = peisGeral.find(pg => pg.id == peiGeralId);
            if (!peiGeral) {
                alert('PEI Geral não encontrado');
                return;
            }
            
            
            const professorSiape = currentUser.siape ? parseInt(currentUser.siape) : null;
            
            if (peiAdaptacaoExistente) {
                
                const updatedData = {
                    pei_geral_id: parseInt(peiGeralId),
                    codigo_componente: parseInt(codigoComponente),
                    ementa: ementa,
                    objetivos_especificos: objetivosEspecificos,
                    metodologia: methodology,
                    avaliacao: evaluation,
                    parecer: parecer,
                    status: peiAdaptacaoExistente.status || 'rascunho'
                };
                
                if (professorSiape) {
                    updatedData.professor_siape = professorSiape;
                }
                
                await API_CONFIG.put(`adaptacoes/${peiAdaptacaoExistente.id}`, updatedData);
                alert('PEI Adaptação atualizado com sucesso!');
            } else {
                
                const newData = {
                    pei_geral_id: parseInt(peiGeralId),
                    codigo_componente: parseInt(codigoComponente),
                    ementa: ementa,
                    objetivos_especificos: objetivosEspecificos,
                    metodologia: methodology,
                    avaliacao: evaluation,
                    parecer: parecer,
                    status: 'rascunho'
                };
                
                if (professorSiape) {
                    newData.professor_siape = professorSiape;
                }
                
                await API_CONFIG.post('adaptacoes', newData);
                alert('PEI Adaptação criado com sucesso!');
            }
            
            
            if (responseModal) {
                responseModal.style.display = 'none';
            }
            await loadData();
            loadPeis();
        } catch (error) {
            alert('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
        }
    }
    
    
    function switchTab(tab) {
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        const activeContent = document.getElementById(`${tab}-content`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }
    
    
    window.editAdaptacao = async function(peiAdaptacaoId) {
        const peiAdaptacao = peisAdaptacao.find(p => p.id == peiAdaptacaoId);
        
        if (peiAdaptacao) {
            const peiGeral = peisGeral.find(pg => pg.id == peiAdaptacao.pei_geral_id);
            
            if (peiGeral) {
                const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
                const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
                const subject = subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente);
                
                
                resetPeiView();
                
                
                let historico = '';
                if (student && student.id_aluno) {
                    try {
                        const alunoResponse = await API_CONFIG.get(`estudantes/${student.id_aluno}`);
                        if (alunoResponse && alunoResponse.historico) {
                            historico = alunoResponse.historico;
                        }
                    } catch (error) {
                    }
                }
                
                
                const viewConfig = createPeiViewConfig({
                    peiGeral,
                    peiAdaptacao,
                    student,
                    course,
                    subject,
                    historico
                });
                
                renderPeiView(viewConfig);
                
                
                if (document.getElementById('modalTitle')) {
                    document.getElementById('modalTitle').textContent = viewConfig.title;
                }
                
                
                if (peiModal) {
                    peiModal.style.display = 'block';
                }
                
                
                
            }
        }
    };

    
    const generatePdfBtn = document.getElementById('generatePdf');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', async function() {
            const peiGeralId = this.getAttribute('data-pei-geral-id');
            const peiAdaptacaoId = this.getAttribute('data-pei-adaptacao-id');
            
            if (!peiGeralId) return;
            
            const peiGeral = peisGeral.find(pg => pg.id == peiGeralId);
            if (!peiGeral) return;
            
            const peiAdaptacao = peiAdaptacaoId ? peisAdaptacao.find(p => p.id == peiAdaptacaoId) : null;
            const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const subject = peiAdaptacao
                ? subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente)
                : (peiGeral && peiGeral.codigo_componente ? subjects.find(s => s.codigo_componente === peiGeral.codigo_componente) : null);
            
            
            let historicoAluno = '';
            if (student && student.id_aluno) {
                try {
                    const alunoResponse = await API_CONFIG.get(`estudantes/${student.id_aluno}`);
                    if (alunoResponse && alunoResponse.historico) {
                        historicoAluno = alunoResponse.historico;
                    }
                } catch (error) {
                }
            }
            
            
            const viewConfig = createPeiViewConfig({
                peiGeral,
                peiAdaptacao,
                student,
                course,
                subject,
                historico: historicoAluno
            });
            
            
            if (typeof html2pdf !== 'undefined') {
                const element = peiViewContainer.querySelector('.pei-view');
                if (element) {
                    const opt = {
                        margin: 1,
                        filename: `PEI_${student ? student.nome.replace(/\s+/g, '_') : 'Estudante'}_${new Date().getTime()}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            } else {
                alert('Biblioteca html2pdf não carregada. Por favor, recarregue a página.');
            }
        });
    }

    
    function closeModalWindow() {
        resetPeiView();
        const generatePdfBtn = document.getElementById('generatePdf');
        if (generatePdfBtn) {
            generatePdfBtn.style.display = 'none';
        }
        if (peiModal) {
            peiModal.style.display = 'none';
        }
        if (responseModal) {
            responseModal.style.display = 'none';
        }
    }
});
