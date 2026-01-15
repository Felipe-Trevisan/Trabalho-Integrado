
document.addEventListener('DOMContentLoaded', function() {
    
    function formatCPF(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return cpf;
    }

    
    function formatTelefone(telefone) {
        if (!telefone) return '';
        telefone = telefone.replace(/\D/g, '');
        if (telefone.length <= 10) {
            telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
            telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
            telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
        }
        return telefone;
    }

    
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
    if (tipo !== 'NAPNE' && tipo !== 'CAE' && tipo !== 'DOCENTE') {
        window.location.href = 'index.html';
        return;
    }

    
    const isCae = tipo === 'CAE';

    
    const newStudentBtn = document.getElementById('newStudentBtn');
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const studentsTableBody = document.getElementById('students-table-body');
    

    
    let students = [];
    let courses = [];
    let matriculas = [];
    let necessidades = [];
    let estudantesNecessidades = [];
    let responsaveis = [];
    let respEstudantes = [];

    

    
    init();
    
    
    setTimeout(() => {
        const courseSelect = document.getElementById('studentCourse');
        if (courseSelect) {
            populateCourseSelect();
        }
    }, 500);

    async function init() {
        setupEventListeners();
        await loadData();
        loadStudentsTable();
        setupSearch();
    }

    async function loadData() {
        try {
            
            const [coursesData, studentsData, matriculasData, necessidadesData, estudantesNecessidadesData, responsaveisData, respEstudantesData] = await Promise.all([
                API_CONFIG.get('cursos'),
                API_CONFIG.get('estudantes'),
                API_CONFIG.get('matriculas'),
                API_CONFIG.get('necessidades'),
                API_CONFIG.get('estudantes-necessidades'),
                API_CONFIG.get('responsaveis'),
                API_CONFIG.get('resp-estudantes')
            ]);

            
            courses = Array.isArray(coursesData) && coursesData.length > 0 
                ? coursesData.map(c => ({
                    id: c.codigo || c.id,
                    code: c.codigo || c.code,
                    name: c.nome || c.name || '',
                    level: c.modalidade || c.level || 'Técnico'
                }))
                : [];

            students = Array.isArray(studentsData) && studentsData.length > 0
                ? studentsData
                : [];

            matriculas = Array.isArray(matriculasData) && matriculasData.length > 0
                ? matriculasData
                : [];

            necessidades = Array.isArray(necessidadesData) && necessidadesData.length > 0
                ? necessidadesData.map(n => ({
                    id: n.necessidade_id || n.id,
                    nome: n.nome || n.name || '',
                    descricao: n.descricao || n.description || ''
                }))
                : [];

            estudantesNecessidades = Array.isArray(estudantesNecessidadesData) && estudantesNecessidadesData.length > 0
                ? estudantesNecessidadesData
                : [];

            responsaveis = Array.isArray(responsaveisData) && responsaveisData.length > 0
                ? responsaveisData.map(r => ({
                    id: r.id_responsavel || r.id,
                    nome: r.nome_responsavel || r.nome || '',
                    cpf: r.cpf_responsavel || r.cpf || '',
                    contato: r.contato_responsavel || r.contato || '',
                    endereco: r.endereco_responsavel || r.endereco || ''
                }))
                : [];

            respEstudantes = Array.isArray(respEstudantesData) && respEstudantesData.length > 0
                ? respEstudantesData
                : [];

            
            populateNecessidadesSelect();

        } catch (error) {
            
            if (error instanceof SyntaxError) {
                
            } else {
                let errorMessage = error.message || 'Erro ao carregar dados do servidor';
                
                if (typeof showToast === 'function') {
                    showToast(errorMessage, 'error');
                }
            }
            
            
            courses = [];
            students = [];
            matriculas = [];
            necessidades = [];
            estudantesNecessidades = [];
            responsaveis = [];
            respEstudantes = [];
        }
    }

    function populateNecessidadesSelect() {
        const container = document.getElementById('necessidades-container');
        if (!container) {
            return;
        }

        container.innerHTML = '';
        
        if (Array.isArray(necessidades) && necessidades.length > 0) {
            necessidades.forEach(need => {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.marginBottom = '10px';
                label.style.cursor = 'pointer';
                label.style.userSelect = 'none';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = need.id;
                checkbox.id = `necessidade-${need.id}`;
                checkbox.name = 'necessidades';
                checkbox.style.marginRight = '10px';
                checkbox.style.width = '18px';
                checkbox.style.height = '18px';
                checkbox.style.cursor = 'pointer';
                checkbox.style.flexShrink = '0';
                
                const span = document.createElement('span');
                span.textContent = need.nome;
                span.style.fontSize = '0.95rem';
                span.style.flex = '1';
            
                
                label.addEventListener('click', function(e) {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                });
                
                label.appendChild(checkbox);
                label.appendChild(span);
                container.appendChild(label);
            });
        } else {
            container.innerHTML = '<p style="color: #666; font-size: 0.9em; margin: 0;">Nenhuma necessidade cadastrada. Cadastre necessidades na página de Necessidades.</p>';
        }
    }
    
    async function criarOuAtualizarMatricula(estudanteId, matriculaNum, cursoId) {
        try {
            
            if (!matriculaNum || !matriculaNum.trim()) {
                throw new Error('Número de matrícula é obrigatório!');
            }
            
            if (!cursoId || !cursoId.toString().trim()) {
                throw new Error('Curso é obrigatório!');
            }
            
            
            const matriculaExistente = Array.isArray(matriculas) 
                ? matriculas.find(m => {
                    const matriculaEstudanteId = m.estudante_id || m.estudanteId || m.id_aluno;
                    return matriculaEstudanteId == estudanteId || 
                           matriculaEstudanteId === estudanteId || 
                           parseInt(matriculaEstudanteId) === parseInt(estudanteId);
                })
                : null;
            
            if (matriculaExistente) {
                
                if (matriculaExistente.matricula === matriculaNum) {
                    
                    await API_CONFIG.put(`matriculas/${matriculaExistente.matricula}`, {
                        estudante_id: estudanteId,
                        curso_id: cursoId.toString(), 
                        ativo: true
                    });
                } else {
                    
                    try {
                        await API_CONFIG.delete(`matriculas/${matriculaExistente.matricula}`);
                    } catch (e) {
                    }
                    
                    await API_CONFIG.post('matriculas', {
                        matricula: matriculaNum.trim(),
                        estudante_id: estudanteId,
                        curso_id: cursoId.toString(), 
                        ativo: true
                    });
                }
            } else {
                
                await API_CONFIG.post('matriculas', {
                    matricula: matriculaNum.trim(),
                    estudante_id: estudanteId,
                    curso_id: cursoId.toString(), 
                    ativo: true
                });
            }
            
            
            try {
                const matriculasAtualizadas = await API_CONFIG.get('matriculas');
                if (Array.isArray(matriculasAtualizadas)) {
                    matriculas = matriculasAtualizadas;
                }
            } catch (e) {
            }
        } catch (error) {
            throw error; 
        }
    }

    
    function getStudentsWithMatricula() {
        
        if (!Array.isArray(students) || students.length === 0) {
            return [];
        }
        
        return students.map(estudante => {
            if (!estudante) return null;
            
            
            const cpfEstudante = estudante.cpf ? estudante.cpf.replace(/\D/g, '') : '';
            const necessidadesEstudante = Array.isArray(estudantesNecessidades)
                ? estudantesNecessidades
                    .filter(en => {
                        const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                        return cpfRelacao === cpfEstudante;
                    })
                    .map(en => {
                        const necessidade = necessidades.find(n => n.id === en.necessidade_id);
                        return necessidade ? necessidade.nome : null;
                    })
                    .filter(n => n !== null)
                : [];
            
            
            const responsavelRelacao = Array.isArray(respEstudantes)
                ? respEstudantes.find(re => re.id_aluno === estudante.id_aluno || re.id_aluno === estudante.id)
                : null;
            
            let responsavelNome = 'N/A';
            let ehProprioResponsavel = false;
            if (responsavelRelacao) {
                const responsavel = responsaveis.find(r => r.id === responsavelRelacao.id_responsavel);
                if (responsavel) {
                    responsavelNome = responsavel.nome || 'N/A';
                    
                    const cpfResp = (responsavel.cpf || '').replace(/\D/g, '');
                    ehProprioResponsavel = cpfResp === cpfEstudante;
                    if (ehProprioResponsavel) {
                        responsavelNome = 'Próprio aluno';
                    }
                }
            }
            
            
            const idAluno = estudante.id_aluno || estudante.id;
            
            
            let matriculaNum = estudante.matricula || 'N/A';
            
            
            let matriculaObj = null;
            if (Array.isArray(matriculas) && matriculas.length > 0) {
                matriculaObj = matriculas.find(m => {
                    const matriculaEstudanteId = m.estudante_id || m.estudanteId || m.id_aluno;
                    return matriculaEstudanteId == idAluno || 
                           matriculaEstudanteId === idAluno || 
                           parseInt(matriculaEstudanteId) === parseInt(idAluno);
                });
                
                
                if (matriculaObj && (!matriculaNum || matriculaNum === 'N/A')) {
                    matriculaNum = matriculaObj.matricula || matriculaObj.numero || 'N/A';
                }
            }
            
            
            let cursoNome = 'N/A';
            if (matriculaObj) {
                const cursoIdMatricula = matriculaObj.curso_id || matriculaObj.cursoId || matriculaObj.curso;
                if (cursoIdMatricula) {
                    const curso = courses.find(c => {
                        const cursoId = c.id || c.codigo || c.code;
                        return cursoId == cursoIdMatricula || 
                               cursoId === cursoIdMatricula || 
                               cursoId === cursoIdMatricula.toString();
                    });
                    if (curso) {
                        cursoNome = curso.name || curso.nome || curso.code || curso.codigo || 'N/A';
                    }
                }
            }
            
            
            if (!matriculaNum || matriculaNum === '') {
                matriculaNum = 'N/A';
            }
            
            return {
                id: estudante.id_aluno || estudante.id,
                id_aluno: estudante.id_aluno || estudante.id,
                name: estudante.nome || estudante.name || '',
                cpf: formatCPF(estudante.cpf || ''),
                cpfRaw: cpfEstudante,
                contato: estudante.contato || '',
                matricula: matriculaNum,
                curso: cursoNome,
                cursoId: matriculaObj ? (matriculaObj.curso_id || matriculaObj.cursoId) : null,
                precisa_atendimento_psicopedagogico: estudante.precisa_atendimento_psicopedagogico === 1 || 
                                                      estudante.precisa_atendimento_psicopedagogico === true ||
                                                      estudante.psychopedagogical === true,
                psychopedagogical: estudante.precisa_atendimento_psicopedagogico === 1 || 
                                 estudante.precisa_atendimento_psicopedagogico === true ||
                                 estudante.psychopedagogical === true,
                necessidades: necessidadesEstudante,
                necessidadesIds: Array.isArray(estudantesNecessidades)
                    ? estudantesNecessidades
                        .filter(en => {
                            const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                            return cpfRelacao === cpfEstudante;
                        })
                        .map(en => en.necessidade_id)
                    : [],
                historico: estudante.historico || '',
                responsavel: responsavelNome,
                ehProprioResponsavel: ehProprioResponsavel,
                idResponsavel: responsavelRelacao ? responsavelRelacao.id_responsavel : null
            };
        }).filter(s => s !== null); 
    }

    function setupEventListeners() {
        
        if (isCae && newStudentBtn) {
            newStudentBtn.style.display = 'none';
        } else if (newStudentBtn) {
        newStudentBtn.addEventListener('click', () => openStudentModal());
        }
        if (studentForm) {
        studentForm.addEventListener('submit', handleStudentSubmit);
        }
        
        
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', function(e) {
                e.target.value = formatCPF(e.target.value);
            });
        }
        
        
        const responsavelCpfInput = document.getElementById('responsavelCpf');
        if (responsavelCpfInput) {
            responsavelCpfInput.addEventListener('input', function(e) {
                e.target.value = formatCPF(e.target.value);
            });
        }
        
        
        const responsavelContatoInput = document.getElementById('responsavelContato');
        if (responsavelContatoInput) {
            responsavelContatoInput.addEventListener('input', function(e) {
                e.target.value = formatTelefone(e.target.value);
            });
        }
        
        
        const ehMaiorIdadeCheck = document.getElementById('ehMaiorIdade');
        const responsavelSection = document.getElementById('responsavelSection');
        if (ehMaiorIdadeCheck && responsavelSection) {
            ehMaiorIdadeCheck.addEventListener('change', function() {
                if (this.checked) {
                    
                    responsavelSection.style.display = 'none';
                    
                    const nome = document.getElementById('name').value;
                    const cpf = document.getElementById('cpf').value.replace(/\D/g, ''); 
                    const contato = document.getElementById('contato').value;
                    
                    const endereco = '';
                    
                    document.getElementById('responsavelNome').value = nome;
                    document.getElementById('responsavelCpf').value = cpf;
                    document.getElementById('responsavelContato').value = contato;
                    document.getElementById('responsavelEndereco').value = endereco;
                } else {
                    
                    responsavelSection.style.display = 'block';
                }
            });
        }
        
        
        
        
        
        setupModalEvents();
        
        
        setupFilterEvents();
        
        
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    function setupModalEvents() {
        const closeBtn = studentModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelStudent');
        
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(studentModal));
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(studentModal));
        
        studentModal.addEventListener('click', (e) => {
            if (e.target === studentModal) closeModal(studentModal);
        });
    }

    function setupFilterEvents() {
        
        const searchInput = document.getElementById('searchStudent');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterStudentsBySearch(this.value);
                if (this.value.trim() !== '') {
                    if (clearSearchBtn) clearSearchBtn.style.display = 'inline-block';
                } else {
                    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                }
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (searchInput) {
                    searchInput.value = '';
                    filterStudentsBySearch('');
                }
                clearSearchBtn.style.display = 'none';
        });
        }
    }

    

    function openStudentModal(student = null) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('studentForm');
        
        
        populateNecessidadesSelect();
        
        if (student) {
            title.textContent = 'Editar Estudante';
            
            setTimeout(() => {
            populateForm(student);
            }, 100);
        } else {
            title.textContent = 'Novo Estudante';
            form.reset();
            document.getElementById('studentId').value = '';
            document.getElementById('historico').value = '';
            
            setTimeout(() => {
                const checkboxes = document.querySelectorAll('input[name="necessidades"]');
                checkboxes.forEach(cb => cb.checked = false);
            }, 100);
            
            document.getElementById('responsavelNome').value = '';
            document.getElementById('responsavelCpf').value = '';
            document.getElementById('responsavelContato').value = '';
            document.getElementById('responsavelEndereco').value = '';
            document.getElementById('ehMaiorIdade').checked = false;
            document.getElementById('responsavelSection').style.display = 'block';
            
            populateCourseSelect();
        }
        
        studentModal.style.display = 'block';
    }
    
    function populateCourseSelect() {
        const courseSelect = document.getElementById('studentCourse');
        if (!courseSelect) return;
        
        const currentValue = courseSelect.value;
        courseSelect.innerHTML = '<option value="">Selecione um curso (opcional)</option>';
        
        if (Array.isArray(courses) && courses.length > 0) {
            courses.forEach(course => {
                const option = document.createElement('option');
                const courseId = course.id || course.codigo || course.code;
                const courseName = course.name || course.nome || course.code || course.codigo || 'Curso sem nome';
                option.value = courseId;
                option.textContent = courseName;
                courseSelect.appendChild(option);
            });
            
            
            if (currentValue) {
                courseSelect.value = currentValue;
            }
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum curso cadastrado';
            courseSelect.appendChild(option);
        }
    }

    function populateForm(student) {
        document.getElementById('studentId').value = student.id || student.id_aluno || '';
        document.getElementById('name').value = student.name || student.nome || '';
        document.getElementById('cpf').value = formatCPF(student.cpf || '');
        document.getElementById('contato').value = student.contato || '';
        document.getElementById('historico').value = student.historico || '';
        
        
        
        const psychopedagogical = document.getElementById('psychopedagogical');
        if (psychopedagogical) {
            
            const psychValue = student.precisa_atendimento_psicopedagogico || 
                             student.psychopedagogical || 
                             false;
            psychopedagogical.value = (psychValue === true || psychValue === 1 || psychValue === '1' || psychValue === 'true') ? 'true' : 'false';
        }
        
        
        
        setTimeout(() => {
            if (student.necessidadesIds && Array.isArray(student.necessidadesIds) && student.necessidadesIds.length > 0) {
                student.necessidadesIds.forEach(necessidadeId => {
                    const checkbox = document.getElementById(`necessidade-${necessidadeId}`);
                    if (checkbox) {
                        checkbox.checked = true;
        }
                });
            }
        }, 150);
        
        
        const matriculaInput = document.getElementById('studentMatricula');
        const courseSelect = document.getElementById('studentCourse');
        
        
        if (matriculaInput) {
            if (student.matricula && student.matricula !== 'N/A' && student.matricula !== '') {
                matriculaInput.value = student.matricula;
            } else {
                matriculaInput.value = '';
            }
        }
        
        
        if (courseSelect) {
            
            populateCourseSelect();
            
            
            if (student.cursoId) {
                
                setTimeout(() => {
                    courseSelect.value = student.cursoId;
                }, 50);
            } else {
                courseSelect.value = '';
            }
        }
        
        
        const responsavelRelacao = Array.isArray(respEstudantes)
            ? respEstudantes.find(re => re.id_aluno === student.id || re.id_aluno === student.id_aluno)
            : null;
        
        if (responsavelRelacao) {
            const responsavel = responsaveis.find(r => r.id === responsavelRelacao.id_responsavel);
            if (responsavel) {
                
                const cpfAluno = (student.cpf || '').replace(/\D/g, '');
                const cpfResponsavel = (responsavel.cpf || '').replace(/\D/g, '');
                const ehProprioResponsavel = cpfAluno === cpfResponsavel;
                
                const ehMaiorIdadeCheck = document.getElementById('ehMaiorIdade');
                if (ehMaiorIdadeCheck) {
                    ehMaiorIdadeCheck.checked = ehProprioResponsavel;
                    ehMaiorIdadeCheck.dispatchEvent(new Event('change'));
                }
                
                if (!ehProprioResponsavel) {
                    document.getElementById('responsavelNome').value = responsavel.nome || '';
                    document.getElementById('responsavelCpf').value = formatCPF(responsavel.cpf || '');
                    document.getElementById('responsavelContato').value = responsavel.contato || '';
                    document.getElementById('responsavelEndereco').value = responsavel.endereco || '';
                }
            }
        }
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    async function handleStudentSubmit(e) {
        e.preventDefault();
        
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        
        const studentId = document.getElementById('studentId').value;
        const cpfRaw = document.getElementById('cpf').value.replace(/\D/g, '');
        
        
        const psychopedagogicalSelect = document.getElementById('psychopedagogical');
        let precisaAtendimento = 0;
        if (psychopedagogicalSelect && psychopedagogicalSelect.value) {
            precisaAtendimento = (psychopedagogicalSelect.value === 'true' || psychopedagogicalSelect.value === '1') ? 1 : 0;
        }
        
        
        const contatoRaw = document.getElementById('contato')?.value.replace(/\D/g, '') || '';
        
        
        const checkboxes = document.querySelectorAll('input[name="necessidades"]:checked');
        const necessidadeSelecionada = Array.from(checkboxes)
            .map(cb => parseInt(cb.value))
            .filter(id => id > 0);
        
        
        const matriculaInput = document.getElementById('studentMatricula');
        const courseSelect = document.getElementById('studentCourse');
        const matricula = matriculaInput ? matriculaInput.value.trim() : '';
        const courseId = courseSelect && courseSelect.value ? courseSelect.value : '';
        
        
        if (!matricula) {
            alert('Por favor, informe o número de matrícula do estudante!');
            if (matriculaInput) matriculaInput.focus();
            return;
        }
        
        if (!courseId) {
            alert('Por favor, selecione o curso do estudante!');
            if (courseSelect) courseSelect.focus();
            return;
        }
        
        const historico = document.getElementById('historico')?.value.trim() || '';
        
        const formData = {
            cpf: cpfRaw,
            nome: document.getElementById('name').value.trim(),
            contato: contatoRaw,
            precisa_atendimento_psicopedagogico: precisaAtendimento, 
            matricula: matricula, 
            courseId: courseId, 
            historico: historico
        };

        try {
            let estudanteSalvo;
            if (studentId) {
                
                
                const historico = document.getElementById('historico')?.value.trim() || '';
                
                const estudanteData = {
                    cpf: cpfRaw,
                    nome: document.getElementById('name').value.trim(),
                    contato: contatoRaw,
                    matricula: matricula, 
                    precisa_atendimento_psicopedagogico: precisaAtendimento,
                    historico: historico
                };
                
                estudanteSalvo = await API_CONFIG.put(`estudantes/${studentId}`, estudanteData);
                
                
                await criarOuAtualizarMatricula(estudanteSalvo.id_aluno || estudanteSalvo.id, matricula, courseId);
                
                
                await gerenciarNecessidadesEstudante(cpfRaw, necessidadeSelecionada);
                
                
                await gerenciarResponsavelEstudante(parseInt(studentId), estudanteSalvo);
                
                showToast('Estudante atualizado com sucesso!', 'success');
            } else {
                
                estudanteSalvo = await API_CONFIG.post('estudantes', formData);
                
                
                
                try {
                    const matriculasAtualizadas = await API_CONFIG.get('matriculas');
                    const matriculaCriada = Array.isArray(matriculasAtualizadas) 
                        ? matriculasAtualizadas.find(m => m.estudante_id === (estudanteSalvo.id_aluno || estudanteSalvo.id))
                        : null;
                    
                    if (!matriculaCriada) {
                        await criarOuAtualizarMatricula(estudanteSalvo.id_aluno || estudanteSalvo.id, matricula, courseId);
                    } else {
                        
                        matriculas = matriculasAtualizadas;
                    }
                } catch (e) {
                    
                    await criarOuAtualizarMatricula(estudanteSalvo.id_aluno || estudanteSalvo.id, matricula, courseId);
                }
                
                
                await gerenciarNecessidadesEstudante(cpfRaw, necessidadeSelecionada);
                
                
                const idAluno = estudanteSalvo.id_aluno || estudanteSalvo.id;
                await gerenciarResponsavelEstudante(idAluno, estudanteSalvo);
                
                showToast('Estudante cadastrado com sucesso!', 'success');
            }
            
            
            await loadData();
            loadStudentsTable();
            closeModal(studentModal);
        } catch (error) {
            const errorMessage = error.message || 'Erro ao salvar estudante';
            showToast(errorMessage, 'error');
            
            if (errorMessage.includes('matrícula') || errorMessage.includes('Matrícula')) {
                const matriculaInput = document.getElementById('studentMatricula');
                if (matriculaInput) {
                    matriculaInput.focus();
                }
            }
        }
    }

    async function gerenciarResponsavelEstudante(idAluno, estudante) {
        if (!idAluno) return;

        const ehMaiorIdade = document.getElementById('ehMaiorIdade')?.checked || false;
        
        
        const responsavelAtual = Array.isArray(respEstudantes)
            ? respEstudantes.find(re => re.id_aluno === idAluno)
            : null;

        if (ehMaiorIdade) {
            
            const cpfAluno = (estudante.cpf || document.getElementById('cpf').value).replace(/\D/g, '');
            const nomeAluno = estudante.nome || document.getElementById('name').value;
            const contatoAluno = estudante.contato || document.getElementById('contato').value || '';
            
            const enderecoAluno = '';
            
            
            let responsavelExistente = responsaveis.find(r => {
                const cpfResp = (r.cpf || '').replace(/\D/g, '');
                return cpfResp === cpfAluno;
            });
            
            let idResponsavel;
            
            if (!responsavelExistente) {
                
                const novoResponsavel = await API_CONFIG.post('responsaveis', {
                    nome_responsavel: nomeAluno,
                    cpf_responsavel: cpfAluno,
                    contato_responsavel: contatoAluno.replace(/\D/g, ''),
                    endereco_responsavel: enderecoAluno
                });
                idResponsavel = novoResponsavel.id_responsavel || novoResponsavel.id;
            } else {
                idResponsavel = responsavelExistente.id;
            }
            
            
            if (responsavelAtual) {
                if (responsavelAtual.id_responsavel !== idResponsavel) {
                    
                    try {
                        await API_CONFIG.delete(`resp-estudantes/${responsavelAtual.id_responsavel}-${idAluno}`);
                    } catch (error) {
                    }
                    
                    
                    try {
                        await API_CONFIG.post('resp-estudantes', {
                            id_responsavel: idResponsavel,
                            id_aluno: idAluno
                        });
                    } catch (error) {
                    }
                }
            } else {
                
                try {
                    await API_CONFIG.post('resp-estudantes', {
                        id_responsavel: idResponsavel,
                        id_aluno: idAluno
                    });
                } catch (error) {
                }
            }
        } else {
            
            const responsavelNome = document.getElementById('responsavelNome')?.value.trim() || '';
            const responsavelCpfRaw = document.getElementById('responsavelCpf')?.value.replace(/\D/g, '') || '';
            const responsavelContatoRaw = document.getElementById('responsavelContato')?.value.replace(/\D/g, '') || '';
            const responsavelEndereco = document.getElementById('responsavelEndereco')?.value.trim() || '';
            
            if (!responsavelNome || !responsavelCpfRaw) {
                
                if (responsavelAtual) {
                    try {
                        await API_CONFIG.delete(`resp-estudantes/${responsavelAtual.id_responsavel}-${idAluno}`);
                    } catch (error) {
                    }
                }
                return;
            }
            
            
            let responsavelExistente = responsaveis.find(r => {
                const cpfResp = (r.cpf || '').replace(/\D/g, '');
                return cpfResp === responsavelCpfRaw;
            });
            
            let idResponsavel;
            
            if (!responsavelExistente) {
                
                const novoResponsavel = await API_CONFIG.post('responsaveis', {
                    nome_responsavel: responsavelNome,
                    cpf_responsavel: responsavelCpfRaw,
                    contato_responsavel: responsavelContatoRaw,
                    endereco_responsavel: responsavelEndereco
                });
                idResponsavel = novoResponsavel.id_responsavel || novoResponsavel.id;
            } else {
                idResponsavel = responsavelExistente.id;
                
                
                if (responsavelNome !== responsavelExistente.nome || 
                    responsavelEndereco !== responsavelExistente.endereco ||
                    responsavelContatoRaw !== (responsavelExistente.contato || '').replace(/\D/g, '')) {
                    try {
                        await API_CONFIG.put(`responsaveis/${idResponsavel}`, {
                            nome_responsavel: responsavelNome,
                            cpf_responsavel: responsavelCpfRaw,
                            contato_responsavel: responsavelContatoRaw,
                            endereco_responsavel: responsavelEndereco
                        });
                    } catch (error) {
                    }
                }
            }
            
            
            if (responsavelAtual) {
                if (responsavelAtual.id_responsavel !== idResponsavel) {
                    
                    try {
                        await API_CONFIG.delete(`resp-estudantes/${responsavelAtual.id_responsavel}-${idAluno}`);
                    } catch (error) {
                    }
                    
                    
                    try {
                        await API_CONFIG.post('resp-estudantes', {
                            id_responsavel: idResponsavel,
                            id_aluno: idAluno
                        });
                    } catch (error) {
                    }
                }
            } else {
                
                try {
                    await API_CONFIG.post('resp-estudantes', {
                        id_responsavel: idResponsavel,
                        id_aluno: idAluno
                    });
                } catch (error) {
                }
            }
        }
    }

    async function gerenciarNecessidadesEstudante(cpfEstudante, necessidadesSelecionadas) {
        if (!cpfEstudante) return;

        
        const cpfLimpo = cpfEstudante.replace(/\D/g, '');
        const necessidadesAtuais = Array.isArray(estudantesNecessidades)
            ? estudantesNecessidades
                .filter(en => {
                    const cpfRelacao = en.estudante_cpf ? en.estudante_cpf.replace(/\D/g, '') : '';
                    return cpfRelacao === cpfLimpo;
                })
                .map(en => en.necessidade_id)
            : [];

        
        const necessidadesParaAdicionar = necessidadesSelecionadas.filter(id => !necessidadesAtuais.includes(id));
        const necessidadesParaRemover = necessidadesAtuais.filter(id => !necessidadesSelecionadas.includes(id));

        
        for (const necessidadeId of necessidadesParaRemover) {
                    try {
                        await API_CONFIG.delete(`estudantes-necessidades/${cpfLimpo}-${necessidadeId}`);
                    } catch (error) {
                    }
                }
                
        
        for (const necessidadeId of necessidadesParaAdicionar) {
                try {
                    await API_CONFIG.post('estudantes-necessidades', {
                        estudante_cpf: cpfLimpo,
                    necessidade_id: necessidadeId
                    });
                } catch (error) {
                }
            }
        
        
                try {
            estudantesNecessidades = await API_CONFIG.get('estudantes-necessidades');
                } catch (error) {
        }
    }

    function loadStudentsTable() {
        studentsTableBody.innerHTML = '';
        
        const studentsWithData = getStudentsWithMatricula();
        
        if (studentsWithData.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-user-graduate"></i>
                        <h3>Nenhum estudante cadastrado</h3>
                        <p>Clique em "Novo Estudante" para começar</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        studentsWithData.forEach(student => {
            const necessidadesTexto = student.necessidades && student.necessidades.length > 0
                ? student.necessidades.join(', ')
                : 'Nenhuma';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td class="cpf-input">${student.cpf}</td>
                <td>${student.matricula || 'N/A'}</td>
                <td>${student.curso || 'N/A'}</td>
                <td>${student.contato || 'N/A'}</td>
                <td>${student.responsavel || 'N/A'}</td>
                <td><span class="badge" title="${necessidadesTexto}">${student.necessidades && student.necessidades.length > 0 ? student.necessidades.length + ' necessidade(s)' : 'Nenhuma'}</span></td>
                <td><span class="badge ${student.psychopedagogical ? 'sim' : 'não'}">${student.psychopedagogical ? 'Sim' : 'Não'}</span></td>
                <td>
                    ${!isCae ? `
                    <button class="btn btn-sm btn-primary" onclick="editStudent(${student.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : '<span style="color: #999;">Somente visualização</span>'}
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    }

    function setupSearch() {
        
    }

    function filterStudentsBySearch(searchTerm) {
        if (!studentsTableBody) return;
        
        const term = searchTerm.toLowerCase().trim();
        
        if (term === '') {
        loadStudentsTable();
            return;
        }
        
        const studentsWithData = getStudentsWithMatricula();
        const filtered = studentsWithData.filter(student => {
            
            const nomeMatch = (student.name || student.nome || '').toLowerCase().includes(term);
            
            
            const cpfValue = student.cpf || '';
            const cpfClean = cpfValue.replace(/\D/g, '');
            const cpfMatch = cpfClean.includes(term.replace(/\D/g, ''));
            
            
            const matriculaMatch = (student.matricula || '').toLowerCase().includes(term);
            
            
            const cursoMatch = (student.curso || student.cursoNome || '').toLowerCase().includes(term);
            
            
            const contatoValue = student.contato || '';
            const contatoClean = contatoValue.replace(/\D/g, '');
            const contatoMatch = contatoClean.includes(term.replace(/\D/g, ''));
            
            return nomeMatch || cpfMatch || matriculaMatch || cursoMatch || contatoMatch;
        });
        
        renderStudentsTable(filtered);
    }
    
    function renderStudentsTable(studentsToRender) {
        if (!studentsTableBody) return;
        
        studentsTableBody.innerHTML = '';
        
        if (studentsToRender.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-message">
                        <i class="fas fa-search"></i>
                        <p>Nenhum estudante encontrado com o termo pesquisado.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        studentsToRender.forEach(student => {
            const necessidadesTexto = student.necessidades && student.necessidades.length > 0
                ? student.necessidades.join(', ')
                : 'Nenhuma';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name || student.nome || 'N/A'}</td>
                <td class="cpf-input">${student.cpf || 'N/A'}</td>
                <td>${student.matricula || 'N/A'}</td>
                <td>${student.curso || student.cursoNome || 'N/A'}</td>
                <td>${student.contato || 'N/A'}</td>
                <td>${student.responsavel || 'N/A'}</td>
                <td><span class="badge" title="${necessidadesTexto}">${student.necessidades && student.necessidades.length > 0 ? student.necessidades.length + ' necessidade(s)' : 'Nenhuma'}</span></td>
                <td><span class="badge ${student.psychopedagogical || student.precisa_atendimento_psicopedagogico ? 'sim' : 'não'}">${student.psychopedagogical || student.precisa_atendimento_psicopedagogico ? 'Sim' : 'Não'}</span></td>
                <td>
                    ${!isCae ? `
                    <button class="btn btn-sm btn-primary" onclick="editStudent(${student.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : '<span style="color: #999;">Somente visualização</span>'}
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    
    window.editStudent = function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const studentsWithData = getStudentsWithMatricula();
        const student = studentsWithData.find(s => s.id === id);
        if (student) openStudentModal(student);
    };

    window.deleteStudent = async function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este estudante?')) {
            try {
                await API_CONFIG.delete(`estudantes/${id}`);
                showToast('Estudante excluído com sucesso!', 'success');
                await loadData();
                loadStudentsTable();
            } catch (error) {
                showToast(error.message || 'Erro ao excluir estudante', 'error');
            }
        }
    };

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

    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
});
