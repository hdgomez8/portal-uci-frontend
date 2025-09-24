import api from './api';

export interface VacacionesData {
  empleado_id: number;
  ciudad_departamento: string;
  fecha_solicitud: string;
  nombres_colaborador: string;
  cedula_colaborador: string;
  cargo_colaborador: string;
  periodo_cumplido_desde: string;
  periodo_cumplido_hasta: string;
  dias_cumplidos: number;
  periodo_disfrute_desde: string;
  periodo_disfrute_hasta: string;
  dias_disfrute: number;
  dias_pago_efectivo_aplica: boolean;
  dias_pago_efectivo_na: boolean;
  dias_pago_efectivo_total?: number;
  actividades_pendientes?: string;
  reemplazo_nombre?: string;
  reemplazo_firma?: string;
  reemplazo_identificacion?: string;
  reemplazo_no_hay?: boolean;
  reemplazo_nuevo_personal?: string;
  solicitante_nombre: string;
  solicitante_cargo: string;
  solicitante_firma?: string;
  jefe_nombre: string;
  jefe_cargo: string;
  jefe_firma?: string;
  administrador_nombre?: string;
  administrador_cargo?: string;
  administrador_firma?: string;
  representante_legal_nombre?: string;
  representante_legal_cargo?: string;
  representante_legal_firma?: string;
  estado?: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  observaciones?: string;
  fecha_revision?: string;
  revisado_por?: number;
  motivo_rechazo?: string;
}

export interface VacacionesResponse extends VacacionesData {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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

export const vacacionesService = {
  crear: (data: VacacionesData) => api.post<VacacionesResponse>('/vacaciones', data),
  listar: () => api.get<VacacionesResponse[]>('/vacaciones'),
  listarPorEmpleado: (empleadoId: number) => api.get<VacacionesResponse[]>(`/vacaciones/empleado/${empleadoId}`),
  listarPorJefe: (jefeId: number) => api.get<VacacionesResponse[]>(`/vacaciones/jefe?jefeId=${jefeId}`),
  listarPorEstado: (estado: string) => api.get<VacacionesResponse[]>(`/vacaciones/estado/${estado}`),
  obtener: (id: number) => api.get<VacacionesResponse>(`/vacaciones/${id}`),
  actualizar: (id: number, data: Partial<VacacionesData>) => api.put<VacacionesResponse>(`/vacaciones/${id}`, data),
  eliminar: (id: number) => api.delete(`/vacaciones/${id}`),
  aprobar: (id: number, data: { observaciones?: string; revisado_por?: number }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/aprobar`, data),
  rechazar: (id: number, data: { motivo_rechazo: string; observaciones?: string; revisado_por?: number }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/rechazar`, data),
  // Nuevas funciones para sistema de visto bueno
  listarPendientesVistoBueno: () => api.get<VacacionesResponse[]>('/vacaciones/pendientes-visto-bueno'),
  aprobarVistoBueno: (id: number, data: { observaciones?: string }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/aprobar-visto-bueno`, data),
  rechazarVistoBueno: (id: number, data: { motivo_rechazo: string; observaciones?: string }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/rechazar-visto-bueno`, data),
  aprobarPorJefe: (id: number, data: { observaciones?: string; documentoJefe?: string }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/aprobar-por-jefe`, data),
  rechazarPorJefe: (id: number, data: { motivo_rechazo: string; observaciones?: string }) =>
    api.put<VacacionesResponse>(`/vacaciones/${id}/rechazar-por-jefe`, data),
  // Nuevos servicios para el flujo completo de aprobación
  aprobarPorAdministrador: (id: number | string, datos: any) => api.put(`/vacaciones/${id}/aprobar-por-administrador`, datos),
  aprobarPorRRHH: (id: number | string, datos: any) => api.put(`/vacaciones/${id}/aprobar-por-rrhh`, datos),
};

export default vacacionesService; 