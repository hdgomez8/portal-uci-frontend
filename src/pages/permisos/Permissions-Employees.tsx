import { useState, useEffect } from 'react';
import { AlertCircle, PlusCircle, XCircle, CheckCircle, Eye, Clock, ArrowUp, ArrowDown, Pencil, FileText, User as UserIcon, Download } from 'lucide-react';
import { obtenerPermisos, crearPermiso, obtenerPermisosPorEmpleado, obtenerEmpleadosPorJefe, obtenerPermisosPorJefe, actualizarEstadoPermiso } from "../../services/apiPermisos";
import { tiposSolicitudService, TipoSolicitud } from "../../services/apiTiposSolicitud";
import { solicitudesService } from "../../services/api";
import { permisosStatsService, PermisosStats } from "../../services/permisosStatsService";
import Loader from '../../components/Loader';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PermisosPorTipoChart from '../../components/PermisosPorTipoChart';
import { exportSolicitudesToExcel } from '../../utils/excelExport';

const EmployeeSummary = ({ empleado }: { empleado: any }) => (
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded flex items-center gap-6">
    <UserIcon className="w-12 h-12 text-blue-400" />
    <div>
      <h2 className="text-xl font-bold">{empleado?.nombres || 'Empleado'}</h2>
      <p className="text-gray-600">{empleado?.oficio || 'Sin cargo'}</p>
      <div className="flex gap-4 mt-1 text-sm text-gray-500">
        <span>#{empleado?.codigo}</span>
        <span>{empleado?.estado_trabajador}</span>
      </div>
    </div>
  </div>
);

