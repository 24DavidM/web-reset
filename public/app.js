const SUPABASE_URL = 'https://ilojggjfajbyntuqucvf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsb2pnZ2pmYWpieW50dXF1Y3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTQ5ODUsImV4cCI6MjA4MDg5MDk4NX0.pywQBDVUjyKiWzkBz-ovDKiCwqO1rlt4SFUTk1n_RVA';

// Función para extraer el token de la URL (tanto hash como query params)
function getTokenFromURL() {
    // Primero intenta obtener del hash fragment (#)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const hashToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');
    
    console.log('📍 Debug Hash:', {
        raw: window.location.hash,
        parsed: hash,
        token: hashToken,
        type: hashType
    });
    
    // Si no está en el hash, intenta query parameters (?)
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get('access_token');
    const queryType = searchParams.get('type');
    
    // También buscar el parámetro 'code' que Supabase envía con PKCE
    const queryCode = searchParams.get('code');
    const hashCode = hashParams.get('code');
    
    console.log('📍 Debug Query:', {
        raw: window.location.search,
        token: queryToken,
        type: queryType,
        code: queryCode
    });
    
    const finalToken = hashToken || queryToken;
    const finalType = hashType || queryType;
    const finalCode = hashCode || queryCode;
    
    console.log('📍 Token Final:', finalToken ? '✅ Encontrado' : '❌ No encontrado');
    console.log('📍 Code:', finalCode ? '✅ Encontrado: ' + finalCode : '❌ No encontrado');
    
    return {
        token: finalToken,
        type: finalType,
        code: finalCode,
        error: hashParams.get('error') || searchParams.get('error'),
        errorDescription: hashParams.get('error_description') || searchParams.get('error_description')
    };
}

// Función para verificar el recovery code y obtener la sesión
async function exchangeCodeForToken(code) {
    try {
        console.log('🔄 Verificando recovery code con Supabase...');
        console.log('📍 Code recibido:', code);
        
        // Usar el endpoint verify para recovery tokens
        const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({
                type: 'recovery',
                token: code
            })
        });
        
        console.log('📍 Response status:', response.status);
        const data = await response.json();
        console.log('📍 Response data:', data);
        
        if (response.ok && data.access_token) {
            console.log('✅ Token obtenido exitosamente');
            return data.access_token;
        } else {
            console.error('❌ Error al verificar code:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Error de red al verificar code:', error);
        return null;
    }
}

// Función para extraer token de una URL completa pegada manualmente
function extractTokenFromFullURL(fullURL) {
    try {
        const url = new URL(fullURL);
        
        // Intentar desde hash
        const hash = url.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const hashToken = hashParams.get('access_token');
        
        // Intentar desde query
        const queryToken = url.searchParams.get('access_token');
        
        return hashToken || queryToken;
    } catch (e) {
        console.error('Error al parsear URL:', e);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const { token, type, code, error, errorDescription } = getTokenFromURL();
    
    // Si hay un code, intercambiarlo por access_token
    if (code && !token) {
        console.log('🔄 Code detectado, intercambiando por access_token...');
        const accessToken = await exchangeCodeForToken(code);
        
        if (accessToken) {
            // Redirigir con el access_token en el hash
            console.log('✅ Redirigiendo con access_token...');
            window.location.hash = `access_token=${accessToken}&type=recovery`;
            window.location.search = ''; // Limpiar query params
            window.location.reload();
            return;
        } else {
            const errorDiv = document.getElementById('error');
            errorDiv.innerHTML = '<strong>❌ Error:</strong> No se pudo obtener el token de acceso. Solicita un nuevo enlace.';
            errorDiv.style.display = 'block';
            return;
        }
    }
    
    // Agregar listener para el botón de extraer token
    const extractBtn = document.getElementById('extractTokenBtn');
    if (extractBtn) {
        extractBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('urlInput');
            const fullURL = urlInput.value.trim();
            
            if (!fullURL) {
                alert('Por favor pega el enlace completo del email');
                return;
            }
            
            const extractedToken = extractTokenFromFullURL(fullURL);
            
            if (extractedToken) {
                console.log('✅ Token extraído exitosamente');
                // Recargar la página con el token en el hash
                window.location.hash = `access_token=${extractedToken}&type=recovery`;
                window.location.reload();
            } else {
                alert('No se pudo extraer el token de la URL. Verifica que sea el enlace correcto del email.');
            }
        });
    }
    
    console.log('🔍 Información de URL:');
    console.log('Token encontrado:', token ? 'Sí (' + token.substring(0, 20) + '...)' : 'No');
    console.log('Tipo:', type);
    console.log('URL completa:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Query:', window.location.search);
    
    const errorDiv = document.getElementById('error');
    
    if (error) {
        errorDiv.textContent = `Error: ${errorDescription || error}`;
        errorDiv.style.display = 'block';
        return;
    }

    if (!token) {
        errorDiv.innerHTML = `
            <strong>⚠️ Token no encontrado</strong><br>
            <small>URL actual: ${window.location.href.substring(0, 80)}...</small><br>
            <small>Puedes pegar el enlace completo del email abajo o solicitar un nuevo correo de recuperación.</small>
        `;
        errorDiv.style.display = 'block';
        
        // Mostrar sección para pegar el token manualmente
        const tokenSection = document.getElementById('tokenInputSection');
        if (tokenSection) {
            tokenSection.style.display = 'block';
        }
    } else {
        console.log('✅ Token válido encontrado:', token.substring(0, 30) + '...');
        // Ocultar la sección de token manual si el token fue encontrado
        const tokenSection = document.getElementById('tokenInputSection');
        if (tokenSection) {
            tokenSection.style.display = 'none';
        }
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

    // Obtener token de la URL o del input manual
    let { token: accessToken } = getTokenFromURL();
    
    // Si no hay token en la URL, intentar obtenerlo del input manual
    if (!accessToken) {
        const manualToken = document.getElementById('tokenInput')?.value.trim();
        if (manualToken) {
            accessToken = manualToken;
        }
    }

    console.log('🔑 Intentando actualizar contraseña con token:', accessToken?.substring(0, 20) + '...');

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
            console.error('❌ Status:', response.status);
            console.error('❌ Token usado:', accessToken.substring(0, 30) + '...');
            
            let errorMsg = error.msg || error.message || 'Error al actualizar contraseña';
            if (response.status === 401 || response.status === 403) {
                errorMsg = 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.';
            }
            
            errorDiv.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
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