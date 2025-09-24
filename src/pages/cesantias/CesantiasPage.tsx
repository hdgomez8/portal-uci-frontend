import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import { cesantiasService, CesantiasResponse } from '../../services/apiCesantias';
import { CheckCircle, XCircle, Clock, Eye, FileText, Plus, Download, AlertCircle, Briefcase, User as UserIcon } from 'lucide-react';
import { exportSolicitudesToExcel } from '../../utils/excelExport';

const CesantiasPage = () => {
  const user = JSON.parse(localStorage.getItem("usuario") || "null");
  const [solicitudes, setSolicitudes] = useState<CesantiasResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAprobacion, setLoadingAprobacion] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<CesantiasResponse | null>(null);
  const [activeTab, setActiveTab] = useState('resumen');
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

  // Función para obtener la fecha local correcta
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Estados del formulario
  const [formData, setFormData] = useState({
    empleado_id: user?.empleado?.id || user?.id,
    correo_solicitante: user?.email || '',
    nombre_colaborador: user?.nombres || user?.empleado?.nombres || '',
    tipo_identificacion: user?.empleado?.tipo_documento || user?.tipo_documento || '',
    numero_identificacion: user?.empleado?.documento || user?.documento || '',
    fecha_solicitud: getCurrentDate(),
    tipo_retiro: 'carta_banco' as 'carta_banco' | 'consignacion_cuenta',
    entidad_bancaria: '',
    tipo_cuenta: '',
    numero_cuenta: '',
    solicitud_cesantias_pdf: '',
    copia_cedula_solicitante: '',
    copia_cedula_conyuge: '',
    predial_certificado: '',
    fotos_reforma: '', // String en lugar de array
    cotizacion_materiales: '',
    promesa_compraventa: '',
    cedula_vendedor: '',
    monto_solicitado: 0
  });

  // Estados para archivos
  const [archivos, setArchivos] = useState<{ [key: string]: File[] }>({});

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const solicitudesUsuario = solicitudes.filter(s => s.empleado_id === (user?.empleado?.id || user?.id));
    
    return {
      totalCesantias: solicitudesUsuario.length,
      cesantiasPendientes: solicitudesUsuario.filter(s => s.estado === 'pendiente').length,
      cesantiasAprobadas: solicitudesUsuario.filter(s => s.estado === 'aprobado').length,
      cesantiasRechazadas: solicitudesUsuario.filter(s => s.estado === 'rechazado').length,
      cesantiasEnRevision: solicitudesUsuario.filter(s => s.estado === 'en_revision').length,
      cesantiasEsteMes: solicitudesUsuario.filter(s => {
        const fecha = new Date(s.fecha_solicitud);
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      }).length,
      montoTotalSolicitado: solicitudesUsuario.reduce((total, s) => total + (s.monto_solicitado || 0), 0),
      montoPromedioPorSolicitud: solicitudesUsuario.length > 0 
        ? Math.round(solicitudesUsuario.reduce((total, s) => total + (s.monto_solicitado || 0), 0) / solicitudesUsuario.length)
        : 0,
      solicitudesCartaBanco: solicitudesUsuario.filter(s => s.tipo_retiro === 'carta_banco').length,
      solicitudesConsignacion: solicitudesUsuario.filter(s => s.tipo_retiro === 'consignacion_cuenta').length
    };
  };

  const estadisticas = calcularEstadisticas();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await cesantiasService.listar();
      setSolicitudes(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setError("Error al cargar solicitudes de cesantías");
      toast.error("Error al cargar solicitudes de cesantías");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre_colaborador || !formData.fecha_solicitud || !formData.tipo_retiro) {
      setError("Los campos obligatorios deben estar completos");
      toast.error("Los campos obligatorios deben estar completos");
      return;
    }

    // Validar datos bancarios si es consignación
    if (formData.tipo_retiro === 'consignacion_cuenta') {
      if (!formData.entidad_bancaria || !formData.tipo_cuenta || !formData.numero_cuenta) {
        setError("Para consignación en cuenta bancaria, todos los datos bancarios son obligatorios");
        toast.error("Para consignación en cuenta bancaria, todos los datos bancarios son obligatorios");
        return;
      }
    }

    try {
      const dataToSend = { ...formData };
      
      // Procesar archivos
      if (archivos.solicitud_cesantias_pdf && archivos.solicitud_cesantias_pdf.length > 0) {
        dataToSend.solicitud_cesantias_pdf = archivos.solicitud_cesantias_pdf[0].name;
      }
      
      if (archivos.copias_cedulas && archivos.copias_cedulas.length > 0) {
        dataToSend.copia_cedula_solicitante = archivos.copias_cedulas[0].name;
        if (archivos.copias_cedulas.length > 1) {
          dataToSend.copia_cedula_conyuge = archivos.copias_cedulas[1].name;
        }
      }
      
      if (archivos.predial_certificado && archivos.predial_certificado.length > 0) {
        dataToSend.predial_certificado = archivos.predial_certificado[0].name;
      }
      
      if (archivos.cotizacion_materiales && archivos.cotizacion_materiales.length > 0) {
        dataToSend.cotizacion_materiales = archivos.cotizacion_materiales[0].name;
      }
      
      if (archivos.promesa_compraventa && archivos.promesa_compraventa.length > 0) {
        dataToSend.promesa_compraventa = archivos.promesa_compraventa[0].name;
      }
      
      if (archivos.cedula_vendedor && archivos.cedula_vendedor.length > 0) {
        dataToSend.cedula_vendedor = archivos.cedula_vendedor[0].name;
      }
      
      // Procesar archivos múltiples
      if (archivos.fotos_reforma && archivos.fotos_reforma.length > 0) {
        (dataToSend as any).fotos_reforma = JSON.stringify(archivos.fotos_reforma.map(file => file.name));
      } else {
        (dataToSend as any).fotos_reforma = null;
      }

      if (selectedSolicitud) {
        await cesantiasService.actualizar(selectedSolicitud.id, dataToSend);
        setSuccessMessage("✔️ Solicitud actualizada correctamente");
        toast.success("Solicitud actualizada correctamente");
      } else {
        await cesantiasService.crear(dataToSend);
        setSuccessMessage("✔️ Solicitud creada correctamente");
        toast.success("Solicitud creada correctamente");
      }

      setModalAbierto(false);
      cargarSolicitudes();
      resetForm();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
      setError("Error al guardar la solicitud");
      toast.error("Error al guardar la solicitud");
    }
  };

  const resetForm = () => {
    setFormData({
      empleado_id: user?.empleado?.id || user?.id,
      correo_solicitante: user?.email || '',
      nombre_colaborador: user?.nombres || user?.empleado?.nombres || '',
      tipo_identificacion: user?.empleado?.tipo_documento || user?.tipo_documento || '',
      numero_identificacion: user?.empleado?.documento || user?.documento || '',
      fecha_solicitud: getCurrentDate(),
      tipo_retiro: 'carta_banco',
      entidad_bancaria: '',
      tipo_cuenta: '',
      numero_cuenta: '',
      solicitud_cesantias_pdf: '',
      copia_cedula_solicitante: '',
      copia_cedula_conyuge: '',
      predial_certificado: '',
      fotos_reforma: '',
      cotizacion_materiales: '',
      promesa_compraventa: '',
      cedula_vendedor: '',
      monto_solicitado: 0
    });
    setArchivos({});
    setSelectedSolicitud(null);
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    if (files) {
      setArchivos(prev => ({
        ...prev,
        [field]: Array.from(files)
      }));
    }
  };

  const handleAprobar = async (id: number) => {
    try {
      setLoadingAprobacion(true);
      const monto = prompt('Ingrese el monto aprobado:');
      if (monto === null) {
        setLoadingAprobacion(false);
        return;
      }

      const montoAprobado = parseFloat(monto);
      if (isNaN(montoAprobado)) {
        setError("Monto inválido");
        toast.error("Monto inválido");
        setLoadingAprobacion(false);
        return;
      }

      await cesantiasService.aprobar(id, {
        monto_aprobado: montoAprobado,
        revisado_por: user?.empleado?.id || user?.id
      });
      setSuccessMessage("✔️ Solicitud aprobada correctamente");
      toast.success("Solicitud aprobada");
      cargarSolicitudes();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error('Error al aprobar:', error);
      setError("Error al aprobar la solicitud");
      toast.error("Error al aprobar la solicitud");
    } finally {
      setLoadingAprobacion(false);
    }
  };

  const handleRechazar = async (id: number) => {
    try {
      setLoadingAprobacion(true);
      const motivo = prompt('Ingrese el motivo del rechazo:');
      if (!motivo) {
        setError("El motivo del rechazo es obligatorio");
        toast.error("El motivo del rechazo es obligatorio");
        setLoadingAprobacion(false);
        return;
      }

      await cesantiasService.rechazar(id, {
        motivo_rechazo: motivo,
        revisado_por: user?.empleado?.id || user?.id
      });
      setSuccessMessage("✔️ Solicitud rechazada correctamente");
      toast.success("Solicitud rechazada");
      cargarSolicitudes();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error('Error al rechazar:', error);
      setError("Error al rechazar la solicitud");
      toast.error("Error al rechazar la solicitud");
    } finally {
      setLoadingAprobacion(false);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircle className="text-green-500 w-5 h-5 inline" />;
      case 'rechazado':
        return <XCircle className="text-red-500 w-5 h-5 inline" />;
      case 'en_revision':
        return <Eye className="text-blue-500 w-5 h-5 inline" />;
      case 'pendiente':
        return <Clock className="text-yellow-500 w-5 h-5 inline" />;
      default:
        return null;
    }
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'rechazado':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'en_revision':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    if (activeTab === 'misSolicitudes') {
      return solicitud.empleado_id === (user?.empleado?.id || user?.id);
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

  const exportarCesantiasAExcel = () => {
    try {
      // Preparar datos para exportación
      const datosParaExportar = solicitudesFiltradasYOrdenadas.map(cesantia => ({
        empleado: cesantia.nombre_colaborador || 'Sin nombre',
        documento: cesantia.numero_identificacion || '',
        fecha_solicitud: cesantia.fecha_solicitud ? new Date(cesantia.fecha_solicitud).toLocaleDateString() : '',
        tipo_retiro: cesantia.tipo_retiro === 'carta_banco' ? 'Carta Banco' : 'Consignación Cuenta',
        entidad_bancaria: cesantia.entidad_bancaria || '',
        tipo_cuenta: cesantia.tipo_cuenta || '',
        numero_cuenta: cesantia.numero_cuenta || '',
        monto_solicitado: cesantia.monto_solicitado || 0,
        estado: cesantia.estado?.toUpperCase() || '',
        observaciones: cesantia.observaciones || ''
      }));

      const success = exportSolicitudesToExcel(datosParaExportar, 'cesantias');
      
      if (success) {
        setSuccessMessage('✅ Cesantías exportadas a Excel exitosamente');
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError('❌ Error al exportar cesantías a Excel');
      }
    } catch (error) {
      console.error('Error exportando cesantías:', error);
      setError('❌ Error al exportar cesantías a Excel');
    }
  };

  // Obtener solicitudes filtradas, ordenadas y paginadas
  const solicitudesFiltradasYOrdenadas = solicitudesFiltradas.filter(solicitud => {
    if (filtros.estado && solicitud.estado !== filtros.estado) return false;
    if (filtros.fechaDesde && solicitud.fecha_solicitud < filtros.fechaDesde) return false;
    if (filtros.fechaHasta && solicitud.fecha_solicitud > filtros.fechaHasta) return false;
    if (filtros.empleado && !solicitud.nombre_colaborador?.toLowerCase().includes(filtros.empleado.toLowerCase())) return false;
    return true;
  });

  const totalPaginas = Math.ceil(solicitudesFiltradasYOrdenadas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const solicitudesPaginadas = solicitudesFiltradasYOrdenadas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  if (loading) {
    return <Loader text="Cargando solicitudes de cesantías..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Cesantías</h1>

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
          Lista de Cesantías
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
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mis Solicitudes</p>
                  <p className="text-2xl font-bold text-white">{estadisticas.totalCesantias}</p>
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
                  <p className="text-2xl font-bold text-white">{estadisticas.cesantiasPendientes}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-900 to-green-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Aprobadas</p>
                  <p className="text-2xl font-bold text-white">{estadisticas.cesantiasAprobadas}</p>
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
                  <p className="text-2xl font-bold text-white">{estadisticas.cesantiasRechazadas}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monto Total Solicitado</h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">${estadisticas.montoTotalSolicitado.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total de solicitudes</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Promedio por Solicitud</h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">${estadisticas.montoPromedioPorSolicitud.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Monto promedio</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Este Mes</h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{estadisticas.cesantiasEsteMes}</p>
                <p className="text-sm text-gray-500">Solicitudes</p>
              </div>
            </div>
          </div>

          {/* Gráfico de tipos de retiro */}
          {estadisticas.totalCesantias > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{estadisticas.cesantiasPendientes}</div>
                    <div className="text-sm text-yellow-700">Pendientes</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.cesantiasEnRevision}</div>
                    <div className="text-sm text-blue-700">En Revisión</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.cesantiasAprobadas}</div>
                    <div className="text-sm text-green-700">Aprobadas</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.cesantiasRechazadas}</div>
                    <div className="text-sm text-red-700">Rechazadas</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Tipo de Retiro</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.solicitudesCartaBanco}</div>
                    <div className="text-sm text-blue-700">Carta Banco</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.solicitudesConsignacion}</div>
                    <div className="text-sm text-green-700">Consignación</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "listado" ? (
        <>
          {/* Botón para crear nueva solicitud */}
          <button
            onClick={() => {
              setSelectedSolicitud(null);
              setModalAbierto(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            Crear Solicitud de Cesantías
          </button>

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
                  onClick={exportarCesantiasAExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  title="Exportar cesantías a Excel"
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Solicitud
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Retiro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        {solicitud.nombre_colaborador?.toUpperCase() || "SIN NOMBRE"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {solicitud.fecha_solicitud ? solicitud.fecha_solicitud.split('T')[0].split('-').reverse().join('/') : "SIN FECHA"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          solicitud.tipo_retiro === 'carta_banco' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          {solicitud.tipo_retiro === 'carta_banco' ? 'Carta Banco' : 'Consignación'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">${(solicitud.monto_solicitado || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(solicitud.estado)}`}>
                          {getEstadoIcon(solicitud.estado)} {solicitud.estado?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSolicitud(solicitud);
                            setModalAbierto(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Ver
                        </button>
                        {solicitud.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleAprobar(solicitud.id)}
                              disabled={loadingAprobacion}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                                loadingAprobacion 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              {loadingAprobacion ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Procesando...
                                </>
                              ) : (
                                'Aprobar'
                              )}
                            </button>
                            <button
                              onClick={() => handleRechazar(solicitud.id)}
                              disabled={loadingAprobacion}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                                loadingAprobacion 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              {loadingAprobacion ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Procesando...
                                </>
                              ) : (
                                'Rechazar'
                              )}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">No hay solicitudes de cesantías registradas.</td>
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
        <p className="text-center text-[#2E7D32] dark:text-[#66BB6A]">Aquí se mostrará el resumen de cesantías.</p>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalAbierto(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedSolicitud ? "Editar Solicitud de Cesantías" : "Nueva Solicitud de Cesantías"}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {selectedSolicitud ? "Modifica los datos de tu solicitud" : "Completa todos los campos requeridos"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalAbierto(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Sección 1: Información Personal */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Información Personal</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del colaborador *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_colaborador}
                      readOnly
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      value={formData.correo_solicitante}
                      readOnly
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de identificación
                    </label>
                    <input
                      type="text"
                      value={formData.tipo_identificacion}
                      readOnly
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de identificación
                    </label>
                    <input
                      type="text"
                      value={formData.numero_identificacion}
                      readOnly
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Detalles de la Solicitud */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Detalles de la Solicitud</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de solicitud *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_solicitud}
                      onChange={(e) => setFormData({...formData, fecha_solicitud: e.target.value})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monto solicitado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.monto_solicitado}
                        onChange={(e) => setFormData({...formData, monto_solicitado: parseFloat(e.target.value) || 0})}
                        className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de retiro */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tipo de retiro *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="carta_banco"
                        checked={formData.tipo_retiro === 'carta_banco'}
                        onChange={(e) => setFormData({...formData, tipo_retiro: e.target.value as 'carta_banco' | 'consignacion_cuenta'})}
                        className="mr-3 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">Carta al banco</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Retiro mediante carta bancaria</div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="consignacion_cuenta"
                        checked={formData.tipo_retiro === 'consignacion_cuenta'}
                        onChange={(e) => setFormData({...formData, tipo_retiro: e.target.value as 'carta_banco' | 'consignacion_cuenta'})}
                        className="mr-3 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">Consignación en cuenta</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Depósito directo a cuenta bancaria</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Datos bancarios (condicional) */}
                {formData.tipo_retiro === 'consignacion_cuenta' && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-4">Información Bancaria</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Entidad bancaria *
                        </label>
                        <input
                          type="text"
                          value={formData.entidad_bancaria}
                          onChange={(e) => setFormData({...formData, entidad_bancaria: e.target.value})}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de cuenta *
                        </label>
                        <select
                          value={formData.tipo_cuenta}
                          onChange={(e) => setFormData({...formData, tipo_cuenta: e.target.value})}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600"
                          required
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Ahorros">Ahorros</option>
                          <option value="Corriente">Corriente</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número de cuenta *
                        </label>
                        <input
                          type="text"
                          value={formData.numero_cuenta}
                          onChange={(e) => setFormData({...formData, numero_cuenta: e.target.value})}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 3: Documentos Requeridos */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Documentos Requeridos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documento 1 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      📄 Solicitud de cesantías (PDF) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange('solicitud_cesantias_pdf', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Formato PDF obligatorio</p>
                  </div>

                  {/* Documento 2 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      🆔 Copia de cédulas
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileChange('copias_cedulas', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Solicitante y cónyuge</p>
                  </div>

                  {/* Documento 3 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      🏠 Predial o certificado
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('predial_certificado', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Libertad y tradición</p>
                  </div>

                  {/* Documento 4 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      📸 Fotos de la reforma
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileChange('fotos_reforma', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Máximo 5 archivos</p>
                  </div>

                  {/* Documento 5 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      💰 Cotización de materiales
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('cotizacion_materiales', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Materiales y/o mano de obra</p>
                  </div>

                  {/* Documento 6 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      📋 Promesa de compraventa
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('promesa_compraventa', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Documento de promesa</p>
                  </div>

                  {/* Documento 7 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      🆔 Cédula del vendedor
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('cedula_vendedor', e.target.files)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Documento de identidad</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  {selectedSolicitud ? 'Actualizar' : 'Crear'} Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CesantiasPage; 