import axios from 'axios';

const apiRoles = axios.create({
  baseURL: 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
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