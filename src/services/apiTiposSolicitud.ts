import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

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

export interface TipoSolicitud {
  id: number;
  nombre: string;
  descripcion?: string;
}

export const tiposSolicitudService = {
  // Obtener todos los tipos de solicitud
  getAllTipos: () => api.get<TipoSolicitud[]>('/tipos-solicitud'),
  
  // Obtener tipo de solicitud por ID
  getTipoById: (id: string | number) => api.get<TipoSolicitud>(`/tipos-solicitud/${id}`),
  
  // Crear nuevo tipo de solicitud
  createTipo: (data: { nombre: string; descripcion?: string }) => api.post<TipoSolicitud>('/tipos-solicitud', data),
  
  // Actualizar tipo de solicitud
  updateTipo: (id: string | number, data: { nombre: string; descripcion?: string }) => api.put<TipoSolicitud>(`/tipos-solicitud/${id}`, data),
  
  // Eliminar tipo de solicitud
  deleteTipo: (id: string | number) => api.delete(`/tipos-solicitud/${id}`),
};

export default tiposSolicitudService; 