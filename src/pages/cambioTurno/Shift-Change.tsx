import { useState, useEffect } from "react";
import { obtenerTurnos, solicitarCambioTurno } from "../../services/turnosService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User as UserIcon, AlertCircle, RefreshCcw, CheckCircle, XCircle, Clock, Eye, Plus, Download, Calendar } from "lucide-react";
import Loader from '../../components/Loader';
import { obtenerEmpleadosPorArea, buscarEmpleados } from '../../services/empleadosService';
import { employeeService, solicitudesService, cambioTurnoService } from '../../services/api';
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

const ShiftChange = () => {
  const [activeTab, setActiveTab] = useState('resumen'); // Cambiado a 'resumen' como primera pestaña
  const [turnos, setTurnos] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Estados para paginación y filtros
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    empleado: ''
  });

  const [turnoActual, setTurnoActual] = useState("");
  const [turnoDeseado, setTurnoDeseado] = useState("");
  const [motivo, setMotivo] = useState("");
  const user = JSON.parse(localStorage.getItem("usuario") || "null");

  // Estado para los nuevos campos del formulario
  // Función para obtener la fecha actual
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener la fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fechaSolicitud, setFechaSolicitud] = useState(getCurrentDate());
  const [nombreCompleto, setNombreCompleto] = useState(user?.nombres || "");
  const [cargo, setCargo] = useState(user?.oficio || "");
  const [fechaTurnoCambiar, setFechaTurnoCambiar] = useState("");
  const [horarioCambiar, setHorarioCambiar] = useState("");
  const [fechaTurnoReemplazo, setFechaTurnoReemplazo] = useState("");
  const [horarioReemplazo, setHorarioReemplazo] = useState("");
  const [motivoCambio, setMotivoCambio] = useState("");
  const [nombreReemplazo, setNombreReemplazo] = useState("");
  const [cedulaReemplazo, setCedulaReemplazo] = useState("");
  const [afectacionNomina, setAfectacionNomina] = useState("No");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [correo, setCorreo] = useState(user?.email || "");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("Pendiente");

  const [empleadosArea, setEmpleadosArea] = useState<any[]>([]);
  const [empleadosMismaArea, setEmpleadosMismaArea] = useState<any[]>([]);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any | null>(null);
  const [busquedaReemplazo, setBusquedaReemplazo] = useState("");
  const [empleadoReemplazoSeleccionado, setEmpleadoReemplazoSeleccionado] = useState<any | null>(null);
  const [mostrarSelectorReemplazo, setMostrarSelectorReemplazo] = useState(false);

  // Función para obtener el departamento correcto para gerentes/jefes de área
  const obtenerDepartamentoGestionado = () => {
    const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
    const tieneRolSupervision = user?.roles?.some((rol: any) => rolesSupervision.includes(rol.nombre));
    
    if (!tieneRolSupervision) {
      return null; // No es gerente/jefe, no aplicar filtro
    }
    
    // Para gerentes/jefes, determinar el departamento que gestionan
    const departamentoPersonal = user?.empleado?.areas?.[0]?.departamento?.nombre;
    
    // Mapeo de departamentos gestionados según el rol y departamento personal
    if (user?.roles?.some((rol: any) => rol.nombre === 'GERENTE')) {
      // Gerentes gestionan ASISTENCIAL independientemente de su departamento personal
      return 'ASISTENCIAL';
    } else if (user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      // Jefes de área gestionan su propio departamento
      return departamentoPersonal;
    } else if (user?.roles?.some((rol: any) => rol.nombre === 'ADMINISTRADOR')) {
      // Admins pueden gestionar todos los departamentos
      return 'TODOS';
    }
    
    // Para otros casos, usar el departamento personal
    return departamentoPersonal;
  };

  // Estado para autocompletado
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  const [pendientesVistoBueno, setPendientesVistoBueno] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalVistoBueno, setModalVistoBueno] = useState(false);
  const [solicitudVistoBueno, setSolicitudVistoBueno] = useState<any | null>(null);
  const [motivoVistoBueno, setMotivoVistoBueno] = useState("");
  const [tipoVistoBueno, setTipoVistoBueno] = useState<'aprobar' | 'rechazar'>('aprobar');
  
  // Estados para jefes de área
  const [enRevision, setEnRevision] = useState<any[]>([]);
  const [modalJefe, setModalJefe] = useState(false);
  const [solicitudJefe, setSolicitudJefe] = useState<any>(null);
  const [motivoJefe, setMotivoJefe] = useState("");
  const [tipoJefe, setTipoJefe] = useState<'aprobar' | 'rechazar'>('aprobar');
  
  // Estados para modal de detalles
  const [modalDetalles, setModalDetalles] = useState(false);
  const [solicitudDetalles, setSolicitudDetalles] = useState<any>(null);

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    // Si es jefe de área, gerente o tiene rol de supervisión, filtrar por departamento gestionado
    // Si no, usar solo las solicitudes del usuario
    const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
    const tieneRolSupervision = user?.roles?.some((rol: any) => rolesSupervision.includes(rol.nombre));
    
    let solicitudesParaEstadisticas;
    
    if (tieneRolSupervision) {
      // Para jefes/gerentes, filtrar por departamento gestionado
      const departamentoGestionado = obtenerDepartamentoGestionado();
      
      if (departamentoGestionado === 'TODOS') {
        // Para admins, mostrar todas las solicitudes
        solicitudesParaEstadisticas = solicitudes;
      } else if (departamentoGestionado) {
        // Filtrar por departamento gestionado
        solicitudesParaEstadisticas = solicitudes.filter(s => {
          // Verificar si la solicitud pertenece al departamento gestionado
          const empleadoDepartamento = s.empleado?.areas?.[0]?.departamento?.nombre;
          return empleadoDepartamento === departamentoGestionado;
        });
      } else {
        // Si no se puede determinar el departamento, usar todas las solicitudes
        solicitudesParaEstadisticas = solicitudes;
      }
    } else {
      // Para empleados normales, usar todas las solicitudes (ya vienen filtradas del backend)
      solicitudesParaEstadisticas = solicitudes;
    }
    
    
    return {
      totalCambios: solicitudesParaEstadisticas.length,
      cambiosPendientes: solicitudesParaEstadisticas.filter(s => s.estado === 'Pendiente').length,
      cambiosAprobados: solicitudesParaEstadisticas.filter(s => s.estado === 'Aprobado').length,
      cambiosRechazados: solicitudesParaEstadisticas.filter(s => s.estado === 'Rechazado').length,
      cambiosEnRevision: solicitudesParaEstadisticas.filter(s => s.estado === 'En Revisión').length,
      cambiosEsteMes: solicitudesParaEstadisticas.filter(s => {
        const fecha = new Date(s.fecha);
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      }).length,
      pendientesVistoBueno: pendientesVistoBueno.length,
      cambiosConAfectacionNomina: solicitudesParaEstadisticas.filter(s => s.afectacion_nomina === 'Sí').length,
      cambiosSinAfectacionNomina: solicitudesParaEstadisticas.filter(s => s.afectacion_nomina === 'No').length
    };
  };

  const estadisticas = calcularEstadisticas();

  // Determinar si el usuario es solo empleado o jefe de área
  const esSoloEmpleado = user?.roles?.length === 1 && user.roles[0].nombre === 'EMPLEADO';
  const esJefeArea = user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA');

  // Si es solo empleado o jefe de área, forzar la pestaña activa a 'listado'
  useEffect(() => {
    if (esSoloEmpleado || esJefeArea) {
      setActiveTab('listado');
    }
  }, [esSoloEmpleado, esJefeArea]);

  useEffect(() => {
    cargarTurnos();
    cargarSolicitudes();
    cargarEmpleadosArea();
    // Solo cargar pendientes por visto bueno si NO es jefe de área
    if (!user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      cargarPendientesVistoBueno();
    }
    // Si es jefe de área, cargar solicitudes en revisión
    if (user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      cargarEnRevision();
    }
  }, []);

  // Cargar pendientes por visto bueno cuando se cambie a la pestaña (solo si no es jefe de área)
  useEffect(() => {
    if (activeTab === "darVistoBueno" && !user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      cargarPendientesVistoBueno();
    }
  }, [activeTab]);

  // Notificar cuando hay solicitudes pendientes por visto bueno
  useEffect(() => {
    if (pendientesVistoBueno.length > 0 && activeTab !== "darVistoBueno") {
      toast.info(`Tienes ${pendientesVistoBueno.length} solicitud(es) pendiente(s) por visto bueno`);
    }
  }, [pendientesVistoBueno.length, activeTab]);

  // Notificar cuando hay solicitudes en revisión para jefes de área
  useEffect(() => {
    if (enRevision.length > 0 && activeTab !== "jefeArea" && user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA')) {
      toast.info(`Tienes ${enRevision.length} solicitud(es) pendiente(s) de revisión`);
    }
  }, [enRevision.length, activeTab]);

  // Llenar campos automáticamente cuando se abre el modal
  useEffect(() => {
    if (user) {
      // Usar la fecha actual
      const fechaActual = getCurrentDate();
      setFechaSolicitud(fechaActual);
      
      // Intentar diferentes nombres de campos para el nombre
      const nombreUsuario = user?.nombres || user?.nombre || user?.empleado?.nombres || user?.empleado?.nombre || "";
      setNombreCompleto(nombreUsuario);
      
      // Intentar diferentes nombres de campos para el cargo
      const cargoUsuario = user?.oficio || user?.cargo || user?.empleado?.oficio || user?.empleado?.cargo || "";
      setCargo(cargoUsuario);
      setCorreo(user?.email || "");
    }
  }, [user]);

  // Limpiar formulario cuando se abra el modal
  useEffect(() => {
    if (modalAbierto) {
      limpiarFormulario();
    }
  }, [modalAbierto]);

  const cargarTurnos = async () => {
    try {
      const data = await obtenerTurnos();
      setTurnos(data);
    } catch (error) {
      toast.error("Error al cargar los turnos");
    }
  };

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      
      // Si el usuario es jefe de área, gerente o tiene rol de supervisión, enviar jefeId
      const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
      const tieneRolSupervision = user?.roles?.some((rol: any) => rolesSupervision.includes(rol.nombre));
      
      let response;
      
      if (tieneRolSupervision) {
        response = await cambioTurnoService.listarConJefe(user?.id);
      } else {
        // Para usuarios normales, cargar solo sus propias solicitudes
        const empleadoId = user?.empleado?.id || user?.id;
        response = await cambioTurnoService.listarPorEmpleado(empleadoId);
      }
      
      setSolicitudes(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setError("Error al cargar solicitudes de cambio de turno");
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleadosArea = async () => {
    try {
      // Obtener el área del usuario actual
      const areaId = user?.empleado?.areas?.[0]?.id || user?.empleado?.area?.id;
      
      if (areaId) {
        const empleados = await obtenerEmpleadosPorArea(areaId);
        // Filtrar para excluir al usuario actual y a los jefes de área
        const empleadosFiltrados = empleados.filter((e: any) => {
          // Excluir al usuario actual
          if (e.id === (user?.empleado?.id || user?.id)) return false;
          
          // Excluir a los jefes de área (empleados con rol JEFE AREA)
          const esJefeArea = e.roles?.some((rol: any) => rol.nombre === 'JEFE AREA');
          if (esJefeArea) return false;
          
          return true;
        });
        setEmpleadosArea(empleadosFiltrados);
        setEmpleadosMismaArea(empleadosFiltrados);
      } else {
        console.log('No se encontró área asignada al usuario');
        setEmpleadosArea([]);
        setEmpleadosMismaArea([]);
      }
    } catch (error) {
      console.error('Error al cargar empleados del área:', error);
      toast.error("Error al cargar empleados del área");
    }
  };

  const cargarPendientesVistoBueno = async () => {
    try {
      // Debugging completo de los datos del usuario
      console.log('🔍 Debugging completo del usuario:', user);
      console.log('🔍 Token:', localStorage.getItem('token'));
      
      // Buscar el documento en diferentes ubicaciones posibles
      const documento = user?.documento || user?.empleado?.documento || user?.empleado?.id;
      
      if (!documento) {
        console.error('No se pudo obtener el documento del usuario:', user);
        toast.error("No se pudo obtener el documento del usuario");
        return;
      }
      
      console.log('🔍 Buscando pendientes por visto bueno para documento:', documento);
      console.log('🔍 Datos del usuario:', {
        documento: user?.documento,
        empleadoDocumento: user?.empleado?.documento,
        empleadoId: user?.empleado?.id,
        nombres: user?.empleado?.nombres
      });
      
      // Probar múltiples identificadores
      const identificadores = [
        documento,
        user?.empleado?.codigo,
        user?.empleado?.nombres
      ].filter(Boolean);
      
      console.log('🔍 Probando con identificadores:', identificadores);
      
      let solicitudesEncontradas = [];
      
      // Probar cada identificador
      for (const identificador of identificadores) {
        try {
          console.log(`🔍 Probando con identificador: "${identificador}"`);
          const response = await cambioTurnoService.pendientesVistoBueno(identificador);
          
          if (response.data && response.data.length > 0) {
            console.log(`✅ Encontradas ${response.data.length} solicitudes con identificador "${identificador}"`);
            solicitudesEncontradas = response.data;
            break;
          }
        } catch (error) {
          console.log(`❌ Error con identificador "${identificador}":`, error);
        }
      }
      
      // Si el usuario es jefe de área, gerente o tiene rol de supervisión, filtrar por departamento
      let solicitudesFiltradas = solicitudesEncontradas;
      
      const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
      const tieneRolSupervision = user?.roles?.some((rol: any) => rolesSupervision.includes(rol.nombre));
      
      if (tieneRolSupervision) {
        // Obtener el departamento que gestiona el usuario
        const departamentoGestionado = obtenerDepartamentoGestionado();
        
        if (departamentoGestionado) {
          console.log(`🔍 Filtrando pendientes por visto bueno por departamento gestionado: ${departamentoGestionado}`);
          console.log(`🔍 Roles del usuario: ${user?.roles?.map((r: any) => r.nombre).join(', ')}`);
          console.log(`🔍 Departamento personal del usuario: ${user?.empleado?.areas?.[0]?.departamento?.nombre}`);
          
          // Filtrar solicitudes que pertenecen al departamento que gestiona
          solicitudesFiltradas = solicitudesEncontradas.filter((solicitud: any) => {
            // Verificar si el empleado de la solicitud pertenece al departamento gestionado
            const empleadoDepartamento = solicitud.empleado?.areas?.[0]?.departamento?.nombre;
            return empleadoDepartamento === departamentoGestionado;
          });
          
          console.log(`📊 Pendientes por visto bueno filtrados por departamento gestionado: ${solicitudesFiltradas.length} de ${solicitudesEncontradas.length}`);
        } else {
          console.log('⚠️ Usuario con rol de supervisión pero sin departamento gestionado asignado');
        }
      }
      
      setPendientesVistoBueno(solicitudesFiltradas);
      
      console.log('📊 Pendientes por visto bueno encontrados:', solicitudesFiltradas.length);
      
      if (solicitudesFiltradas.length === 0) {
        toast.info("No tienes solicitudes pendientes por visto bueno");
      }
    } catch (error: any) {
      console.error('Error al cargar pendientes por visto bueno:', error);
      toast.error("Error al cargar pendientes por visto bueno");
    }
  };

  const limpiarFormulario = () => {
    setFechaTurnoCambiar("");
    setHorarioCambiar("");
    setFechaTurnoReemplazo("");
    setHorarioReemplazo("");
    setMotivoCambio("");
    setNombreReemplazo("");
    setCedulaReemplazo("");
    setAfectacionNomina("No");
    setSoporte(null);
    setObservaciones("");
    setEmpleadoReemplazoSeleccionado(null);
    setMostrarSelectorReemplazo(false);
    // Mantener la fecha de solicitud como la fecha actual
    setFechaSolicitud(getCurrentDate());
  };

  const manejarCambioTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    if (!nombreCompleto || !fechaSolicitud || !fechaTurnoCambiar || !fechaTurnoReemplazo || !horarioCambiar || !horarioReemplazo || !nombreReemplazo || !cedulaReemplazo) {
      setError("Todos los campos obligatorios deben estar llenos");
      toast.error("Todos los campos obligatorios deben estar llenos");
      return;
    }
    
    // Validar que se hayan seleccionado horarios válidos
    if (!horarioCambiar || horarioCambiar === "") {
      setError("Debe seleccionar un horario a cambiar");
      toast.error("Debe seleccionar un horario a cambiar");
      return;
    }
    
    if (!horarioReemplazo || horarioReemplazo === "") {
      setError("Debe seleccionar un horario de reemplazo");
      toast.error("Debe seleccionar un horario de reemplazo");
      return;
    }
    // Validación de fechas
    const hoy = new Date();
    hoy.setHours(0,0,0,0); // Solo fecha, sin hora
    
    // Convertir las fechas del formulario a objetos Date y normalizar a medianoche
    const fechaCambiar = new Date(fechaTurnoCambiar + 'T00:00:00');
    const fechaReemplazo = new Date(fechaTurnoReemplazo + 'T00:00:00');
    
    // Logs de depuración para ver qué está pasando con las fechas
    console.log('🔍 Debug fechas:');
    console.log('   Fecha actual (hoy):', hoy.toISOString());
    console.log('   Fecha turno a cambiar:', fechaTurnoCambiar);
    console.log('   Fecha turno a cambiar (Date):', fechaCambiar.toISOString());
    console.log('   Fecha turno reemplazo:', fechaTurnoReemplazo);
    console.log('   Fecha turno reemplazo (Date):', fechaReemplazo.toISOString());
    console.log('   Comparación fechaCambiar < hoy:', fechaCambiar < hoy);
    console.log('   Comparación fechaReemplazo < hoy:', fechaReemplazo < hoy);
    
    // Validar que la fecha del turno a cambiar no sea anterior a la fecha actual
    if (fechaCambiar < hoy) {
      setError("La Fecha Turno a Cambiar no puede ser anterior a la fecha actual");
      toast.error("La Fecha Turno a Cambiar no puede ser anterior a la fecha actual");
      return;
    }
    
    // Validar que la fecha del turno de reemplazo no sea anterior a la fecha actual
    if (fechaReemplazo < hoy) {
      setError("La Fecha Turno Reemplazo no puede ser anterior a la fecha actual");
      toast.error("La Fecha Turno Reemplazo no puede ser anterior a la fecha actual");
      return;
    }

    try {
      await cambioTurnoService.crear({
        empleado_id: user?.empleado?.id || user?.id,
        fecha: fechaTurnoCambiar, // Fecha en que se realizará el cambio de turno
        fecha_turno_reemplazo: fechaTurnoReemplazo, // Fecha en que se realizará el turno de reemplazo
        horario_cambiar: horarioCambiar,
        horario_reemplazo: horarioReemplazo,
        motivo: motivoCambio,
        nombre_reemplazo: nombreReemplazo,
        cedula_reemplazo: cedulaReemplazo,
        afectacion_nomina: afectacionNomina,
        soporte: soporte ? soporte.name : '',
        correo,
        observaciones,
        estado
      });
      setSuccessMessage("✔️ Solicitud enviada correctamente");
      toast.success("Solicitud enviada correctamente");
      cargarSolicitudes();
      limpiarFormulario();
      setModalAbierto(false);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setError("Error al enviar la solicitud");
      toast.error("Error al enviar la solicitud");
    }
  };

  const handleBusquedaEmpleado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusquedaEmpleado(value);
    setEmpleadoSeleccionado(null);
    setEmpleadoReemplazoSeleccionado(null);
    setNombreReemplazo('');
    setCedulaReemplazo('');
    setBusquedaReemplazo('');
    if (value.length >= 2) {
      setCargandoSugerencias(true);
      try {
        const resultados = await buscarEmpleados(value);
        setSugerencias(resultados);
      } catch (error) {
        console.error('Error en búsqueda:', error);
      } finally {
        setCargandoSugerencias(false);
      }
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarEmpleado = (empleado: any) => {
    setEmpleadoSeleccionado(empleado);
    setBusquedaEmpleado(empleado.nombres);
    setSugerencias([]);
  };

  const handleBusquedaReemplazo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusquedaReemplazo(value);
    setEmpleadoReemplazoSeleccionado(null);
    // No necesitamos hacer llamadas a la API aquí, el filtrado se hace localmente
  };

  const seleccionarEmpleadoReemplazo = (empleado: any) => {
    setEmpleadoReemplazoSeleccionado(empleado);
    setBusquedaReemplazo(empleado.nombres);
    setNombreReemplazo(empleado.nombres);
    setCedulaReemplazo(empleado.documento || empleado.cedula || '');
    setSugerencias([]);
    setMostrarSelectorReemplazo(false);
  };

  const seleccionarEmpleadoMismaArea = (empleado: any) => {
    setEmpleadoReemplazoSeleccionado(empleado);
    setNombreReemplazo(empleado.nombres);
    setCedulaReemplazo(empleado.documento || '');
    setMostrarSelectorReemplazo(false);
  };

  const abrirModalVistoBueno = (solicitud: any, tipo: 'aprobar' | 'rechazar') => {
    setSolicitudVistoBueno(solicitud);
    setTipoVistoBueno(tipo);
    setMotivoVistoBueno("");
    setModalVistoBueno(true);
  };

  const abrirModalDetalles = async (solicitud: any) => {
    try {
      // Obtener los datos completos de la solicitud desde el backend
      const response = await cambioTurnoService.obtener(solicitud.id);
      setSolicitudDetalles(response.data);
      setModalDetalles(true);
    } catch (error) {
      console.error('Error al obtener detalles de la solicitud:', error);
      // Si falla, usar los datos de la lista
    setSolicitudDetalles(solicitud);
    setModalDetalles(true);
      toast.error('Error al cargar los detalles completos de la solicitud');
    }
  };

  const aprobarVistoBueno = async () => {
    if (!solicitudVistoBueno) return;
    
    try {
      await cambioTurnoService.aprobarVistoBueno(solicitudVistoBueno.id, motivoVistoBueno);
      setSuccessMessage("✔️ Visto bueno aprobado correctamente");
      toast.success("Visto bueno aprobado");
      cargarPendientesVistoBueno();
      setModalVistoBueno(false);
      setSolicitudVistoBueno(null);
      setMotivoVistoBueno("");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setError("Error al aprobar visto bueno");
      toast.error("Error al aprobar visto bueno");
    }
  };

  const rechazarVistoBueno = async () => {
    if (!solicitudVistoBueno) return;
    
    try {
      await cambioTurnoService.rechazarVistoBueno(solicitudVistoBueno.id, motivoVistoBueno);
      setSuccessMessage("✔️ Visto bueno rechazado correctamente");
      toast.success("Visto bueno rechazado");
      cargarPendientesVistoBueno();
      setModalVistoBueno(false);
      setSolicitudVistoBueno(null);
      setMotivoVistoBueno("");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setError("Error al rechazar visto bueno");
      toast.error("Error al rechazar visto bueno");
    }
  };

  // Funciones para jefes de área
  const cargarEnRevision = async () => {
    try {
      const jefeId = user?.empleado?.id;
      if (!jefeId) {
        console.log('No se pudo obtener el ID del jefe');
        return;
      }
      
      // Obtener el departamento gestionado usando la función definida
      const departamentoGestionado = obtenerDepartamentoGestionado();
      
      if (!departamentoGestionado) {
        console.log('⚠️ Usuario sin departamento gestionado asignado');
        setEnRevision([]);
        return;
      }
      
      console.log('🔍 Cargando solicitudes en revisión...');
      console.log(`🔍 Departamento gestionado: ${departamentoGestionado}`);
      
      const response = await cambioTurnoService.enRevision(jefeId, departamentoGestionado);
      setEnRevision(response.data || []);
      
      console.log('📊 Solicitudes en revisión encontradas:', response.data?.length || 0);
    } catch (error: any) {
      console.error('Error al cargar solicitudes en revisión:', error);
      toast.error("Error al cargar solicitudes en revisión");
    }
  };

  const abrirModalJefe = async (solicitud: any, tipo: 'aprobar' | 'rechazar') => {
    try {
      // Obtener los datos completos de la solicitud desde el backend
      const response = await cambioTurnoService.obtener(solicitud.id);
      setSolicitudJefe(response.data);
      setTipoJefe(tipo);
      setMotivoJefe("");
      setModalJefe(true);
    } catch (error) {
      console.error('Error al obtener detalles de la solicitud:', error);
      // Si falla, usar los datos de la lista
    setSolicitudJefe(solicitud);
    setTipoJefe(tipo);
    setMotivoJefe("");
    setModalJefe(true);
      toast.error('Error al cargar los detalles completos de la solicitud');
    }
  };

  const aprobarPorJefe = async () => {
    if (!solicitudJefe) return;
    
    try {
      // Enviar información del jefe que está aprobando
      const datosAprobacion = {
        motivo: motivoJefe,
        documentoJefe: user?.documento || user?.empleado?.documento
      };
      
      await cambioTurnoService.aprobarPorJefe(solicitudJefe.id, datosAprobacion);
      toast.success("Solicitud aprobada correctamente");
      setModalJefe(false);
      setSolicitudJefe(null);
      setMotivoJefe("");
      cargarEnRevision();
    } catch (error: any) {
      console.error('Error al aprobar solicitud:', error);
      toast.error("Error al aprobar solicitud");
    }
  };

  const rechazarPorJefe = async () => {
    if (!solicitudJefe) return;
    
    try {
      await cambioTurnoService.rechazarPorJefe(solicitudJefe.id, motivoJefe);
      toast.success("Solicitud rechazada correctamente");
      setModalJefe(false);
      setSolicitudJefe(null);
      setMotivoJefe("");
      cargarEnRevision();
    } catch (error: any) {
      console.error('Error al rechazar solicitud:', error);
      toast.error("Error al rechazar solicitud");
    }
  };

  const getEstadoIcon = (estado: string) => {
    if (!estado) return null;
    
    const estadoLower = estado.toLowerCase();
    
    switch (estadoLower) {
      case 'aprobado':
        return <CheckCircle className="text-green-600 w-4 h-4" />;
      case 'rechazado':
        return <XCircle className="text-red-600 w-4 h-4" />;
      case 'en revisión':
      case 'en_revision':
        return <Eye className="text-blue-600 w-4 h-4" />;
      case 'pendiente':
        return <Clock className="text-amber-600 w-4 h-4" />;
      default:
        return <AlertCircle className="text-gray-600 w-4 h-4" />;
    }
  };

  const getEstadoClass = (estado: string) => {
    if (!estado) return 'bg-gray-100 text-gray-700 border border-gray-300';
    
    const estadoLower = estado.toLowerCase();
    
    switch (estadoLower) {
      case 'aprobado':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm';
      case 'rechazado':
        return 'bg-red-50 text-red-800 border border-red-200 shadow-sm';
      case 'en revisión':
      case 'en_revision':
        return 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm';
      case 'pendiente':
        return 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm';
    }
  };

  const getVistoBuenoIcon = (vistoBueno: string) => {
    if (!vistoBueno) return <Clock className="text-amber-600 w-4 h-4" />;
    
    const vistoBuenoLower = vistoBueno.toLowerCase();
    
    switch (vistoBuenoLower) {
      case 'aprobado':
        return <CheckCircle className="text-emerald-600 w-4 h-4" />;
      case 'rechazado':
        return <XCircle className="text-red-600 w-4 h-4" />;
      case 'pendiente':
        return <Clock className="text-amber-600 w-4 h-4" />;
      default:
        return <AlertCircle className="text-gray-600 w-4 h-4" />;
    }
  };

  const getVistoBuenoClass = (vistoBueno: string) => {
    if (!vistoBueno) return 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm';
    
    const vistoBuenoLower = vistoBueno.toLowerCase();
    
    switch (vistoBuenoLower) {
      case 'aprobado':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm';
      case 'rechazado':
        return 'bg-red-50 text-red-800 border border-red-200 shadow-sm';
      case 'pendiente':
        return 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm';
    }
  };

  // Filtrar solicitudes: si es solo empleado, mostrar solo las suyas
  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    if (esSoloEmpleado) {
      // Para empleados normales, todas las solicitudes ya vienen filtradas del backend
      return true;
    }
    if (activeTab === 'misSolicitudes') {
      // Para la pestaña "Mis Solicitudes", todas las solicitudes ya vienen filtradas del backend
      return true;
    }
    return true;
  });

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
      empleado: ''
    });
    setPaginaActual(1);
  };

  const exportarCambiosTurnoAExcel = () => {
    try {
      // Función helper para formatear fechas en formato DD/MM/YYYY
      const formatearFecha = (fecha: any) => {
        if (!fecha) return '';
        try {
          const fechaStr = fecha.toString();
          let fechaObj: Date;
          
          if (fechaStr.includes('T')) {
            fechaObj = new Date(fecha);
          } else if (fechaStr.includes('-')) {
            // Si viene como YYYY-MM-DD, procesar directamente
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
          } else {
            fechaObj = new Date(fecha);
          }
          
          const day = String(fechaObj.getDate()).padStart(2, '0');
          const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
          const year = fechaObj.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (error) {
          console.error('Error formateando fecha:', error);
          return '';
        }
      };

      // Preparar datos para exportación
      const datosParaExportar = solicitudesFiltradasYOrdenadas.map(solicitud => ({
        empleado: solicitud.empleado?.nombres || solicitud.nombre_completo || 'Sin nombre',
        documento: solicitud.empleado?.documento || solicitud.cedula || '',
        cargo: solicitud.cargo || '',
        fecha_solicitud: formatearFecha(solicitud.fecha_creacion),
        fecha_turno_cambiar: formatearFecha(solicitud.fecha_turno_reemplazo), // Fecha Turno a Realizar
        horario_cambiar: solicitud.horario_reemplazo || '', // Horario a Realizar
        fecha_turno_reemplazo: formatearFecha(solicitud.fecha), // Fecha Turno del Cambio
        horario_reemplazo: solicitud.horario_cambiar || '', // Horario a Cambiar
        nombre_reemplazo: solicitud.nombre_reemplazo || '',
        cedula_reemplazo: solicitud.cedula_reemplazo || '',
        motivo_cambio: solicitud.motivo || solicitud.motivo_cambio || '',
        estado: solicitud.estado?.toUpperCase() || '',
        observaciones: solicitud.observaciones || ''
      }));

      const success = exportSolicitudesToExcel(datosParaExportar, 'cambios_turno');
      
      if (success) {
        setSuccessMessage('✅ Cambios de turno exportados a Excel exitosamente');
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError('❌ Error al exportar cambios de turno a Excel');
      }
    } catch (error) {
      console.error('Error exportando cambios de turno:', error);
      setError('❌ Error al exportar cambios de turno a Excel');
    }
  };

  // Obtener solicitudes filtradas, ordenadas y paginadas
  const solicitudesFiltradasYOrdenadas = solicitudesFiltradas.filter(solicitud => {
    if (filtros.estado && solicitud.estado !== filtros.estado) return false;
    if (filtros.fechaDesde && solicitud.fecha < filtros.fechaDesde) return false;
    if (filtros.fechaHasta && solicitud.fecha > filtros.fechaHasta) return false;
    if (filtros.empleado && !solicitud.nombre_completo?.toLowerCase().includes(filtros.empleado.toLowerCase())) return false;
    return true;
  });

  const totalPaginas = Math.ceil(solicitudesFiltradasYOrdenadas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const solicitudesPaginadas = solicitudesFiltradasYOrdenadas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  if (loading) {
    return <Loader text="Cargando solicitudes de cambio de turno..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Cambio de Turno</h1>

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
      <div className="flex border-b flex-wrap">
        {/* Pestaña Resumen - Visible para todos */}
        <button
          className={`px-4 py-2 text-lg ${activeTab === "resumen" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
          onClick={() => setActiveTab("resumen")}
        >
          Resumen
        </button>
        
        {/* Pestaña Listado - Visible para todos */}
        <button
          className={`px-4 py-2 text-lg ${activeTab === "listado" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
          onClick={() => setActiveTab("listado")}
        >
          Lista de Cambios de Turno
        </button>
        
        {/* Pestaña Dar Visto Bueno - No visible para jefes de área */}
        {!user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "darVistoBueno" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("darVistoBueno")}
          >
            Dar Visto Bueno
            {pendientesVistoBueno.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendientesVistoBueno.length}
              </span>
            )}
          </button>
        )}
        
        {/* Pestaña Revisión Jefe de Área - Solo para jefes */}
        {user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "jefeArea" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("jefeArea")}
          >
            Revisión Jefe de Área
            {enRevision.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {enRevision.length}
              </span>
            )}
          </button>
        )}
        

      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "resumen" ? (
        <div className="space-y-6">
          {/* Indicador de filtrado por departamento para jefes de área y gerentes */}
          {user?.roles?.some((rol: any) => ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'].includes(rol.nombre)) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-blue-700">
                <strong>Vista de Supervisión:</strong> Mostrando datos filtrados por departamento 
                <strong className="ml-1">{obtenerDepartamentoGestionado() || 'ASISTENCIAL'}</strong>
              </p>
            </div>
          )}
          
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <RefreshCcw className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {user?.roles?.some((rol: any) => ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'].includes(rol.nombre)) ? 'Total Solicitudes' : 'Mis Solicitudes'}
                  </p>
                  <p className="text-2xl font-bold text-white">{estadisticas.totalCambios}</p>
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
                  <p className="text-2xl font-bold text-white">{estadisticas.cambiosPendientes}</p>
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
                  <p className="text-2xl font-bold text-white">{estadisticas.cambiosAprobados}</p>
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
                  <p className="text-2xl font-bold text-white">{estadisticas.cambiosRechazados}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">Pendientes por Visto Bueno</h2>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{estadisticas.pendientesVistoBueno}</p>
                <p className="text-sm text-gray-500">Solicitudes</p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">Este Mes</h2>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{estadisticas.cambiosEsteMes}</p>
                <p className="text-sm text-gray-500">Solicitudes</p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold">Con Afectación Nómina</h2>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{estadisticas.cambiosConAfectacionNomina}</p>
                <p className="text-sm text-gray-500">Solicitudes</p>
              </div>
            </div>
          </div>

          {/* Gráfico de estados */}
          {estadisticas.totalCambios > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{estadisticas.cambiosPendientes}</div>
                    <div className="text-sm text-yellow-700">Pendientes</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.cambiosEnRevision}</div>
                    <div className="text-sm text-blue-700">En Revisión</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{estadisticas.cambiosAprobados}</div>
                    <div className="text-sm text-green-700">Aprobados</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{estadisticas.cambiosRechazados}</div>
                    <div className="text-sm text-red-700">Rechazados</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Afectación Nómina</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{estadisticas.cambiosSinAfectacionNomina}</div>
                    <div className="text-sm text-green-700">Sin Afectación</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{estadisticas.cambiosConAfectacionNomina}</div>
                    <div className="text-sm text-red-700">Con Afectación</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "listado" ? (
        <>
          {/* Indicador de filtrado por departamento para jefes de área y gerentes */}
          {user?.roles?.some((rol: any) => ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'].includes(rol.nombre)) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center mb-4">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-blue-700">
                <strong>Vista de Supervisión:</strong> Mostrando cambios de turno filtrados por departamento 
                <strong className="ml-1">{obtenerDepartamentoGestionado() || 'ASISTENCIAL'}</strong>
              </p>
            </div>
          )}
          
          {/* Botón para crear nueva solicitud - No visible para jefes de área */}
          {!user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              Crear Solicitud de Cambio de Turno
            </button>
          )}

          {/* Modal de Cambio de Turno - No visible para jefes de área */}
          {modalAbierto && !user?.roles?.some((rol: any) => rol.nombre === 'JEFE AREA') && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalAbierto(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b px-6 py-4 rounded-t-xl bg-white dark:bg-gray-800 sticky top-0">
                  <h2 className="text-2xl font-bold text-[#2E7D32] dark:text-[#4CAF50]">Nueva Solicitud de Cambio de Turno</h2>
                  <button 
                    onClick={() => {
                      setModalAbierto(false);
                      limpiarFormulario();
                    }} 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50]" />
                  </button>
                </div>
                <form onSubmit={manejarCambioTurno} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Solicitud</label>
                      <input type="date" className="input mt-1" value={fechaSolicitud} onChange={e => setFechaSolicitud(e.target.value)} required readOnly />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                      <input type="text" className="input mt-1" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cargo</label>
                      <input type="text" className="input mt-1" value={cargo} onChange={e => setCargo(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Turno a Cambiar</label>
                      <input 
                        type="date" 
                        className="input mt-1" 
                        value={fechaTurnoCambiar} 
                        onChange={e => setFechaTurnoCambiar(e.target.value)} 
                        min={getMinDate()}
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horario a Cambiar</label>
                      <select className="input mt-1" value={horarioCambiar} onChange={e => setHorarioCambiar(e.target.value)} required>
                        <option value="">Seleccionar horario</option>
                        <option value="CORRIDO">CORRIDO</option>
                        <option value="MAÑANA">MAÑANA</option>
                        <option value="TARDE">TARDE</option>
                        <option value="NOCHE">NOCHE</option>
                        <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                        <option value="M8">M8</option>
                        <option value="ARREGLO">ARREGLO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Turno Reemplazo</label>
                      <input 
                        type="date" 
                        className="input mt-1" 
                        value={fechaTurnoReemplazo} 
                        onChange={e => setFechaTurnoReemplazo(e.target.value)} 
                        min={getMinDate()}
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horario a Realizar</label>
                      <select className="input mt-1" value={horarioReemplazo} onChange={e => setHorarioReemplazo(e.target.value)} required>
                        <option value="">Seleccionar horario</option>
                        <option value="CORRIDO">CORRIDO</option>
                        <option value="MAÑANA">MAÑANA</option>
                        <option value="TARDE">TARDE</option>
                        <option value="NOCHE">NOCHE</option>
                        <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                        <option value="M8">M8</option>
                        <option value="ARREGLO">ARREGLO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Motivo del Cambio</label>
                      <textarea className="input mt-1" value={motivoCambio} onChange={e => setMotivoCambio(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre Reemplazo</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="input mt-1 flex-1" 
                          value={nombreReemplazo} 
                          onChange={e => setNombreReemplazo(e.target.value)} 
                          required 
                          placeholder="Buscar empleado..."
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorReemplazo(!mostrarSelectorReemplazo)}
                          className="mt-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          Seleccionar
                        </button>
                      </div>
                      {mostrarSelectorReemplazo && (
                        <div className="mt-2 p-3 border border-gray-300 rounded-md bg-white max-h-40 overflow-y-auto">
                          <p className="text-sm font-medium text-gray-700 mb-2">Empleados de la misma área:</p>
                          
                          {/* Campo de búsqueda */}
                          <div className="mb-3 relative">
                            <input
                              type="text"
                              placeholder="Buscar por nombre o documento..."
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={busquedaReemplazo}
                              onChange={handleBusquedaReemplazo}
                            />
                            {busquedaReemplazo && (
                              <button
                                type="button"
                                onClick={() => setBusquedaReemplazo('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                title="Limpiar búsqueda"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          
                          {/* Lista de empleados filtrados */}
                          {empleadosMismaArea.length > 0 ? (
                            <>
                              {/* Contador de resultados */}
                              {busquedaReemplazo && (
                                <div className="text-xs text-gray-500 mb-2">
                                  {empleadosMismaArea.filter((empleado) => {
                                    const busqueda = busquedaReemplazo.toLowerCase();
                                    return (
                                      empleado.nombres?.toLowerCase().includes(busqueda) ||
                                      empleado.documento?.toLowerCase().includes(busqueda)
                                    );
                                  }).length} resultado(s) encontrado(s)
                                </div>
                              )}
                              
                              {empleadosMismaArea
                                .filter((empleado) => {
                                  if (!busquedaReemplazo) return true;
                                  const busqueda = busquedaReemplazo.toLowerCase();
                                  return (
                                    empleado.nombres?.toLowerCase().includes(busqueda) ||
                                    empleado.documento?.toLowerCase().includes(busqueda)
                                  );
                                })
                                .map((empleado) => (
                                  <div
                                    key={empleado.id}
                                    onClick={() => seleccionarEmpleadoMismaArea(empleado)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm border-b border-gray-100"
                                  >
                                    <div className="font-medium">{empleado.nombres}</div>
                                    <div className="text-xs text-gray-500">Cédula: {empleado.documento}</div>
                                    <div className="text-xs text-gray-500">Cargo: {empleado.oficio || 'Sin cargo'}</div>
                                  </div>
                                ))}
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No hay empleados en la misma área</p>
                          )}
                          
                          {/* Mensaje si no hay resultados en la búsqueda */}
                          {busquedaReemplazo && empleadosMismaArea.length > 0 && empleadosMismaArea.filter((empleado) => {
                            const busqueda = busquedaReemplazo.toLowerCase();
                            return (
                              empleado.nombres?.toLowerCase().includes(busqueda) ||
                              empleado.documento?.toLowerCase().includes(busqueda)
                            );
                          }).length === 0 && (
                            <p className="text-sm text-gray-500 mt-2 text-center py-2 bg-gray-50 rounded">
                              No se encontraron empleados con esa búsqueda
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cédula Reemplazo</label>
                      <input 
                        type="text" 
                        className="input mt-1" 
                        value={cedulaReemplazo} 
                        onChange={e => setCedulaReemplazo(e.target.value)} 
                        required 
                        readOnly={empleadoReemplazoSeleccionado !== null}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Afectación Nómina</label>
                      <select className="input mt-1" value={afectacionNomina} onChange={e => setAfectacionNomina(e.target.value)} required>
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Soporte (opcional)</label>
                      <input type="file" className="input mt-1" onChange={e => setSoporte(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Correo</label>
                      <input type="email" className="input mt-1" value={correo} onChange={e => setCorreo(e.target.value)} required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Observaciones</label>
                      <textarea className="input mt-1" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalAbierto(false);
                        limpiarFormulario();
                      }} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">Guardar Solicitud</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mt-6">
            <div className="flex flex-wrap gap-4 items-end">
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
                  <option value="en_revision">En Revisión</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
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
                  onClick={exportarCambiosTurnoAExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  title="Exportar cambios de turno a Excel"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Información de resultados */}
            <div className="mt-4 text-sm text-[#2E7D32] dark:text-[#66BB6A]">
              Mostrando {solicitudesPaginadas.length} de {solicitudesFiltradasYOrdenadas.length} solicitudes
            </div>
          </div>

          {/* Tabla de solicitudes */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Turno a Realizar / Horario a Realizar
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Turno del Cambio / Horario Cambiar
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {solicitudesPaginadas.length > 0 ? (
                  solicitudesPaginadas.map((solicitud, index) => (
                    <tr key={solicitud.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium flex items-center gap-2 justify-center">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        {(solicitud.empleado?.nombres || '').toUpperCase() || "SIN NOMBRE"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha_turno_reemplazo ? (() => {
                              const fechaStr = solicitud.fecha_turno_reemplazo.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_reemplazo || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha ? (() => {
                              const fechaStr = solicitud.fecha.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_cambiar || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(solicitud.estado)}`}>
                          {getEstadoIcon(solicitud.estado)} {solicitud.estado?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => abrirModalDetalles(solicitud)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">No hay solicitudes de cambio de turno registradas.</td>
                  </tr>
                )}
              </tbody>
                </table>
              </div>
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

      ) : activeTab === "darVistoBueno" ? (
        <div className="space-y-6">
          {/* Indicador de filtrado por departamento para jefes de área y gerentes */}
          {user?.roles?.some((rol: any) => ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'].includes(rol.nombre)) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-blue-700">
                <strong>Vista de Supervisión:</strong> Mostrando solicitudes pendientes por visto bueno filtradas por departamento 
                <strong className="ml-1">{obtenerDepartamentoGestionado() || 'ASISTENCIAL'}</strong>
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Dar Visto Bueno</h3>
            <p className="text-blue-700 text-sm">
              Aquí puedes aprobar o rechazar las solicitudes donde te han pedido como reemplazo. 
              Revisa los detalles y toma tu decisión.
            </p>
          </div>
          
          <h2 className="text-2xl font-bold">Solicitudes Pendientes por Visto Bueno</h2>
          
          {pendientesVistoBueno.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turno que Cubrirás / Horario a Cubrir
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turno a Cambiar / Horario a Cambiar
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendientesVistoBueno.map((solicitud, index) => (
                    <tr key={solicitud.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium flex items-center gap-2 justify-center">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        {solicitud.empleado?.nombres?.toUpperCase() || "SIN NOMBRE"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha ? (() => {
                              const fechaStr = solicitud.fecha.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_cambiar || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha_turno_reemplazo ? (() => {
                              const fechaStr = solicitud.fecha_turno_reemplazo.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_reemplazo || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center max-w-xs truncate" title={solicitud.motivo}>
                        {solicitud.motivo || "-"}
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => abrirModalVistoBueno(solicitud, 'aprobar')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => abrirModalVistoBueno(solicitud, 'rechazar')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                        >
                          ✗ Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="mb-4">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <p className="text-lg font-medium">No tienes solicitudes pendientes por visto bueno</p>
              <p className="text-sm text-gray-500 mt-2">Cuando alguien te solicite como reemplazo, aparecerá aquí</p>
            </div>
          )}
        </div>
      ) : activeTab === "jefeArea" ? (
        <div className="space-y-6">
          {/* Indicador de filtrado por departamento para jefes de área y gerentes */}
          {user?.roles?.some((rol: any) => ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'].includes(rol.nombre)) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-blue-700">
                <strong>Vista de Supervisión:</strong> Mostrando solicitudes en revisión filtradas por departamento 
                <strong className="ml-1">{obtenerDepartamentoGestionado() || 'ASISTENCIAL'}</strong>
              </p>
            </div>
          )}
          
          <h2 className="text-2xl font-bold">Solicitudes en Revisión - Jefe de Área</h2>
          
          {enRevision.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reemplazo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Turno a Realizar / Horario a Realizar
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Turno del Cambio / Horario Cambiar
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enRevision.map((solicitud, index) => (
                    <tr key={solicitud.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium flex items-center gap-2 justify-center">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        {solicitud.empleado?.nombres?.toUpperCase() || "SIN NOMBRE"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {solicitud.nombre_reemplazo || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha_turno_reemplazo ? (() => {
                              const fechaStr = solicitud.fecha_turno_reemplazo.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_reemplazo || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span>
                            {solicitud.fecha ? (() => {
                              const fechaStr = solicitud.fecha.toString();
                              if (fechaStr.includes('T')) {
                                const [year, month, day] = fechaStr.split('T')[0].split('-');
                                return `${day}/${month}/${year}`;
                              } else {
                                const [year, month, day] = fechaStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                            })() : "N/A"}
                          </span>
                          <span className="text-xs text-gray-600">{solicitud.horario_cambiar || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => abrirModalJefe(solicitud, 'aprobar')}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => abrirModalJefe(solicitud, 'rechazar')}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No hay solicitudes en revisión para aprobar.
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-[#2E7D32] dark:text-[#66BB6A]">Aquí se mostrará el resumen de cambios de turno.</p>
      )}

      {/* Modal de Visto Bueno */}
      {modalVistoBueno && solicitudVistoBueno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            tipoVistoBueno === 'aprobar' 
              ? 'border-t-4 border-green-500' 
              : 'border-t-4 border-red-500'
          }`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-6 py-4 rounded-t-xl sticky top-0 z-10 ${
              tipoVistoBueno === 'aprobar'
                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30'
                : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30'
            }`}>
              <div className="flex items-center gap-3">
                {tipoVistoBueno === 'aprobar' ? (
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <h2 className={`text-2xl font-bold ${
                  tipoVistoBueno === 'aprobar'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                {tipoVistoBueno === 'aprobar' ? 'Aprobar Visto Bueno' : 'Rechazar Visto Bueno'}
              </h2>
              </div>
              <button 
                onClick={() => {
                  setModalVistoBueno(false);
                  setSolicitudVistoBueno(null);
                  setMotivoVistoBueno("");
                }} 
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <XCircle className={`w-6 h-6 ${
                  tipoVistoBueno === 'aprobar'
                    ? 'text-green-600 hover:text-green-700 dark:text-green-400'
                    : 'text-red-600 hover:text-red-700 dark:text-red-400'
                }`} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información del Solicitante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.empleado?.nombres || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.empleado?.documento || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Detalles del Cambio de Turno */}
              <div className={`p-4 rounded-lg border ${
                tipoVistoBueno === 'aprobar'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                  tipoVistoBueno === 'aprobar'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Detalles del Cambio de Turno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Turno que Cubrirás</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.fecha ? (() => {
                        const fechaStr = solicitudVistoBueno.fecha.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudVistoBueno.fecha);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario a Cubrir</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.horario_cambiar || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Turno a Cambiar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.fecha_turno_reemplazo ? (() => {
                        const fechaStr = solicitudVistoBueno.fecha_turno_reemplazo.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudVistoBueno.fecha_turno_reemplazo);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario a Cambiar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.horario_reemplazo || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Reemplazo */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Tu Información (Reemplazo)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre del Reemplazo</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.nombre_reemplazo || 'N/A'} <span className="text-xs text-blue-600 dark:text-blue-400">(Tú)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudVistoBueno.cedula_reemplazo || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              {solicitudVistoBueno.motivo && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Motivo del Cambio
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    {solicitudVistoBueno.motivo}
                  </p>
                </div>
              )}
              
              {/* Campo de comentario/motivo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {tipoVistoBueno === 'aprobar' ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Comentario (opcional)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Motivo del rechazo <span className="text-red-500">*</span>
                    </span>
                  )}
                </label>
                <textarea 
                  className={`w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                    tipoVistoBueno === 'aprobar'
                      ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:border-green-700 dark:bg-gray-700 dark:text-gray-100'
                      : 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:border-red-700 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                  rows={4}
                  value={motivoVistoBueno}
                  onChange={(e) => setMotivoVistoBueno(e.target.value)}
                  placeholder={
                    tipoVistoBueno === 'aprobar' 
                      ? 'Agregar un comentario opcional sobre tu aprobación...' 
                      : 'Especificar el motivo por el cual rechazas este visto bueno (requerido)...'
                  }
                  required={tipoVistoBueno === 'rechazar'}
                />
                {tipoVistoBueno === 'rechazar' && !motivoVistoBueno && (
                  <p className="mt-1 text-sm text-red-500">El motivo del rechazo es obligatorio</p>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => {
                    setModalVistoBueno(false);
                    setSolicitudVistoBueno(null);
                    setMotivoVistoBueno("");
                  }} 
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={tipoVistoBueno === 'aprobar' ? aprobarVistoBueno : rechazarVistoBueno}
                  disabled={tipoVistoBueno === 'rechazar' && !motivoVistoBueno}
                  className={`px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    tipoVistoBueno === 'aprobar' 
                      ? 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl' 
                      : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {tipoVistoBueno === 'aprobar' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobar Visto Bueno
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar Visto Bueno
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Jefe de Área */}
      {modalJefe && solicitudJefe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            tipoJefe === 'aprobar' 
              ? 'border-t-4 border-blue-500' 
              : 'border-t-4 border-red-500'
          }`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-6 py-4 rounded-t-xl sticky top-0 z-10 ${
              tipoJefe === 'aprobar'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30'
                : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30'
            }`}>
              <div className="flex items-center gap-3">
                {tipoJefe === 'aprobar' ? (
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${
                    tipoJefe === 'aprobar'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                {tipoJefe === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
              </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Jefe de Área</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalJefe(false);
                  setSolicitudJefe(null);
                  setMotivoJefe("");
                }}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <XCircle className={`w-6 h-6 ${
                  tipoJefe === 'aprobar'
                    ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400'
                    : 'text-red-600 hover:text-red-700 dark:text-red-400'
                }`} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información del Solicitante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.empleado?.nombres || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.empleado?.documento || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles del Cambio de Turno */}
              <div className={`p-4 rounded-lg border ${
                tipoJefe === 'aprobar'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                  tipoJefe === 'aprobar'
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Detalles del Cambio de Turno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha Turno a Realizar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.fecha_turno_reemplazo ? (() => {
                        const fechaStr = solicitudJefe.fecha_turno_reemplazo.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudJefe.fecha_turno_reemplazo);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario a Realizar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{solicitudJefe.horario_reemplazo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha Turno del Cambio</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.fecha ? (() => {
                        const fechaStr = solicitudJefe.fecha.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudJefe.fecha);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario Cambiar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.horario_cambiar || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Horario a Realizar</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.horario_reemplazo || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Reemplazo */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Información del Reemplazo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre del Reemplazo</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.nombre_reemplazo || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {solicitudJefe.cedula_reemplazo || 'N/A'}
                    </p>
                  </div>
                  {solicitudJefe.visto_bueno_reemplazo && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado del Visto Bueno</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                        solicitudJefe.visto_bueno_reemplazo === 'Aprobado' || solicitudJefe.visto_bueno_reemplazo === 'Aprobado'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : solicitudJefe.visto_bueno_reemplazo === 'Rechazado'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {solicitudJefe.visto_bueno_reemplazo === 'Aprobado' || solicitudJefe.visto_bueno_reemplazo === 'Aprobado' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : solicitudJefe.visto_bueno_reemplazo === 'Rechazado' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {solicitudJefe.visto_bueno_reemplazo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo */}
              {solicitudJefe.motivo && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Motivo del Cambio
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    {solicitudJefe.motivo}
                  </p>
                </div>
              )}

              {/* Observaciones */}
              {solicitudJefe.observaciones && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Observaciones
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    {solicitudJefe.observaciones}
                  </p>
                </div>
              )}
              
              {/* Campo de comentario/motivo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {tipoJefe === 'aprobar' ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Comentario (opcional)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Motivo del rechazo <span className="text-red-500">*</span>
                    </span>
                  )}
                </label>
                <textarea
                  className={`w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                    tipoJefe === 'aprobar'
                      ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-blue-700 dark:bg-gray-700 dark:text-gray-100'
                      : 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:border-red-700 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                  rows={4}
                  value={motivoJefe}
                  onChange={(e) => setMotivoJefe(e.target.value)}
                  placeholder={
                    tipoJefe === 'aprobar' 
                      ? 'Agregar un comentario opcional sobre tu aprobación...' 
                      : 'Especificar el motivo por el cual rechazas esta solicitud (requerido)...'
                  }
                  required={tipoJefe === 'rechazar'}
                />
                {tipoJefe === 'rechazar' && !motivoJefe && (
                  <p className="mt-1 text-sm text-red-500">El motivo del rechazo es obligatorio</p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setModalJefe(false);
                    setSolicitudJefe(null);
                    setMotivoJefe("");
                  }}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={tipoJefe === 'aprobar' ? aprobarPorJefe : rechazarPorJefe}
                  disabled={tipoJefe === 'rechazar' && !motivoJefe}
                  className={`px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    tipoJefe === 'aprobar'
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl' 
                      : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {tipoJefe === 'aprobar' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobar Solicitud
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rechazar Solicitud
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {modalDetalles && solicitudDetalles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4 rounded-t-xl bg-white dark:bg-gray-800 sticky top-0">
              <h2 className="text-xl font-bold text-[#2E7D32] dark:text-[#4CAF50]">
                Detalles de Solicitud de Cambio de Turno
              </h2>
              <button
                onClick={() => {
                  setModalDetalles(false);
                  setSolicitudDetalles(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Información del solicitante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  👤 Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</p>
                    <p className="text-base font-semibold">{solicitudDetalles.empleado?.nombres || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento</p>
                    <p className="text-base font-semibold">{solicitudDetalles.empleado?.documento || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información del cambio de turno */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                  🔄 Detalles del Cambio de Turno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha Turno a Realizar</p>
                    <p className="text-base font-semibold">
                      {solicitudDetalles.fecha_turno_reemplazo ? (() => {
                        // fecha_turno_reemplazo viene como DATEONLY (YYYY-MM-DD), procesar directamente
                        const fechaStr = solicitudDetalles.fecha_turno_reemplazo.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudDetalles.fecha_turno_reemplazo);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          // Si viene como YYYY-MM-DD, procesar directamente
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario a Realizar</p>
                    <p className="text-base font-semibold">{solicitudDetalles.horario_reemplazo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha Turno del Cambio</p>
                    <p className="text-base font-semibold">
                      {solicitudDetalles.fecha ? (() => {
                        // fecha viene como DATEONLY (YYYY-MM-DD), procesar directamente
                        const fechaStr = solicitudDetalles.fecha.toString();
                        if (fechaStr.includes('T')) {
                          const fecha = new Date(solicitudDetalles.fecha);
                          const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
                          const day = String(fechaLocal.getDate()).padStart(2, '0');
                          const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
                          const year = fechaLocal.getFullYear();
                          return `${day}/${month}/${year}`;
                        } else {
                          // Si viene como YYYY-MM-DD, procesar directamente
                          const [year, month, day] = fechaStr.split('T')[0].split('-');
                          return `${day}/${month}/${year}`;
                        }
                      })() : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">Horario Cambiar</p>
                    <p className="text-base font-semibold">{solicitudDetalles.horario_cambiar || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(solicitudDetalles.estado)}`}>
                      {getEstadoIcon(solicitudDetalles.estado)} {solicitudDetalles.estado?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del reemplazo */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                  👥 Información del Reemplazo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre del Reemplazo</p>
                    <p className="text-base font-semibold">{solicitudDetalles.nombre_reemplazo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documento del Reemplazo</p>
                    <p className="text-base font-semibold">{solicitudDetalles.cedula_reemplazo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visto Bueno del Reemplazo</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getVistoBuenoClass(solicitudDetalles.visto_bueno_reemplazo)}`}>
                      {getVistoBuenoIcon(solicitudDetalles.visto_bueno_reemplazo)} {solicitudDetalles.visto_bueno_reemplazo || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo y observaciones */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  📝 Motivo y Observaciones
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Motivo del Cambio</p>
                    <p className="text-base">{solicitudDetalles.motivo || 'N/A'}</p>
                  </div>
                  {solicitudDetalles.observaciones && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Observaciones</p>
                      <p className="text-base">{solicitudDetalles.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón cerrar */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setModalDetalles(false);
                    setSolicitudDetalles(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftChange;
