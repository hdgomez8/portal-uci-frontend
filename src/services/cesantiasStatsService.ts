import api from './api';

export interface CesantiasStats {
  totalCesantias: number;
  cesantiasPendientes: number;
  cesantiasAprobadas: number;
  cesantiasRechazadas: number;
  cesantiasEnRevision: number;
  cesantiasEsteMes: number;
  montoTotalSolicitado: number;
  montoPromedioPorSolicitud: number;
  solicitudesCartaBanco: number;
  solicitudesConsignacion: number;
  cesantiasPorEmpleado: Array<{
    empleado: string;
    totalCesantias: number;
    aprobadas: number;
    pendientes: number;
    rechazadas: number;
  }>;
  cesantiasUltimosMeses: Array<{
    mes: string;
    cantidad: number;
  }>;
}

class CesantiasStatsService {
  async getStatsByEmployee(empleadoId: number): Promise<CesantiasStats> {
    try {
      const response = await api.get(`/cesantias/stats/empleado/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de cesantías del empleado:', error);
      return {
        totalCesantias: 0,
        cesantiasPendientes: 0,
        cesantiasAprobadas: 0,
        cesantiasRechazadas: 0,
        cesantiasEnRevision: 0,
        cesantiasEsteMes: 0,
        montoTotalSolicitado: 0,
        montoPromedioPorSolicitud: 0,
        solicitudesCartaBanco: 0,
        solicitudesConsignacion: 0,
        cesantiasPorEmpleado: [],
        cesantiasUltimosMeses: []
      };
    }
  }

  async getStatsByJefe(jefeId: number): Promise<CesantiasStats> {
    try {
      const response = await api.get(`/cesantias/stats/jefe/${jefeId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de cesantías del jefe:', error);
      return {
        totalCesantias: 0,
        cesantiasPendientes: 0,
        cesantiasAprobadas: 0,
        cesantiasRechazadas: 0,
        cesantiasEnRevision: 0,
        cesantiasEsteMes: 0,
        montoTotalSolicitado: 0,
        montoPromedioPorSolicitud: 0,
        solicitudesCartaBanco: 0,
        solicitudesConsignacion: 0,
        cesantiasPorEmpleado: [],
        cesantiasUltimosMeses: []
      };
    }
  }

  async getStatsGeneral(): Promise<CesantiasStats> {
    try {
      const response = await api.get('/cesantias/stats/general');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas generales de cesantías:', error);
      return {
        totalCesantias: 0,
        cesantiasPendientes: 0,
        cesantiasAprobadas: 0,
        cesantiasRechazadas: 0,
        cesantiasEnRevision: 0,
        cesantiasEsteMes: 0,
        montoTotalSolicitado: 0,
        montoPromedioPorSolicitud: 0,
        solicitudesCartaBanco: 0,
        solicitudesConsignacion: 0,
        cesantiasPorEmpleado: [],
        cesantiasUltimosMeses: []
      };
    }
  }
}

export const cesantiasStatsService = new CesantiasStatsService(); 