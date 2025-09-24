export interface Empleado {
  id: string;
  nombres: string;
  oficio: string;
  area?: {
    nombre: string;
    jefe?: string;
  };
  documento?: string;
}

export interface Permiso {
  id: number;
  nombre: string;
}

export interface Rol {
  id: number;
  nombre: string;
  permisos: Permiso[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  empleado?: Empleado;
  roles?: Rol[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}