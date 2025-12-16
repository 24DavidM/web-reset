const SUPABASE_URL = 'https://ilojggjfajbyntuqucvf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsb2pnZ2pmYWpieW50dXF1Y3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTQ5ODUsImV4cCI6MjA4MDg5MDk4NX0.pywQBDVUjyKiWzkBz-ovDKiCwqO1rlt4SFUTk1n_RVA';

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
  let accessToken = params.get('access_token');

  // Si no hay token en el hash, intentar verificar token de recuperación (PKCE/Magic Link)
  if (!accessToken) {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const type = queryParams.get('type') || 'recovery'; // Default to recovery if missing
    const email = queryParams.get('email');

    console.log('Verifying token:', { token, type, email });

    if (token) {
      try {
        const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY
          },
          body: JSON.stringify({ type, token, email })
        });

        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          accessToken = data.access_token;
        } else {
          const errorData = await verifyResponse.json();
          console.error('Error verification response:', errorData);
        }
      } catch (e) {
        console.error('Error verificando token:', e);
      }
    }
  }

  if (!accessToken) {
    errorDiv.textContent = 'Token inválido o expirado';
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
      successDiv.textContent = '¡Contraseña actualizada exitosamente!';
      successDiv.style.display = 'block';
      document.getElementById('resetForm').reset();

      setTimeout(() => {
        window.close();
      }, 3000);
    } else {
      const error = await response.json();
      errorDiv.textContent = error.message || 'Error al actualizar contraseña';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Error de conexión. Intenta nuevamente.';
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
});