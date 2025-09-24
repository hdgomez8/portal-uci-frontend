import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555/api";

export interface PermisosStats {
  totalPermisos: number;
  permisosPendientes: number;
  permisosAprobados: number;
  permisosRechazados: number;
  permisosVistoBueno: number;
  permisosEsteMes: number;
  permisosPorTipo: {
    tipo: string;
    cantidad: number;
    porcentaje: number;
  }[];
  permisosPorEmpleado: {
    empleado: string;
    totalPermisos: number;
    aprobados: number;
    pendientes: number;
    rechazados: number;
  }[];
  permisosUltimosMeses: {
    mes: string;
    cantidad: number;
  }[];
}

export const permisosStatsService = {
  // Obtener estadísticas generales de permisos
  getStats: async (): Promise<PermisosStats> => {
    try {
      const response = await axios.get(`${API_URL}/solicitudes/stats`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas de permisos:", error);
      throw error;
    }
  },

  // Obtener estadísticas de permisos por empleado específico
  getStatsByEmployee: async (empleadoId: string | number): Promise<PermisosStats> => {
    try {
      const response = await axios.get(`${API_URL}/solicitudes/stats/empleado/${empleadoId}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas de permisos del empleado:", error);
      throw error;
    }
  },

  // Obtener estadísticas de permisos por jefe
  getStatsByJefe: async (jefeId: string | number): Promise<PermisosStats> => {
    try {
      const response = await axios.get(`${API_URL}/solicitudes/stats/jefe/${jefeId}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas de permisos del jefe:", error);
      throw error;
    }
  }
}; 