import api from './api';

export interface DashboardStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  solicitudesVacaciones: number;
  solicitudesPendientes: number;
  contratosPorVencer: number;
  nuevosEmpleados: number;
  empleadosSalida: number;
}

export interface EmployeeSummary {
  id: number;
  nombres: string;
  oficio: string;
  fecha_ingreso: string;
  estado_trabajador: string;
}

export interface VacationRequest {
  id: number;
  empleado: string;
  fecha_inicio: string;
  dias: number;
  estado: string;
}

export interface ContractEnding {
  id: number;
  empleado: string;
  oficio: string;
  fecha_salida: string;
  tipo_contrato: string;
}

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      // Retornar valores por defecto en caso de error
      return {
        totalEmpleados: 0,
        empleadosActivos: 0,
        empleadosInactivos: 0,
        solicitudesVacaciones: 0,
        solicitudesPendientes: 0,
        contratosPorVencer: 0,
        nuevosEmpleados: 0,
        empleadosSalida: 0,
      };
    }
  },

  // Obtener empleados recientes
  getRecentEmployees: async (): Promise<EmployeeSummary[]> => {
    try {
      const response = await api.get('/empleados?limit=5&sort=fecha_ingreso&order=desc');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo empleados recientes:', error);
      return [];
    }
  },

  // Obtener solicitudes de vacaciones
  getVacationRequests: async (): Promise<VacationRequest[]> => {
    try {
      const response = await api.get('/solicitudes?tipo=vacaciones&limit=10');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo solicitudes de vacaciones:', error);
      return [];
    }
  },

  // Obtener contratos por vencer
  getContractEndings: async (): Promise<ContractEnding[]> => {
    try {
      const response = await api.get('/empleados?contratos_por_vencer=true&limit=10');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo contratos por vencer:', error);
      return [];
    }
  },

  // Obtener datos para gráficos de rotación
  getRotationData: async () => {
    try {
      const response = await api.get('/dashboard/rotation-data');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos de rotación:', error);
      return {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Nuevas Contrataciones',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: '#00F5FF',
          },
          {
            label: 'Bajas',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: '#FF00F5',
          },
        ],
      };
    }
  },
}; 