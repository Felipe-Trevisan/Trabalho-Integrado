
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const toast = document.getElementById('toast');

    
    
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '' || currentPage === 'web/' || currentPage === 'web') {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser && currentUser.token) {
                    
                    const tipo = currentUser.tipo ? currentUser.tipo.toUpperCase() : '';
                    
                    
                    
                    if (tipo === 'DOCENTE') {
                        window.location.replace('professor.html');
                        return;
                    } else if (tipo === 'CAE' || tipo === 'NAPNE') {
                        window.location.replace('dashboard.html');
                        return;
                    } else {
                        
                        window.location.replace('dashboard.html');
                        return;
                    }
                }
            } catch (e) {
                
            }
        }
    }

    
    setupPasswordToggle('toggleLoginPassword', 'login-password');

    function setupPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggle && input) {
            toggle.addEventListener('click', function() {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    }


    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const loginUserInput = document.getElementById('login-username').value.trim();
        const loginPassInput = document.getElementById('login-password').value;

        let isValid = true;

        if (loginUserInput.length === 0) {
            showError('login-user-error', 'Digite seu usuário');
            isValid = false;
        } else {
            hideError('login-user-error');
        }

        if (loginPassInput.length === 0) {
            showError('login-pass-error', 'Digite sua senha');
            isValid = false;
        } else {
            hideError('login-pass-error');
        }

        if (!isValid) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            
            const response = await fetch(API_CONFIG.baseURL + 'auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: loginUserInput,
                    senha: loginPassInput
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                
                let tipoUsuario = data.tipo || 'NAPNE';
                const tipoLower = tipoUsuario.toLowerCase();
                if (tipoLower === 'docente' || tipoLower === 'professor') {
                    tipoUsuario = 'DOCENTE';
                } else if (tipoLower === 'napne') {
                    tipoUsuario = 'NAPNE';
                } else if (tipoLower === 'cae') {
                    tipoUsuario = 'CAE';
                }
                
                
                
                const userData = {
                    token: data.token,
                    siape: data.siape || '00000000',
                    username: data.username || loginUserInput,
                    nome: data.nome || loginUserInput,
                    tipo: tipoUsuario,
                    email: data.email || loginUserInput + '@napne.local',
                    cpf: data.cpf || ''
                };
                
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('token', data.token);
                
                showToast('Login realizado com sucesso!', 'success');
                setTimeout(() => {
                    
                    
                    if (tipoUsuario === 'DOCENTE') {
                        window.location.replace('professor.html');
                    } else if (tipoUsuario === 'CAE' || tipoUsuario === 'NAPNE') {
                        window.location.replace('dashboard.html');
                    } else {
                        
                        window.location.replace('dashboard.html');
                    }
                }, 1000);
            } else {
                const errorMsg = data.error || 'Usuário ou senha incorretos.';
                showToast(errorMsg, 'error');
                showError('login-user-error', errorMsg);
                showError('login-pass-error', ' ');
            }
        } catch (error) {
            showToast('Erro ao conectar com o servidor. Tente novamente.', 'error');
            showError('login-user-error', 'Erro de conexão');
        }
    });

    function showError(id, message) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    function hideError(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }

    function showToast(message, type) {
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show ' + type;

            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    }

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const icon = this.parentElement.querySelector('i');
            if (icon) {
                icon.style.color = '#764ba2';
            }
        });

        input.addEventListener('blur', function() {
            const icon = this.parentElement.querySelector('i');
            if (icon) {
                icon.style.color = '#666';
            }
        });
    });
});


function getToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = getToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}
