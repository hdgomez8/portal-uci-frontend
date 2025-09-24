// Utilidad para debuggear la funcionalidad de visto bueno
export const debugVistoBueno = async (documento: string | number) => {
  try {
    console.log('🔍 DEBUG VISTO BUENO - FRONTEND');
    console.log('================================');
    console.log('Documento a buscar:', documento);
    console.log('Tipo de documento:', typeof documento);
    
    // Hacer la petición directamente
    const response = await fetch(`http://localhost:5555/api/cambio-turno/pendientes-visto-bueno?documento=${encodeURIComponent(documento.toString())}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Status de la respuesta:', response.status);
    console.log('Headers de la respuesta:', response.headers);
    
    const data = await response.json();
    console.log('Datos de la respuesta:', data);
    
    return data;
  } catch (error) {
    console.error('Error en debugVistoBueno:', error);
    throw error;
  }
};

// Función para probar con diferentes formatos de documento
export const probarDiferentesDocumentos = async (documento: string | number) => {
  console.log('🧪 PROBANDO DIFERENTES FORMATOS DE DOCUMENTO');
  console.log('=============================================');
  
  const formatos = [
    documento,
    documento.toString(),
    documento.toString().trim(),
    documento.toString().padStart(8, '0'),
    documento.toString().replace(/\s/g, '')
  ];
  
  for (const formato of formatos) {
    console.log(`\nProbando formato: "${formato}" (tipo: ${typeof formato})`);
    try {
      const resultado = await debugVistoBueno(formato);
      console.log(`✅ Resultado: ${resultado.length || 0} solicitudes encontradas`);
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}; 