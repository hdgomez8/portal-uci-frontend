import axios from 'axios';

const apiRoles = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 30 segundos de timeout
  timeoutErrorMessage: 'La solicitud tardó demasiado en responder. Por favor, inténtalo de nuevo.',
});

// Interceptor para agregar el token a las peticiones
apiRoles.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const rolesService = {
  // Obtener todos los roles
  getAllRoles: () => apiRoles.get('/roles'),
  
  // Obtener rol por ID
  getRoleById: (id: string) => apiRoles.get(`/roles/${id}`),
};

export default apiRoles; 