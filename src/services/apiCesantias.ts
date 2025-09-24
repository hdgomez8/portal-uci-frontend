import api from './api';

export interface CesantiasData {
  empleado_id: number;
  correo_solicitante: string;
  nombre_colaborador: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  fecha_solicitud: string;
  tipo_retiro: 'carta_banco' | 'consignacion_cuenta';
  entidad_bancaria?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  solicitud_cesantias_pdf: string;
  copia_cedula_solicitante?: string;
  copia_cedula_conyuge?: string;
  predial_certificado?: string;
  fotos_reforma?: string; // JSON string en lugar de array
  cotizacion_materiales?: string;
  promesa_compraventa?: string;
  cedula_vendedor?: string;
  monto_solicitado?: number;
}

export interface CesantiasResponse {
  id: number;
  empleado_id: number;
  correo_solicitante: string;
  nombre_colaborador: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  fecha_solicitud: string;
  tipo_retiro: 'carta_banco' | 'consignacion_cuenta';
  entidad_bancaria?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  solicitud_cesantias_pdf: string;
  copia_cedula_solicitante?: string;
  copia_cedula_conyuge?: string;
  predial_certificado?: string;
  fotos_reforma?: string; // JSON string en lugar de array
  cotizacion_materiales?: string;
  promesa_compraventa?: string;
  cedula_vendedor?: string;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  observaciones?: string;
  fecha_revision?: string;
  revisado_por?: number;
  monto_solicitado?: number;
  monto_aprobado?: number;
  motivo_rechazo?: string;
  created_at: string;
  updated_at: string;
  empleado?: {
    id: number;
    nombres: string;
    documento: string;
    email: string;
  };
  revisor?: {
    id: number;
    nombres: string;
    documento: string;
  };
}

export const cesantiasService = {
  // Crear nueva solicitud
  crear: (data: CesantiasData) => api.post<CesantiasResponse>('/cesantias', data),
  
  // Listar todas las solicitudes
  listar: () => api.get<CesantiasResponse[]>('/cesantias'),
  
  // Listar solicitudes de un empleado específico
  listarPorEmpleado: (empleadoId: number) => api.get<CesantiasResponse[]>(`/cesantias/empleado/${empleadoId}`),
  
  // Listar solicitudes por estado
  listarPorEstado: (estado: string) => api.get<CesantiasResponse[]>(`/cesantias/estado/${estado}`),
  
  // Obtener una solicitud por ID
  obtener: (id: number) => api.get<CesantiasResponse>(`/cesantias/${id}`),
  
  // Actualizar una solicitud
  actualizar: (id: number, data: Partial<CesantiasData>) => api.put<CesantiasResponse>(`/cesantias/${id}`, data),
  
  // Eliminar una solicitud
  eliminar: (id: number) => api.delete(`/cesantias/${id}`),
  
  // Aprobar solicitud
  aprobar: (id: number, data: { monto_aprobado?: number; observaciones?: string; revisado_por?: number }) => 
    api.put<CesantiasResponse>(`/cesantias/${id}/aprobar`, data),
  
  // Rechazar solicitud
  rechazar: (id: number, data: { motivo_rechazo: string; observaciones?: string; revisado_por?: number }) => 
    api.put<CesantiasResponse>(`/cesantias/${id}/rechazar`, data)
};

export default cesantiasService; 