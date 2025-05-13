// Funciones de autenticación
const API_URL = 'http://localhost:3000/api';

// Registro de usuario
async function register(event) {
    event.preventDefault();
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value
    };

    try {
        toggleSpinner();
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en el registro');
        }

        localStorage.setItem('token', data.token);
        showToast('Registro exitoso');
        setTimeout(() => window.location.href = '/', 1000);
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'danger');
    } finally {
        toggleSpinner(false);
    }
}

// Inicio de sesión
async function login(event) {
    event.preventDefault();
    
    const formData = {
        correo: document.getElementById('correo').value,
        password: document.getElementById('password').value
    };

    try {
        toggleSpinner();
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en el inicio de sesión');
        }

        localStorage.setItem('token', data.token);
        showToast('Inicio de sesión exitoso');
        setTimeout(() => window.location.href = '/', 1000);
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'danger');
    } finally {
        toggleSpinner(false);
    }
}

// Verificar token y obtener información del usuario
async function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/auth/verificar`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error al verificar token:', error);
        localStorage.removeItem('token');
        return null;
    }
}

// Event Listeners para formularios
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }

    // Verificar autenticación al cargar la página
    verificarToken().then(usuario => {
        if (usuario) {
            // El usuario está autenticado
            updateAuthUI();
        }
    });
}); 