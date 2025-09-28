// Script para debugging del usuario en el frontend
// Ejecutar en la consola del navegador

function debugUser() {
  console.log('🔍 Debugging datos del usuario...');
  
  // Verificar si hay token
  const token = localStorage.getItem('token');
  console.log('📋 Token:', token ? 'Presente' : 'Ausente');
  
  // Verificar datos del usuario en localStorage
  const userData = localStorage.getItem('user');
  console.log('📋 Datos del usuario en localStorage:', userData);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('✅ Usuario parseado:', user);
      console.log('   Email:', user.email);
      console.log('   Documento:', user.documento);
      console.log('   Empleado:', user.empleado);
      
      if (user.empleado) {
        console.log('   Empleado ID:', user.empleado.id);
        console.log('   Empleado Nombres:', user.empleado.nombres);
        console.log('   Empleado Documento:', user.empleado.documento);
        console.log('   Empleado Email:', user.empleado.email);
      }
    } catch (error) {
      console.error('❌ Error parseando usuario:', error);
    }
  }
  
  // Verificar datos del usuario en el estado de Redux (si existe)
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('📋 Redux DevTools disponible');
  }
  
  // Probar la API directamente
  console.log('🔍 Probando API directamente...');
  
  fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Respuesta de /api/auth/me:', data);
  })
  .catch(error => {
    console.error('❌ Error en /api/auth/me:', error);
  });
  
  // Probar endpoint de pendientes por visto bueno
  if (userData) {
    try {
      const user = JSON.parse(userData);
      const documento = user.documento || user.empleado?.documento || user.empleado?.id;
      
      if (documento) {
        console.log(`🔍 Probando pendientes por visto bueno con documento: ${documento}`);
        
        fetch(`${import.meta.env.VITE_API_URL}/cambio-turno/pendientes-visto-bueno?documento=${encodeURIComponent(documento)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log('✅ Respuesta de pendientes por visto bueno:', data);
          console.log(`📊 Solicitudes encontradas: ${data.length}`);
        })
        .catch(error => {
          console.error('❌ Error en pendientes por visto bueno:', error);
        });
      }
    } catch (error) {
      console.error('❌ Error procesando datos del usuario:', error);
    }
  }
}

// Función para simular el login y obtener datos del usuario
async function testLogin() {
  console.log('🔍 Probando login...');
  
  try {
    const loginResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'cuenta3uci2025@gmail.com',
        password: 'Orion1225'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);
    
    if (loginData.token) {
      // Probar obtener datos del usuario
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const userData = await userResponse.json();
      console.log('✅ User data:', userData);
      
      // Probar pendientes por visto bueno
      const documento = userData.documento || userData.empleado?.documento || userData.empleado?.id;
      
      if (documento) {
        const pendientesResponse = await fetch(`${import.meta.env.VITE_API_URL}/cambio-turno/pendientes-visto-bueno?documento=${encodeURIComponent(documento)}`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const pendientesData = await pendientesResponse.json();
        console.log('✅ Pendientes por visto bueno:', pendientesData);
      }
    }
  } catch (error) {
    console.error('❌ Error en testLogin:', error);
  }
}

// Exportar funciones para uso en consola
window.debugUser = debugUser;
window.testLogin = testLogin;

console.log('🔧 Scripts de debugging cargados:');
console.log('   - debugUser(): Debuggear datos del usuario actual');
console.log('   - testLogin(): Probar login y API directamente'); 