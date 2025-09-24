import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  UserMinus,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { dashboardService, DashboardStats, EmployeeSummary, VacationRequest, ContractEnding } from '../services/dashboardService';
import { permisosStatsService, PermisosStats } from '../services/permisosStatsService';
import { vacacionesStatsService, VacacionesStats } from '../services/vacacionesStatsService';
import { cesantiasStatsService, CesantiasStats } from '../services/cesantiasStatsService';
import { cambioTurnoStatsService, CambioTurnoStats } from '../services/cambioTurnoStatsService';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Loader from '../components/Loader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend as PieLegend } from 'recharts';
import PermisosPorTipoChart from '../components/PermisosPorTipoChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const employeeTabs = [
  { id: 'permissions', label: 'Permisos' },
  { id: 'shift', label: 'Cambio de Turno' },
  { id: 'vacations', label: 'Vacaciones' },
  { id: 'severance', label: 'Cesantías' },
];

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'employees', label: 'Empleados' },
  { id: 'vacations', label: 'Vacaciones' },
  { id: 'contracts', label: 'Contratos' },
];

const pieColors = [
  '#2E7D32', // verde
  '#1976D2', // azul
  '#FFA726', // naranja
  '#AB47BC', // morado
  '#FF7043', // rojo/naranja
  '#26A69A', // turquesa
  '#FBC02D', // amarillo
  '#8D6E63', // marrón
  '#EC407A', // rosa
  '#29B6F6', // celeste
];

const Dashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isEmpleado = user?.roles?.length === 1 && user.roles[0].nombre === 'EMPLEADO';
  const isJefe = user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA');
  const showEmployeeTabs = isEmpleado || isJefe;
  
  // Logs de depuración
  console.log('Usuario:', user);
  console.log('Roles del usuario:', user?.roles);
  console.log('¿Es empleado?:', isEmpleado);
  console.log('¿Es jefe de área?:', isJefe);
  console.log('¿Mostrar pestañas de empleado?:', showEmployeeTabs);
  
  const [activeTab, setActiveTab] = useState('permissions');
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpleados: 0,
    empleadosActivos: 0,
    empleadosInactivos: 0,
    solicitudesVacaciones: 0,
    solicitudesPendientes: 0,
    contratosPorVencer: 0,
    nuevosEmpleados: 0,
    empleadosSalida: 0,
  });
  const [chartData, setChartData] = useState({
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
  });
  const [recentEmployees, setRecentEmployees] = useState<EmployeeSummary[]>([]);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [contractEndings, setContractEndings] = useState<ContractEnding[]>([]);
  const [permisosStats, setPermisosStats] = useState<PermisosStats>({
    totalPermisos: 0,
    permisosPendientes: 0,
    permisosAprobados: 0,
    permisosRechazados: 0,
    permisosVistoBueno: 0,
    permisosEsteMes: 0,
    permisosPorTipo: [],
    permisosPorEmpleado: [],
    permisosUltimosMeses: []
  });
  const [vacacionesStats, setVacacionesStats] = useState<VacacionesStats>({
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
  });
  const [cesantiasStats, setCesantiasStats] = useState<CesantiasStats>({
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
  });
  const [cambioTurnoStats, setCambioTurnoStats] = useState<CambioTurnoStats>({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [
          statsData, 
          chartDataResponse, 
          recentEmployeesData, 
          vacationRequestsData, 
          contractEndingsData, 
          permisosStatsData,
          vacacionesStatsData,
          cesantiasStatsData,
          cambioTurnoStatsData
        ] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRotationData(),
          dashboardService.getRecentEmployees(),
          dashboardService.getVacationRequests(),
          dashboardService.getContractEndings(),
          user && user.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') 
            ? permisosStatsService.getStatsByJefe(Number(user.empleado?.id))
            : permisosStatsService.getStatsByEmployee(Number(user?.empleado?.id || 0)),
          user && user.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') 
            ? vacacionesStatsService.getStatsByJefe(Number(user.empleado?.id))
            : vacacionesStatsService.getStatsByEmployee(Number(user?.empleado?.id || 0)),
          user && user.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') 
            ? cesantiasStatsService.getStatsByJefe(Number(user.empleado?.id))
            : cesantiasStatsService.getStatsByEmployee(Number(user?.empleado?.id || 0)),
          user && user.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') 
            ? cambioTurnoStatsService.getStatsByJefe(Number(user.empleado?.id))
            : cambioTurnoStatsService.getStatsByEmployee(Number(user?.empleado?.id || 0)),
        ]);

        setStats(statsData);
        setChartData(chartDataResponse);
        setRecentEmployees(recentEmployeesData);
        setVacationRequests(vacationRequestsData);
        setContractEndings(contractEndingsData);
        setPermisosStats(permisosStatsData);
        setVacacionesStats(vacacionesStatsData);
        setCesantiasStats(cesantiasStatsData);
        setCambioTurnoStats(cambioTurnoStatsData);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statsCards = [
    { title: 'Total Empleados', value: stats.totalEmpleados.toString(), icon: Users, color: 'cyan' },
    { title: 'Empleados Activos', value: stats.empleadosActivos.toString(), icon: Briefcase, color: 'fuchsia' },
    { title: 'Nuevos (30 días)', value: stats.nuevosEmpleados.toString(), icon: DollarSign, color: 'emerald' },
    { title: 'Vacaciones Pendientes', value: stats.solicitudesPendientes.toString(), icon: Calendar, color: 'amber' },
  ];

  const renderTabContent = () => {
    if (showEmployeeTabs) {
      switch (activeTab) {
        case 'permissions':
          return (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {isEmpleado ? 'Mis Permisos' : 'Total Permisos'}
                      </p>
                      <p className="text-2xl font-bold text-white">{permisosStats.totalPermisos}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-yellow-900 to-yellow-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pendientes</p>
                      <p className="text-2xl font-bold text-white">{permisosStats.permisosPendientes}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-900 to-green-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Aprobados</p>
                      <p className="text-2xl font-bold text-white">{permisosStats.permisosAprobados}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-900 to-red-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Rechazados</p>
                      <p className="text-2xl font-bold text-white">{permisosStats.permisosRechazados}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de permisos por tipo */}
              {permisosStats.permisosPorTipo.length > 0 && (
                <PermisosPorTipoChart data={permisosStats.permisosPorTipo} />
              )}

              {/* Top empleados con más permisos - Solo para administradores/jefes */}
              {permisosStats.permisosPorEmpleado.length > 0 && !isEmpleado && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">
                    {isEmpleado ? 'Mis Permisos por Tipo' : 'Top Empleados con Más Permisos'}
                  </h2>
                  <div className="space-y-3">
                    {permisosStats.permisosPorEmpleado
                      .sort((a, b) => b.totalPermisos - a.totalPermisos)
                      .slice(0, 5)
                      .map((empleado, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{empleado.empleado}</span>
                            <div className="flex space-x-2 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {empleado.aprobados} aprobados
                              </span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {empleado.pendientes} pendientes
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {empleado.rechazados} rechazados
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-blue-600">{empleado.totalPermisos}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gráfico de tendencia mensual */}
              {permisosStats.permisosUltimosMeses.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Tendencia de Permisos (Últimos 6 Meses)</h2>
                  <div className="flex items-end justify-between h-32">
                    {permisosStats.permisosUltimosMeses.map((mes, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-blue-600 rounded-t w-8 mb-2"
                          style={{ height: `${Math.max(10, (mes.cantidad / Math.max(...permisosStats.permisosUltimosMeses.map(m => m.cantidad))) * 100)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{mes.mes}</span>
                        <span className="text-xs font-medium">{mes.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        case 'vacations':
          return (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-green-900 to-green-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {isEmpleado ? 'Mis Vacaciones' : 'Total Vacaciones'}
                      </p>
                      <p className="text-2xl font-bold text-white">{vacacionesStats.totalVacaciones}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-yellow-900 to-yellow-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pendientes</p>
                      <p className="text-2xl font-bold text-white">{vacacionesStats.vacacionesPendientes}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Aprobadas</p>
                      <p className="text-2xl font-bold text-white">{vacacionesStats.vacacionesAprobadas}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-900 to-red-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Rechazadas</p>
                      <p className="text-2xl font-bold text-white">{vacacionesStats.vacacionesRechazadas}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Días Totales Solicitados</p>
                      <p className="text-3xl font-bold text-cyan-500">{vacacionesStats.diasTotalesSolicitados}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-cyan-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Promedio por Solicitud</p>
                      <p className="text-3xl font-bold text-purple-500">{vacacionesStats.diasPromedioPorSolicitud.toFixed(1)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Este Mes</p>
                      <p className="text-3xl font-bold text-orange-500">{vacacionesStats.vacacionesEsteMes}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Top empleados con más vacaciones - Solo para administradores/jefes */}
              {vacacionesStats.vacacionesPorEmpleado.length > 0 && !isEmpleado && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Top Empleados con Más Solicitudes de Vacaciones</h2>
                  <div className="space-y-3">
                    {vacacionesStats.vacacionesPorEmpleado
                      .sort((a, b) => b.totalVacaciones - a.totalVacaciones)
                      .slice(0, 5)
                      .map((empleado, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{empleado.empleado}</span>
                            <div className="flex space-x-2 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {empleado.aprobadas} aprobadas
                              </span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {empleado.pendientes} pendientes
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {empleado.rechazadas} rechazadas
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-green-600">{empleado.totalVacaciones}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gráfico de tendencia mensual */}
              {vacacionesStats.vacacionesUltimosMeses.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Tendencia de Vacaciones (Últimos 6 Meses)</h2>
                  <div className="flex items-end justify-between h-32">
                    {vacacionesStats.vacacionesUltimosMeses.map((mes, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-green-600 rounded-t w-8 mb-2"
                          style={{ height: `${Math.max(10, (mes.cantidad / Math.max(...vacacionesStats.vacacionesUltimosMeses.map(m => m.cantidad))) * 100)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{mes.mes}</span>
                        <span className="text-xs font-medium">{mes.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        case 'severance':
          return (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-purple-900 to-purple-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {isEmpleado ? 'Mis Cesantías' : 'Total Cesantías'}
                      </p>
                      <p className="text-2xl font-bold text-white">{cesantiasStats.totalCesantias}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-yellow-900 to-yellow-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pendientes</p>
                      <p className="text-2xl font-bold text-white">{cesantiasStats.cesantiasPendientes}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-900 to-green-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Aprobadas</p>
                      <p className="text-2xl font-bold text-white">{cesantiasStats.cesantiasAprobadas}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-900 to-red-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Rechazadas</p>
                      <p className="text-2xl font-bold text-white">{cesantiasStats.cesantiasRechazadas}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Monto Total</p>
                      <p className="text-2xl font-bold text-cyan-500">${cesantiasStats.montoTotalSolicitado.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-cyan-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Promedio por Solicitud</p>
                      <p className="text-2xl font-bold text-blue-500">${cesantiasStats.montoPromedioPorSolicitud.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Carta Banco</p>
                      <p className="text-2xl font-bold text-green-500">{cesantiasStats.solicitudesCartaBanco}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Consignación</p>
                      <p className="text-2xl font-bold text-orange-500">{cesantiasStats.solicitudesConsignacion}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Top empleados con más cesantías - Solo para administradores/jefes */}
              {cesantiasStats.cesantiasPorEmpleado.length > 0 && !isEmpleado && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Top Empleados con Más Solicitudes de Cesantías</h2>
                  <div className="space-y-3">
                    {cesantiasStats.cesantiasPorEmpleado
                      .sort((a, b) => b.totalCesantias - a.totalCesantias)
                      .slice(0, 5)
                      .map((empleado, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{empleado.empleado}</span>
                            <div className="flex space-x-2 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {empleado.aprobadas} aprobadas
                              </span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {empleado.pendientes} pendientes
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {empleado.rechazadas} rechazadas
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-purple-600">{empleado.totalCesantias}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gráfico de tendencia mensual */}
              {cesantiasStats.cesantiasUltimosMeses.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Tendencia de Cesantías (Últimos 6 Meses)</h2>
                  <div className="flex items-end justify-between h-32">
                    {cesantiasStats.cesantiasUltimosMeses.map((mes, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-purple-600 rounded-t w-8 mb-2"
                          style={{ height: `${Math.max(10, (mes.cantidad / Math.max(...cesantiasStats.cesantiasUltimosMeses.map(m => m.cantidad))) * 100)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{mes.mes}</span>
                        <span className="text-xs font-medium">{mes.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        case 'shift':
          return (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-indigo-900 to-indigo-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {isEmpleado ? 'Mis Cambios' : 'Total Cambios'}
                      </p>
                      <p className="text-2xl font-bold text-white">{cambioTurnoStats.totalCambiosTurno}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-yellow-900 to-yellow-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pendientes</p>
                      <p className="text-2xl font-bold text-white">{cambioTurnoStats.cambiosPendientes}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-900 to-green-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Aprobados</p>
                      <p className="text-2xl font-bold text-white">{cambioTurnoStats.cambiosAprobados}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-900 to-red-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Rechazados</p>
                      <p className="text-2xl font-bold text-white">{cambioTurnoStats.cambiosRechazados}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Por Visto Bueno</p>
                      <p className="text-3xl font-bold text-blue-500">{cambioTurnoStats.cambiosPorVistoBueno}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">En Revisión</p>
                      <p className="text-3xl font-bold text-orange-500">{cambioTurnoStats.cambiosEnRevision}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Este Mes</p>
                      <p className="text-3xl font-bold text-purple-500">{cambioTurnoStats.cambiosEsteMes}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Top empleados con más cambios de turno - Solo para administradores/jefes */}
              {cambioTurnoStats.cambiosPorEmpleado.length > 0 && !isEmpleado && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Top Empleados con Más Solicitudes de Cambio de Turno</h2>
                  <div className="space-y-3">
                    {cambioTurnoStats.cambiosPorEmpleado
                      .sort((a, b) => b.totalCambios - a.totalCambios)
                      .slice(0, 5)
                      .map((empleado, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{empleado.empleado}</span>
                            <div className="flex space-x-2 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {empleado.aprobados} aprobados
                              </span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {empleado.pendientes} pendientes
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {empleado.rechazados} rechazados
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{empleado.totalCambios}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gráfico de tendencia mensual */}
              {cambioTurnoStats.cambiosUltimosMeses.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Tendencia de Cambios de Turno (Últimos 6 Meses)</h2>
                  <div className="flex items-end justify-between h-32">
                    {cambioTurnoStats.cambiosUltimosMeses.map((mes, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-indigo-600 rounded-t w-8 mb-2"
                          style={{ height: `${Math.max(10, (mes.cantidad / Math.max(...cambioTurnoStats.cambiosUltimosMeses.map(m => m.cantidad))) * 100)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{mes.mes}</span>
                        <span className="text-xs font-medium">{mes.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gráfico de cambios por turno */}
              {cambioTurnoStats.cambiosPorTurno.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Cambios por Tipo de Turno</h2>
                  <div className="flex items-end justify-between h-32">
                    {cambioTurnoStats.cambiosPorTurno.map((turno, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-indigo-600 rounded-t w-8 mb-2"
                          style={{ height: `${Math.max(10, (turno.cantidad / Math.max(...cambioTurnoStats.cambiosPorTurno.map(t => t.cantidad))) * 100)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600">{turno.turno}</span>
                        <span className="text-xs font-medium">{turno.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        default:
          return null;
      }
    }
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="card bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-${stat.color}-500/20 rounded-lg`}>
                        <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{stat.title}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
              <Bar data={chartData} />
            </div>
          </div>
        );

      case 'employees':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Empleados Recientes</h2>
                <span className="text-sm text-gray-500">Total: {recentEmployees.length}</span>
              </div>
              <div className="divide-y dark:divide-gray-700">
                {recentEmployees.map((employee) => (
                  <div key={employee.id} className="py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{employee.nombres}</h3>
                      <p className="text-sm text-gray-500">{employee.oficio}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(employee.fecha_ingreso).toLocaleDateString()}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {employee.estado_trabajador}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Próximas Evaluaciones
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Ana García</p>
                      <p className="text-sm text-gray-500">Evaluación de Desempeño</p>
                    </div>
                    <span className="text-sm text-gray-500">15/03/2024</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Personal
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Documentación Pendiente</p>
                      <p className="text-sm text-gray-500">3 empleados</p>
                    </div>
                    <button className="text-sm text-primary hover:underline">Ver detalles</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'vacations':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Solicitudes de Vacaciones</h2>
                <button className="btn-primary">Nueva Solicitud</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {vacationRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{request.empleado}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(request.fecha_inicio).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.dias}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.estado === 'Aprobado'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          }`}>
                            {request.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Días Disponibles</p>
                    <p className="text-3xl font-bold text-cyan-500">156</p>
                  </div>
                  <Calendar className="w-8 h-8 text-cyan-500" />
                </div>
              </div>
              <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Solicitudes Aprobadas</p>
                    <p className="text-3xl font-bold text-green-500">8</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Solicitudes Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-500">3</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Próximas Terminaciones de Contrato</h2>
                <button className="btn-primary">Gestionar Contratos</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Fin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contractEndings.map((contract) => (
                      <tr key={contract.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{contract.empleado}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contract.oficio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(contract.fecha_salida).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {contract.tipo_contrato}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserMinus className="w-5 h-5" />
                  Resumen de Terminaciones
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Contratos por vencer (30 días)</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Renovaciones pendientes</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Finalizaciones voluntarias</span>
                    <span className="font-semibold">1</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Tipos de Contrato</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Indefinido</span>
                    <span className="font-semibold">180</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Temporal</span>
                    <span className="font-semibold">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Período de prueba</span>
                    <span className="font-semibold">23</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <Loader text="Cargando panel de control..." />;
  }

  // Log de depuración para las pestañas
  console.log('Pestañas mostradas:', showEmployeeTabs ? employeeTabs : tabs);

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 border-b dark:border-gray-700">
        {(showEmployeeTabs ? employeeTabs : tabs).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 -mb-px text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default Dashboard;