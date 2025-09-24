// Utilidad para verificar los datos del usuario en localStorage
export const checkUserData = () => {
  console.log('🔍 VERIFICANDO DATOS DEL USUARIO');
  console.log('=================================');
  
  // Verificar token
  const token = localStorage.getItem('token');
  console.log('Token:', token ? 'Presente' : 'No encontrado');
  
  // Verificar usuario
  const usuarioString = localStorage.getItem('usuario');
  console.log('Usuario (string):', usuarioString);
  
  if (usuarioString) {
    try {
      const usuario = JSON.parse(usuarioString);
      console.log('Usuario (objeto):', usuario);
      console.log('Estructura del usuario:');
      console.log('  - ID:', usuario.id);
      console.log('  - Email:', usuario.email);
      console.log('  - Nombre:', usuario.name);
      console.log('  - Documento directo:', usuario.documento);
      console.log('  - Empleado:', usuario.empleado);
      if (usuario.empleado) {
        console.log('    - Empleado ID:', usuario.empleado.id);
        console.log('    - Empleado Nombres:', usuario.empleado.nombres);
        console.log('    - Empleado Documento:', usuario.empleado.documento);
        console.log('    - Empleado Oficio:', usuario.empleado.oficio);
      }
      
      // Buscar documento en diferentes ubicaciones
      const documento = usuario.documento || usuario.empleado?.documento || usuario.empleado?.id;
      console.log('📋 Documento encontrado:', documento);
      console.log('📋 Tipo de documento:', typeof documento);
      
      return {
        token: !!token,
        usuario: usuario,
        documento: documento
      };
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      return null;
    }
  } else {
    console.log('No hay datos de usuario en localStorage');
    return null;
  }
};

// Función para limpiar datos de prueba
export const clearTestData = () => {
  console.log('🧹 LIMPIANDO DATOS DE PRUEBA');
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  console.log('Datos limpiados');
}; 