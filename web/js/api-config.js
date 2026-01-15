

const API_CONFIG = {
    
    baseURL: (function() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port ? ':' + window.location.port : '';
        const path = window.location.pathname;
        let basePath = path;
        
        
        if (path.includes('/web/')) {
            basePath = path.split('/web/')[0];
        } else if (path.includes('/web')) {
            basePath = path.replace('/web', '');
        }
        
        
        if (basePath.includes('.')) {
            const lastSlash = basePath.lastIndexOf('/');
            if (lastSlash >= 0) {
                basePath = basePath.substring(0, lastSlash + 1);
            } else {
                basePath = '/';
            }
        }
        
        
        if (!basePath.endsWith('/')) {
            basePath += '/';
        }
        
        const url = `${protocol}
        return url;
    })(),
    
    
    getToken() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.token || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    
    
    async request(endpoint, method = 'GET', data = null) {
        const url = this.baseURL + endpoint;
        const token = this.getToken();
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        
        if (token && !endpoint.includes('auth/login')) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 
            
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: data ? JSON.stringify(data) : null,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const text = await response.text();
            
            
            if (!response.ok) {
                let errorMessage = `Erro ${response.status}: Erro na requisição`;
                try {
                    if (text && text.trim().startsWith('{')) {
                        const json = JSON.parse(text);
                        errorMessage = json.error || errorMessage;
                    } else if (text.trim()) {
                        errorMessage = text.trim();
                    } else {
                        errorMessage = `Erro ${response.status}: ${response.statusText || 'Erro na requisição'}`;
                    }
                } catch (e) {
                    errorMessage = text.trim() || `Erro ${response.status}: Erro na requisição`;
                }
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }
            
            
            if (!text || !text.trim()) {
                return null;
            }
            
            
            try {
                return JSON.parse(text.trim());
            } catch (e) {
                return null;
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Tempo de espera excedido. Verifique se o servidor está rodando.');
            }
            
            
            if (error.message) {
                throw error;
            } else {
                throw new Error(`Erro ${response?.status || 'desconhecido'}: Erro na requisição`);
            }
        }
    },
    
    
    async get(endpoint) {
        try {
            const result = await this.request(endpoint, 'GET');
            return result || [];
        } catch (error) {
            if (error.message && (error.message.includes('MySQL') || error.message.includes('banco de dados') || error.message.includes('conectar'))) {
                return [];
            }
            return [];
        }
    },
    
    async post(endpoint, data) {
        try {
            return await this.request(endpoint, 'POST', data);
        } catch (error) {
            throw error;
        }
    },
    
    async put(endpoint, data) {
        try {
            return await this.request(endpoint, 'PUT', data);
        } catch (error) {
            throw error;
        }
    },
    
    async delete(endpoint) {
        try {
            return await this.request(endpoint, 'DELETE');
        } catch (error) {
            throw error;
        }
    }
};
