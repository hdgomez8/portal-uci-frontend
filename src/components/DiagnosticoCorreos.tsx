import React from 'react';
import { useDiagnosticoCorreos } from '../hooks/useDiagnosticoCorreos';

export const DiagnosticoCorreos: React.FC = () => {
  const { estado, loading, ejecutarDiagnostico, resetearDiagnostico } = useDiagnosticoCorreos();

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ejecutando': return 'text-blue-600 bg-blue-100';
      case 'completado': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'SISTEMA': return 'bg-purple-100 text-purple-800';
      case 'CONFIGURACIÓN': return 'bg-blue-100 text-blue-800';
      case 'DNS': return 'bg-yellow-100 text-yellow-800';
      case 'PUERTO': return 'bg-orange-100 text-orange-800';
      case 'SMTP': return 'bg-indigo-100 text-indigo-800';
      case 'EMAIL': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'FINAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ejecutando': return '⏳';
      case 'completado': return '✅';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  const getProgresoPorcentaje = () => {
    if (!estado || !estado.totalPasos || estado.totalPasos === 0) return 0;
    const pasosCompletados = estado.pasos?.length || 0;
    return Math.round((pasosCompletados / estado.totalPasos) * 100);
  };

  const getEstadisticas = () => {
    if (!estado || !estado.pasos) return null;
    
    const pasosCompletados = estado.pasos.filter(p => p.estado === 'completado').length;
    const pasosConError = estado.pasos.filter(p => p.estado === 'error').length;
    const pasosEjecutando = estado.pasos.filter(p => p.estado === 'ejecutando').length;
    
    const categorias = [...new Set(estado.pasos.map(p => p.categoria))];
    
    return {
      pasosCompletados,
      pasosConError,
      pasosEjecutando,
      totalPasos: estado.pasos.length,
      categorias: categorias.length,
      tiempoTranscurrido: estado.timestamp ? 
        Math.round((Date.now() - new Date(estado.timestamp).getTime()) / 1000) : 0
    };
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header con información de Gmail API */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Diagnóstico de Correos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sistema de monitoreo con Gmail API
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={ejecutarDiagnostico}
              disabled={loading || estado?.ejecutando}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Ejecutando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Ejecutar Diagnóstico</span>
                </div>
              )}
            </button>
            
            <button
              onClick={resetearDiagnostico}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <div className="flex items-center space-x-2">
                <span>🔄</span>
                <span>Resetear</span>
              </div>
            </button>
          </div>
        </div>

        {/* Información de Gmail API */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <span className="text-lg">📧</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Gmail API (OAuth 2.0)</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Autenticación segura con Google • Envío confiable • Monitoreo en tiempo real
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-600 dark:text-blue-400">Estado</div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400">✅ Conectado</div>
            </div>
          </div>
        </div>
      </div>

      {estado && (
        <div className="space-y-6">
          {/* Estado General Mejorado */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${estado.ejecutando ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  {estado.ejecutando ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <span className="text-xl">✅</span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {estado.ejecutando ? 'Diagnóstico en Progreso' : 'Diagnóstico Completado'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {estado.ejecutando ? 'Verificando configuración de Gmail API...' : 'Sistema de correos verificado'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getProgresoPorcentaje()}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {estado.pasos?.length || 0} de {estado.totalPasos || 0} pasos
                </div>
              </div>
            </div>

            {/* Barra de Progreso Mejorada */}
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${getProgresoPorcentaje()}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Inicio</span>
                <span>Progreso</span>
                <span>Finalización</span>
              </div>
            </div>
          </div>

          {/* Estadísticas del Diagnóstico */}
          {estado.pasos && estado.pasos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <span>📊</span>
                <span>Estadísticas del Diagnóstico</span>
              </h4>
              
              {(() => {
                const stats = getEstadisticas();
                if (!stats) return null;
                
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600 dark:text-green-400">✅</span>
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Completados</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.pasosCompletados}
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-600 dark:text-red-400">❌</span>
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">Errores</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.pasosConError}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-blue-600 dark:text-blue-400">⏳</span>
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">En Progreso</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.pasosEjecutando}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-purple-600 dark:text-purple-400">📋</span>
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Categorías</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.categorias}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Lista de Pasos Mejorada */}
          {estado.pasos && estado.pasos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>📋</span>
                  <span>Log de Diagnóstico</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Monitoreo en tiempo real del proceso de verificación
                </p>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {estado.pasos.map((paso, index) => (
                    <div 
                      key={paso.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            paso.estado === 'completado' ? 'bg-green-100 dark:bg-green-900' :
                            paso.estado === 'error' ? 'bg-red-100 dark:bg-red-900' :
                            'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            <span className="text-sm">
                              {getEstadoIcon(paso.estado)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(paso.categoria)}`}>
                              {paso.categoria}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(paso.estado)}`}>
                              {paso.estado}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-900 dark:text-white mb-1">
                            {paso.mensaje}
                          </p>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>🕒</span>
                            <span>{new Date(paso.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Display Mejorado */}
          {estado.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-xl">❌</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Error en el Diagnóstico
                  </h4>
                  <p className="text-red-700 dark:text-red-300 mb-3">
                    {estado.error}
                  </p>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <p>💡 <strong>Sugerencias:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Verifica la configuración de Gmail API</li>
                      <li>Revisa las credenciales de OAuth 2.0</li>
                      <li>Comprueba la conectividad de red</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultado Final Mejorado */}
          {estado.resultado && !estado.ejecutando && (
            <div className={`rounded-xl p-6 shadow-lg border ${
              estado.resultado === 'exitoso' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    estado.resultado === 'exitoso' 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    <span className="text-2xl">
                      {estado.resultado === 'exitoso' ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">
                    {estado.resultado === 'exitoso' ? 'Diagnóstico Exitoso' : 'Diagnóstico Falló'}
                  </h4>
                  <p className="mb-4">
                    {estado.resultado === 'exitoso' 
                      ? 'El sistema de correos con Gmail API está funcionando correctamente. Todos los componentes han sido verificados exitosamente.'
                      : 'Se encontraron problemas en el diagnóstico. Revisa los errores mostrados arriba para más detalles.'
                    }
                  </p>
                  
                  {estado.resultado === 'exitoso' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎉 Sistema Verificado</h5>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>✅ Gmail API configurado correctamente</li>
                        <li>✅ OAuth 2.0 autenticación exitosa</li>
                        <li>✅ Envío de correos funcionando</li>
                        <li>✅ Conectividad de red estable</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información de Acceso Mejorada */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <span>🔗</span>
              <span>Enlaces y Recursos</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg">🌐</span>
                  <h5 className="font-medium text-gray-900 dark:text-white">Acceso Web</h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Diagnóstico completo en página web
                </p>
                <a 
                  href="/public/diagnostico.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline"
                >
                  /public/diagnostico.html →
                </a>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg">📧</span>
                  <h5 className="font-medium text-gray-900 dark:text-white">Gmail API</h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  OAuth 2.0 • Envío seguro • Monitoreo
                </p>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✅ Configurado
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado Inicial Mejorado */}
      {!estado && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Diagnóstico de Correos
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Verifica la configuración de Gmail API y el estado del sistema de correos
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">¿Qué verifica el diagnóstico?</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
                <li>• Configuración de Gmail API</li>
                <li>• Autenticación OAuth 2.0</li>
                <li>• Conectividad de red</li>
                <li>• Envío de correos de prueba</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Presiona "Ejecutar Diagnóstico" para comenzar la verificación
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
