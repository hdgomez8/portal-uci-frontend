import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos de timeout
  timeoutErrorMessage: 'La solicitud tardó demasiado en responder. Por favor, inténtalo de nuevo.',
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('🔍 DEBUG - Interceptor de petición:');
  console.log('  - Token en localStorage:', token ? 'Presente' : 'Ausente');
  console.log('  - Token valor:', token ? token.substring(0, 20) + '...' : 'N/A');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('  - Header Authorization añadido');
  } else {
    console.log('  - ⚠️ No hay token, petición sin autenticación');
  }

  // 🔍 DEBUG DETALLADO DE PETICIONES
  console.log('🔍 ===== REQUEST DEBUG =====');
  console.log('🌐 URL:', config.url);
  console.log('📋 Method:', config.method?.toUpperCase());
  console.log('🔑 Headers:', config.headers);
  console.log('📦 Data:', config.data);
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('🔍 ===== END REQUEST DEBUG =====');

  // Si el body es FormData, quitar Content-Type para que axios agregue el boundary
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }

  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // 🔍 DEBUG DETALLADO DE RESPUESTAS
    console.log('🔍 ===== RESPONSE DEBUG =====');
    console.log('📊 Status:', response.status);
    console.log('📝 Data:', response.data);
    console.log('🔑 Headers:', response.headers);
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🔍 ===== END RESPONSE DEBUG =====');

    return response;
  },
  (error) => {
    // 🔍 DEBUG DETALLADO DE ERRORES
    console.log('🔍 ===== ERROR DEBUG =====');
    console.log('❌ Error:', error.message);
    console.log('📊 Status:', error.response?.status);
    console.log('📝 Data:', error.response?.data);
    console.log('🔑 Headers:', error.response?.headers);
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    // 🔍 DEBUG ESPECÍFICO PARA ERRORES 500
    if (error.response?.status === 500 && error.response?.data) {
      console.log('🔍 ===== ERROR 500 DETAILS =====');
      console.log('❌ Error Message:', error.response.data.detalle);
      console.log('🔧 Error Type:', error.response.data.tipo);
      console.log('🔢 Error Code:', error.response.data.codigo);
      console.log('📋 Stack Trace:', error.response.data.stack);
      
      if (error.response.data.debug) {
        console.log('🔍 ===== DEBUG INFO =====');
        console.log('👤 Usuario autenticado:', error.response.data.debug.usuario_autenticado);
        console.log('👥 Empleado ID:', error.response.data.debug.empleado_id);
        console.log('📋 Tipo solicitud ID:', error.response.data.debug.tipo_solicitud_id);
        console.log('📅 Fecha:', error.response.data.debug.fecha);
        console.log('📅 Fecha permiso:', error.response.data.debug.fecha_permiso);
        console.log('🕐 Hora:', error.response.data.debug.hora);
        console.log('⏱️ Duración:', error.response.data.debug.duracion);
        console.log('📝 Observaciones:', error.response.data.debug.observaciones);
        console.log('📎 Archivos:', error.response.data.debug.archivos_count);
        console.log('🔍 ===== END DEBUG INFO =====');
      }
      console.log('🔍 ===== END ERROR 500 DETAILS =====');
    }
    
    console.log('🔍 ===== END ERROR DEBUG =====');

    // 🚨 MANEJO DE TOKEN EXPIRADO O INVÁLIDO
    if (error.response?.status === 401) {
      console.log('🔐 Error de autenticación detectado (401)');
      console.log('📝 Error data:', error.response?.data);

      const errorData = error.response?.data;
      const errorMessage = errorData?.message?.toLowerCase() || '';
      
      // Verificar si es un error de autenticación (token expirado, inválido, etc.)
      const isAuthError = errorMessage.includes('token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('expirado') ||
        errorMessage.includes('inválido') ||
        errorMessage.includes('acceso denegado') ||
        errorData?.expired === true;

      if (isAuthError) {
        console.log('🔐 Error de autenticación confirmado - Redirigiendo al login');

        // Limpiar datos de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('usuario');

        // Limpiar Redux store si está disponible
        try {
          const store = (window as any).__REDUX_STORE__;
          if (store) {
            store.dispatch({ type: 'auth/logout' });
          }
        } catch (e) {
          console.log('No se pudo limpiar Redux store');
        }

        // Mostrar mensaje al usuario
        console.warn('⚠️ Tu sesión ha expirado. Serás redirigido al login.');

        // Redirigir al login inmediatamente (usar replace para evitar que el usuario pueda volver atrás)
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
    }
    
    // También manejar errores 400 relacionados con tokens (por compatibilidad)
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message?.toLowerCase() || '';
      
      if (errorMessage.includes('token') && (errorMessage.includes('invalid') || errorMessage.includes('inválido'))) {
        console.log('🔐 Token inválido detectado (400) - Redirigiendo al login');
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('usuario');
        
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Helpers para URLs públicas
export const getPublicBase = () =>
  import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;

export const buildAdjuntoUrl = (rutaRelativa: string) => {
  // Usar la ruta API alternativa para evitar problemas de autenticación
  return `${getPublicBase()}/api/files/${rutaRelativa}`;
};

// Si a veces guardaste rutas absolutas de disco, normalízalas:
export const normalizarRutaAdjunto = (rutaBD: string) => {
  // Si la ruta ya empieza con 'uploads/', remover ese prefijo
  if (rutaBD.startsWith('uploads/')) {
    return rutaBD.substring('uploads/'.length);
  }
  
  // Si contiene '/uploads/', extraer solo la parte después de '/uploads/'
  const idx = rutaBD.indexOf('/uploads/');
  if (idx >= 0) {
    return rutaBD.substring(idx + '/uploads/'.length);
  }
  
  // Si no contiene 'uploads/', devolver tal como está
  return rutaBD;
};

export const userService = {
  getUsers: () => api.get('/usuarios'),

  createUser: (userData: {
    nombres: string;
    email: string;
    documento: string;
    codigo: string;
    fecha_ingreso: string;
    tipo_contrato: string;
    password: string;
    rol: string;
    departamento: string;
    area: string;
    jefe_id: string;
    oficio: string;
  }) => api.post('/usuarios', userData),

  updateUser: (id: string, userData: {
    email?: string;
    password?: string;
  }) => api.put(`/usuarios/${id}`, userData),

  deleteUser: (id: string) => api.delete(`/usuarios/${id}`),
};

export const employeeService = {
  getAll: () => api.get('/empleados'),

  getById: (id: string) => api.get(`/empleados/${id}`),

  getJefeByEmpleadoId: (empleadoId: string) => api.get(`/empleados/${empleadoId}/jefe`),

  create: (employeeData: {
    codigo: number;
    documento: string;
    tipo_documento: string;
    ciudad_documento: string;
    nombres: string;
    foto_perfil: string;
    fecha_nacimiento: string;
    ciudad_nacimiento: string;
    sexo: string;
    estado_civil: string;
    email: string;
    direccion: string;
    codigo_postal: string;
    ciudad_residencia: string;
    telefono: string;
    transporta_empresa: boolean;
    personas_a_cargo: number;
    fecha_ingreso: string;
    fecha_salida?: string;
    tipo_contrato: string;
    estado_trabajador: string;
    jornada: string;
    salario_integral: boolean;
    sucursal: string;
    grupo_pago: string;
    oficio: string;
    depto: string;
    equipo_trabajo: string;
    clase_trabajador: string;
    tipo_cotizante: string;
    centro_trabajo: string;
    forma_pago: string;
    banco_empresa: string;
    tipo_cuenta: string;
    nro_cuenta_banco: string;
    fondo_pension: string;
    fondo_salud: string;
    ccf: string;
    sucursal_pi: string;
  }) => api.post('/empleados', employeeData),

  update: (id: string, employeeData: Partial<{
    codigo: number;
    documento: string;
    tipo_documento: string;
    ciudad_documento: string;
    nombres: string;
    foto_perfil: string;
    fecha_nacimiento: string;
    ciudad_nacimiento: string;
    sexo: string;
    estado_civil: string;
    email: string;
    direccion: string;
    codigo_postal: string;
    ciudad_residencia: string;
    telefono: string;
    transporta_empresa: boolean;
    personas_a_cargo: number;
    fecha_ingreso: string;
    fecha_salida: string;
    tipo_contrato: string;
    estado_trabajador: string;
    jornada: string;
    salario_integral: boolean;
    sucursal: string;
    grupo_pago: string;
    oficio: string;
    depto: string;
    equipo_trabajo: string;
    clase_trabajador: string;
    tipo_cotizante: string;
    centro_trabajo: string;
    forma_pago: string;
    banco_empresa: string;
    tipo_cuenta: string;
    nro_cuenta_banco: string;
    fondo_pension: string;
    fondo_salud: string;
    ccf: string;
    sucursal_pi: string;
  }>) => api.put(`/empleados/${id}`, employeeData),

  delete: (id: string) => api.delete(`/empleados/${id}`),

  // Nuevos métodos para manejar archivos
  uploadProfilePhoto: (id: string, photoFile: File) => {
    const formData = new FormData();
    formData.append('foto_perfil', photoFile);
    return api.post(`/empleados/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadResume: (id: string, resumeFile: File) => {
    const formData = new FormData();
    formData.append('cv', resumeFile);
    return api.post(`/empleados/${id}/upload-cv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadSignature: (id: string, signatureFile: File) => {
    const formData = new FormData();
    formData.append('firma', signatureFile);
    return api.post(`/empleados/${id}/firma`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getSignature: (id: string) => api.get(`/empleados/${id}/firma`),

  deleteSignature: (id: string) => api.delete(`/empleados/${id}/firma`),

  getResume: (id: string) => api.get(`/empleados/${id}/upload-cv`, { responseType: 'blob' }),

  updateArea: (id: string, areaId: string | null) => api.put(`/empleados/${id}/area`, { areaId }),

  getEmailNotificacion: (id: string) => api.get(`/empleados/${id}/email-notificacion`),

  getByDocumento: (documento: string) => api.get(`/empleados/documento/${documento}`),

  // Función para actualizar rápidamente el estado del empleado
  updateStatus: (id: string, estado: string) => api.patch(`/empleados/${id}/estado`, { estado_trabajador: estado }),
};

export const rolesService = {
  getRoles: () => api.get('/roles'),
  createRole: (data: { nombre: string }) => api.post('/roles', data),
  updateRole: (id: string, data: { nombre: string }) => api.put(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  assignPermissions: (id: string, permisos: number[]) => api.post(`/roles/${id}/permisos`, { permisos }),
  removePermission: (id: string, permisoId: string) => api.delete(`/roles/${id}/permisos/${permisoId}`),
  updateUserRole: (userId: string, rolId: string) => api.put(`/usuarios/${userId}/rol`, { rolId }),
};

export const permisosService = {
  getPermisos: () => api.get('/permisos'),
  createPermiso: (data: { nombre: string }) => api.post('/permisos', data),
  updatePermiso: (id: string, data: { nombre: string }) => api.put(`/permisos/${id}`, data),
  deletePermiso: (id: string) => api.delete(`/permisos/${id}`),
};

export const solicitudesService = {
  getSolicitudes: () => api.get('/solicitudes'),
  getSolicitudesPorEmpleado: (empleadoId: string) => api.get(`/solicitudes/empleado/${empleadoId}`),
  getSolicitudesPorJefe: (jefeId: string) => api.get(`/solicitudes/jefe/${jefeId}`),
  crearSolicitud: (solicitudData: FormData) => api.post('/solicitudes', solicitudData),
  actualizarEstadoSolicitud: (id: string, estado: string, motivo?: string) =>
    api.put(`/solicitudes/${id}/estado`, { estado, motivo }),
  descargarPDF: (id: string) => api.get(`/solicitudes/${id}/pdf`, { responseType: 'blob' }),
};

export const cambioTurnoService = {
  listar: () => api.get('/cambio-turno'),
  listarConJefe: (jefeId: number | string) => api.get(`/cambio-turno?jefeId=${jefeId}`),
  listarPorEmpleado: (empleadoId: number | string) => api.get(`/cambio-turno/empleado/${empleadoId}`),
  crear: (data: any) => api.post('/cambio-turno', data),
  obtener: (id: number | string) => api.get(`/cambio-turno/${id}`),
  actualizar: (id: number | string, data: any) => api.put(`/cambio-turno/${id}`, data),
  eliminar: (id: number | string) => api.delete(`/cambio-turno/${id}`),
  pendientesVistoBueno: (documento: string) => api.get(`/cambio-turno/pendientes-visto-bueno?documento=${encodeURIComponent(documento)}`),
  aprobarVistoBueno: (id: number | string, motivo?: string) => api.post(`/cambio-turno/${id}/aprobar-visto-bueno`, { motivo }),
  rechazarVistoBueno: (id: number | string, motivo?: string) => api.post(`/cambio-turno/${id}/rechazar-visto-bueno`, { motivo }),
  // Funciones para jefes de área
  enRevision: (jefeId: number | string, departamentoGestionado: string) => api.get(`/cambio-turno/en-revision?jefeId=${jefeId}&departamentoGestionado=${departamentoGestionado}`),
  aprobarPorJefe: (id: number | string, datos: any) => api.post(`/cambio-turno/${id}/aprobar-por-jefe`, datos),
  rechazarPorJefe: (id: number | string, motivo?: string) => api.post(`/cambio-turno/${id}/rechazar-por-jefe`, { motivo }),
};

export default api;
