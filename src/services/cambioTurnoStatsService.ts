import api from './api';

export interface CambioTurnoStats {
  totalCambiosTurno: number;
  cambiosPendientes: number;
  cambiosAprobados: number;
  cambiosRechazados: number;
  cambiosEnRevision: number;
  cambiosEsteMes: number;
  cambiosPorVistoBueno: number;
  cambiosPorEmpleado: Array<{
    empleado: string;
    totalCambios: number;
    aprobados: number;
    pendientes: number;
    rechazados: number;
  }>;
  cambiosUltimosMeses: Array<{
    mes: string;
    cantidad: number;
  }>;
  cambiosPorTurno: Array<{
    turno: string;
    cantidad: number;
  }>;
}

class CambioTurnoStatsService {
  async getStatsByEmployee(empleadoId: number): Promise<CambioTurnoStats> {
    try {
      const response = await api.get(`/cambio-turno/stats/empleado/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de cambio de turno del empleado:', error);
      return {
        totalCambiosTurno: 0,
        cambiosPendientes: 0,
        cambiosAprobados: 0,
        cambiosRechazados: 0,
        cambiosEnRevision: 0,
        cambiosEsteMes: 0,
        cambiosPorVistoBueno: 0,
        cambiosPorEmpleado: [],
        cambiosUltimosMeses: [],
        cambiosPorTurno: []
      };
    }
  }

  async getStatsByJefe(jefeId: number): Promise<CambioTurnoStats> {
    try {
      const response = await api.get(`/cambio-turno/stats/jefe/${jefeId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de cambio de turno del jefe:', error);
      return {
        totalCambiosTurno: 0,
        cambiosPendientes: 0,
        cambiosAprobados: 0,
        cambiosRechazados: 0,
        cambiosEnRevision: 0,
        cambiosEsteMes: 0,
        cambiosPorVistoBueno: 0,
        cambiosPorEmpleado: [],
        cambiosUltimosMeses: [],
        cambiosPorTurno: []
      };
    }
  }

  async getStatsGeneral(): Promise<CambioTurnoStats> {
    try {
      const response = await api.get('/cambio-turno/stats/general');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas generales de cambio de turno:', error);
      return {
        totalCambiosTurno: 0,
        cambiosPendientes: 0,
        cambiosAprobados: 0,
        cambiosRechazados: 0,
        cambiosEnRevision: 0,
        cambiosEsteMes: 0,
        cambiosPorVistoBueno: 0,
        cambiosPorEmpleado: [],
        cambiosUltimosMeses: [],
        cambiosPorTurno: []
      };
    }
  }
}

export const cambioTurnoStatsService = new CambioTurnoStatsService(); 