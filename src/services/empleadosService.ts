import axios from 'axios';
import api from './api';

export const obtenerEmpleadosPorArea = async (areaId: number) => {
  const { data } = await api.get(`/empleados/area/${areaId}`);
  return data;
};

export const buscarEmpleados = async (q: string) => {
  const { data } = await api.get(`/empleados/buscar?q=${encodeURIComponent(q)}`);
  return data;
}; 