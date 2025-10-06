import { useState, useEffect } from 'react';

interface PasoDiagnostico {
  id: number;
  categoria: string;
  mensaje: string;
  estado: 'ejecutando' | 'completado' | 'error';
  timestamp: string;
}

interface EstadoDiagnostico {
  ejecutando: boolean;
  pasos: PasoDiagnostico[];
  resultado: 'exitoso' | 'error' | null;
  error: string | null;
  timestamp: string;
  totalPasos: number;
}

export const useDiagnosticoCorreos = () => {
  const [estado, setEstado] = useState<EstadoDiagnostico | null>(null);
  const [loading, setLoading] = useState(false);

  const obtenerEstado = async () => {
    try {
      console.log('🔍 Consultando estado del diagnóstico de correos...');
      const response = await fetch('/api/diagnostico/estado');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Estado del diagnóstico obtenido:', data);
      setEstado(data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo estado del diagnóstico:', error);
      return null;
    }
  };

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    try {
      console.log('🚀 Ejecutando diagnóstico de correos...');
      const response = await fetch('/api/diagnostico/ejecutar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Diagnóstico iniciado:', data);
      setEstado(data);
      return data;
    } catch (error) {
      console.error('❌ Error ejecutando diagnóstico:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetearDiagnostico = async () => {
    try {
      console.log('🔄 Reseteando diagnóstico de correos...');
      const response = await fetch('/api/diagnostico/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Diagnóstico reseteado:', data);
      setEstado(data);
      return data;
    } catch (error) {
      console.error('❌ Error reseteando diagnóstico:', error);
      return null;
    }
  };

  // Auto-actualización cada 1.5 segundos si está ejecutando (más fluido)
  useEffect(() => {
    if (estado?.ejecutando) {
      console.log('⏳ Diagnóstico en ejecución, iniciando auto-actualización...');
      const interval = setInterval(() => {
        obtenerEstado();
      }, 1500); // Reducido a 1.5 segundos para mayor fluidez
      
      return () => {
        console.log('🛑 Deteniendo auto-actualización del diagnóstico');
        clearInterval(interval);
      };
    }
  }, [estado?.ejecutando]);

  // Cargar estado inicial al montar el componente
  useEffect(() => {
    obtenerEstado();
  }, []);

  return {
    estado,
    loading,
    obtenerEstado,
    ejecutarDiagnostico,
    resetearDiagnostico
  };
};
