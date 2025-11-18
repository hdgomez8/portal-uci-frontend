import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  autoWidth?: boolean;
}

/**
 * Exporta datos a un archivo Excel
 * @param data - Array de objetos con los datos a exportar
 * @param columns - Array de columnas con { key: string, header: string }
 * @param options - Opciones de exportación
 */
export const exportToExcel = (
  data: any[],
  columns: { key: string; header: string }[],
  options: ExcelExportOptions = {}
) => {
  try {
    // Preparar los datos para Excel
    const excelData = data.map(row => {
      const excelRow: any = {};
      columns.forEach(column => {
        excelRow[column.header] = row[column.key] || '';
      });
      return excelRow;
    });

    // Crear el workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar opciones por defecto
    const {
      filename = 'export',
      sheetName = 'Datos',
      autoWidth = true
    } = options;

    // Ajustar ancho de columnas automáticamente
    if (autoWidth) {
      const columnWidths = columns.map(column => ({
        wch: Math.max(
          column.header.length,
          ...data.map(row => {
            const value = row[column.key];
            return value ? String(value).length : 0;
          })
        )
      }));
      worksheet['!cols'] = columnWidths;
    }

    // Agregar el worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generar el archivo y descargarlo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Crear URL y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Exporta datos de solicitudes con formato específico
 * @param data - Array de solicitudes
 * @param type - Tipo de solicitud (permisos, vacaciones, etc.)
 */
export const exportSolicitudesToExcel = (data: any[], type: string) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${type}_${timestamp}`;
  
  // Si es tipo 'cambios_turno', usar columnas específicas
  if (type === 'cambios_turno') {
    const columns = [
      { key: 'empleado', header: 'Empleado' },
      { key: 'documento', header: 'Documento' },
      { key: 'cargo', header: 'Cargo' },
      { key: 'fecha_solicitud', header: 'Fecha de Solicitud' },
      { key: 'fecha_turno_cambiar', header: 'Fecha Turno a Realizar' },
      { key: 'horario_cambiar', header: 'Horario a Realizar' },
      { key: 'fecha_turno_reemplazo', header: 'Fecha Turno del Cambio' },
      { key: 'horario_reemplazo', header: 'Horario a Cambiar' },
      { key: 'nombre_reemplazo', header: 'Nombre Reemplazo' },
      { key: 'cedula_reemplazo', header: 'Cédula Reemplazo' },
      { key: 'motivo_cambio', header: 'Motivo del Cambio' },
      { key: 'estado', header: 'Estado' },
      { key: 'observaciones', header: 'Observaciones' }
    ];

    return exportToExcel(data, columns, {
      filename,
      sheetName: 'Cambios de Turno',
      autoWidth: true
    });
  }
  
  // Columnas comunes para otras solicitudes
  const columns = [
    { key: 'empleado', header: 'Empleado' },
    { key: 'documento', header: 'Documento' },
    { key: 'cargo', header: 'Cargo' },
    { key: 'area', header: 'Área' },
    { key: 'fecha_solicitud', header: 'Fecha Solicitud' },
    { key: 'estado', header: 'Estado' },
    { key: 'observaciones', header: 'Observaciones' }
  ];

  return exportToExcel(data, columns, {
    filename,
    sheetName: type.charAt(0).toUpperCase() + type.slice(1),
    autoWidth: true
  });
};

/**
 * Exporta datos de empleados
 * @param data - Array de empleados
 */
export const exportEmpleadosToExcel = (data: any[]) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `empleados_${timestamp}`;
  
  const columns = [
    { key: 'nombres', header: 'Nombres' },
    { key: 'documento', header: 'Documento' },
    { key: 'oficio', header: 'Cargo' },
    { key: 'email', header: 'Email' },
    { key: 'estado_trabajador', header: 'Estado' },
    { key: 'area', header: 'Área' }
  ];

  return exportToExcel(data, columns, {
    filename,
    sheetName: 'Empleados',
    autoWidth: true
  });
};

/**
 * Exporta datos de usuarios
 * @param data - Array de usuarios
 */
export const exportUsuariosToExcel = (data: any[]) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `usuarios_${timestamp}`;
  
  const columns = [
    { key: 'nombres', header: 'Nombres' },
    { key: 'documento', header: 'Documento' },
    { key: 'email', header: 'Email' },
    { key: 'roles', header: 'Roles' },
    { key: 'estado', header: 'Estado' }
  ];

  return exportToExcel(data, columns, {
    filename,
    sheetName: 'Usuarios',
    autoWidth: true
  });
};

/**
 * Exporta datos de departamentos
 * @param data - Array de departamentos
 */
export const exportDepartamentosToExcel = (data: any[]) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `departamentos_${timestamp}`;
  
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'gerente', header: 'Gerente' },
    { key: 'empleados_count', header: 'Número de Empleados' }
  ];

  return exportToExcel(data, columns, {
    filename,
    sheetName: 'Departamentos',
    autoWidth: true
  });
};

/**
 * Exporta datos de áreas
 * @param data - Array de áreas
 */
export const exportAreasToExcel = (data: any[]) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `areas_${timestamp}`;
  
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'departamento', header: 'Departamento' },
    { key: 'jefe', header: 'Jefe' },
    { key: 'empleados_count', header: 'Número de Empleados' }
  ];

  return exportToExcel(data, columns, {
    filename,
    sheetName: 'Áreas',
    autoWidth: true
  });
}; 