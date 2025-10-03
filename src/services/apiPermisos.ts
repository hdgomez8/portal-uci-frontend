import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";

// Configurar axios con interceptor para token
const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 segundos de timeout
    timeoutErrorMessage: 'La solicitud tardó demasiado en responder. Por favor, inténtalo de nuevo.',
  });

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// PERMISOS DEL SISTEMA (Roles y Permisos)
export const permisosSistemaService = {
  getPermisos: () => api.get('/permisos'),
  createPermiso: (data: { nombre: string }) => api.post('/permisos', data),
  updatePermiso: (id: string, data: { nombre: string }) => api.put(`/permisos/${id}`, data),
  deletePermiso: (id: string) => api.delete(`/permisos/${id}`),
};

// SOLICITUDES DE PERMISOS (Permisos de empleados)
export const obtenerPermisos = async () => {
    try {
        const response = await axios.get(`${API_URL}/solicitudes`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        throw error;
    }
};

export const crearPermiso = async (permiso: any, archivos: File[]) => {
    try {
        const formData = new FormData();

        // Agregar los campos del permiso al FormData
        Object.keys(permiso).forEach(key => {
            formData.append(key, permiso[key]);
        });

        // Agregar los archivos al FormData (si existen)
        if (archivos && archivos.length > 0) {
            archivos.forEach((archivo: File) => {
                formData.append('adjuntos', archivo);
            });
        }

        // Enviar la solicitud usando la instancia api configurada
        const response = await api.post('/solicitudes', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        throw error;
    }
};

export const obtenerPermisosPorEmpleado = async (empleado_id: string | number) => {
    try {
        const response = await axios.get(`${API_URL}/solicitudes/empleado/${empleado_id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener solicitudes del empleado:', error);
        throw error;
    }
};

export const obtenerEmpleadosPorJefe = async (jefe_id: string | number) => {
    try {
        const response = await axios.get(`${API_URL}/empleados/jefe/${jefe_id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener empleados del jefe:', error);
        throw error;
    }
};

export const obtenerPermisosPorJefe = async (jefe_id: string | number) => {
    try {
        const response = await axios.get(`${API_URL}/solicitudes/jefe/${jefe_id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener permisos del jefe:', error);
        throw error;
    }
};

export const actualizarEstadoPermiso = async (solicitud_id: string | number, estado: string, motivo?: string) => {
    try {
        const response = await axios.put(`${API_URL}/solicitudes/${solicitud_id}/estado`, {
            estado,
            motivo,
            visto_bueno_por: JSON.parse(localStorage.getItem("usuario") || "{}")?.empleado?.nombres || 'Jefe de Área'
        });
        return response.data;
    } catch (error) {
        console.error('Error al actualizar estado del permiso:', error);
        throw error;
    }
};
