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
    if (!estado || estado.totalPasos === 0) return 0;
    return Math.round((estado.pasos.length / estado.totalPasos) * 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          🔍 Diagnóstico de Correos
        </h3>
        <div className="flex gap-2">
          <button
            onClick={ejecutarDiagnostico}
            disabled={loading || estado?.ejecutando}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? '⏳ Ejecutando...' : '🚀 Ejecutar Diagnóstico'}
          </button>
          
          <button
            onClick={resetearDiagnostico}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            🔄 Resetear
          </button>
        </div>
      </div>

      {estado && (
        <div className="space-y-4">
          {/* Estado General */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                Estado: {estado.ejecutando ? '⏳ Ejecutando' : '✅ Completado'}
              </span>
              {estado.ejecutando && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {estado.pasos.length} de {estado.totalPasos} pasos
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgresoPorcentaje()}%` }}
            ></div>
          </div>

          {/* Lista de Pasos */}
          {estado.pasos.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
              {estado.pasos.map((paso) => (
                <div 
                  key={paso.id} 
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-lg">
                    {getEstadoIcon(paso.estado)}
                  </span>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoriaColor(paso.categoria)}`}>
                    {paso.categoria}
                  </span>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(paso.estado)}`}>
                    {paso.estado}
                  </span>
                  
                  <span className="text-sm text-gray-900 dark:text-white flex-1">
                    {paso.mensaje}
                  </span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(paso.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {estado.error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-2">
                <span className="text-lg">❌</span>
                <div>
                  <strong>Error:</strong> {estado.error}
                </div>
              </div>
            </div>
          )}

          {/* Resultado Final */}
          {estado.resultado && !estado.ejecutando && (
            <div className={`p-4 rounded-md border ${
              estado.resultado === 'exitoso' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {estado.resultado === 'exitoso' ? '✅' : '❌'}
                </span>
                <div>
                  <strong>Resultado:</strong> {estado.resultado === 'exitoso' ? 'Diagnóstico completado exitosamente' : 'Diagnóstico falló'}
                </div>
              </div>
            </div>
          )}

          {/* Información de Acceso */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <div className="flex items-center space-x-2">
              <span>🌐</span>
              <span>Acceso web completo: <a href="/public/diagnostico.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/public/diagnostico.html</a></span>
            </div>
          </div>
        </div>
      )}

      {!estado && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p>No hay datos de diagnóstico disponibles</p>
          <p className="text-sm">Presiona "Ejecutar Diagnóstico" para comenzar</p>
        </div>
      )}
    </div>
  );
};
