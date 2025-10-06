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
  const [mensaje, setMensaje] = useState<string>('');
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error' | 'info' | 'warning'>('info');

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
    setMensaje('🚀 Iniciando diagnóstico de correos...');
    setTipoMensaje('info');
    
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
      console.log('🔍 Estado del diagnóstico:', data.status);
      console.log('🔍 Resultado:', data.resultado);
      console.log('🔍 Mensaje:', data.message);
      console.log('🔍 Timestamp:', data.timestamp);
      
      // Debugging adicional para Gmail API
      console.log('🔍 ===== DEBUGGING COMPLETO DEL DIAGNÓSTICO =====');
      console.log('🔍 Estructura completa de la respuesta:', JSON.stringify(data, null, 2));
      
      if (data.details) {
        console.log('🔍 Detalles del diagnóstico:', data.details);
      }
      if (data.errors) {
        console.log('❌ Errores específicos:', data.errors);
      }
      if (data.warnings) {
        console.log('⚠️ Advertencias específicas:', data.warnings);
      }
      if (data.gmailStatus) {
        console.log('📧 Estado de Gmail API:', data.gmailStatus);
      }
      if (data.steps) {
        console.log('📋 Pasos del diagnóstico:', data.steps);
      }
      if (data.problems) {
        console.log('🚨 Problemas identificados:', data.problems);
      }
      if (data.suggestions) {
        console.log('💡 Sugerencias:', data.suggestions);
      }
      
      // Mostrar todas las propiedades disponibles
      console.log('🔍 Propiedades disponibles en la respuesta:', Object.keys(data));
      console.log('🔍 ===== FIN DEBUGGING COMPLETO =====');
      
      // Mostrar feedback visual basado en la respuesta
      if (data.status === 'success') {
        setMensaje('✅ Correo de prueba enviado exitosamente a hdgomez0@gmail.com');
        setTipoMensaje('success');
      } else if (data.status === 'error') {
        setMensaje(`❌ Error enviando correo: ${data.message || 'Error desconocido'}`);
        setTipoMensaje('error');
      } else if (data.status === 'warning') {
        const warningMessage = data.message || 'Revisa la configuración del sistema';
        let detailedMessage = `⚠️ Gmail API configurado pero con advertencias: ${warningMessage}`;
        
        // Agregar detalles específicos si están disponibles
        if (data.warnings && Array.isArray(data.warnings)) {
          detailedMessage += `\n\nAdvertencias específicas:\n${data.warnings.map(w => `• ${w}`).join('\n')}`;
        }
        if (data.problems && Array.isArray(data.problems)) {
          detailedMessage += `\n\nProblemas identificados:\n${data.problems.map(p => `• ${p}`).join('\n')}`;
        }
        if (data.suggestions && Array.isArray(data.suggestions)) {
          detailedMessage += `\n\nSugerencias:\n${data.suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        
        setMensaje(detailedMessage);
        setTipoMensaje('warning');
      } else {
        setMensaje('📧 Procesando envío de correo de prueba...');
        setTipoMensaje('info');
      }
      
      setEstado(data);
      return data;
    } catch (error) {
      console.error('❌ Error ejecutando diagnóstico:', error);
      setMensaje(`❌ Error de conexión: ${error.message}`);
      setTipoMensaje('error');
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
    mensaje,
    tipoMensaje,
    obtenerEstado,
    ejecutarDiagnostico,
    resetearDiagnostico
  };
};
