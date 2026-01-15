
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
    if (tipo !== 'NAPNE' && tipo !== 'CAE' && tipo !== 'DOCENTE') {
        window.location.href = 'index.html';
        return;
    }

    
    const isCae = tipo === 'CAE';

    
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const newCourseBtn = document.getElementById('newCourseBtn');
    const newSubjectBtn = document.getElementById('newSubjectBtn');
    const courseModal = document.getElementById('courseModal');
    const subjectModal = document.getElementById('subjectModal');
    const courseDetailsModal = document.getElementById('courseDetailsModal');
    const courseForm = document.getElementById('courseForm');
    const subjectForm = document.getElementById('subjectForm');
    const coursesTableBody = document.getElementById('courses-table-body');
    const subjectsTableBody = document.getElementById('subjects-table-body');

    
    let courses = [];
    let subjects = [];

    
    init();

    async function init() {
        setupEventListeners();
        await loadData();
        loadCoursesTable();
        loadSubjectsTable();
    }

    async function loadData() {
        try {
            const [coursesData, subjectsData] = await Promise.all([
                API_CONFIG.get('cursos'),
                API_CONFIG.get('componentes')
            ]);

            
            courses = Array.isArray(coursesData) && coursesData.length > 0
                ? coursesData.map(c => ({
                    id: c.codigo || c.id,
                    code: c.codigo || c.code || '',
                    codigo: c.codigo || c.code || '',
                    name: c.nome || c.name || '',
                    nome: c.nome || c.name || '',
                    level: c.modalidade || c.level || 'Técnico',
                    modalidade: c.modalidade || c.level || 'Técnico',
                    description: c.duracao || c.description || '',
                    carga_horaria: c.carga_horaria || c.workload || null,
                    workload: c.carga_horaria || c.workload || null,
                    duracao: c.duracao || c.duration || '',
                    duration: c.duracao || c.duration || '',
                    coordenador_cpf: c.coordenador_cpf || c.coordinator_cpf || null
                }))
                : [];

            subjects = Array.isArray(subjectsData) && subjectsData.length > 0
                ? subjectsData.map(s => ({
                    id: s.codigo_componente || s.id,
                    codigo_componente: s.codigo_componente || s.id,
                    name: s.componente || s.name || '',
                    componente: s.componente || s.name || '',
                    cargaHoraria: s.carga_horaria || s.cargaHoraria || 0,
                    carga_horaria: s.carga_horaria || s.cargaHoraria || 0,
                    ementa: s.ementa || s.description || '',
                    description: s.ementa || s.description || ''
                }))
                : [];

        } catch (error) {
            
            if (error instanceof SyntaxError) {
                
            } else {
                let errorMessage = error.message || 'Erro ao carregar dados do servidor';
                
                if (typeof showToast === 'function') {
                    showToast(errorMessage, 'error');
                }
            }
            
            
            courses = [];
            subjects = [];
        }
    }

    function setupEventListeners() {
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        
        if (isCae) {
            if (newCourseBtn) newCourseBtn.style.display = 'none';
            if (newSubjectBtn) newSubjectBtn.style.display = 'none';
        } else {
        if (newCourseBtn) newCourseBtn.addEventListener('click', () => openCourseModal());
        if (newSubjectBtn) newSubjectBtn.addEventListener('click', () => openSubjectModal());
        }

        
        if (courseForm) courseForm.addEventListener('submit', handleCourseSubmit);
        if (subjectForm) subjectForm.addEventListener('submit', handleSubjectSubmit);

        
        setupModalEvents();

        

        
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        
        const searchInput = document.getElementById('searchCourse');
        const clearSearchBtn = document.getElementById('clearSearchCourse');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterCoursesBySearch(this.value);
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
                    filterCoursesBySearch('');
                }
                clearSearchBtn.style.display = 'none';
            });
        }
    }
    
    function filterCoursesBySearch(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (term === '') {
            loadCoursesTable();
            return;
        }
        
        const filtered = courses.filter(course => {
            const codeMatch = (course.code || course.codigo || '').toLowerCase().includes(term);
            const nameMatch = (course.name || course.nome || '').toLowerCase().includes(term);
            const levelMatch = (course.level || course.modalidade || '').toLowerCase().includes(term);
            const coordMatch = (course.coordenador_cpf || '').toLowerCase().includes(term);
            
            return codeMatch || nameMatch || levelMatch || coordMatch;
        });
        
        renderCoursesTable(filtered);
    }
    
    function renderCoursesTable(coursesToRender) {
        if (!coursesTableBody) return;
        coursesTableBody.innerHTML = '';
        
        if (!Array.isArray(coursesToRender) || coursesToRender.length === 0) {
            coursesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-search"></i>
                        <p>${courses.length === 0 ? 'Nenhum curso cadastrado.' : 'Nenhum curso encontrado com o termo pesquisado.'}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        coursesToRender.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${course.code || course.codigo || 'N/A'}</strong></td>
                <td>${course.name || course.nome || 'N/A'}</td>
                <td>${course.level || course.modalidade || 'N/A'}</td>
                <td>${course.workload || course.carga_horaria || 'N/A'} horas</td>
                <td>${course.duration || course.duracao || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCourseDetails('${course.code || course.codigo}')" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!isCae ? `
                    <button class="btn btn-sm btn-secondary" onclick="editCourse('${course.code || course.codigo}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course.code || course.codigo}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            coursesTableBody.appendChild(row);
        });
    }

    function setupModalEvents() {
        const modals = [courseModal, subjectModal, courseDetailsModal];
        
        modals.forEach(modal => {
            if (!modal) return;
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });

        
        const cancelCourse = document.getElementById('cancelCourse');
        const cancelSubject = document.getElementById('cancelSubject');
        if (cancelCourse) cancelCourse.addEventListener('click', () => closeModal(courseModal));
        if (cancelSubject) cancelSubject.addEventListener('click', () => closeModal(subjectModal));
        
        
        const coordinatorCpfInput = document.getElementById('courseCoordinatorCpf');
        if (coordinatorCpfInput) {
            coordinatorCpfInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    if (value.length <= 3) {
                        value = value;
                    } else if (value.length <= 6) {
                        value = value.replace(/(\d{3})(\d+)/, '$1.$2');
                    } else if (value.length <= 9) {
                        value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
                    } else {
                        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
                    }
                    e.target.value = value;
                }
            });
        }
    }

    function switchTab(tabName) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-content`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    function openCourseModal(course = null) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const title = document.getElementById('courseModalTitle');
        const form = document.getElementById('courseForm');
        
        if (course) {
            if (title) title.textContent = 'Editar Curso';
            if (document.getElementById('courseId')) document.getElementById('courseId').value = course.id || course.codigo;
            if (document.getElementById('courseCode')) document.getElementById('courseCode').value = course.code || course.codigo || '';
            if (document.getElementById('courseName')) document.getElementById('courseName').value = course.name || course.nome || '';
            if (document.getElementById('courseLevel')) document.getElementById('courseLevel').value = course.level || course.modalidade || '';
            if (document.getElementById('courseDescription')) document.getElementById('courseDescription').value = course.description || '';
            
            
            const coordinatorCpf = course.coordenador_cpf || '';
            if (document.getElementById('courseCoordinatorCpf')) {
                
                const formattedCpf = coordinatorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                document.getElementById('courseCoordinatorCpf').value = formattedCpf || '';
            }
            if (document.getElementById('courseWorkload')) {
                document.getElementById('courseWorkload').value = course.carga_horaria || course.workload || '';
            }
            if (document.getElementById('courseDuration')) {
                
                const duration = course.duracao || '';
                const durationOnly = duration.includes('ano') ? duration.split('-')[1]?.trim() || '' : duration;
                document.getElementById('courseDuration').value = durationOnly;
            }
            if (document.getElementById('courseYears')) {
                
                const duration = course.duracao || '';
                const yearsMatch = duration.match(/(\d+)\s*ano/i);
                document.getElementById('courseYears').value = yearsMatch ? yearsMatch[1] : '';
            }
        } else {
            if (title) title.textContent = 'Novo Curso';
            if (form) form.reset();
            if (document.getElementById('courseId')) document.getElementById('courseId').value = '';
        }
        
        if (courseModal) courseModal.style.display = 'block';
    }

    function openSubjectModal(subject = null) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const title = document.getElementById('subjectModalTitle');
        const form = document.getElementById('subjectForm');
        
        if (subject) {
            if (title) title.textContent = 'Editar Matéria';
            
            if (document.getElementById('subjectId')) {
                document.getElementById('subjectId').value = subject.id || subject.codigo_componente || '';
            }
            if (document.getElementById('subjectName')) {
                document.getElementById('subjectName').value = subject.name || subject.componente || '';
            }
            if (document.getElementById('subjectWorkload')) {
                document.getElementById('subjectWorkload').value = subject.carga_horaria || subject.cargaHoraria || '';
            }
            if (document.getElementById('subjectEmenta')) {
                document.getElementById('subjectEmenta').value = subject.ementa || subject.description || '';
            }
        } else {
            if (title) title.textContent = 'Nova Matéria';
            if (form) form.reset();
            if (document.getElementById('subjectId')) document.getElementById('subjectId').value = '';
        }
        
        if (subjectModal) subjectModal.style.display = 'block';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    async function handleCourseSubmit(e) {
        e.preventDefault();
        
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        
        const courseId = document.getElementById('courseId')?.value;
        
        
        const coordinatorCpf = document.getElementById('courseCoordinatorCpf')?.value?.replace(/\D/g, '') || '';
        const workload = parseInt(document.getElementById('courseWorkload')?.value) || 0;
        const duration = document.getElementById('courseDuration')?.value || '';
        const years = parseInt(document.getElementById('courseYears')?.value) || 0;
        
        
        const fullDuration = years > 0 ? `${years} ano(s) - ${duration}` : duration;

        
        const backendData = {
            codigo: document.getElementById('courseCode')?.value || undefined,
            nome: document.getElementById('courseName')?.value || '',
            modalidade: document.getElementById('courseLevel')?.value || '',
            carga_horaria: workload,
            duracao: fullDuration,
            coordenador_cpf: coordinatorCpf && coordinatorCpf.length === 11 ? coordinatorCpf : null 
        };

        try {
            if (courseId) {
                
                await API_CONFIG.put(`cursos/${courseId}`, backendData);
                showToast('Curso atualizado com sucesso!', 'success');
            } else {
                
                await API_CONFIG.post('cursos', backendData);
                showToast('Curso criado com sucesso!', 'success');
            }
            
            await loadData();
            loadCoursesTable();
            closeModal(courseModal);
        } catch (error) {
            showToast(error.message || 'Erro ao salvar curso', 'error');
        }
    }

    async function handleSubjectSubmit(e) {
        e.preventDefault();
        
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        
        const subjectId = document.getElementById('subjectId')?.value;
        
        
        const subjectData = {
            componente: document.getElementById('subjectName')?.value || '',
            carga_horaria: parseInt(document.getElementById('subjectWorkload')?.value) || 0,
            ementa: document.getElementById('subjectEmenta')?.value || ''
        };
        
        
        delete subjectData.codigo_componente;

        try {
            if (subjectId) {
                
                await API_CONFIG.put(`componentes/${subjectId}`, subjectData);
                showToast('Matéria atualizada com sucesso!', 'success');
            } else {
                
                await API_CONFIG.post('componentes', subjectData);
                showToast('Matéria criada com sucesso!', 'success');
            }
            
            await loadData();
            loadSubjectsTable();
            closeModal(subjectModal);
        } catch (error) {
            showToast(error.message || 'Erro ao salvar matéria', 'error');
        }
    }

    function loadCoursesTable() {
        renderCoursesTable(courses);
    }
    
    function renderCoursesTable(coursesToRender) {
        if (!coursesTableBody) return;
        coursesTableBody.innerHTML = '';
        
        
        if (!Array.isArray(coursesToRender) || coursesToRender.length === 0) {
            coursesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-search"></i>
                        <p>${courses.length === 0 ? 'Nenhum curso cadastrado.' : 'Nenhum curso encontrado com o termo pesquisado.'}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        coursesToRender.forEach(course => {
            if (!course) return;
            
            const subjectCount = Array.isArray(subjects)
                ? subjects.filter(s => s.courseId === course.id).length
                : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.code || course.codigo || ''}</td>
                <td>${course.name || course.nome || ''}</td>
                <td><span class="badge ${course.level ? course.level.toLowerCase() : ''}">${course.level || course.modalidade || ''}</span></td>
                <td>${subjectCount}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCourseDetails('${course.id || course.codigo}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!isCae ? `
                    <button class="btn btn-sm btn-primary" onclick="editCourse('${course.id || course.codigo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course.id || course.codigo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            coursesTableBody.appendChild(row);
        });
    }

    function loadSubjectsTable() {
        if (!subjectsTableBody) return;
        
        const filteredSubjects = getFilteredSubjects();
        subjectsTableBody.innerHTML = '';
        
        
        if (!Array.isArray(filteredSubjects) || filteredSubjects.length === 0) {
            subjectsTableBody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma matéria encontrada</td></tr>';
            return;
        }
        
        filteredSubjects.forEach(subject => {
            if (!subject) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject.name || subject.componente || ''}</td>
                <td>${subject.carga_horaria || subject.cargaHoraria || 0} horas</td>
                <td>
                    ${!isCae ? `
                    <button class="btn btn-sm btn-primary" onclick="editSubject(${subject.id || subject.codigo_componente})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSubject(${subject.id || subject.codigo_componente})">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            subjectsTableBody.appendChild(row);
        });
    }

    function populateCourseSelects() {
        
    }

    function populateFilterOptions() {
        
    }

    function getFilteredSubjects() {
        
        return subjects;
    }

    
    window.editCourse = function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const course = courses.find(c => c.id === id || c.codigo === id);
        if (course) openCourseModal(course);
    };

    window.deleteCourse = async function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este curso? Todas as matérias associadas também serão removidas.')) {
            try {
                await API_CONFIG.delete(`cursos/${id}`);
                showToast('Curso excluído com sucesso!', 'success');
                await loadData();
                loadCoursesTable();
                loadSubjectsTable();
            } catch (error) {
                showToast(error.message || 'Erro ao excluir curso', 'error');
            }
        }
    };

    window.viewCourseDetails = function(id) {
        const course = courses.find(c => c.id === id || c.codigo === id);
        if (!course) return;

        const title = document.getElementById('courseDetailsTitle');
        if (title) title.textContent = `Detalhes: ${course.name}`;
        
        const detailCode = document.getElementById('detail-course-code');
        const detailName = document.getElementById('detail-course-name');
        const detailLevel = document.getElementById('detail-course-level');
        const detailDescription = document.getElementById('detail-course-description');
        
        if (detailCode) detailCode.textContent = course.code || '';
        if (detailName) detailName.textContent = course.name || '';
        if (detailLevel) detailLevel.textContent = course.level || '';
        if (detailDescription) detailDescription.textContent = course.description || 'Nenhuma descrição disponível.';

        
        const courseSubjects = subjects;
        const subjectsList = document.getElementById('course-subjects-list');
        
        if (subjectsList) {
            if (courseSubjects.length === 0) {
                subjectsList.innerHTML = '<p class="empty-message">Nenhuma matéria cadastrada para este curso.</p>';
            } else {
                subjectsList.innerHTML = courseSubjects.map(subject => `
                    <div class="subject-item">
                        <h4>${subject.name}</h4>
                        <p><strong>Carga Horária:</strong> ${subject.cargaHoraria || 'N/A'} horas</p>
                    </div>
                `).join('');
            }
        }

        if (courseDetailsModal) courseDetailsModal.style.display = 'block';
    };

    window.editSubject = function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        const subject = subjects.find(s => s.id === id);
        if (subject) openSubjectModal(subject);
    };

    window.deleteSubject = async function(id) {
        if (isCae) {
            alert('Usuários CAE possuem acesso somente para visualização.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir esta matéria?')) {
            try {
                await API_CONFIG.delete(`componentes/${id}`);
                showToast('Matéria excluída com sucesso!', 'success');
                await loadData();
                loadSubjectsTable();
                loadCoursesTable();
            } catch (error) {
                showToast(error.message || 'Erro ao excluir matéria', 'error');
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
