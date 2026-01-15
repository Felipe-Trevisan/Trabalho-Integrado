
document.addEventListener('DOMContentLoaded', function() {
    
    const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));
    if (!currentStudent) {
        window.location.href = 'index.html';
        return;
    }

    
    const logoutBtn = document.getElementById('logout');
    const studentWelcome = document.getElementById('student-welcome');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const peiModal = document.getElementById('peiModal');
    const closeModal = document.querySelector('.close');
    
    
    let studentData = null;
    let peisGeral = [];
    let peisAdaptacao = [];
    let courses = [];
    let subjects = [];
    let matriculas = [];

    
    init();

    async function init() {
        await loadData();
        loadStudentInfo();
        loadStudentPeis();
        setupEventListeners();
    }

    async function loadData() {
        try {
            
            const students = await API_CONFIG.get('estudantes');
            studentData = students.find(s => s.id_aluno == currentStudent.id || s.nome === currentStudent.name);
            
            if (studentData) {
                
                const allMatriculas = await API_CONFIG.get('matriculas');
                const matricula = allMatriculas.find(m => m.estudante_id === studentData.id_aluno);
                
                if (matricula) {
                    
                    [peisGeral, peisAdaptacao, courses, subjects] = await Promise.all([
                        API_CONFIG.get('peis'),
                        API_CONFIG.get('adaptacoes'),
                        API_CONFIG.get('cursos'),
                        API_CONFIG.get('componentes')
                    ]);
                    
                    
                    peisGeral = peisGeral.filter(pg => pg.matricula === matricula.matricula);
                    peisAdaptacao = peisAdaptacao.filter(pa => 
                        peisGeral.some(pg => pg.id === pa.pei_geral_id)
                    );
                }
            }
        } catch (error) {
        }
    }

    function loadStudentInfo() {
        if (studentData) {
            studentWelcome.textContent = `Bem-vindo(a), ${studentData.nome}`;
            if (document.getElementById('info-name')) {
                document.getElementById('info-name').textContent = studentData.nome;
            }
            if (document.getElementById('info-id')) {
                document.getElementById('info-id').textContent = studentData.id_aluno;
            }
            
            
            const matricula = matriculas.find(m => m.estudante_id === studentData.id_aluno);
            const course = matricula ? courses.find(c => c.codigo === matricula.curso_id) : null;
            
            if (document.getElementById('info-course')) {
                document.getElementById('info-course').textContent = course ? course.nome : 'Não informado';
            }
            if (document.getElementById('info-level')) {
                document.getElementById('info-level').textContent = course ? course.modalidade : 'Não informado';
            }
            if (document.getElementById('info-need')) {
                document.getElementById('info-need').textContent = studentData.precisa_atendimento_psicopedagogico ? 'Sim' : 'Não';
            }
        }
    }

    function loadStudentPeis() {
        
        const peisCompletos = peisAdaptacao.map(pa => {
            const peiGeral = peisGeral.find(pg => pg.id === pa.pei_geral_id);
            const subject = subjects.find(s => s.codigo_componente === pa.codigo_componente);
            
            return {
                id: pa.id,
                subject: subject ? subject.componente : 'N/A',
                teacher: pa.docente || 'N/A',
                yearSemester: peiGeral ? peiGeral.periodo : 'N/A',
                ementa: pa.ementa || '',
                generalObjective: pa.objetivo_geral || '',
                specificObjectives: pa.objetivos_especificos || '',
                contents: pa.conteudos || '',
                methodology: pa.metodologia || '',
                evaluation: pa.avaliacao || '',
                opinion: pa.comentarios_napne || '',
                type: 'adaptacao'
            };
        });
        
        
        const adaptacaoPeis = peisCompletos.filter(pei => pei.type === 'adaptacao');
        const historicoPeis = peisGeral.filter(pg => !peisAdaptacao.some(pa => pa.pei_geral_id === pg.id));
        
        
        displayPeisList(adaptacaoPeis, 'adaptacao-peis');
        
        
        displayPeisList(historicoPeis.map(pg => ({
            id: pg.id,
            subject: '-',
            teacher: '-',
            yearSemester: pg.periodo || 'N/A',
            ementa: '',
            generalObjective: '',
            specificObjectives: '',
            contents: '',
            methodology: '',
            evaluation: '',
            opinion: '',
            type: 'historico'
        })), 'historico-peis');
    }
    
    
    function displayPeisList(peis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (peis.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum PEI encontrado.</p>';
            return;
        }
        
        let html = '';
        peis.forEach(pei => {
            html += `
                <div class="pei-item">
                    <div class="pei-info">
                        <h3>${pei.subject}</h3>
                        <p>Docente: ${pei.teacher} | ${pei.yearSemester}</p>
                    </div>
                    <div class="pei-actions">
                        <button class="btn btn-view" onclick="viewPeiDetail(${pei.id})">Ver Detalhes</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    
    window.viewPeiDetail = function(peiId) {
        
        const peiAdaptacao = peisAdaptacao.find(p => p.id == peiId);
        const peiGeral = peiAdaptacao ? peisGeral.find(pg => pg.id === peiAdaptacao.pei_geral_id) : 
                                        peisGeral.find(pg => pg.id == peiId);
        
        if (peiAdaptacao) {
            const subject = subjects.find(s => s.codigo_componente === peiAdaptacao.codigo_componente);
            
            if (document.getElementById('modalTitle')) {
                document.getElementById('modalTitle').textContent = `PEI - ${subject ? subject.componente : 'N/A'}`;
            }
            if (document.getElementById('detail-subject')) {
                document.getElementById('detail-subject').textContent = subject ? subject.componente : 'N/A';
            }
            if (document.getElementById('detail-teacher')) {
                document.getElementById('detail-teacher').textContent = peiAdaptacao.docente || 'N/A';
            }
            if (document.getElementById('detail-yearSemester')) {
                document.getElementById('detail-yearSemester').textContent = peiGeral ? peiGeral.periodo : 'N/A';
            }
            if (document.getElementById('detail-ementa')) {
                document.getElementById('detail-ementa').textContent = peiAdaptacao.ementa || 'Não informado';
            }
            if (document.getElementById('detail-generalObjective')) {
                document.getElementById('detail-generalObjective').textContent = peiAdaptacao.objetivo_geral || 'Não informado';
            }
            if (document.getElementById('detail-specificObjectives')) {
                document.getElementById('detail-specificObjectives').textContent = peiAdaptacao.objetivos_especificos || 'Não informado';
            }
            if (document.getElementById('detail-contents')) {
                document.getElementById('detail-contents').textContent = peiAdaptacao.conteudos || 'Não informado';
            }
            if (document.getElementById('detail-methodology')) {
                document.getElementById('detail-methodology').textContent = peiAdaptacao.metodologia || 'Não informado';
            }
            if (document.getElementById('detail-evaluation')) {
                document.getElementById('detail-evaluation').textContent = peiAdaptacao.avaliacao || 'Não informado';
            }
            if (document.getElementById('detail-opinion')) {
                document.getElementById('detail-opinion').textContent = peiAdaptacao.comentarios_napne || 'Não informado';
            }
        } else if (peiGeral) {
            if (document.getElementById('modalTitle')) {
                document.getElementById('modalTitle').textContent = 'PEI Geral';
            }
            if (document.getElementById('detail-yearSemester')) {
                document.getElementById('detail-yearSemester').textContent = peiGeral.periodo || 'N/A';
            }
            if (document.getElementById('detail-ementa')) {
                document.getElementById('detail-ementa').textContent = peiGeral.dificuldades || 'Não informado';
            }
        }
        
        if (peiModal) {
            peiModal.style.display = 'block';
        }
    };
    
    function setupEventListeners() {
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('currentStudent');
                window.location.href = 'index.html';
            });
        }
        
        
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
        
        
        window.addEventListener('click', function(event) {
            if (event.target === peiModal) {
                closeModalWindow();
            }
        });
    }
    
    
    function switchTab(tab) {
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        const activeContent = document.getElementById(`${tab}-content`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }
    
    
    function closeModalWindow() {
        if (peiModal) {
            peiModal.style.display = 'none';
        }
    }
});
