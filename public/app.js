const SUPABASE_URL = 'https://ilojggjfajbyntuqucvf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsb2pnZ2pmYWpieW50dXF1Y3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTQ5ODUsImV4cCI6MjA4MDg5MDk4NX0.pywQBDVUjyKiWzkBz-ovDKiCwqO1rlt4SFUTk1n_RVA';

// Debug: Mostrar la URL completa al cargar
console.log('URL completa:', window.location.href);
console.log('Hash:', window.location.hash);

// Verificar si hay token al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    console.log('Token encontrado:', accessToken ? 'Sí' : 'No');
    console.log('Tipo:', type);
    
    const errorDiv = document.getElementById('error');
    
    if (errorParam) {
        errorDiv.textContent = `Error: ${errorDescription || errorParam}`;
        errorDiv.style.display = 'block';
        return;
    }

    if (!accessToken) {
        errorDiv.textContent = 'Token no encontrado en la URL. Asegúrate de usar el enlace del email.';
        errorDiv.style.display = 'block';
    }
});

document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    // Obtener access token de la URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    console.log('Intentando actualizar contraseña con token:', accessToken?.substring(0, 20) + '...');

    if (!accessToken) {
        errorDiv.textContent = 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.';
        errorDiv.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            console.log('✅ Contraseña actualizada exitosamente');
            successDiv.textContent = '¡Contraseña actualizada exitosamente!';
            successDiv.style.display = 'block';
            document.getElementById('resetForm').reset();

            setTimeout(() => {
                window.close();
            }, 3000);
        } else {
            const error = await response.json();
            console.error('❌ Error de Supabase:', error);
            errorDiv.textContent = error.msg || error.message || 'Error al actualizar contraseña';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        errorDiv.textContent = 'Error de conexión: ' + error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});
