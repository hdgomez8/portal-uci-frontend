import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, Eye, Plus, AlertCircle, Calendar, User as UserIcon } from 'lucide-react';
import Loader from '../../components/Loader';

const VacacionesPage = () => {
  const user = JSON.parse(localStorage.getItem("usuario") || "null");
  const [activeTab, setActiveTab] = useState('resumen');
  const [solicitudes, setSolicitudes] = useState([]);
  const [enRevision, setEnRevision] = useState([]);
  const [enRevisionAdministracion, setEnRevisionAdministracion] = useState([]);
  const [enRevisionRRHH, setEnRevisionRRHH] = useState([]); // Nuevo estado para RRHH
  const [loading, setLoading] = useState(false);
  const [loadingAprobacion, setLoadingAprobacion] = useState(false); // Nuevo estado para loading de aprobación

  // Estados para el flujo de aprobación
  const [modalJefe, setModalJefe] = useState(false);
  const [modalAdministrador, setModalAdministrador] = useState(false);
  const [modalRRHH, setModalRRHH] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [tipoAccion, setTipoAccion] = useState('aprobar');
  
  // Estado para nueva solicitud de vacaciones
  const [nuevaVacacion, setNuevaVacacion] = useState({
    ciudad_departamento: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    nombres_colaborador: '',
    cedula_colaborador: '',
    cargo_colaborador: '',
    periodo_cumplido_desde: '',
    periodo_cumplido_hasta: '',
    dias_cumplidos: 0,
    periodo_disfrute_desde: '',
    periodo_disfrute_hasta: '',
    dias_disfrute: 0,
    dias_pago_efectivo_aplica: false,
    dias_pago_efectivo_na: false,
    dias_pago_efectivo_total: 0,
    actividades_pendientes: '',
    reemplazo_nombre: '',
    reemplazo_firma: '',
    reemplazo_identificacion: '',
    reemplazo_no_hay: false,
    reemplazo_nuevo_personal: 'na',
    solicitante_nombre: '',
    solicitante_cargo: '',
    solicitante_firma: '',
    jefe_nombre: '',
    jefe_cargo: '',
    jefe_firma: '',
    administrador_nombre: '',
    administrador_cargo: '',
    administrador_firma: '',
    representante_legal_nombre: '',
    representante_legal_cargo: '',
    representante_legal_firma: '',
    observaciones: '',
    archivo_pdf: null
  });

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Inicializar campos del formulario solo una vez cuando el usuario esté disponible
  useEffect(() => {
    if (user?.empleado && !nuevaVacacion.nombres_colaborador) {
      setNuevaVacacion(prev => ({
        ...prev,
        ciudad_departamento: 'Santa Marta/Magdalena', // Fijo
        fecha_solicitud: new Date().toISOString().split('T')[0], // Día actual
        nombres_colaborador: user.empleado.nombres || '',
        cedula_colaborador: user.empleado.documento || '',
        cargo_colaborador: user.empleado.oficio || '',
        solicitante_nombre: user.empleado.nombres || '',
        solicitante_cargo: user.empleado.oficio || '',
        // Intentar obtener información del jefe del departamento
        jefe_nombre: obtenerJefeDepartamento(user) || '',
        jefe_cargo: obtenerCargoJefeDepartamento(user) || ''
      }));
    }
  }, [user?.empleado?.id]); // Solo depende del ID del empleado, no del objeto completo

  // Función para obtener el jefe del departamento
  const obtenerJefeDepartamento = (user) => {
    try {
      // Intentar obtener del localStorage o de la información del usuario
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Buscar información del jefe en la estructura correcta: areas[0].jefe
        if (userData?.empleado?.areas?.[0]?.jefe?.nombres) {
          return userData.empleado.areas[0].jefe.nombres;
        }
      }
      
      // Fallback: usar información del usuario actual si es jefe
      if (user?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
        return user.empleado?.nombres || '';
      }
      
      return '';
    } catch (error) {
      console.error('Error obteniendo jefe del departamento:', error);
      return '';
    }
  };

  // Función para obtener el cargo del jefe del departamento
  const obtenerCargoJefeDepartamento = (user) => {
    try {
      // Intentar obtener del localStorage o de la información del usuario
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Buscar información del jefe en la estructura correcta: areas[0].jefe
        if (userData?.empleado?.areas?.[0]?.jefe?.oficio) {
          return userData.empleado.areas[0].jefe.oficio;
        }
      }
      
      // Fallback: usar información del usuario actual si es jefe
      if (user?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
        return user.empleado?.oficio || '';
      }
      
      return 'Jefe de Área'; // Cargo por defecto
    } catch (error) {
      console.error('Error obteniendo cargo del jefe:', error);
      return 'Jefe de Área';
    }
  };

  // Función para manejar la selección de archivo PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar que sea un PDF
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        e.target.value = '';
        return;
      }
      
      // Verificar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        e.target.value = '';
        return;
      }
      
      setNuevaVacacion(prev => ({
        ...prev,
        archivo_pdf: file
      }));
      
      toast.success('Archivo PDF seleccionado correctamente');
    }
  };

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay token de autenticación');
        return;
      }

      // Cargar datos reales desde el backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/vacaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      
      // Filtrar solicitudes según el rol del usuario
      let solicitudesFiltradas = [];
      
      // Obtener información del usuario desde localStorage si no está disponible
      let userInfo = user;
      if (!userInfo) {
        try {
          const storedUser = localStorage.getItem('usuario');
          if (storedUser) {
            userInfo = JSON.parse(storedUser);
          }
        } catch (error) {
          console.error('Error al parsear usuario del localStorage:', error);
        }
      }
      
      if (userInfo?.roles?.some((rol) => rol.nombre === 'ADMINISTRADOR')) {
        // Administradores ven solicitudes en revisión (aprobadas por jefe)
        solicitudesFiltradas = data.filter(solicitud => solicitud.estado === 'en_revision');
      } else if (userInfo?.roles?.some((rol) => rol.nombre === 'JEFE AREA')) {
        // Jefes ven solicitudes según su departamento
        const departamentoId = userInfo?.empleado?.areas?.[0]?.departamento?.id;
        
        if (departamentoId === 4) { // ADMINISTRACIÓN
          // Jefes de administración ven TODAS las solicitudes "en_revision"
          solicitudesFiltradas = data.filter(solicitud => 
            solicitud.estado === 'en_revision'
          );
                 } else if (departamentoId === 2) { // RRHH
           // Jefes de RRHH ven solicitudes "aprobado_por_admin"
           solicitudesFiltradas = data.filter(solicitud => 
             solicitud.estado === 'aprobado_por_admin'
           );
        } else {
          // Otros jefes ven solicitudes de su departamento
          solicitudesFiltradas = data.filter(solicitud => 
            solicitud.empleado?.areas?.[0]?.departamento?.id === departamentoId
          );
        }
      } else if (userInfo?.roles?.some((rol) => rol.nombre === 'RRHH')) {
        // RRHH ve solicitudes aprobadas por administrador
        solicitudesFiltradas = data.filter(solicitud => solicitud.estado === 'aprobado_por_admin');
      } else {
        // Empleados normales solo ven sus propias solicitudes
        // IMPORTANTE: user.id ≠ empleado.id, usar empleado.id
        const empleadoId = userInfo?.empleado?.id;
        if (empleadoId) {
          solicitudesFiltradas = data.filter(solicitud => solicitud.empleado_id === empleadoId);
        } else {
          // Fallback: si no hay empleado.id, no mostrar nada
          solicitudesFiltradas = [];
          console.warn('No se pudo determinar el ID del empleado para el filtrado');
        }
      }
      
      setSolicitudes(solicitudesFiltradas);
      
      // Filtrar solicitudes en revisión según el rol
      if (userInfo?.roles?.some((rol) => rol.nombre === 'JEFE AREA')) {
        const departamentoId = userInfo?.empleado?.areas?.[0]?.departamento?.id;
        
        if (departamentoId === 4) { // ADMINISTRACIÓN
          // Jefes de administración ven solicitudes "en_revision" para su pestaña específica
          const enRevisionData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'en_revision');
          setEnRevisionAdministracion(enRevisionData);
          // También ven solicitudes "pendiente" para la pestaña general de jefes
          const pendientesData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'pendiente');
          setEnRevision(pendientesData);
        } else if (departamentoId === 2) { // RRHH
          const enRevisionRRHHData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'aprobado_por_admin');
          setEnRevisionRRHH(enRevisionRRHHData);
          // También ven solicitudes "pendiente" para la pestaña general de jefes
          const pendientesData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'pendiente');
          setEnRevision(pendientesData);
        } else {
          // Otros jefes ven solo solicitudes "pendiente"
          const enRevisionData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'pendiente');
          setEnRevision(enRevisionData);
          setEnRevisionAdministracion([]);
          setEnRevisionRRHH([]); // Limpiar RRHH si no es jefe de RRHH
        }
      } else if (userInfo?.roles?.some((rol) => rol.nombre === 'ADMINISTRADOR')) {
        const enRevisionData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'en_revision');
        setEnRevision(enRevisionData);
        setEnRevisionAdministracion([]);
        setEnRevisionRRHH([]); // Limpiar RRHH si es administrador
      } else if (userInfo?.roles?.some((rol) => rol.nombre === 'RRHH')) {
        const enRevisionData = solicitudesFiltradas.filter(solicitud => solicitud.estado === 'aprobado_por_admin');
        setEnRevision(enRevisionData);
        setEnRevisionAdministracion([]);
        setEnRevisionRRHH([]); // Limpiar RRHH si es RRHH
      } else {
        setEnRevision([]);
        setEnRevisionAdministracion([]);
        setEnRevisionRRHH([]); // Limpiar RRHH si es empleado normal
      }
      
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear nueva solicitud de vacaciones
  const crearSolicitudVacaciones = async (e) => {
    e.preventDefault();
    
    try {
      setLoadingAprobacion(true); // Activar loader
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay token de autenticación');
        return;
      }

      // Validar campos obligatorios
      const camposObligatorios = [
        'ciudad_departamento', 'fecha_solicitud', 'nombres_colaborador',
        'cedula_colaborador', 'periodo_cumplido_desde', 'periodo_cumplido_hasta',
        'dias_cumplidos', 'periodo_disfrute_desde', 'periodo_disfrute_hasta', 'dias_disfrute',
        'solicitante_nombre', 'solicitante_cargo', 'jefe_nombre', 'jefe_cargo'
      ];
      
      for (const campo of camposObligatorios) {
        if (!nuevaVacacion[campo]) {
          toast.error(`Falta el campo obligatorio: ${campo}`);
          return;
        }
      }

      // Agregar empleado_id del usuario actual
      const solicitudCompleta = {
        ...nuevaVacacion,
        empleado_id: user?.empleado?.id
      };

      // Crear FormData para enviar archivo PDF
      const formData = new FormData();
      
      // Agregar todos los campos de la solicitud
      Object.keys(solicitudCompleta).forEach(key => {
        if (key === 'archivo_pdf' && solicitudCompleta[key]) {
          // Agregar el archivo PDF
          formData.append('archivo_pdf', solicitudCompleta[key]);
        } else if (key !== 'archivo_pdf') {
          // Agregar otros campos como strings
          formData.append(key, solicitudCompleta[key]);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/vacaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir Content-Type para que el navegador lo establezca automáticamente con el boundary
        },
        body: formData
      });

      if (response.ok) {
        const nuevaSolicitud = await response.json();
        toast.success('✅ Solicitud de vacaciones creada exitosamente');
        setModalCrear(false);
        
        // Limpiar formulario
        setNuevaVacacion({
          ciudad_departamento: '',
          fecha_solicitud: new Date().toISOString().split('T')[0],
          nombres_colaborador: '',
          cedula_colaborador: '',
          cargo_colaborador: '',
          periodo_cumplido_desde: '',
          periodo_cumplido_hasta: '',
          dias_cumplidos: 0,
          periodo_disfrute_desde: '',
          periodo_disfrute_hasta: '',
          dias_disfrute: 0,
          dias_pago_efectivo_aplica: false,
          dias_pago_efectivo_na: false,
          dias_pago_efectivo_total: 0,
          actividades_pendientes: '',
          reemplazo_nombre: '',
          reemplazo_firma: '',
          reemplazo_identificacion: '',
          reemplazo_no_hay: false,
          reemplazo_nuevo_personal: 'na',
          solicitante_nombre: '',
          solicitante_cargo: '',
          solicitante_firma: '',
          jefe_nombre: '',
          jefe_cargo: '',
          jefe_firma: '',
          administrador_nombre: '',
          administrador_cargo: '',
          administrador_firma: '',
          representante_legal_nombre: '',
          representante_legal_cargo: '',
          representante_legal_firma: '',
          observaciones: '',
          archivo_pdf: null
        });
        
        // Recargar solicitudes
        await cargarSolicitudes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear la solicitud');
      }
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      toast.error(`Error al crear la solicitud: ${error.message}`);
    } finally {
      setLoadingAprobacion(false); // Desactivar loader
    }
  };

  const getEstadoIcon = (estado) => {
    if (!estado) return <AlertCircle className="text-gray-600 w-4 h-4" />;
    
    const estadoLower = estado.toLowerCase();
    
    switch (estadoLower) {
      case 'aprobado':
        return <CheckCircle className="text-emerald-600 w-4 h-4" />;
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

  const getEstadoClass = (estado) => {
    if (!estado) return 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm';
    
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

  const abrirModal = (solicitud, tipo, modalType) => {
    setSolicitudActual(solicitud);
    setTipoAccion(tipo);
    setMotivo('');
    
    switch (modalType) {
      case 'jefe':
        setModalJefe(true);
        break;
      case 'administrador':
        setModalAdministrador(true);
        break;
      case 'rrhh':
        setModalRRHH(true);
        break;
    }
  };

  const manejarAccion = async (modalType) => {
    try {
      setLoadingAprobacion(true); // Activar loader
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay token de autenticación');
        return;
      }

      // Determinar la ruta específica según el tipo de modal
      let url = '';
      switch (modalType) {
        case 'jefe':
          url = tipoAccion === 'aprobar' 
            ? `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/aprobar-por-jefe`
            : `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/rechazar-por-jefe`;
          break;
        case 'administrador':
          url = tipoAccion === 'aprobar' 
            ? `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/aprobar-por-administracion`
            : `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/rechazar-por-administracion`;
          break;
        case 'rrhh':
          url = tipoAccion === 'aprobar' 
            ? `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/aprobar-por-rrhh`
            : `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}/rechazar-por-rrhh`;
          break;
        default:
          url = `${import.meta.env.VITE_API_URL}/vacaciones/${solicitudActual.id}`;
      }

      // Actualizar la solicitud en el backend
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motivo_rechazo: tipoAccion === 'rechazar' ? motivo : null,
          observaciones: tipoAccion === 'aprobar' ? motivo : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar la solicitud');
      }

      toast.success(`Solicitud ${tipoAccion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
      
      // Cerrar modal
      switch (modalType) {
        case 'jefe':
          setModalJefe(false);
          break;
        case 'administrador':
          setModalAdministrador(false);
          break;
        case 'rrhh':
          setModalRRHH(false);
          break;
      }
      
      // Recargar datos
      await cargarSolicitudes();
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      toast.error(`Error al procesar la solicitud: ${error.message}`);
    } finally {
      setLoadingAprobacion(false); // Desactivar loader
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Vacaciones</h1>

      {/* Botón para crear nueva solicitud - Solo para empleados (no jefes) */}
      {!user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') && (
        <div className="mb-6">
          <button
            onClick={() => setModalCrear(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Solicitud de Vacaciones
          </button>
        </div>
      )}

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
          Lista de Vacaciones
        </button>
        
        {/* Pestaña Visto Bueno Jefe - Solo para jefes */}
        {user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "vistoBuenoJefe" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("vistoBuenoJefe")}
          >
            Visto Bueno Jefe
            {enRevision.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {enRevision.length}
              </span>
            )}
          </button>
        )}

        {/* Pestaña Visto Bueno Administración - Solo para jefes de área de administración */}
        {user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') && 
         user?.empleado?.areas?.[0]?.departamento?.id === 4 && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "vistoBuenoAdministracion" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("vistoBuenoAdministracion")}
          >
            Visto Bueno Administración
            {enRevisionAdministracion.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {enRevisionAdministracion.length}
              </span>
            )}
          </button>
        )}

        {/* Pestaña Visto Bueno RRHH - Solo para jefes de área de RRHH */}
        {user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') && 
         user?.empleado?.areas?.[0]?.departamento?.id === 2 && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "vistoBuenoRRHH" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("vistoBuenoRRHH")}
          >
            Visto Bueno RRHH
            {enRevisionRRHH.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {enRevisionRRHH.length}
              </span>
            )}
          </button>
        )}

        {/* Pestaña Revisión Administrador - Solo para administradores */}
        {user?.roles?.some((rol) => rol.nombre === 'ADMINISTRADOR') && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "revisionAdministrador" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("revisionAdministrador")}
          >
            Revisión Administrador
          </button>
        )}

        {/* Pestaña Aprobación RRHH - Solo para RRHH */}
        {user?.roles?.some((rol) => rol.nombre === 'RRHH') && (
          <button
            className={`px-4 py-2 text-lg ${activeTab === "aprobacionRRHH" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"} relative`}
            onClick={() => setActiveTab("aprobacionRRHH")}
          >
            Aprobación RRHH
          </button>
        )}
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "resumen" && (
        <div className="space-y-6">
          {/* Tarjetas de estadísticas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="card bg-gradient-to-br from-green-900 to-green-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') ? 'Total Vacaciones' : 'Mis Vacaciones'}
                  </p>
                  <p className="text-2xl font-bold text-white">{solicitudes.length}</p>
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
                  <p className="text-2xl font-bold text-white">{solicitudes.filter(s => s.estado === 'pendiente').length}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Aprobadas</p>
                  <p className="text-2xl font-bold text-white">{solicitudes.filter(s => s.estado === 'aprobado').length}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-900 to-red-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rechazadas</p>
                  <p className="text-2xl font-bold text-white">{solicitudes.filter(s => s.estado === 'rechazado').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Días Totales Solicitados</p>
                  <p className="text-3xl font-bold text-cyan-500">
                    {solicitudes.reduce((total, s) => total + (s.dias_disfrute || 0), 0)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Promedio por Solicitud</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {solicitudes.length > 0 
                      ? (solicitudes.reduce((total, s) => total + (s.dias_disfrute || 0), 0) / solicitudes.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Este Mes</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {solicitudes.filter(s => {
                      const fecha = new Date(s.fecha_solicitud);
                      const ahora = new Date();
                      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Distribución por estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {solicitudes.filter(s => s.estado === 'pendiente').length}
                  </div>
                  <div className="text-sm text-yellow-700">Pendientes</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {solicitudes.filter(s => s.estado === 'en_revision').length}
                  </div>
                  <div className="text-sm text-blue-700">En Revisión</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {solicitudes.filter(s => s.estado === 'aprobado').length}
                  </div>
                  <div className="text-sm text-green-700">Aprobadas</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {solicitudes.filter(s => s.estado === 'rechazado').length}
                  </div>
                  <div className="text-sm text-red-700">Rechazadas</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tendencia Mensual</h2>
              <div className="flex items-end justify-between h-32">
                {(() => {
                  const meses = [];
                  for (let i = 5; i >= 0; i--) {
                    const fecha = new Date();
                    fecha.setMonth(fecha.getMonth() - i);
                    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
                    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
                    
                    const cantidad = solicitudes.filter(s => {
                      const fechaSolicitud = new Date(s.fecha_solicitud);
                      return fechaSolicitud >= inicioMes && fechaSolicitud <= finMes;
                    }).length;
                    
                    meses.push({
                      mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                      cantidad
                    });
                  }
                  
                  const maxCantidad = Math.max(...meses.map(m => m.cantidad));
                  
                  return meses.map((mes, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-green-600 rounded-t w-8 mb-2"
                        style={{ height: `${Math.max(10, (mes.cantidad / Math.max(maxCantidad, 1)) * 100)}px` }}
                      ></div>
                      <span className="text-xs text-gray-600">{mes.mes}</span>
                      <span className="text-xs font-medium">{mes.cantidad}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Top solicitudes recientes */}
          {solicitudes.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Solicitudes Recientes</h2>
              <div className="space-y-3">
                {solicitudes
                  .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
                  .slice(0, 5)
                  .map((solicitud, index) => (
                    <div key={solicitud.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{solicitud.empleado?.nombres}</span>
                          <div className="text-sm text-gray-500">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{solicitud.dias_disfrute} días</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                          {getEstadoIcon(solicitud.estado)}
                          {solicitud.estado?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Resumen de acciones pendientes para jefes */}
          {user?.roles?.some((rol) => rol.nombre === 'JEFE AREA') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {enRevision.length > 0 && (
                <div className="card bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800">Pendientes de Revisión</h3>
                  </div>
                  <p className="text-yellow-700 mb-3">
                    Tienes <span className="font-bold">{enRevision.length}</span> solicitudes pendientes de tu aprobación.
                  </p>
                  <button
                    onClick={() => setActiveTab("vistoBuenoJefe")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Revisar Solicitudes
                  </button>
                </div>
              )}

              {enRevisionAdministracion.length > 0 && (
                <div className="card bg-blue-50 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">Pendientes de Administración</h3>
                  </div>
                  <p className="text-blue-700 mb-3">
                    Tienes <span className="font-bold">{enRevisionAdministracion.length}</span> solicitudes pendientes de administración.
                  </p>
                  <button
                    onClick={() => setActiveTab("vistoBuenoAdministracion")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Revisar Solicitudes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "listado" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                          {getEstadoIcon(solicitud.estado)}
                          {solicitud.estado?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vistoBuenoJefe" && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  👔 Visto Bueno Jefe de Área
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Aquí puedes revisar y aprobar las solicitudes de vacaciones de tu equipo.</p>
                </div>
              </div>
            </div>
          </div>

          {enRevision.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enRevision.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                            {getEstadoIcon(solicitud.estado)}
                            {solicitud.estado?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModal(solicitud, "aprobar", "jefe")}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => abrirModal(solicitud, "rechazar", "jefe")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes en revisión</h3>
              <p className="mt-1 text-sm text-gray-500">No tienes solicitudes pendientes de revisión.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "vistoBuenoAdministracion" && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  👔 Visto Bueno Administración
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Aquí puedes revisar y aprobar las solicitudes de vacaciones de tu departamento.</p>
                </div>
              </div>
            </div>
          </div>

          {enRevisionAdministracion.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enRevisionAdministracion.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                            {getEstadoIcon(solicitud.estado)}
                            {solicitud.estado?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModal(solicitud, "aprobar", "administrador")}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => abrirModal(solicitud, "rechazar", "administrador")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes en revisión</h3>
              <p className="mt-1 text-sm text-gray-500">No hay solicitudes pendientes de revisión administrativa.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "vistoBuenoRRHH" && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  👔 Visto Bueno RRHH
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Aquí puedes revisar y aprobar las solicitudes de vacaciones de tu departamento de RRHH.</p>
                </div>
              </div>
            </div>
          </div>

          {enRevisionRRHH.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enRevisionRRHH.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                            {getEstadoIcon(solicitud.estado)}
                            {solicitud.estado?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModal(solicitud, "aprobar", "rrhh")}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => abrirModal(solicitud, "rechazar", "rrhh")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes en revisión</h3>
              <p className="mt-1 text-sm text-gray-500">No hay solicitudes pendientes de revisión RRHH.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "revisionAdministrador" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  🏢 Revisión Administrador
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Aquí puedes revisar y aprobar las solicitudes que ya tienen visto bueno del jefe de área.</p>
                </div>
              </div>
            </div>
          </div>

          {enRevision.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reemplazo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enRevision.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.reemplazo_nombre || 'No asignado'}</div>
                          <div className="text-sm text-gray-500">{solicitud.reemplazo_identificacion}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                            {getEstadoIcon(solicitud.estado)}
                            {solicitud.estado?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModal(solicitud, "aprobar", "administrador")}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => abrirModal(solicitud, "rechazar", "administrador")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Eye className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes en revisión</h3>
              <p className="mt-1 text-sm text-gray-500">No hay solicitudes pendientes de revisión administrativa.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "aprobacionRRHH" && (
        <div className="space-y-6">
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-800">
                  👥 Aprobación RRHH
                </h3>
                <div className="mt-2 text-sm text-purple-700">
                  <p>Aquí puedes realizar la aprobación final de las solicitudes de vacaciones.</p>
                </div>
              </div>
            </div>
          </div>

          {enRevision.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reemplazo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enRevision.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{solicitud.empleado?.nombres}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(solicitud.periodo_disfrute_desde).toLocaleDateString()} - {new Date(solicitud.periodo_disfrute_hasta).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.dias_disfrute} días</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{solicitud.reemplazo_nombre || 'No asignado'}</div>
                          <div className="text-sm text-gray-500">{solicitud.reemplazo_identificacion}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoClass(solicitud.estado)}`}>
                            {getEstadoIcon(solicitud.estado)}
                            {solicitud.estado?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => abrirModal(solicitud, "aprobar", "rrhh")}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => abrirModal(solicitud, "rechazar", "rrhh")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes para aprobación final</h3>
              <p className="mt-1 text-sm text-gray-500">No hay solicitudes pendientes de aprobación por RRHH.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Jefe */}
      {modalJefe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tipoAccion === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Solicitud de: <strong>{solicitudActual?.empleado?.nombres}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Días: {solicitudActual?.dias_disfrute}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoAccion === "aprobar" ? "Observaciones (opcional)" : "Motivo del rechazo"}
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={tipoAccion === "aprobar" ? "Observaciones adicionales..." : "Motivo del rechazo..."}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalJefe(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={loadingAprobacion}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => manejarAccion('jefe')}
                  disabled={loadingAprobacion}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center ${
                    tipoAccion === "aprobar" 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-red-500 hover:bg-red-600"
                  } ${loadingAprobacion ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingAprobacion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    tipoAccion === "aprobar" ? "Aprobar" : "Rechazar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Administrador */}
      {modalAdministrador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tipoAccion === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Solicitud de: <strong>{solicitudActual?.empleado?.nombres}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Días: {solicitudActual?.dias_disfrute}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoAccion === "aprobar" ? "Observaciones (opcional)" : "Motivo del rechazo"}
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={tipoAccion === "aprobar" ? "Observaciones adicionales..." : "Motivo del rechazo..."}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalAdministrador(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={loadingAprobacion}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => manejarAccion('administrador')}
                  disabled={loadingAprobacion}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center ${
                    tipoAccion === "aprobar" 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-red-500 hover:bg-red-600"
                  } ${loadingAprobacion ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingAprobacion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    tipoAccion === "aprobar" ? "Aprobar" : "Rechazar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para RRHH */}
      {modalRRHH && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {tipoAccion === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Solicitud de: <strong>{solicitudActual?.empleado?.nombres}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Días: {solicitudActual?.dias_disfrute}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipoAccion === "aprobar" ? "Observaciones (opcional)" : "Motivo del rechazo"}
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={tipoAccion === "aprobar" ? "Observaciones adicionales..." : "Motivo del rechazo..."}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalRRHH(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={loadingAprobacion}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => manejarAccion('rrhh')}
                  disabled={loadingAprobacion}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center ${
                    tipoAccion === "aprobar" 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-red-500 hover:bg-red-600"
                  } ${loadingAprobacion ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingAprobacion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    tipoAccion === "aprobar" ? "Aprobar" : "Rechazar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva solicitud de vacaciones */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Crear Nueva Solicitud de Vacaciones
              </h3>
              
              <form onSubmit={crearSolicitudVacaciones} className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad/Departamento *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={nuevaVacacion.ciudad_departamento}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Solicitud *
                    </label>
                    <input
                      type="date"
                      required
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={nuevaVacacion.fecha_solicitud}
                    />
                  </div>
                </div>

                {/* Información del colaborador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres del Colaborador *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={nuevaVacacion.nombres_colaborador}
                      placeholder="Nombres completos"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula del Colaborador *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={nuevaVacacion.cedula_colaborador}
                      placeholder="Número de documento"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo del Colaborador
                    </label>
                    <input
                      type="text"
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      value={nuevaVacacion.cargo_colaborador}
                      placeholder="Cargo actual"
                    />
                  </div>
                </div>

                {/* Período cumplido */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Período Cumplido</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desde *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.periodo_cumplido_desde}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, periodo_cumplido_desde: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hasta *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.periodo_cumplido_hasta}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, periodo_cumplido_hasta: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Días Cumplidos *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.dias_cumplidos}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, dias_cumplidos: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Período de disfrute */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Período de Disfrute</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desde *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.periodo_disfrute_desde}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, periodo_disfrute_desde: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hasta *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.periodo_disfrute_hasta}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, periodo_disfrute_hasta: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Días de Disfrute *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.dias_disfrute}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, dias_disfrute: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Información del solicitante y jefe */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Información del Solicitante y Jefe</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Solicitante *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.solicitante_nombre}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, solicitante_nombre: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo del Solicitante *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={nuevaVacacion.solicitante_cargo}
                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, solicitante_cargo: e.target.value})}
                        placeholder="Cargo actual"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Jefe *
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        value={nuevaVacacion.jefe_nombre}
                        placeholder="Nombre del jefe directo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo del Jefe *
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        value={nuevaVacacion.jefe_cargo}
                        placeholder="Cargo del jefe directo"
                      />
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      value={nuevaVacacion.observaciones}
                      onChange={(e) => setNuevaVacacion({...nuevaVacacion, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>

                {/* Archivo PDF */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Documento de Soporte</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjuntar PDF (Opcional)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {nuevaVacacion.archivo_pdf && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{nuevaVacacion.archivo_pdf.name}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Solo archivos PDF. Máximo 5MB.
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setModalCrear(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={loadingAprobacion}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAprobacion}
                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center ${
                      loadingAprobacion ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loadingAprobacion ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Solicitud'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacacionesPage; 