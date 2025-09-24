import api from './api';

export interface VacacionesStats {
  totalVacaciones: number;
  vacacionesPendientes: number;
  vacacionesAprobadas: number;
  vacacionesRechazadas: number;
  vacacionesEnRevision: number;
  vacacionesEsteMes: number;
  diasTotalesSolicitados: number;
  diasPromedioPorSolicitud: number;
  vacacionesPorEmpleado: Array<{
    empleado: string;
    totalVacaciones: number;
    aprobadas: number;
    pendientes: number;
    rechazadas: number;
  }>;
  vacacionesUltimosMeses: Array<{
    mes: string;
    cantidad: number;
  }>;
}

class VacacionesStatsService {
  async getStatsByEmployee(empleadoId: number): Promise<VacacionesStats> {
    try {
      const response = await api.get(`/vacaciones/stats/empleado/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de vacaciones del empleado:', error);
      return {
        totalVacaciones: 0,
        vacacionesPendientes: 0,
        vacacionesAprobadas: 0,
        vacacionesRechazadas: 0,
        vacacionesEnRevision: 0,
        vacacionesEsteMes: 0,
        diasTotalesSolicitados: 0,
        diasPromedioPorSolicitud: 0,
        vacacionesPorEmpleado: [],
        vacacionesUltimosMeses: []
      };
    }
  }

  async getStatsByJefe(jefeId: number): Promise<VacacionesStats> {
    try {
      const response = await api.get(`/vacaciones/stats/jefe/${jefeId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de vacaciones del jefe:', error);
      return {
        totalVacaciones: 0,
        vacacionesPendientes: 0,
        vacacionesAprobadas: 0,
        vacacionesRechazadas: 0,
        vacacionesEnRevision: 0,
        vacacionesEsteMes: 0,
        diasTotalesSolicitados: 0,
        diasPromedioPorSolicitud: 0,
        vacacionesPorEmpleado: [],
        vacacionesUltimosMeses: []
      };
    }
  }

  async getStatsGeneral(): Promise<VacacionesStats> {
    try {
      const response = await api.get('/vacaciones/stats/general');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas generales de vacaciones:', error);
      return {
        totalVacaciones: 0,
        vacacionesPendientes: 0,
        vacacionesAprobadas: 0,
        vacacionesRechazadas: 0,
        vacacionesEnRevision: 0,
        vacacionesEsteMes: 0,
        diasTotalesSolicitados: 0,
        diasPromedioPorSolicitud: 0,
        vacacionesPorEmpleado: [],
        vacacionesUltimosMeses: []
      };
    }
  }
}

export const vacacionesStatsService = new VacacionesStatsService(); 