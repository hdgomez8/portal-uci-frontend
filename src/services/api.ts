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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 🔍 DEBUG DETALLADO DE PETICIONES
  console.log('🔍 ===== REQUEST DEBUG =====');
  console.log('🌐 URL:', config.url);
  console.log('📋 Method:', config.method?.toUpperCase());
  console.log('🔑 Headers:', config.headers);
  console.log('📦 Data:', config.data);
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('🔍 ===== END REQUEST DEBUG =====');
  
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
    console.log('🔍 ===== END ERROR DEBUG =====');
    
    return Promise.reject(error);
  }
);

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
  crearSolicitud: (solicitudData: FormData) => api.post('/solicitudes', solicitudData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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