const Permissions = () => {
  const user = JSON.parse(localStorage.getItem("usuario") || "null");
  
  // Función para obtener el área del usuario
  const obtenerAreaUsuario = () => {
    console.log('🔍 Debug obteniendo área del usuario:', user);
    
    // La estructura correcta según el backend es: user.empleado.areas[0].nombre
    const area = user?.empleado?.areas?.[0]?.nombre || 'No asignada';
    
    console.log('📋 Área encontrada:', area);
    return area;
  };
  
  // Función para obtener el jefe del usuario
  const obtenerJefeUsuario = () => {
    console.log('🔍 Debug obteniendo jefe del usuario:', user);
    
    // La estructura correcta según el backend es: user.empleado.areas[0].jefe.nombres
    const jefe = user?.empleado?.areas?.[0]?.jefe?.nombres || 'No asignado';
    
    console.log('📋 Jefe encontrado:', jefe);
    return jefe;
  };
  
  // Función para obtener la fecha local correcta
  const getCurrentDate = () => {
    const now = new Date();
    
    // Ajustar por zona horaria local para evitar desfase
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fechas correctamente evitando problemas de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return "SIN FECHA";
    try {
      // Usar solo la parte de la fecha (YYYY-MM-DD) para evitar desfase por zona horaria
      const soloFecha = dateString.split('T')[0];
      const [year, month, day] = soloFecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return "SIN FECHA";
    }
  };

  // Función específica para formatear fechas en la tabla, corrigiendo el desfase de zona horaria
  const formatDateForTable = (dateString: string) => {
    if (!dateString) return "SIN FECHA";
    try {
      // Crear fecha en zona horaria local para evitar desfase
      const date = new Date(dateString);
      
      // Ajustar por zona horaria local
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formateando fecha para tabla:', error);
      return "SIN FECHA";
    }
  };

  // Función para convertir fecha a formato YYYY-MM-DD para inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Usar solo la parte de la fecha (YYYY-MM-DD) para evitar desfase por zona horaria
      return dateString.split('T')[0];
    } catch (error) {
      console.error('Error formateando fecha para input:', error);
      return '';
    }
  };

  // Función para asegurar que la fecha se envíe correctamente
  const ensureCorrectDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Si ya está en formato YYYY-MM-DD, usarlo directamente
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log("✅ Fecha ya en formato correcto:", dateString);
        return dateString;
      }
      
      // Para otros formatos, crear fecha en zona horaria local
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log("📅 Fecha convertida:", dateString, "->", result);
      return result;
    } catch (error) {
      console.error('Error asegurando fecha correcta:', error);
      return dateString;
    }
  };
  
  const [permissions, setPermissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState('resumen'); // Estado para cambiar de pestaña
  const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal
  const [newPermission, setNewPermission] = useState({
    empleado_id: user?.empleado?.id,
    tipo_solicitud_id: '',
    fecha: getCurrentDate(), // ✅ Usar función que obtiene fecha local correcta
    fecha_permiso: '',
    estado: 'Pendiente',
    hora: '00:00',
    duracion: '',
    observaciones: '',
  });

  const [archivos, setArchivos] = useState<File[]>([]); // ✅ Nuevo estado para los archivos
  const [orden, setOrden] = useState({ campo: 'fecha_creacion', asc: false }); // Cambiado a false para mostrar los más recientes primero
  const [selectedPermission, setSelectedPermission] = useState<any | null>(null);
  const [empleadosJefe, setEmpleadosJefe] = useState<any[]>([]);
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
  
  // Estados para paginación y filtros
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);
  const [filtros, setFiltros] = useState({
    estado: '',
    tipoPermiso: '',
    fechaDesde: '',
    fechaHasta: '',
    empleado: ''
  });

  const [loading, setLoading] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitud[]>([]);

  // Colores institucionales para el gráfico
  const pieColors = ['#2E7D32', '#4CAF50', '#66BB6A', '#3A7CA5', '#81C784', '#1976D2'];

  useEffect(() => {
    fetchPermissions();
    fetchPermisosStats();
    fetchTiposSolicitud();
    if (user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      fetchEmpleadosJefe();
    }
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      let data;
      if (user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
        // Obtener solo las solicitudes de los empleados del jefe (excluyendo las del propio jefe)
        data = await obtenerPermisosPorJefe(Number(user.empleado?.id));
        console.log('Solicitudes de empleados del jefe:', data);
      } else {
        // Solo las del empleado logueado
        data = await obtenerPermisosPorEmpleado(Number(user.empleado?.id));
      }
      setPermissions(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar los permisos");
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpleadosJefe = async () => {
    try {
      const empleados = await obtenerEmpleadosPorJefe(user.empleado?.id);
      setEmpleadosJefe(empleados);
    } catch (err) {
      setError("Error al cargar los empleados del jefe");
      console.error("Error fetching empleados jefe:", err);
    }
  };

  const fetchPermisosStats = async () => {
    try {
      let stats;
      if (user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
        // Para jefes: estadísticas de todos los empleados de su departamento
        stats = await permisosStatsService.getStatsByJefe(Number(user.empleado?.id));
      } else {
        // Para empleados: solo sus propios permisos
        stats = await permisosStatsService.getStatsByEmployee(Number(user.empleado?.id));
      }
      setPermisosStats(stats);
    } catch (err) {
      console.error("Error fetching permisos stats:", err);
    }
  };

  const fetchTiposSolicitud = async () => {
    try {
      const response = await tiposSolicitudService.getAllTipos();
      setTiposSolicitud(response.data);
      console.log('Tipos de solicitud cargados:', response.data);
    } catch (err) {
      console.error("Error al cargar tipos de solicitud:", err);
      setError("Error al cargar los tipos de solicitud");
    }
  };

  // Guardar permiso nuevo (simulación)
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Si se está editando un permiso existente, no hacer nada
    if (selectedPermission) {
      return;
    }
    
    // Validar que la fecha del permiso no sea anterior a hoy
    const fechaActual = getCurrentDate();
    if (newPermission.fecha_permiso && newPermission.fecha_permiso < fechaActual) {
      setError('❌ La fecha del permiso no puede ser anterior a la fecha actual');
      return;
    }
    
    // Logs detallados para debugging
    console.log("🔍 DEBUG - Fecha del permiso:");
    console.log("  - newPermission.fecha_permiso:", newPermission.fecha_permiso);
    console.log("  - Tipo de dato:", typeof newPermission.fecha_permiso);
    console.log("  - Fecha actual:", fechaActual);
    console.log("  - Fecha actual tipo:", typeof fechaActual);
    
    // Verificar si la fecha es válida
    if (newPermission.fecha_permiso) {
      const fechaPermiso = new Date(newPermission.fecha_permiso);
      console.log("  - Fecha como objeto Date:", fechaPermiso);
      console.log("  - Fecha ISO string:", fechaPermiso.toISOString());
      console.log("  - Fecha local string:", fechaPermiso.toLocaleDateString());
      console.log("  - Zona horaria offset:", fechaPermiso.getTimezoneOffset());
    }
    
    // Asegurar que la fecha se envíe correctamente
    const fechaPermisoCorregida = ensureCorrectDate(newPermission.fecha_permiso);
    console.log("  - Fecha corregida para envío:", fechaPermisoCorregida);
    
    console.log("🚀 Datos a enviar:", newPermission, archivos);

    try {
      const formData = new FormData();

      // Crear una copia de newPermission con la fecha corregida
      const datosEnviar = {
        ...newPermission,
        fecha_permiso: fechaPermisoCorregida
      };

      // Agregar datos del permiso al formData
      Object.entries(datosEnviar).forEach(([key, value]) => {
        formData.append(key, value);
        console.log(`📤 Enviando ${key}:`, value);
      });

      // Agregar archivos al formData
      archivos.forEach((file) => {
        formData.append("adjuntos", file);
      });

      const response = await crearPermiso(datosEnviar, archivos);
      console.log("✅ Respuesta del servidor:", response);

      fetchPermissions();
      setSuccessMessage("✔️ Permiso creado con éxito");
      setTimeout(() => setSuccessMessage(""), 5000);      
      setPermissions([...permissions, response]);
      setShowModal(false);

      setNewPermission({
        empleado_id: user?.empleado?.id || '',
        tipo_solicitud_id: '',
        fecha: getCurrentDate(),
        fecha_permiso: '',
        estado: 'Pendiente',
        hora: '00:00',
        duracion: '',
        observaciones: ''
      });

      setArchivos([]);

    } catch (err) {
      console.error('❌ Error creando permiso:', err);
      setError('Error al crear el permiso');
    }
  };


  const estadoIcon = (estado: any) => {
    switch (estado?.toLowerCase()) {
      case "aprobado":
        return <CheckCircle className="text-green-500 w-5 h-5 inline" />;
      case "rechazado":
        return <XCircle className="text-red-500 w-5 h-5 inline" />;
      case "visto_bueno":
        return <Eye className="text-blue-500 w-5 h-5 inline" />;
      case "pendiente":
        return <Clock className="text-yellow-500 w-5 h-5 inline" />;
      default:
        return null;
    }
  };

  // Función para filtrar permisos
  const filtrarPermisos = (permisos: any[]) => {
    return permisos.filter(permiso => {
      const cumpleEstado = !filtros.estado || permiso.estado === filtros.estado;
      const cumpleTipo = !filtros.tipoPermiso || permiso.tipo_solicitud?.nombre === filtros.tipoPermiso;
      const cumpleEmpleado = !filtros.empleado || 
        permiso.empleado?.nombres?.toLowerCase().includes(filtros.empleado.toLowerCase());
      
      let cumpleFecha = true;
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaPermiso = permiso.fecha_creacion ? new Date(permiso.fecha_creacion).toISOString().split('T')[0] : '';
        if (filtros.fechaDesde && fechaPermiso < filtros.fechaDesde) cumpleFecha = false;
        if (filtros.fechaHasta && fechaPermiso > filtros.fechaHasta) cumpleFecha = false;
      }
      
      return cumpleEstado && cumpleTipo && cumpleEmpleado && cumpleFecha;
    });
  };

  // Función para ordenar permisos
  const ordenarPermisos = (permisos: any[]) => {
    const obtenerValor = (permiso: any, campo: any) => {
      switch (campo) {
        case "empleado":
          return permiso.empleado?.nombres?.toUpperCase() || "";
        case "fecha_solicitud":
          return permiso.fecha_creacion ? new Date(permiso.fecha_creacion).toISOString() : "";
        case "fecha_permiso":
          return permiso.fecha || "";
        case "estado":
          return permiso.estado || "";
        case "tipo_permiso":
          return permiso.tipo_solicitud?.nombre || "";
        default:
          return permiso[campo] || "";
      }
    };

    return [...permisos].sort((a, b) => {
      const valorA = obtenerValor(a, orden.campo);
      const valorB = obtenerValor(b, orden.campo);

      if (typeof valorA === "string") {
        return orden.asc ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
      } else {
        return orden.asc ? valorA - valorB : valorB - valorA;
      }
    });
  };

  // Obtener permisos filtrados, ordenados y paginados
  const permisosFiltradosYOrdenados = ordenarPermisos(filtrarPermisos(permissions));
  const totalPaginas = Math.ceil(permisosFiltradosYOrdenados.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const permisosPaginados = permisosFiltradosYOrdenados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const ordenarPorCampo = (campo: any) => {
    const esAsc = orden.campo === campo ? !orden.asc : true;
    setOrden({ campo, asc: esAsc });
    setPaginaActual(1); // Resetear a la primera página al cambiar orden
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      tipoPermiso: '',
      fechaDesde: '',
      fechaHasta: '',
      empleado: ''
    });
    setPaginaActual(1);
  };

  const manejarAccion = (permiso: any) => {
    if (!permiso) {
      setSelectedPermission(null); // Limpiar si es nuevo
      // Resetear el formulario para nuevo permiso
      setNewPermission({
        empleado_id: user?.id,
        tipo_solicitud_id: '',
        fecha: getCurrentDate(),
        fecha_permiso: '',
        estado: 'Pendiente',
        hora: '00:00',
        duracion: '',
        observaciones: '',
      });
      setArchivos([]);
    } else {
      setSelectedPermission(permiso);
      // Cargar la información del permiso en el formulario
      setNewPermission({
        empleado_id: permiso.empleado_id,
        tipo_solicitud_id: permiso.tipo_solicitud_id?.toString() || '',
        fecha: permiso.fecha_creacion ? formatDateForInput(permiso.fecha_creacion) : new Date().toISOString().split("T")[0],
        fecha_permiso: permiso.fecha ? formatDateForInput(permiso.fecha) : '',
        estado: permiso.estado || 'Pendiente',
        hora: permiso.hora || '00:00',
        duracion: permiso.duracion ? Math.floor(Number(permiso.duracion)).toString() : '',
        observaciones: permiso.observaciones || '',
      });
      setArchivos([]); // Limpiar archivos nuevos
    }

    setShowModal(true);
  };

  const manejarAprobarRechazar = async (permiso: any, estado: string) => {
    try {
      setLoading(true);
      let motivo = '';
      if (estado === 'rechazado') {
        const motivoInput = prompt('Por favor, ingresa el motivo del rechazo:');
        if (motivoInput === null) { setLoading(false); return; }
        motivo = motivoInput;
      }
      const response = await actualizarEstadoPermiso(permiso.id, estado, motivo);
      if (estado === 'aprobado') {
        setSuccessMessage('✅ Permiso aprobado exitosamente. Se ha enviado un PDF al empleado.');
      } else {
        setSuccessMessage('❌ Permiso rechazado. Se ha notificado al empleado.');
      }
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchPermissions();
      
      // Cerrar el modal después de la acción
      setShowModal(false);
      setSelectedPermission(null);
    } catch (error) {
      console.error('Error al actualizar estado del permiso:', error);
      setError('Error al actualizar el estado del permiso');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (permiso: any) => {
    try {
      const response = await solicitudesService.descargarPDF(permiso.id);
      
      // Crear un blob con la respuesta
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `permiso_${permiso.id}.pdf`;
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('✅ PDF descargado exitosamente');
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      setError('Error al descargar el PDF');
    }
  };

  const exportarPermisosAExcel = () => {
    try {
      // Preparar datos para exportación
      const datosParaExportar = permisosFiltradosYOrdenados.map(permiso => ({
        empleado: permiso.empleado?.nombres || 'Sin nombre',
        documento: permiso.empleado?.documento || '',
        cargo: permiso.empleado?.oficio || '',
        area: permiso.empleado?.areas?.[0]?.nombre || '',
        fecha_solicitud: formatDateForTable(permiso.fecha_creacion),
        fecha_permiso: formatDate(permiso.fecha),
        hora: permiso.hora || '',
        duracion: permiso.duracion || '',
        tipo_permiso: permiso.tipo_solicitud?.nombre || '',
        estado: permiso.estado?.toUpperCase() || '',
        observaciones: permiso.observaciones || ''
      }));

      const success = exportSolicitudesToExcel(datosParaExportar, 'permisos');
      
      if (success) {
        setSuccessMessage('✅ Permisos exportados a Excel exitosamente');
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError('❌ Error al exportar permisos a Excel');
      }
    } catch (error) {
      console.error('Error exportando permisos:', error);
      setError('❌ Error al exportar permisos a Excel');
    }
  };

  const obtenerIconoAccion = (permiso: any) => {
    const isJefe = user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA');
    
    if (isJefe && permiso.estado === "pendiente") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => manejarAccion(permiso)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
            title="Ver detalles del permiso"
          >
            👁️ Ver
          </button>
          <button
            onClick={() => manejarAprobarRechazar(permiso, 'aprobado')}
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
            title="Aprobar permiso"
          >
            ✓ Aprobar
          </button>
          <button
            onClick={() => manejarAprobarRechazar(permiso, 'rechazado')}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
            title="Rechazar permiso"
          >
            ✗ Rechazar
          </button>
          {/* Los jefes de área no pueden dar visto bueno */}
        </div>
      );
    }
    
    switch (permiso.estado) {
      case "pendiente":
        return <Pencil className="text-blue-500 cursor-pointer" onClick={() => manejarAccion(permiso)} />;
      case "rechazado":
      case "visto_bueno":
        return <Eye className="text-yellow-500 cursor-pointer" onClick={() => manejarAccion(permiso)} />;
      case "aprobado":
        return (
          <div className="flex gap-2">
            <FileText 
              className="text-green-500 cursor-pointer" 
              onClick={() => manejarAccion(permiso)}
            />
            <button
              onClick={() => descargarPDF(permiso)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
              title="Descargar PDF"
            >
              📄 PDF
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // Usar directamente permissions ya que el filtrado se hace en fetchPermissions
  const permisosFiltrados = permissions;

  console.log("Usuario autenticado:", user);
  console.log("ID del empleado autenticado:", user.empleado?.id);
  console.log("Roles del usuario:", user?.roles);
  console.log("¿Es jefe de área?:", user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA'));

  if (loading) {
    return <Loader text="Cargando permisos..." />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* <EmployeeSummary empleado={user?.empleado} /> */}
      <h1 className="text-3xl font-bold">Gestión de Permisos</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-100 text-green-800 rounded-md text-center">
          {successMessage}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-lg ${activeTab === "resumen" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
          onClick={() => setActiveTab("resumen")}
        >
          Resumen
        </button>
        <button
          className={`px-4 py-2 text-lg ${activeTab === "listado" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
          onClick={() => setActiveTab("listado")}
        >
          Lista de Permisos
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "resumen" ? (
        <div className="space-y-6">
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') 
                      ? 'Total Permisos (Departamento)' 
                      : 'Mis Permisos'
                    }
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
                  <CheckCircle className="w-6 h-6 text-green-400" />
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
                  <XCircle className="w-6 h-6 text-red-400" />
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

          {/* Top empleados con más permisos - Solo para jefes */}
          {permisosStats.permisosPorEmpleado.length > 0 && user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Empleados del Departamento con Más Permisos</h2>
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
      ) : activeTab === "listado" ? (
        <>
          {/* Botón para crear nuevo permiso - Solo visible para empleados, no para jefes */}
          {!user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') ? (
            <button
              onClick={() => manejarAccion(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
            >
              <PlusCircle className="w-5 h-5" />
              Crear Permiso
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <p className="text-blue-700 font-medium">
                  💡 <strong>Nota para Jefes:</strong> Para crear tus propios permisos, debes hacerlo desde tu cuenta personal de empleado, no desde esta vista de jefe.
                </p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mt-6">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Filtro por empleado */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Empleado</label>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filtros.empleado}
                  onChange={(e) => {
                    setFiltros({ ...filtros, empleado: e.target.value });
                    setPaginaActual(1);
                  }}
                />
              </div>

              {/* Filtro por estado */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Estado</label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                  value={filtros.estado}
                  onChange={(e) => {
                    setFiltros({ ...filtros, estado: e.target.value });
                    setPaginaActual(1);
                  }}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                  {!user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
                    <option value="visto_bueno">Visto Bueno</option>
                  )}
                </select>
              </div>

              {/* Filtro por tipo de permiso */}
              <div className="min-w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Tipo de Permiso</label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                  value={filtros.tipoPermiso}
                  onChange={(e) => {
                    setFiltros({ ...filtros, tipoPermiso: e.target.value });
                    setPaginaActual(1);
                  }}
                >
                  <option value="">Todos</option>
                  <option value="Calamidad Domestica">Calamidad Domestica</option>
                  <option value="Consulta Medica">Consulta Medica</option>
                  <option value="Licencia no Remunerada">Licencia no Remunerada</option>
                  <option value="Licencia Remunerada">Licencia Remunerada</option>
                  <option value="Asuntos Personales">Asuntos Personales</option>
                  <option value="Asuntos Laborales">Asuntos Laborales</option>
                </select>
              </div>

              {/* Filtro por fecha desde */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Desde</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                  value={filtros.fechaDesde}
                  onChange={(e) => {
                    setFiltros({ ...filtros, fechaDesde: e.target.value });
                    setPaginaActual(1);
                  }}
                />
              </div>

              {/* Filtro por fecha hasta */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Hasta</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                  value={filtros.fechaHasta}
                  onChange={(e) => {
                    setFiltros({ ...filtros, fechaHasta: e.target.value });
                    setPaginaActual(1);
                  }}
                />
              </div>

              {/* Botón limpiar filtros */}
              <div className="min-w-[120px]">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Limpiar
                </button>
              </div>

              {/* Botón exportar a Excel */}
              <div className="min-w-[140px]">
                <button
                  type="button"
                  onClick={exportarPermisosAExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  title="Exportar permisos a Excel"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Información de resultados */}
            <div className="mt-4 text-sm text-[#2E7D32] dark:text-[#66BB6A]">
              Mostrando {permisosPaginados.length} de {permisosFiltradosYOrdenados.length} permisos
            </div>
          </div>

          {/* Tabla de permisos */}
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white shadow-lg rounded-xl border border-gray-200">
              <thead className="bg-blue-600">
                <tr>
                  <th 
                    className="px-4 py-3 text-white font-semibold text-center rounded-tl-xl cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => ordenarPorCampo('empleado')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Empleado
                      {orden.campo === 'empleado' && (
                        <span className="text-xs">
                          {orden.asc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-white font-semibold text-center">Cargo</th>
                  <th 
                    className="px-4 py-3 text-white font-semibold text-center cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => ordenarPorCampo('fecha_solicitud')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Fecha Solicitud
                      {orden.campo === 'fecha_solicitud' && (
                        <span className="text-xs">
                          {orden.asc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-white font-semibold text-center cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => ordenarPorCampo('fecha_permiso')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Fecha Permiso
                      {orden.campo === 'fecha_permiso' && (
                        <span className="text-xs">
                          {orden.asc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-white font-semibold text-center cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => ordenarPorCampo('estado')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Estado
                      {orden.campo === 'estado' && (
                        <span className="text-xs">
                          {orden.asc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-white font-semibold text-center cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => ordenarPorCampo('tipo_permiso')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Tipo Permiso
                      {orden.campo === 'tipo_permiso' && (
                        <span className="text-xs">
                          {orden.asc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-white font-semibold text-center rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {permisosPaginados.length > 0 ? (
                  permisosPaginados.map((permiso: any, index: number) => (
                    <tr key={permiso.id} className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium flex items-center gap-2 justify-center">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        {permiso.empleado?.nombres?.toUpperCase() || "SIN NOMBRE"}
                      </td>
                      <td className="px-4 py-3 text-center">{permiso.empleado?.oficio || "-"}</td>
                      <td className="px-4 py-3 text-center">{formatDateForTable(permiso.fecha_creacion)}</td>
                      <td className="px-4 py-3 text-center">{formatDate(permiso.fecha)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                          ${permiso.estado === 'aprobado' ? 'bg-green-100 text-green-700 border border-green-300' :
                            permiso.estado === 'rechazado' ? 'bg-red-100 text-red-700 border border-red-300' :
                            permiso.estado === 'visto_bueno' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                            'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}
                        >
                          {estadoIcon(permiso.estado)} {permiso.estado?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{permiso.tipo_solicitud?.nombre?.toUpperCase() || ''}</td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        {obtenerIconoAccion(permiso)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-permisos">
                    <td colSpan={7} className="text-center py-6 text-gray-400">No hay permisos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              {/* Números de página */}
              <div className="flex gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => setPaginaActual(pagina)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pagina === paginaActual
                        ? 'bg-[#2E7D32] text-white'
                        : 'bg-gray-200 text-[#2E7D32] hover:bg-gray-300 dark:bg-gray-700 dark:text-[#4CAF50] dark:hover:bg-gray-600'
                    }`}
                  >
                    {pagina}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-[#2E7D32] dark:text-[#66BB6A]">Aquí se mostrará el resumen de permisos.</p>
      )}

      {/* Modal para crear un permiso */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#2E7D32] dark:text-[#4CAF50]">
                    {selectedPermission
                      ? (selectedPermission.estado === 'rechazado' || selectedPermission.estado === 'aprobado')
                        ? 'Detalle del Permiso'
                        : 'Editar Permiso'
                      : 'Nuevo Permiso'}
                  </h2>
                  {selectedPermission && user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && selectedPermission.estado === "pendiente" && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      ⏳ Pendiente de Aprobación
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50]" />
                </button>
              </div>
            </div>

            {/* Mostrar motivo de rechazo si el permiso está rechazado */}
            {selectedPermission && selectedPermission.estado === 'rechazado' && (
              <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 rounded">
                <p className="text-red-700 font-semibold">Motivo del rechazo:</p>
                <p className="text-red-800">{selectedPermission.motivo || 'No se especificó un motivo.'}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Primera fila: Nombre empleado, Cargo, Área, Jefe Inmediato */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="hidden" name="empleado_id" value={newPermission.empleado_id} />

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Nombre Empleado</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                    value={selectedPermission?.empleado?.nombres || user?.empleado?.nombres || ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Cargo</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                    value={selectedPermission?.empleado?.oficio || user.empleado?.oficio || ""}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Área</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                    value={
                      selectedPermission?.empleado?.areas?.[0]?.nombre ||
                      obtenerAreaUsuario()
                    }
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Jefe Inmediato</label>
                  <input
                    type="text"
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                    value={
                      selectedPermission?.empleado?.areas?.[0]?.jefe?.nombres ||
                      obtenerJefeUsuario()
                    }
                    disabled
                  />
                </div>
              </div>

              {/* Segunda fila: Fecha solicitud, Fecha permiso, Hora permiso, Duración permiso */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Fecha Solicitud</label>
                  <input
                    type="date"
                    className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white"
                    value={newPermission.fecha}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Fecha Permiso</label>
                  <input
                    type="date"
                    className={`border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg ${
                      selectedPermission ? 'bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white' : 'bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]'
                    }`}
                    value={
                      newPermission.fecha_permiso?.split('T')[0] || ''
                    }
                    onChange={(e) => !selectedPermission && setNewPermission({ ...newPermission, fecha_permiso: e.target.value })}
                    min={getCurrentDate()} // Fecha mínima: hoy
                    readOnly={!!selectedPermission}
                    required={!selectedPermission}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Hora Permiso</label>
                  <input
                    type="time"
                    className={`border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg ${
                      selectedPermission ? 'bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white' : 'bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]'
                    }`}
                    value={newPermission.hora}
                    onChange={(e) => !selectedPermission && setNewPermission({ ...newPermission, hora: e.target.value })}
                    readOnly={!!selectedPermission}
                    required={!selectedPermission}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Duración (Horas)</label>
                  <input
                    type="number"
                    className={`border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg ${
                      selectedPermission ? 'bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white' : 'bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]'
                    }`}
                    value={newPermission.duracion}
                    onChange={(e) => !selectedPermission && setNewPermission({ ...newPermission, duracion: e.target.value })}
                    readOnly={!!selectedPermission}
                    min="1"
                    required={!selectedPermission}
                  />
                </div>
              </div>

              {/* Tercera fila: Tipo Permiso */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#2E7D32] dark:text-[#4CAF50]">Tipo de Permiso</label>
                <select
                  className={`border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg ${
                    selectedPermission ? 'bg-gray-50 dark:bg-gray-700 text-[#1B5E20] dark:text-white' : 'bg-white dark:bg-gray-700 text-[#1B5E20] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  value={newPermission.tipo_solicitud_id}
                  onChange={(e) => !selectedPermission && setNewPermission({ ...newPermission, tipo_solicitud_id: e.target.value })}
                  disabled={!!selectedPermission}
                  required={!selectedPermission}
                >
                  <option value="">Selecciona Tipo De Permiso</option>
                  {tiposSolicitud.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cuarta fila: Soportes */}
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
                <label className="block text-sm font-semibold mb-3 text-[#2E7D32] dark:text-[#4CAF50]">
                  📂 Soportes Presentados
                </label>

                {/* Zona de carga de archivos - Solo visible para nuevos permisos */}
                {!selectedPermission && (
                  <div
                    className="relative border-2 border-dashed border-gray-300 p-6 rounded-lg cursor-pointer hover:border-gray-500 transition"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArchivos((prevArchivos) => [...prevArchivos, ...Array.from(e.dataTransfer.files)]);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={(e) => setArchivos(Array.from(e.target.files || []))}
                    />
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl text-gray-400">📁</span>
                      <p className="text-center text-gray-500 text-sm">Haz clic o arrastra archivos aquí</p>
                    </div>
                  </div>
                )}

                {/* Mostrar archivos seleccionados - Solo para nuevos permisos */}
                {!selectedPermission && archivos.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Archivos seleccionados:</p>
                    <ul className="space-y-2">
                      {archivos.map((archivo, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-blue-500 text-lg">{archivo.type.includes("image") ? "🖼️" : "📄"}</span>
                            <span className="text-sm text-gray-700 truncate max-w-xs">{archivo.name}</span>
                          </div>
                          <button
                            className="ml-3 text-red-500 hover:text-red-700 transition"
                            onClick={() => {
                              setArchivos(archivos.filter((_, i) => i !== index));
                            }}
                          >
                            ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mostrar archivos adjuntos si el permiso ya tiene archivos */}
                {selectedPermission?.adjuntos?.length > 0 && (
                  <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3">📎 Archivos Adjuntos:</p>
                    <ul className="space-y-2">
                      {(selectedPermission.adjuntos || []).map((archivo: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-green-500 text-lg">{archivo.tipo_mime.includes("image") ? "🖼️" : "📄"}</span>
                            <a
                              href={`http://localhost:5000/${archivo.ruta_archivo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate max-w-xs"
                            >
                              {archivo.nombre_archivo}
                            </a>
                          </div>
                          <a
                            href={`http://localhost:5000/${archivo.ruta_archivo}`}
                            download={archivo.nombre_archivo}
                            className="ml-3 text-green-500 hover:text-green-700 transition"
                          >
                            ⬇️
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* Quinta fila: Observaciones */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Observaciones</label>
                <textarea
                  className={`border border-gray-300 p-3 w-full rounded-lg h-32 resize-none ${
                    selectedPermission ? 'bg-gray-50 text-gray-600' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder={selectedPermission ? "" : "Escribe tus observaciones..."}
                  value={newPermission.observaciones}
                  onChange={(e) => !selectedPermission && setNewPermission({ ...newPermission, observaciones: e.target.value })}
                  readOnly={!!selectedPermission}
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                {selectedPermission ? (
                  // Botones para permisos existentes
                  <div className="flex gap-4 w-full">
                    {user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && selectedPermission.estado === "pendiente" ? (
                      // Botones para jefes con permisos pendientes
                      <>
                        <button
                          type="button"
                          onClick={() => manejarAprobarRechazar(selectedPermission, 'aprobado')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          ✓ Aprobar Permiso
                        </button>
                        <button
                          type="button"
                          onClick={() => manejarAprobarRechazar(selectedPermission, 'rechazado')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          ✗ Rechazar Permiso
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          Cerrar
                        </button>
                      </>
                    ) : (
                      // Solo botón de cerrar para otros casos
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                ) : (
                  // Botones de cancelar y enviar para nuevos permisos
                  <>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Solicitar Permiso
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Permissions;
