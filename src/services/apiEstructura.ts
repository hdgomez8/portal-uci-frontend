// services/api/estructuraService.js
import axios from 'axios';

const apiEstructura = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 30 segundos de timeout
  timeoutErrorMessage: 'La solicitud tardó demasiado en responder. Por favor, inténtalo de nuevo.',
});

// Interceptor para agregar el token a las peticiones
apiEstructura.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const estructuraService = {
  getAllDepartamentos: () => apiEstructura.get('/departamentos'),
  getAllAreas: () => apiEstructura.get('/areas'),
  getAreas: () => apiEstructura.get('/areas'),
  createDepartamento: (data: { nombre: string; gerente_id?: string }) => apiEstructura.post('/departamentos', data),
  createArea: (data: { nombre: string; departamento_id: string }) => apiEstructura.post('/areas', data),
  updateDepartamento: (id: string, data: { nombre: string; gerente_id?: string }) => apiEstructura.put(`/departamentos/${id}`, data),
  updateArea: (id: string, data: { nombre: string; departamento_id: string }) => apiEstructura.put(`/areas/${id}`, data),
  deleteArea: (id: string) => apiEstructura.delete(`/areas/${id}`),
  deleteDepartamento: (id: string) => apiEstructura.delete(`/departamentos/${id}`),
};

export default apiEstructura;
