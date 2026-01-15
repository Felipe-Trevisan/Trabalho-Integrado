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
    const isNapne = tipo === 'NAPNE';
    const isCae = tipo === 'CAE';
    const isDocente = tipo === 'DOCENTE';

    if (!isDocente && !isNapne && !isCae) {
        alert('Apenas usuários autorizados podem acessar a gestão de PEIs.');
        window.location.href = 'dashboard.html';
        return;
    }

    const logoutBtn = document.getElementById('logout');
    const newPeiBtn = document.getElementById('newPeiBtn');
    const applyFiltersBtn = null;
    const clearFiltersBtn = null;
    const peiModal = document.getElementById('peiModal');
    const closeModal = document.querySelector('.close');
    const cancelPeiBtn = document.getElementById('cancelPei');
    const peiForm = document.getElementById('peiForm');
    const peiViewContainer = document.getElementById('peiViewContainer');
    const generatePdfBtn = document.getElementById('generatePdf');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const specificNeedFilter = null;
    const courseFilter = null;
    const studentNameSelect = document.getElementById('studentName');
    const studentCourseSelect = document.getElementById('studentCourse');
    const teacherInput = document.getElementById('teacher');
    
    
    function resetPeiView() {
        if (peiViewContainer) {
            peiViewContainer.innerHTML = '';
            peiViewContainer.style.display = 'none';
        }
        if (peiForm) {
            peiForm.style.display = 'block';
        }
        if (generatePdfBtn) {
            generatePdfBtn.style.display = 'none';
            generatePdfBtn.removeAttribute('data-pei-geral-id');
            generatePdfBtn.removeAttribute('data-pei-adaptacao-id');
        }
        const subjectSelect = document.getElementById('subject');
        if (subjectSelect) {
            subjectSelect.disabled = false;
            subjectSelect.classList.remove('select-locked');
            subjectSelect.removeAttribute('title');
        }
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

    function getNecessidadeDoEstudante(estudante) {
        if (!estudante || !estudante.cpf) return '';
        const cpfEstudante = estudante.cpf.replace(/\D/g, '');
        const relacoes = Array.isArray(estudantesNecessidades)
            ? estudantesNecessidades.filter(en => {
                const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                return cpfRelacao === cpfEstudante;
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

    function renderPeiView(config) {
        if (!peiViewContainer || !peiForm) return;
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

        peiForm.style.display = 'none';
        peiViewContainer.style.display = 'block';
    }

    function createPeiViewConfig({ peiGeral, peiAdaptacao, student, course, subject, professor }) {
        const subjectName = subject ? (subject.componente || subject.name || '') : '';
        const subjectEmenta = subject ? (subject.ementa || subject.description || '') : '';
        const necessidadesAluno = getNecessidadeDoEstudante(student);
        const necessidadeNome = peiGeral?.necessidade_especifica || necessidadesAluno;
        const professorNome = professor ? (professor.nome || professor.name || professor.docente || '') : '';
        const updatedAt = formatDateTime(peiAdaptacao?.data_atualizacao || peiGeral?.data_atualizacao);
        const statusChip = buildStatusChip(peiAdaptacao ? peiAdaptacao.status : 'pendente');

        const basicInfo = [
            { label: 'Estudante', value: student ? student.nome : 'N/A' },
            { label: 'Curso', value: course ? (course.name || course.nome) : 'N/A' },
            { label: 'Componente Curricular', value: subjectName || 'Não definido' },
            { label: 'Professor Responsável', value: professorNome || 'N/A' },
            { label: 'Ano/Semestre', value: peiGeral?.periodo || 'N/A' },
            { label: 'Necessidade Específica', value: necessidadeNome || 'Não informado' },
            { label: 'Status do PEI', value: statusChip.text }
        ];

        const generalItems = [];
        if (subjectEmenta) {
            generalItems.push({ label: 'Ementa do Componente Curricular', value: subjectEmenta });
        }
        generalItems.push(
            { label: 'Objetivo Geral', value: peiGeral?.objetivo_geral },
            { label: 'Conteúdos', value: peiGeral?.conteudos },
            { label: 'Parecer do NAPNE', value: peiGeral?.parecer },
            { label: 'Dificuldades', value: peiGeral?.dificuldades },
            { label: 'Interesses e Habilidades', value: peiGeral?.interesses_habilidades },
            { label: 'Estratégias', value: peiGeral?.estrategias },
            { label: 'Observações', value: peiGeral?.observacoes },
            { label: 'Precisa de Monitor', value: (peiGeral?.precisa_monitor === 1 || peiGeral?.precisa_monitor === true) ? 'Sim' : 'Não' }
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

    
    let peisGeral = [];
    let peisAdaptacao = [];
    let students = [];
    let courses = [];
    let teachers = [];
    let subjects = [];
    let matriculas = [];
    let necessidades = [];
    let estudantesNecessidades = [];
    let servidores = []; 
    
    
    
    
    initPage();
    
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    
    if (isCae && newPeiBtn) {
        newPeiBtn.style.display = 'none';
    } else {
        newPeiBtn.addEventListener('click', function() {
            if (isCae) {
                alert('Usuários CAE possuem acesso somente para visualização.');
                return;
            }
            window.openModalGeral(); 
        });
    }
    
    
    closeModal.addEventListener('click', function() {
        closeModalWindow();
    });
    
    cancelPeiBtn.addEventListener('click', function() {
        closeModalWindow();
    });
    
    
    window.addEventListener('click', function(event) {
        if (event.target === peiModal) {
            closeModalWindow();
        }
    });
    
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    
    
    
    const searchInput = document.getElementById('searchPei');
    const clearSearchBtn = document.getElementById('clearSearchPei');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPeisBySearch(this.value);
            if (this.value.trim() !== '') {
                if (clearSearchBtn) clearSearchBtn.style.display = 'inline-block';
            } else {
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                
                loadPeis();
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                filterPeisBySearch('');
            }
            clearSearchBtn.style.display = 'none';
            applyFilters();
        });
    }
    
    
    let currentSearchTerm = '';
    
    function filterPeisBySearch(searchTerm) {
        currentSearchTerm = searchTerm.toLowerCase().trim();
        loadPeis(); 
    }
    
    
    generatePdfBtn.addEventListener('click', function() {
        generatePdf();
    });
    
    
    studentNameSelect.addEventListener('change', function() {
        updateStudentInfo(this.value); 
    });

    
    const subjectSelect = document.getElementById('subject');
    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.description) {
                const ementaValue = selectedOption.dataset.description;
                
                const ementaAdaptacao = document.getElementById('ementaAdaptacao');
                if (ementaAdaptacao) {
                    ementaAdaptacao.value = ementaValue;
                }
                
                const ementaTextarea = document.getElementById('ementa');
                if (ementaTextarea) {
                    ementaTextarea.value = ementaValue;
                }
            }
        });
    }

    
    peiForm.addEventListener('submit', function(e) {
        e.preventDefault();
        savePei();
    });
    
    
    const napneCommentModal = document.getElementById('napneCommentModal');
    const napneCommentForm = document.getElementById('napneCommentForm');
    const cancelCommentBtn = document.getElementById('cancelComment');
    const closeNapneCommentModal = napneCommentModal ? napneCommentModal.querySelector('.close') : null;
    
    if (napneCommentForm) {
        napneCommentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNapneComment();
        });
    }
    
    if (cancelCommentBtn) {
        cancelCommentBtn.addEventListener('click', function() {
            if (napneCommentModal) {
                napneCommentModal.style.display = 'none';
            }
        });
    }
    
    if (closeNapneCommentModal) {
        closeNapneCommentModal.addEventListener('click', function() {
            if (napneCommentModal) {
                napneCommentModal.style.display = 'none';
            }
        });
    }
    
    if (napneCommentModal) {
        window.addEventListener('click', function(event) {
            if (event.target === napneCommentModal) {
                napneCommentModal.style.display = 'none';
            }
        });
    }
    
    
    async function initPage() {
        await loadData();
        
        
        populateCourseOptions();

        
        populateStudentOptions();

        
        populateTeacherOptions();

        
        populateSubjectOptions();

        
        loadPeis();

        
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const id = urlParams.get('id');

        if (action && id) {
            if (action === 'edit') {
                openModal(id);
            } else if (action === 'view') {
                viewPei(id);
            }
        }
    }

    
    async function loadData() {
        try {
            [students, courses, subjects, servidores, peisGeral, peisAdaptacao, matriculas, necessidadesData, estudantesNecessidadesData] = await Promise.all([
                API_CONFIG.get('estudantes'),
                API_CONFIG.get('cursos'),
                API_CONFIG.get('componentes'),
                API_CONFIG.get('servidores'),
                API_CONFIG.get('peis'),
                API_CONFIG.get('adaptacoes'),
                API_CONFIG.get('matriculas'),
                API_CONFIG.get('necessidades'),
                API_CONFIG.get('estudantes-necessidades')
            ]);
            
            
            necessidades = Array.isArray(necessidadesData) ? necessidadesData.map(n => ({
                id: n.necessidade_id || n.id,
                nome: n.nome || n.name || '',
                descricao: n.descricao || n.description || ''
            })) : [];
            
            estudantesNecessidades = Array.isArray(estudantesNecessidadesData) ? estudantesNecessidadesData : [];

            
            servidores = Array.isArray(servidores) ? servidores : [];

            
            teachers = servidores.filter(s => s.tipo === 'Docente').map(t => ({
                id: t.siape,
                name: t.nome,
                email: t.email,
                tipo: t.tipo
            }));

            
            courses = courses.map(c => ({
                codigo: c.codigo,
                id: c.codigo,
                nome: c.nome,
                name: c.nome,
                modalidade: c.modalidade,
                level: c.modalidade || 'Técnico'
            }));

            
            subjects = subjects.map(s => ({
                codigo_componente: s.codigo_componente,
                id: s.codigo_componente,
                componente: s.componente,
                name: s.componente,
                carga_horaria: s.carga_horaria,
                cargaHoraria: s.carga_horaria,
                ementa: s.ementa || s.description || '',
                description: s.ementa || s.description || ''
            }));
        } catch (error) {
            let errorMessage = 'Erro ao carregar dados do servidor';
            
            
            if (error instanceof SyntaxError) {
                errorMessage = 'Erro ao processar resposta do servidor. Verifique a conexão.';
                
            } else if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }
            
            students = [];
            courses = [];
            teachers = [];
            subjects = [];
            peisGeral = [];
            peisAdaptacao = [];
            matriculas = [];
            necessidades = [];
            estudantesNecessidades = [];
        }
    }
    
    
    function populateCourseOptions() {
        if (!studentCourseSelect) return;

        
        studentCourseSelect.innerHTML = '<option value="">Selecione o curso</option>';

        
        courses.forEach(course => {
            const courseId = course.id;
            const courseName = course.name;
            studentCourseSelect.innerHTML += `<option value="${courseId}">${courseName}</option>`;
        });
    }
    
    
    function populateStudentOptions() {
        if (!studentNameSelect) return;
        
        studentNameSelect.innerHTML = '<option value="">Selecione o estudante</option>';

        
        students.forEach(student => {
            
            const matricula = matriculas.find(m => m.estudante_id === student.id_aluno);
            const course = courses.find(c => matricula && c.id === matricula.curso_id);
            const courseName = course ? course.name : 'Curso não informado';
            
            studentNameSelect.innerHTML += `<option value="${student.nome}" data-matricula="${matricula ? matricula.matricula : ''}" data-course-id="${course ? course.id : ''}" data-course="${courseName}" data-student-id="${student.id_aluno || student.id}">${student.nome}</option>`;
        });
    }

    
    function populateTeacherOptions() {
        const teacherSelect = document.getElementById('teacher');
        const professorSelect = document.getElementById('professorSelect');
        
        
        if (professorSelect) {
            professorSelect.innerHTML = '<option value="">Selecione o professor</option>';
            servidores.forEach(servidor => {
                if (servidor.tipo === 'Docente') {
                    const option = document.createElement('option');
                    option.value = servidor.siape;
                    option.textContent = `${servidor.nome} (SIAPE: ${servidor.siape})`;
                    professorSelect.appendChild(option);
                }
            });
        }
        
        
        if (teacherSelect) {
            teacherSelect.innerHTML = '<option value="">Selecione o docente</option>';
            servidores.forEach(servidor => {
                if (servidor.tipo === 'Docente') {
                    const option = document.createElement('option');
                    option.value = servidor.nome;
                    option.textContent = servidor.nome;
                    teacherSelect.appendChild(option);
                }
            });
        }
    }

    
    function populateSubjectOptions() {
        const subjectSelect = document.getElementById('subject');
        const ementaTextarea = document.getElementById('ementa');
        
        if (!subjectSelect) return;
        
        subjectSelect.innerHTML = '<option value="">Selecione a matéria</option>';
        ementaTextarea.value = ''; 

        
        if (Array.isArray(subjects) && subjects.length > 0) {
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.codigo_componente || subject.id;
                option.textContent = subject.componente || subject.name || '';
                
                option.dataset.description = subject.ementa || subject.description || '';
                subjectSelect.appendChild(option);
            });
        }
    }
    
    
    async function updateStudentInfo(studentName) {
        const selectedOption = studentNameSelect.options[studentNameSelect.selectedIndex];
        if (selectedOption && studentName) {
            const courseId = selectedOption.dataset.courseId;
            const courseName = selectedOption.dataset.course;
            const studentId = selectedOption.dataset.studentId;

            
            if (courseId) {
            studentCourseSelect.value = courseId;
            }

            
            populateSubjectOptions();

            
            const student = students.find(s => s.nome === studentName || s.name === studentName);
            if (student && student.cpf) {
                const cpfEstudante = student.cpf.replace(/\D/g, '');
                
                
                const relacaoNecessidade = Array.isArray(estudantesNecessidades)
                    ? estudantesNecessidades.find(en => {
                        const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                        return cpfRelacao === cpfEstudante;
                    })
                    : null;
                
                if (relacaoNecessidade) {
                    const necessidade = necessidades.find(n => n.id === relacaoNecessidade.necessidade_id);
                    const specificNeedSelect = document.getElementById('specificNeed');
                    if (specificNeedSelect && necessidade) {
                        
                        specificNeedSelect.innerHTML = '<option value="">Nenhuma necessidade</option>';
                        necessidades.forEach(need => {
                            const option = document.createElement('option');
                            option.value = need.id;
                            option.textContent = need.nome;
                            if (need.id === necessidade.id) {
                                option.selected = true;
                            }
                            specificNeedSelect.appendChild(option);
                        });
                    }
                } else {
                    
        const specificNeedSelect = document.getElementById('specificNeed');
                    if (specificNeedSelect) {
                        specificNeedSelect.innerHTML = '<option value="">Nenhuma necessidade cadastrada</option>';
                        necessidades.forEach(need => {
                            const option = document.createElement('option');
                            option.value = need.id;
                            option.textContent = need.nome;
                            specificNeedSelect.appendChild(option);
            });
        }
    }
            }
            
            
            if (studentId || (student && student.id_aluno)) {
                const alunoId = studentId || student.id_aluno;
                try {
                    const response = await API_CONFIG.get(`estudantes/${alunoId}`);
                    if (response && response.historico) {
                        const historicoField = document.getElementById('historico');
                        if (historicoField) {
                            historicoField.value = response.historico || '';
                        }
                    }
                } catch (error) {
                    const historicoField = document.getElementById('historico');
                    if (historicoField) {
                        historicoField.value = '';
                    }
                }
            }
        }
    }
    
    
    
    
    function loadPeis() {
        const peiGeralTableBody = document.getElementById('pei-geral-table-body');
        const peiAdaptacaoTableBody = document.getElementById('pei-adaptacao-table-body');
        const searchTerm = currentSearchTerm || '';
        
        
        if (peiGeralTableBody) {
            peiGeralTableBody.innerHTML = '';
            
            let peisGeralToShow = peisGeral;
            
            
            if (searchTerm) {
                peisGeralToShow = peisGeral.filter(peiGeral => {
                    const matricula = matriculas.find(m => m.matricula === peiGeral.matricula);
                    const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                    const course = courses.find(c => matricula && c.id === matricula.curso_id);
                    const subject = subjects.find(s => (s.codigo_componente || s.id) == peiGeral.codigo_componente);
                    const professor = servidores.find(s => s.siape === peiGeral.professor_siape);
                    
                    const studentMatch = (student ? student.nome : '').toLowerCase().includes(searchTerm);
                    const courseMatch = (course ? course.name : '').toLowerCase().includes(searchTerm);
                    const subjectMatch = (subject ? (subject.name || subject.componente) : '').toLowerCase().includes(searchTerm);
                    const professorMatch = (professor ? professor.nome : '').toLowerCase().includes(searchTerm);
                    const periodoMatch = (peiGeral.periodo || '').toLowerCase().includes(searchTerm);
                    
                    return studentMatch || courseMatch || subjectMatch || professorMatch || periodoMatch;
                });
            }
            
            if (peisGeralToShow.length === 0) {
                peiGeralTableBody.innerHTML = `<tr><td colspan="9" class="empty-message">${peisGeral.length === 0 ? 'Nenhum PEI Geral cadastrado.' : 'Nenhum PEI Geral encontrado com o termo pesquisado.'}</td></tr>`;
            } else {
                peisGeralToShow.forEach(peiGeral => {
                    const matricula = matriculas.find(m => m.matricula === peiGeral.matricula);
                    const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                    const course = courses.find(c => matricula && c.id === matricula.curso_id);
                    const subject = subjects.find(s => (s.codigo_componente || s.id) == peiGeral.codigo_componente);
                    
                    
                    const peiAdaptacao = peisAdaptacao.find(pa => pa.pei_geral_id === peiGeral.id);
                    const temAdaptacao = !!peiAdaptacao;
                    
                    
                    const professor = servidores.find(s => s.siape === peiGeral.professor_siape);
                    const nomeProfessor = professor ? professor.nome : 'N/A';
                    
                    
                    const necessidadesAluno = student ? getNecessidadeDoEstudante(student) : '';
                    const necessidadeNome = necessidadesAluno || 'N/A';
                    
                    
                    const status = temAdaptacao ? 'Com Adaptação' : 'Pendente';
                    const statusClass = temAdaptacao ? 'status-completed' : 'status-pending';
                    const subjectName = subject ? (subject.name || subject.componente || subject.codigo_componente) : 'Não definido';
                    
                    const row = document.createElement('tr');
                    const actionsGeral = isCae
                        ? `<button class="btn btn-view" onclick="viewPeiGeral(${peiGeral.id})">Visualizar</button>`
                        : `<button class="btn btn-view" onclick="viewPeiGeral(${peiGeral.id})">Visualizar</button>
                           <button class="btn btn-edit" onclick="editPeiGeral(${peiGeral.id})">Editar</button>
                           <button class="btn btn-danger" onclick="deletePeiGeral(${peiGeral.id})">Excluir</button>`;
                    row.innerHTML = `
                        <td>${student ? student.nome : 'N/A'}</td>
                        <td>${course ? course.name : 'N/A'}</td>
                        <td>${subjectName}</td>
                        <td>${peiGeral.periodo || 'N/A'}</td>
                        <td>${necessidadeNome}</td>
                        <td>${nomeProfessor}</td>
                        <td><span class="status-badge ${statusClass}">${status}</span></td>
                        <td>${peiGeral.data_atualizacao ? new Date(peiGeral.data_atualizacao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>
                            ${actionsGeral}
                        </td>
                    `;
                    peiGeralTableBody.appendChild(row);
                });
            }
        }
        
        
        if (peiAdaptacaoTableBody) {
            peiAdaptacaoTableBody.innerHTML = '';
            
            let peisAdaptacaoToShow = peisAdaptacao;
            
            
            if (searchTerm) {
                peisAdaptacaoToShow = peisAdaptacao.filter(pa => {
                    const peiGeral = peisGeral.find(pg => pg.id === pa.pei_geral_id);
                    const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
                    const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                    const course = courses.find(c => matricula && c.id === matricula.curso_id);
                    const subject = subjects.find(s => (s.codigo_componente || s.id) == pa.codigo_componente);
                    const professor = servidores.find(s => s.siape === pa.professor_siape);
                    
                    const studentMatch = (student ? student.nome : '').toLowerCase().includes(searchTerm);
                    const courseMatch = (course ? course.name : '').toLowerCase().includes(searchTerm);
                    const subjectMatch = (subject ? (subject.name || subject.componente) : '').toLowerCase().includes(searchTerm);
                    const professorMatch = (professor ? professor.nome : '').toLowerCase().includes(searchTerm);
                    const periodoMatch = (peiGeral ? peiGeral.periodo : '').toLowerCase().includes(searchTerm);
                    
                    return studentMatch || courseMatch || subjectMatch || professorMatch || periodoMatch;
                });
            }
            
            if (peisAdaptacaoToShow.length === 0) {
                peiAdaptacaoTableBody.innerHTML = `<tr><td colspan="8" class="empty-message">${peisAdaptacao.length === 0 ? 'Nenhum PEI Adaptação cadastrado.' : 'Nenhum PEI Adaptação encontrado com o termo pesquisado.'}</td></tr>`;
        } else {
                peisAdaptacaoToShow.forEach(pa => {
                    const peiGeral = peisGeral.find(pg => pg.id === pa.pei_geral_id);
                    const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
                const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                const course = courses.find(c => matricula && c.id === matricula.curso_id);
                    const subject = subjects.find(s => (s.codigo_componente || s.id) == pa.codigo_componente);
                    const professor = servidores.find(s => s.siape === pa.professor_siape);
                    
                    
                    const statusMap = {
                        'rascunho': 'Rascunho',
                        'enviado_para_napne': 'Enviado para NAPNE',
                        'em_avaliacao': 'Em Avaliação',
                        'aprovado': 'Aprovado',
                        'rejeitado': 'Rejeitado'
                    };
                    const statusText = statusMap[pa.status] || pa.status || 'N/A';
                    const statusClass = pa.status === 'aprovado' ? 'status-completed' : 
                                      pa.status === 'rejeitado' ? 'status-rejected' : 
                                      pa.status === 'em_avaliacao' ? 'status-pending' : 'status-draft';
                
                const row = document.createElement('tr');
                const actionsAdapt = isCae
                    ? `<button class="btn btn-view" onclick="viewPeiAdaptacao(${pa.id})">Visualizar</button>`
                    : `<button class="btn btn-view" onclick="viewPeiAdaptacao(${pa.id})">Visualizar</button>
                       <button class="btn btn-comment" onclick="commentPeiAdaptacao(${pa.id})">Comentar</button>
                       <button class="btn btn-danger" onclick="deletePeiAdaptacao(${pa.id})">Excluir</button>`;
                row.innerHTML = `
                    <td>${student ? student.nome : 'N/A'}</td>
                    <td>${course ? course.name : 'N/A'}</td>
                        <td>${subject ? subject.name : 'N/A'}</td>
                        <td>${professor ? professor.nome : pa.docente || 'N/A'}</td>
                        <td>${peiGeral ? peiGeral.periodo : 'N/A'}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${pa.data_envio_napne ? new Date(pa.data_envio_napne).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>
                            ${actionsAdapt}
                    </td>
                `;
                    peiAdaptacaoTableBody.appendChild(row);
            });
            }
        }
    }
    
    window.viewPeiGeral = function(id) {
        window.openModalGeral(id, true); 
    };
    
    window.editPeiGeral = function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        window.openModalGeral(id, false); 
    };
    
    
    window.openModalGeral = async function(peiGeralId = null, readOnly = false) {
        if (isCae && !readOnly) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        resetPeiView();
        const modalTitle = document.getElementById('modalTitle');
        const peiIdField = document.getElementById('peiId');
        const peiTypeField = document.getElementById('peiType');
        const saveBtn = document.getElementById('savePei');
        const generatePdfBtn = document.getElementById('generatePdf');
        
        if (peiGeralId) {
            
            const peiGeral = peisGeral.find(p => p.id == peiGeralId);
            if (!peiGeral) {
                alert('PEI Geral não encontrado');
                return;
            }
            
            const matricula = matriculas.find(m => m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.id === matricula.curso_id);
            const subject = subjects.find(s => (s.codigo_componente || s.id) == peiGeral.codigo_componente);
            const professor = servidores.find(s => s.siape === peiGeral.professor_siape);
            const peiAdaptacaoRelacionado = peisAdaptacao.find(pa => pa.pei_geral_id === peiGeral.id);
            
            modalTitle.textContent = readOnly ? 'Visualizar PEI Geral' : 'Editar PEI Geral';
            peiIdField.value = peiGeral.id;
            peiTypeField.value = 'geral';
            
            
            document.getElementById('studentName').value = student ? student.nome : '';
            document.getElementById('studentCourse').value = course ? course.id : '';
            document.getElementById('yearSemester').value = peiGeral.periodo || '';
            document.getElementById('generalObjective').value = peiGeral.objetivo_geral || '';
            document.getElementById('contents').value = peiGeral.conteudos || '';
            document.getElementById('napneOpinion').value = peiGeral.parecer || '';
            document.getElementById('dificuldades').value = peiGeral.dificuldades || '';
            document.getElementById('interessesHabilidades').value = peiGeral.interesses_habilidades || '';
            document.getElementById('estrategias').value = peiGeral.estrategias || '';
            const precisaMonitorEl = document.getElementById('precisaMonitor');
            if (precisaMonitorEl) {
                precisaMonitorEl.checked = peiGeral.precisa_monitor === 1 || peiGeral.precisa_monitor === true;
            }
            
            
            if (student && student.id_aluno) {
                try {
                    const alunoResponse = await API_CONFIG.get(`estudantes/${student.id_aluno}`);
                    if (alunoResponse && alunoResponse.historico) {
                        const historicoField = document.getElementById('historico');
                        if (historicoField) {
                            historicoField.value = alunoResponse.historico || '';
                        }
                    }
                } catch (error) {
                    
                    if (student.historico) {
                        const historicoField = document.getElementById('historico');
                        if (historicoField) {
                            historicoField.value = student.historico || '';
                        }
                    }
                }
            }
            document.getElementById('observacoes').value = peiGeral.observacoes || '';
            
            
            const professorSelect = document.getElementById('professorSelect');
            if (professorSelect && peiGeral.professor_siape) {
                professorSelect.value = peiGeral.professor_siape;
            }
            
            
            updateStudentInfo(student ? student.nome : '');

            
            const subjectGroup = document.getElementById('subject-group');
            if (subjectGroup) {
                subjectGroup.style.display = 'block';
                const select = subjectGroup.querySelector('select');
                if (select) {
                    select.disabled = readOnly;
                    select.required = true;
                    if (readOnly) {
                        select.classList.add('select-locked');
                        select.title = 'Componente curricular definido pelo NAPNE';
                    } else {
                        select.classList.remove('select-locked');
                        select.removeAttribute('title');
                    }
                    if (peiGeral.codigo_componente) {
                        select.value = peiGeral.codigo_componente.toString();
                        if (select.value !== peiGeral.codigo_componente.toString()) {
                            const optionToSelect = Array.from(select.options).find(opt => opt.value == peiGeral.codigo_componente);
                            if (optionToSelect) {
                                optionToSelect.selected = true;
                            }
                        }
                        select.dispatchEvent(new Event('change'));
                    }
                }
            }

            const ementaGroup = document.getElementById('ementa-group');
            if (ementaGroup) {
                ementaGroup.style.display = 'block';
                const ementaTextarea = ementaGroup.querySelector('textarea');
                if (ementaTextarea) {
                    ementaTextarea.value = subject ? (subject.ementa || subject.description || '') : '';
                }
            }
            
            
            const adaptacaoFields = ['teacher-group', 'specificObjectives-group', 'methodology-group', 'evaluation-group', 'opinion-group', 'ementa-adaptacao-group'];
            adaptacaoFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.style.display = 'none';
                    
                    const inputs = field.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input) {
                            input.removeAttribute('required');
                            input.disabled = true;
                        }
                    });
                }
            });
            
            
            const geralFields = ['professor-select-group', 'generalObjective', 'contents', 'napneOpinion', 'dificuldades', 'interessesHabilidades', 'estrategias', 'observacoes', 'historico'];
            geralFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const group = field.closest('.form-group') || field;
                    if (group) group.style.display = 'block';
                    
                    const inputs = group.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input && !readOnly) {
                            input.disabled = false;
                        }
                    });
                }
            });
            
            if (readOnly) {
                const viewConfig = createPeiViewConfig({
                    peiGeral,
                    peiAdaptacao: peiAdaptacaoRelacionado,
                    student,
                    course,
                    subject,
                    professor
                });
                renderPeiView(viewConfig);

                const inputs = peiForm.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = true);
                if (saveBtn) saveBtn.style.display = 'none';
                if (generatePdfBtn) generatePdfBtn.style.display = 'inline-block';
            } else {
                const inputs = peiForm.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = false);
                saveBtn.style.display = 'inline-block';
                generatePdfBtn.style.display = 'inline-block';
            }
        } else {
            
            modalTitle.textContent = 'Novo PEI Geral';
            peiForm.reset();
            peiIdField.value = '';
            peiTypeField.value = 'geral';
            
            
            const adaptacaoFields = ['teacher-group', 'specificObjectives-group', 'methodology-group', 'evaluation-group', 'opinion-group', 'ementa-adaptacao-group'];
            adaptacaoFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.style.display = 'none';
                    
                    const inputs = field.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input) {
                            input.removeAttribute('required');
                            input.disabled = true;
                        }
                    });
                }
            });
            
            
            const geralFields = ['professor-select-group', 'generalObjective', 'contents', 'napneOpinion', 'dificuldades', 'interessesHabilidades', 'estrategias', 'observacoes', 'historico'];
            geralFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const group = field.closest('.form-group') || field;
                    if (group) group.style.display = 'block';
                    
                    const inputs = group.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input) {
                            input.disabled = false;
                        }
                    });
                }
            });
            
            
            const subjectGroup = document.getElementById('subject-group');
            if (subjectGroup) {
                subjectGroup.style.display = 'block';
                const select = subjectGroup.querySelector('select');
                if (select) {
                    select.disabled = false;
                    select.required = true;
                    select.value = '';
                    select.classList.remove('select-locked');
                    select.removeAttribute('title');
                }
            }
            const ementaGroup = document.getElementById('ementa-group');
            if (ementaGroup) {
                ementaGroup.style.display = 'block';
                const ementaTextarea = ementaGroup.querySelector('textarea');
                if (ementaTextarea) {
                    ementaTextarea.value = '';
                }
            }
            
            
            const napneCommentsSection = document.getElementById('napne-comments-section');
            if (napneCommentsSection) {
                napneCommentsSection.style.display = 'none';
            }
            
            
            const inputs = peiForm.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.disabled = false);
            saveBtn.style.display = 'inline-block';
            generatePdfBtn.style.display = 'inline-block';
        }
        
        
        const modal = document.getElementById('peiModal');
        if (modal) {
            modal.style.display = 'block';
        }
    };
    
    
    window.viewPeiGeralOld = function(id) {
        const pei = peisGeral.find(p => p.id == id);
        if (pei) {
            alert(`PEI Geral ID: ${pei.id}\nMatrícula: ${pei.matricula}\nPeríodo: ${pei.periodo}\nDificuldades: ${pei.dificuldades || 'N/A'}`);
        }
    };
    
    
    function openModal(id = null, readOnly = false) {
        if (isCae && !readOnly) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        resetPeiView();
        const modalTitle = document.getElementById('modalTitle');
        const peiIdField = document.getElementById('peiId');
        const peiTypeField = document.getElementById('peiType');
        const saveBtn = document.getElementById('savePei');
        const generatePdfBtn = document.getElementById('generatePdf');

        if (id) {
            
            
            const peiAdaptacao = peisAdaptacao.find(p => p.id == id);
            if (peiAdaptacao) {
                const peiGeral = peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id);
                const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
                const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
                const course = courses.find(c => matricula && c.id === matricula.curso_id);
                const subject = subjects.find(s => (s.codigo_componente || s.id) == peiAdaptacao.codigo_componente);
                const professor = servidores.find(s => s.siape === (peiAdaptacao.professor_siape || peiGeral?.professor_siape));
                
                const pei = {
                    id: peiAdaptacao.id,
                    studentName: student ? student.nome : '',
                    course: course ? course.id : '',
                    subject: subject ? (subject.codigo_componente || subject.id).toString() : '',
                    teacher: peiAdaptacao.docente || '',
                    yearSemester: peiGeral ? peiGeral.periodo : '',
                    ementa: peiAdaptacao.ementa || '',
                    
                    generalObjective: peiGeral ? peiGeral.objetivo_geral : '',
                    contents: peiGeral ? peiGeral.conteudos : '',
                    napneOpinion: peiGeral ? peiGeral.parecer : '',
                    
                    specificObjectives: peiAdaptacao.objetivos_especificos || '',
                    methodology: peiAdaptacao.metodologia || '',
                    evaluation: peiAdaptacao.avaliacao || '',
                    opinion: peiAdaptacao.parecer || '',
                    comentarios_napne: peiAdaptacao.comentarios_napne || '',
                    type: 'adaptacao'
                };
                
                
                const adaptacaoFields = ['subject-group', 'teacher-group', 'specificObjectives-group', 'methodology-group', 'evaluation-group', 'opinion-group', 'ementa-adaptacao-group'];
                adaptacaoFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.style.display = 'block';
                    }
                });
                
                
                const geralExtraFields = ['professor-select-group', 'dificuldades', 'interessesHabilidades', 'estrategias', 'observacoes', 'historico'];
                geralExtraFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        const group = field.closest('.form-group') || field;
                        if (group) group.style.display = 'none';
                    }
                });
                
                
                const geralViewFields = ['generalObjective', 'contents', 'napneOpinion'];
                geralViewFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        const group = field.closest('.form-group');
                        if (group) group.style.display = 'block';
                    }
                });
                
                if (readOnly) {
                    modalTitle.textContent = 'Visualizar PEI - Adaptação Curricular';
                    const viewConfig = createPeiViewConfig({
                        peiGeral,
                        peiAdaptacao,
                        student,
                        course,
                        subject,
                        professor
                    });
                    renderPeiView(viewConfig);

                    
                    const inputs = peiForm.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => input.disabled = true);
                    if (saveBtn) saveBtn.style.display = 'none';
                    if (generatePdfBtn) generatePdfBtn.style.display = 'inline-block';
                } else {
                    modalTitle.textContent = 'Editar PEI - Adaptação Curricular';
                    
                    const inputs = peiForm.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        
                        const isGeralField = ['generalObjective', 'contents', 'napneOpinion', 'dificuldades', 'interessesHabilidades', 'estrategias', 'observacoes', 'historico', 'professorSelect'].includes(input.id);
                        if (!isGeralField) {
                            input.disabled = false;
                        }
                    });
                    saveBtn.style.display = 'inline-block';
                    generatePdfBtn.style.display = 'inline-block';
                }
                peiIdField.value = pei.id;
                peiTypeField.value = pei.type;

                
                document.getElementById('studentName').value = pei.studentName;
                document.getElementById('studentCourse').value = pei.course;
                const subjectSelect = document.getElementById('subject');
                if (subjectSelect) {
                    subjectSelect.value = pei.subject;
                    subjectSelect.disabled = true;
                    subjectSelect.classList.add('select-locked');
                }
                teacherInput.value = pei.teacher; 
                document.getElementById('yearSemester').value = pei.yearSemester;
                
                
                updateStudentInfo(pei.studentName);

                    
                    setTimeout(() => {
                        const subjectSelect = document.getElementById('subject');
                        if (subjectSelect) {
                            const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
                            if (selectedOption) {
                                const description = selectedOption.dataset.description;
                                const ementaValue = description || pei.ementa || '';
                                
                                const ementaAdaptacao = document.getElementById('ementaAdaptacao');
                                if (ementaAdaptacao) {
                                    ementaAdaptacao.value = ementaValue;
                                }
                            }
                        }
                    }, 300);
                
                document.getElementById('generalObjective').value = pei.generalObjective || '';
                document.getElementById('contents').value = pei.contents || '';
                document.getElementById('napneOpinion').value = pei.napneOpinion || '';
                
                document.getElementById('specificObjectives').value = pei.specificObjectives || '';
                document.getElementById('methodology').value = pei.methodology || '';
                document.getElementById('evaluation').value = pei.evaluation || '';
                document.getElementById('opinion').value = pei.opinion || '';
                
                
                const ementaAdaptacao = document.getElementById('ementaAdaptacao');
                if (ementaAdaptacao) {
                    ementaAdaptacao.value = pei.ementa || '';
                }
                
                
                const napneCommentsSection = document.getElementById('napne-comments-section');
                const napneCommentsDisplay = document.getElementById('napne-comments-display');
                if (napneCommentsSection && napneCommentsDisplay) {
                    if (pei.comentarios_napne && pei.comentarios_napne.trim()) {
                        napneCommentsDisplay.textContent = pei.comentarios_napne;
                        napneCommentsSection.style.display = 'block';
                    } else {
                        napneCommentsDisplay.textContent = 'Nenhum comentário do NAPNE ainda.';
                        napneCommentsSection.style.display = readOnly ? 'block' : 'none'; 
                    }
                }
            }
        } else {
            
            
            
            alert('NAPNE cria apenas PEI Geral. PEI Adaptação é criado pelos professores.');
            closeModalWindow();
        }

        peiModal.style.display = 'block';
    }
    
    
    function closeModalWindow() {
        if (peiModal) {
            peiModal.style.display = 'none';
        }
        resetPeiView();
    }
    
    
    async function savePei() {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const peiId = document.getElementById('peiId').value;
        const peiType = document.getElementById('peiType').value;
        const studentName = document.getElementById('studentName').value;
        let courseId = document.getElementById('studentCourse').value;
        const subjectId = document.getElementById('subject').value;
        const subjectIdNumber = subjectId ? parseInt(subjectId, 10) : null;
        const teacher = document.getElementById('teacher').value;
        const yearSemester = document.getElementById('yearSemester').value;
        const specificNeedId = document.getElementById('specificNeed').value;
        
        
        const necessidade = necessidades.find(n => n.id == specificNeedId);
        const specificNeed = necessidade ? necessidade.nome : '';
        
        
        const ementaEl = document.getElementById('ementa');
        const ementa = ementaEl ? ementaEl.value : '';
        
        
        const generalObjective = document.getElementById('generalObjective').value;
        const contents = document.getElementById('contents').value;
        const napneOpinion = document.getElementById('napneOpinion').value;
        const dificuldades = document.getElementById('dificuldades').value;
        const interessesHabilidades = document.getElementById('interessesHabilidades').value;
        const estrategias = document.getElementById('estrategias').value;
        const observacoes = document.getElementById('observacoes').value;
        const precisaMonitorEl = document.getElementById('precisaMonitor');
        const precisaMonitor = precisaMonitorEl ? precisaMonitorEl.checked : false;
        
        
        const specificObjectivesEl = document.getElementById('specificObjectives');
        const methodologyEl = document.getElementById('methodology');
        const evaluationEl = document.getElementById('evaluation');
        const opinionEl = document.getElementById('opinion');
        
        const specificObjectives = specificObjectivesEl ? specificObjectivesEl.value : '';
        const methodology = methodologyEl ? methodologyEl.value : '';
        const evaluation = evaluationEl ? evaluationEl.value : '';
        const opinion = opinionEl ? opinionEl.value : '';
        
        try {
            
            const student = students.find(s => s.nome === studentName);
            if (!student) {
                alert('Estudante não encontrado!');
                return;
            }

            let matricula = matriculas.find(m => m.estudante_id === student.id_aluno);
            if (!matricula || !matricula.matricula) {
                
                if (!courseId || courseId === '') {
                    
                    if (courses && courses.length > 0) {
                        courseId = courses[0].id || courses[0].codigo;
                        
                        document.getElementById('studentCourse').value = courseId;
                        alert('Matrícula não encontrada para este estudante. Usando o primeiro curso disponível para criar a matrícula automaticamente.');
                    } else {
                        alert('Matrícula não encontrada para este estudante! Selecione um curso para criar a matrícula automaticamente.');
                        return;
                    }
                }
                
                matricula = { matricula: '', estudante_id: student.id_aluno, curso_id: courseId };
            } else if (!courseId || courseId === '') {
                
                courseId = matricula.curso_id || matricula.cursoId;
                if (courseId) {
                    document.getElementById('studentCourse').value = courseId;
                }
            }

            
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

            if (peiId) {
                
                const peiAdaptacao = peisAdaptacao.find(p => p.id == peiId);
                if (peiAdaptacao) {
                    
                    const peiGeral = peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id);
                    if (peiGeral) {
                        const peiGeralData = {
                            id_aluno: peiGeral.id_aluno,
                            matricula: peiGeral.matricula || matricula.matricula,
                            periodo: yearSemester,
                            codigo_componente: subjectIdNumber || peiGeral.codigo_componente || null,
                            necessidade_especifica: specificNeed || '',
                            objetivo_geral: generalObjective || '',
                            conteudos: contents || '',
                            parecer: napneOpinion || '',
                            dificuldades: dificuldades || '',
                            interesses_habilidades: interessesHabilidades || '',
                            estrategias: estrategias || '',
                            observacoes: observacoes || '',
                            precisa_monitor: precisaMonitor
                        };
                        
                        
                        const professorSelect = document.getElementById('professorSelect');
                        if (professorSelect && professorSelect.value) {
                            const professorSiape = parseInt(professorSelect.value);
                            const servidorDocente = servidores.find(s => s.siape == professorSiape && s.tipo === 'Docente');
                            if (servidorDocente) {
                                peiGeralData.professor_siape = professorSiape;
                            } else {
                                peiGeralData.professor_siape = peiGeral.professor_siape; 
                            }
                        } else if (peiGeral.professor_siape) {
                            peiGeralData.professor_siape = peiGeral.professor_siape;
                        } else {
                            alert('Por favor, selecione um professor responsável!');
                            return;
                        }
                        
                        await API_CONFIG.put(`peis/${peiGeral.id}`, peiGeralData);
                    }
                    
                    
                    
                    const ementaAdaptacaoEl = document.getElementById('ementaAdaptacao');
                    const ementaAdaptacao = ementaAdaptacaoEl ? ementaAdaptacaoEl.value : ementa;
                    
                    const peiData = {
                        pei_geral_id: peiAdaptacao.pei_geral_id,
                        codigo_componente: subjectIdNumber || peiGeral?.codigo_componente || 0,
                        ementa: ementaAdaptacao, 
                        objetivos_especificos: specificObjectives,
                        metodologia: methodology,
                        avaliacao: evaluation,
                        parecer: opinion,
                        docente: teacher
                    };
                    
                    
                    if (peiAdaptacao.professor_siape) {
                        peiData.professor_siape = peiAdaptacao.professor_siape;
                    } else if (currentUser.siape && !isNaN(parseInt(currentUser.siape))) {
                        
                        const servidorDocente = servidores.find(s => s.siape == currentUser.siape && s.tipo === 'Docente');
                        if (servidorDocente) {
                            peiData.professor_siape = parseInt(currentUser.siape);
                        }
                    }
                    
                    
                    await API_CONFIG.put(`adaptacoes/${peiId}`, peiData);
                    showToast('PEI atualizado com sucesso!', 'success');
                } else if (peiType === 'geral') {
                    
                    const peiGeral = peisGeral.find(pg => pg.id == peiId);
                    if (!peiGeral) {
                        alert('PEI Geral não encontrado para atualização.');
                        return;
                    }

                    if (!subjectIdNumber) {
                        alert('Por favor, selecione a matéria vinculada ao PEI.');
                        return;
                    }

                    const professorSelect = document.getElementById('professorSelect');
                    const professorSiape = professorSelect ? parseInt(professorSelect.value, 10) : null;
                    if (!professorSiape || isNaN(professorSiape)) {
                        alert('Por favor, selecione um professor responsável!');
                        return;
                    }

                    const servidorDocente = servidores.find(s => s.siape == professorSiape && s.tipo === 'Docente');
                    if (!servidorDocente) {
                        alert('Professor selecionado não é válido!');
                        return;
                    }

                    const peiGeralData = {
                        id_aluno: student.id_aluno || student.id,
                        matricula: peiGeral.matricula || (matricula ? matricula.matricula : ''),
                        periodo: yearSemester,
                        codigo_componente: subjectIdNumber,
                        necessidade_especifica: specificNeed || '',
                        objetivo_geral: generalObjective || '',
                        conteudos: contents || '',
                        parecer: napneOpinion || '',
                        dificuldades: dificuldades || '',
                        interesses_habilidades: interessesHabilidades || '',
                        estrategias: estrategias || '',
                        observacoes: observacoes || '',
                        precisa_monitor: precisaMonitor,
                        professor_siape: professorSiape
                    };

                    await API_CONFIG.put(`peis/${peiId}`, peiGeralData);
                    showToast('PEI Geral atualizado com sucesso!', 'success');
                } else {
                    alert('Tipo de PEI não suportado para atualização.');
                    return;
                }
            } else {
                
                
                const professorSelect = document.getElementById('professorSelect');
                const professorSiape = professorSelect ? parseInt(professorSelect.value) : null;
                
                if (!professorSiape || isNaN(professorSiape)) {
                    alert('Por favor, selecione um professor responsável!');
                    return;
                }
                
                
                const servidorDocente = servidores.find(s => s.siape == professorSiape && s.tipo === 'Docente');
                if (!servidorDocente) {
                    alert('Professor selecionado não é válido!');
                    return;
                }
                
                
                if (!generalObjective || generalObjective.trim() === '') {
                    alert('Por favor, preencha o objetivo geral!');
                    return;
                }
                
                if (!contents || contents.trim() === '') {
                    alert('Por favor, preencha os conteúdos!');
                    return;
                }
                
                if (!napneOpinion || napneOpinion.trim() === '') {
                    alert('Por favor, preencha o parecer do NAPNE!');
                    return;
                }
                
                if (!subjectIdNumber) {
                    alert('Por favor, selecione o componente curricular vinculado ao PEI.');
                    return;
                }
                
                
                if (!courseId || courseId === '') {
                    
                    if (matricula && matricula.curso_id) {
                        courseId = matricula.curso_id;
                    } else if (courses && courses.length > 0) {
                        
                        courseId = courses[0].id || courses[0].codigo;
                    }
                }
                
                const peiGeralData = {
                    id_aluno: student.id_aluno || student.id,
                    matricula: matricula ? matricula.matricula : '',
                    courseId: courseId || '', 
                    professor_siape: professorSiape,
                    periodo: yearSemester,
                    codigo_componente: subjectIdNumber,
                    necessidade_especifica: specificNeed || '',
                    objetivo_geral: generalObjective,
                    conteudos: contents,
                    parecer: napneOpinion,
                    dificuldades: dificuldades || '',
                    interesses_habilidades: interessesHabilidades || '',
                    estrategias: estrategias || '',
                    observacoes: observacoes || '',
                    precisa_monitor: precisaMonitor
                };
                
                const peiGeral = await API_CONFIG.post('peis', peiGeralData);
                
                
                
                showToast('PEI Geral criado com sucesso! O professor poderá criar a adaptação.', 'success');
            }
            
            
            await loadData();
            
            
            closeModalWindow();
            loadPeis();
            
        } catch (error) {
            alert('Erro ao salvar PEI: ' + (error.message || 'Erro desconhecido'));
        }
    }

    function showToast(message, type) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
    
    
    window.viewPei = function(id) {
        openModal(id, true);
    };

    
    window.viewStudentDetails = function(studentName) {
        const student = students.find(s => s.nome === studentName);
        if (!student) {
            alert('Detalhes do aluno não encontrados.');
            return;
        }
        
        const matricula = matriculas.find(m => m.estudante_id === student.id_aluno);
        const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
        const courseName = course ? course.nome : 'Curso não informado';
        
        const details = `
            Nome: ${student.nome}
            CPF: ${student.cpf}
            Curso: ${courseName}
            Contato: ${student.contato || 'Não informado'}
        `;
        alert(details);
    };

    
    window.viewProfessorDetails = function(professorName) {
        const professor = servidores.find(t => t.nome === professorName || t.docente === professorName);
        if (!professor) {
            alert('Detalhes do professor não encontrados.');
            return;
        }
        
        const details = `
            Nome: ${professor.nome}
            Email: ${professor.email || 'Não informado'}
            Tipo: ${professor.tipo || 'Não informado'}
        `;
        alert(details);
    };
    
    
    window.viewPeiAdaptacao = function(id) {
        const peiAdaptacao = peisAdaptacao.find(p => p.id == id);
        if (!peiAdaptacao) {
            alert('PEI Adaptação não encontrado');
            return;
        }
        
        
        openModal(id, true);
    };
    
    
    window.commentPeiAdaptacao = function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const peiAdaptacao = peisAdaptacao.find(p => p.id == id);
        if (!peiAdaptacao) {
            alert('PEI Adaptação não encontrado');
            return;
        }
        
        const peiGeral = peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id);
        const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
        const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
        const course = courses.find(c => matricula && c.id === matricula.curso_id);
        const subject = subjects.find(s => (s.codigo_componente || s.id) == peiAdaptacao.codigo_componente);
        const professor = servidores.find(s => s.siape === peiAdaptacao.professor_siape);
        
        
        if (document.getElementById('comment-student')) {
            document.getElementById('comment-student').textContent = student ? student.nome : 'N/A';
        }
        if (document.getElementById('comment-subject')) {
            document.getElementById('comment-subject').textContent = subject ? subject.name : 'N/A';
        }
        if (document.getElementById('comment-teacher')) {
            document.getElementById('comment-teacher').textContent = professor ? professor.nome : peiAdaptacao.docente || 'N/A';
        }
        if (document.getElementById('comment-status')) {
            const statusMap = {
                'rascunho': 'Rascunho',
                'enviado_para_napne': 'Enviado para NAPNE',
                'em_avaliacao': 'Em Avaliação',
                'aprovado': 'Aprovado',
                'rejeitado': 'Rejeitado'
            };
            document.getElementById('comment-status').textContent = statusMap[peiAdaptacao.status] || peiAdaptacao.status || 'N/A';
        }
        if (document.getElementById('comment-pei-adaptacao-id')) {
            document.getElementById('comment-pei-adaptacao-id').value = peiAdaptacao.id;
        }
        if (document.getElementById('napne-comment')) {
            document.getElementById('napne-comment').value = peiAdaptacao.comentarios_napne || '';
        }
        if (document.getElementById('napne-status')) {
            document.getElementById('napne-status').value = '';
        }
        
        
        const napneCommentModal = document.getElementById('napneCommentModal');
        if (napneCommentModal) {
            napneCommentModal.style.display = 'block';
        }
    };
    
    
    async function saveNapneComment() {
        const peiAdaptacaoId = document.getElementById('comment-pei-adaptacao-id')?.value;
        const comentario = document.getElementById('napne-comment')?.value || '';
        const novoStatus = document.getElementById('napne-status')?.value || '';
        
        if (!peiAdaptacaoId) {
            alert('Erro: ID do PEI Adaptação não encontrado');
            return;
        }
        
        if (!comentario.trim()) {
            alert('Por favor, digite um comentário');
            return;
        }
        
        try {
            const peiAdaptacao = peisAdaptacao.find(p => p.id == peiAdaptacaoId);
            if (!peiAdaptacao) {
                alert('PEI Adaptação não encontrado');
                return;
            }
            
            
            const updatedData = {
                pei_geral_id: peiAdaptacao.pei_geral_id,
                codigo_componente: peiAdaptacao.codigo_componente,
                ementa: peiAdaptacao.ementa || '',
                objetivos_especificos: peiAdaptacao.objetivos_especificos || '',
                metodologia: peiAdaptacao.metodologia || '',
                avaliacao: peiAdaptacao.avaliacao || '',
                parecer: peiAdaptacao.parecer || '',
                comentarios_napne: comentario,
                status: novoStatus || peiAdaptacao.status || 'em_avaliacao'
            };
            
            
            
            if (comentario.trim()) {
                
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                updatedData.data_resposta_napne = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }
            
            
            if (peiAdaptacao.professor_siape) {
                updatedData.professor_siape = peiAdaptacao.professor_siape;
            }
            
            await API_CONFIG.put(`adaptacoes/${peiAdaptacaoId}`, updatedData);
            
            
            const napneCommentModal = document.getElementById('napneCommentModal');
            if (napneCommentModal) {
                napneCommentModal.style.display = 'none';
            }
            await loadData();
            loadPeis();
            
            alert('Comentário salvo com sucesso!');
        } catch (error) {
            alert('Erro ao salvar comentário: ' + (error.message || 'Erro desconhecido'));
        }
    }

    
    window.editPei = function(id) {
        openModal(id);
    };
    
    
    window.deletePeiGeral = async function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este PEI Geral? Isso também excluirá o PEI Adaptação associado, se houver.')) {
            try {
                
                const peiAdaptacao = peisAdaptacao.find(pa => pa.pei_geral_id == id);
                if (peiAdaptacao) {
                    await API_CONFIG.delete(`adaptacoes/${peiAdaptacao.id}`);
                }
                
                
                await API_CONFIG.delete(`peis/${id}`);
                alert('PEI Geral excluído com sucesso!');
                await loadData();
                loadPeis();
            } catch (error) {
                alert('Erro ao excluir PEI Geral: ' + (error.message || 'Erro desconhecido'));
            }
        }
    };
    
    
    window.deletePeiAdaptacao = async function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este PEI Adaptação?')) {
            try {
                await API_CONFIG.delete(`adaptacoes/${id}`);
                alert('PEI Adaptação excluído com sucesso!');
                await loadData();
                loadPeis();
            } catch (error) {
                alert('Erro ao excluir PEI Adaptação: ' + (error.message || 'Erro desconhecido'));
            }
        }
    };
    
    
    window.deletePei = async function(id) {
        
        await window.deletePeiAdaptacao(id);
    };
    
    
    function switchTab(tab) {
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-content`).classList.add('active');
    }
    
    
    function applyFilters() {
        const searchTerm = currentSearchTerm || '';
        
        
        const peisCompletos = peisAdaptacao.map(pa => {
            const peiGeral = peisGeral.find(pg => pg.id === pa.pei_geral_id);
            const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const courseObj = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const subject = subjects.find(s => s.codigo_componente === pa.codigo_componente);
            
            return {
                id: pa.id,
                pei_geral_id: pa.pei_geral_id,
                studentName: student ? student.nome : 'N/A',
                course: courseObj ? courseObj.nome : 'N/A',
                courseId: courseObj ? courseObj.codigo : null,
                subject: subject ? subject.componente : 'N/A',
                teacher: pa.docente || 'N/A',
                yearSemester: peiGeral ? peiGeral.periodo : 'N/A',
                specificNeed: peiGeral ? peiGeral.dificuldades : '',
                needType: 'all' 
            };
        });
        
        
        let filteredPeis = peisCompletos;
        
        
        if (searchTerm) {
            filteredPeis = filteredPeis.filter(pei => {
                const studentMatch = (pei.studentName || '').toLowerCase().includes(searchTerm);
                const courseMatch = (pei.course || '').toLowerCase().includes(searchTerm);
                const subjectMatch = (pei.subject || '').toLowerCase().includes(searchTerm);
                const teacherMatch = (pei.teacher || '').toLowerCase().includes(searchTerm);
                const periodoMatch = (pei.yearSemester || '').toLowerCase().includes(searchTerm);
                return studentMatch || courseMatch || subjectMatch || teacherMatch || periodoMatch;
            });
        }
        
        
        displayFilteredPeis(filteredPeis);
    }
    
    
    function displayFilteredPeis(filteredPeis) {
        const peiTableBody = document.getElementById('pei-table-body');
        const historicoTableBody = document.getElementById('pei-historico-table-body');
        
        if (!peiTableBody || !historicoTableBody) return;
        
        
        peiTableBody.innerHTML = '';
        historicoTableBody.innerHTML = '';
        
        if (filteredPeis.length === 0) {
            peiTableBody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum PEI encontrado com os filtros aplicados.</td></tr>';
            historicoTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Nenhum PEI encontrado com os filtros aplicados.</td></tr>';
            return;
        }
        
        
        if (filteredPeis.length === 0) {
            peiTableBody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum PEI de adaptação curricular encontrado.</td></tr>';
        } else {
            filteredPeis.forEach(pei => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pei.studentName}</td>
                    <td>${pei.course}</td>
                    <td>${pei.subject}</td>
                    <td>${pei.teacher}</td>
                    <td>${pei.yearSemester}</td>
                    <td>-</td>
                    <td>
                        <button class="btn btn-view" onclick="viewPei(${pei.id})">Visualizar</button>
                        <button class="btn btn-edit" onclick="editPei(${pei.id})">Editar</button>
                        <button class="btn btn-danger" onclick="deletePei(${pei.id})">Excluir</button>
                    </td>
                `;
                peiTableBody.appendChild(row);
            });
        }
        
        
        historicoTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Use a aba "Histórico" para ver todos os PEIs gerais.</td></tr>';
    }
    
    
    function clearFilters() {
        currentSearchTerm = '';
        const searchInput = document.getElementById('searchPei');
        if (searchInput) {
            searchInput.value = '';
        }
        
        loadPeis();
    }
    
    
    async function generatePdf() {
        const peiId = document.getElementById('peiId').value;
        const peiType = document.getElementById('peiType')?.value || '';
        let content = '';

        if (peiId) {
            let peiGeral = null;
            let peiAdaptacao = null;

            if (peiType === 'geral') {
                peiGeral = peisGeral.find(pg => pg.id == peiId);
                if (!peiGeral) return;
                peiAdaptacao = peisAdaptacao.find(pa => pa.pei_geral_id === peiGeral.id) || null;
            } else {
                peiAdaptacao = peisAdaptacao.find(p => p.id == peiId);
                if (!peiAdaptacao) return;
                peiGeral = peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id);
            }

            if (!peiGeral) return;

            const matricula = matriculas.find(m => peiGeral && m.matricula === peiGeral.matricula);
            const student = students.find(s => matricula && s.id_aluno === matricula.estudante_id);
            const course = courses.find(c => matricula && c.codigo === matricula.curso_id);
            const subject = subjects.find(s => (s.codigo_componente || s.id) == (peiAdaptacao ? peiAdaptacao.codigo_componente : peiGeral.codigo_componente));
            const professor = servidores.find(s => s.siape === peiGeral.professor_siape);
            
            
            const necessidadeNome = peiGeral?.necessidade_especifica || getNecessidadeDoEstudante(student) || 'N/A';

            const professorAdaptacao = peiAdaptacao ? servidores.find(s => s.siape === peiAdaptacao.professor_siape) : null;
            const teacherName = peiAdaptacao
                ? (professorAdaptacao ? professorAdaptacao.nome : (peiAdaptacao.docente || 'N/A'))
                : (professor ? professor.nome : 'N/A');
            const ementaBase = subject ? (subject.ementa || subject.description || '') : '';
            
            
            let historicoAluno = '';
            if (student && student.id_aluno) {
                try {
                    const alunoResponse = await API_CONFIG.get(`estudantes/${student.id_aluno}`);
                    if (alunoResponse && alunoResponse.historico) {
                        historicoAluno = alunoResponse.historico;
                    }
                } catch (error) {
                    
                    if (student.historico) {
                        historicoAluno = student.historico;
                    }
                }
            }
            
            const pei = {
                historicoAluno: historicoAluno,
                studentName: student ? student.nome : 'N/A',
                course: course ? course.nome : 'N/A',
                subject: subject ? (subject.componente || subject.name || 'N/A') : 'N/A',
                teacher: teacherName,
                yearSemester: peiGeral ? peiGeral.periodo : 'N/A',
                ementa: peiAdaptacao ? (peiAdaptacao.ementa || ementaBase) : ementaBase,
                necessidadeEspecifica: necessidadeNome,
                
                generalObjective: peiGeral ? peiGeral.objetivo_geral : '',
                contents: peiGeral ? peiGeral.conteudos : '',
                napneOpinion: peiGeral ? peiGeral.parecer : '',
                dificuldades: peiGeral ? peiGeral.dificuldades : '',
                interessesHabilidades: peiGeral ? peiGeral.interesses_habilidades : '',
                estrategias: peiGeral ? peiGeral.estrategias : '',
                observacoes: peiGeral ? peiGeral.observacoes : '',
                
                specificObjectives: peiAdaptacao ? peiAdaptacao.objetivos_especificos || '' : '',
                methodology: peiAdaptacao ? peiAdaptacao.metodologia || '' : '',
                evaluation: peiAdaptacao ? peiAdaptacao.avaliacao || '' : '',
                opinion: peiAdaptacao ? peiAdaptacao.parecer || '' : '',
                comentarios_napne: peiAdaptacao ? peiAdaptacao.comentarios_napne || '' : ''
            };
            
            if (pei) {
                const currentDate = new Date().toLocaleDateString('pt-BR');
                content = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            @page {
                                margin: 15mm;
                            }
                            body {
                                font-family: 'Arial', 'Helvetica', sans-serif;
                                font-size: 11pt;
                                line-height: 1.6;
                                color: #333;
                                padding: 0;
                                margin: 0;
                            }
                            .header {
                                text-align: center;
                                border-bottom: 3px solid #2c3e50;
                                padding-bottom: 15px;
                                margin-bottom: 25px;
                            }
                            .header h1 {
                                color: #2c3e50;
                                font-size: 20pt;
                                margin: 0 0 10px 0;
                                font-weight: bold;
                            }
                            .header .subtitle {
                                color: #7f8c8d;
                                font-size: 11pt;
                                margin: 0;
                            }
                            .section {
                                margin-bottom: 25px;
                                page-break-inside: avoid;
                            }
                            .section-title {
                                background-color: #3498db;
                                color: white;
                                padding: 10px 15px;
                                font-size: 13pt;
                                font-weight: bold;
                                margin: 0 0 15px 0;
                                border-radius: 4px;
                            }
                            .info-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 15px;
                                margin-bottom: 20px;
                            }
                            .info-item {
                                padding: 10px;
                                background-color: #f8f9fa;
                                border-left: 4px solid #3498db;
                                border-radius: 4px;
                            }
                            .info-item strong {
                                display: block;
                                color: #2c3e50;
                                font-size: 10pt;
                                margin-bottom: 5px;
                                text-transform: uppercase;
                            }
                            .info-item span {
                                color: #333;
                                font-size: 11pt;
                            }
                            .content-box {
                                background-color: #ffffff;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                padding: 15px;
                                margin-bottom: 15px;
                                min-height: 60px;
                            }
                            .content-box strong {
                                display: block;
                                color: #2c3e50;
                                font-size: 10pt;
                                margin-bottom: 10px;
                                text-transform: uppercase;
                                border-bottom: 1px solid #eee;
                                padding-bottom: 5px;
                            }
                            .content-box p {
                                margin: 0;
                                color: #333;
                                white-space: pre-wrap;
                                word-wrap: break-word;
                            }
                            .footer {
                                margin-top: 30px;
                                padding-top: 15px;
                                border-top: 2px solid #ddd;
                                text-align: center;
                                color: #7f8c8d;
                                font-size: 9pt;
                            }
                            .full-width {
                                grid-column: 1 / -1;
                            }
                            @media print {
                                .section {
                                    page-break-inside: avoid;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)</h1>
                            <p class="subtitle">${peiAdaptacao ? 'Adaptação Curricular' : 'PEI Geral'}</p>
                    </div>

                        <div class="section">
                            <div class="section-title">INFORMAÇÕES DO ESTUDANTE</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <strong>Nome do Estudante</strong>
                                    <span>${pei.studentName}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Curso</strong>
                                    <span>${pei.course}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Componente Curricular</strong>
                                    <span>${pei.subject}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Professor</strong>
                                    <span>${pei.teacher}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Ano/Semestre</strong>
                                    <span>${pei.yearSemester}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Necessidade Específica</strong>
                                    <span>${pei.necessidadeEspecifica}</span>
                                </div>
                            </div>
                            ${pei.ementa ? `
                            <div class="content-box full-width">
                                <strong>Ementa do Componente Curricular</strong>
                                <p>${pei.ementa}</p>
                            </div>
                            ` : ''}
                        </div>

                        <div class="section">
                            <div class="section-title">PEI GERAL (Criado pelo NAPNE)</div>
                            ${pei.generalObjective ? `
                            <div class="content-box">
                                <strong>Objetivo Geral</strong>
                                <p>${pei.generalObjective}</p>
                            </div>
                            ` : ''}
                            ${pei.contents ? `
                            <div class="content-box">
                                <strong>Conteúdos</strong>
                                <p>${pei.contents}</p>
                            </div>
                            ` : ''}
                            ${pei.dificuldades ? `
                            <div class="content-box">
                                <strong>Dificuldades Identificadas</strong>
                                <p>${pei.dificuldades}</p>
                            </div>
                            ` : ''}
                            ${pei.interessesHabilidades ? `
                            <div class="content-box">
                                <strong>Interesses e Habilidades</strong>
                                <p>${pei.interessesHabilidades}</p>
                            </div>
                            ` : ''}
                            ${pei.estrategias ? `
                            <div class="content-box">
                                <strong>Estratégias Pedagógicas</strong>
                                <p>${pei.estrategias}</p>
                            </div>
                            ` : ''}
                            ${pei.observacoes ? `
                            <div class="content-box">
                                <strong>Observações</strong>
                                <p>${pei.observacoes}</p>
                            </div>
                            ` : ''}
                            ${pei.historicoAluno ? `
                            <div class="content-box">
                                <strong>Histórico do Aluno</strong>
                                <p>${pei.historicoAluno}</p>
                            </div>
                            ` : ''}
                            ${pei.napneOpinion ? `
                            <div class="content-box">
                                <strong>Parecer do NAPNE</strong>
                                <p>${pei.napneOpinion}</p>
                            </div>
                            ` : ''}
                        </div>

                        <div class="section">
                            <div class="section-title">PEI ADAPTAÇÃO (Criado pelo Professor)</div>
                            ${pei.specificObjectives ? `
                            <div class="content-box">
                                <strong>Objetivos Específicos</strong>
                                <p>${pei.specificObjectives}</p>
                            </div>
                            ` : ''}
                            ${pei.methodology ? `
                            <div class="content-box">
                                <strong>Metodologia</strong>
                                <p>${pei.methodology}</p>
                            </div>
                            ` : ''}
                            ${pei.evaluation ? `
                            <div class="content-box">
                                <strong>Avaliação</strong>
                                <p>${pei.evaluation}</p>
                            </div>
                            ` : ''}
                            ${pei.opinion ? `
                            <div class="content-box">
                                <strong>Parecer do Professor</strong>
                                <p>${pei.opinion}</p>
                            </div>
                            ` : ''}
                            ${pei.comentarios_napne ? `
                            <div class="content-box" style="background-color: #fff3cd; border-color: #ffc107;">
                                <strong>Comentários do NAPNE sobre a Adaptação</strong>
                                <p>${pei.comentarios_napne}</p>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            <p>Documento gerado em ${currentDate} - Sistema NAPNE</p>
                        </div>
                    </body>
                    </html>
                `;
            }
        } else {
            
            const peiForm = document.querySelector("#peiForm");
            const clone = peiForm.cloneNode(true);
            clone.querySelector(".form-actions")?.remove();
            
            
            const style = document.createElement('style');
            style.textContent = `
                body { font-family: Arial, sans-serif; padding: 20px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { font-weight: bold; color: #2c3e50; display: block; margin-bottom: 5px; }
                .form-group input, .form-group select, .form-group textarea { 
                    width: 100%; 
                    padding: 8px; 
                    border: 1px solid #ddd; 
                    border-radius: 4px;
                    font-size: 11pt;
                }
                .form-group textarea { 
                    min-height: 80px; 
                    white-space: pre-wrap;
                }
                h3 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
                hr { margin: 20px 0; border: 1px solid #ddd; }
            `;
            clone.appendChild(style);
            
            content = clone.outerHTML;
        }

        
        const select = document.getElementById("studentName");
        const studentName = select ? select.options[select.selectedIndex]?.text || select.value : 'PEI';
        const valor = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'PEI';

        
        const options = {
            margin: [15, 15, 15, 15],
            filename: valor + '_PEI',
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: {
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        }

        
        html2pdf().set(options).from(content).save();
    }
    
    
    
    
    
});



if (typeof window.openModalGeral === 'undefined') {
    window.openModalGeral = function() {
    };
}

if (typeof window.deletePeiGeral === 'undefined') {
    window.deletePeiGeral = function() {
    };
}

if (typeof window.deletePeiAdaptacao === 'undefined') {
    window.deletePeiAdaptacao = function() {
    };
}