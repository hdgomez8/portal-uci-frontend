import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  AlertCircle, 
  User, 
  Edit3,
  X,
  Power,
  PowerOff,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

interface Employee {
  id: number;
  codigo: number;
  nombres: string;
  documento: string;
  email: string;
  departamento: string;
  estado_trabajador: string;
  oficio: string;
  foto_perfil?: string;
}

interface EmployeeFormData {
  id?: number;
  codigo: number;
  clase?: string;
  documento: string;
  tipo_documento: string;
  ciudad_documento: string;
  nombres: string;
  foto_perfil?: string;
  hoja_vida?: string;
  fecha_ingreso: string;
  tipo_contrato: string;
  sucursal: string;
  grupo_pago: string;
  oficio: string;
  depto: string;
  equipo_trabajo: string;
  clase_trabajador: string;
  estado_trabajador: string;
  jornada: string;
  salario_integral: boolean;
  fecha_nacimiento: string;
  ciudad_nacimiento: string;
  sexo: string;
  estado_civil: string;
  email: string;
  direccion: string;
  codigo_postal: string;
  ciudad_residencia: string;
  telefono: string;
  transporta_empresa: boolean;
  personas_a_cargo: number;
  concepto_pago_admon?: string;
  concepto_pago_domingo?: string;
  concepto_pago_festivo?: string;
  concepto_pago_oficio?: string;
  forma_pago: string;
  banco_empresa: string;
  gerencia_electronica?: string;
  tipo_cuenta: string;
  nro_cuenta_banco: string;
  fondo_pension: string;
  fecha_ingreso_fondo_pension?: string;
  fondo_salud: string;
  fecha_ingreso_fondo_salud?: string;
  ccf: string;
  sucursal_pi: string;
  centro_trabajo: string;
  tipo_cotizante: string;
  depto_dane?: string;
  dias_vacaciones?: number;
  forma_pago_prima_vacaciones?: string;
  forma_pago_aguinaldo?: string;
  origen_dias_prima_servicio?: string;
  forma_pago_prima_servicio?: string;
  dias_prima_servicio?: number;
  fondo_cesantias?: string;
  dias_cesantias?: number;
  ingreso_fondo?: boolean;
  fecha_ingreso_fondo?: string;
  sustitucion_patronal?: boolean;
  fecha_sustitucion_patronal?: string;
  dias_perdidos_ley_vieja?: number;
  clase_indemnizacion?: string;
  forma_indemnizacion?: string;
  fecha_expedicion_documento?: string;
  fecha_salida?: string;
  firma?: string;
}

const Employees = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getAll();
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los empleados');
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalize = (str: any) =>
    (str ? String(str) : '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredEmployees = employees.filter(employee => {
    const term = normalize(searchTerm);
    return (
      normalize(employee.nombres).includes(term) ||
      (employee.documento + '').includes(term) ||
      normalize(employee.email).includes(term) ||
      normalize(employee.departamento).includes(term)
    );
  });



  const handleSaveEmployee = async (employeeData: any) => {
    try {
      if (editingEmployee?.id) {
        await employeeService.update(editingEmployee.id.toString(), employeeData);
      } else {
        await employeeService.create(employeeData);
      }
      await fetchEmployees();
      setEditingEmployee(null);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Error al guardar el empleado');
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const newStatus = employee.estado_trabajador === 'Activo' ? 'Inactivo' : 'Activo';
      await employeeService.updateStatus(employee.id.toString(), newStatus);
      
      // Actualizar la lista local sin hacer una nueva petición
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employee.id 
            ? { ...emp, estado_trabajador: newStatus }
            : emp
        )
      );
    } catch (err) {
      console.error('Error toggling employee status:', err);
      setError('Error al cambiar el estado del empleado');
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el empleado "${employee.nombres}" y su usuario asociado? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      console.log('🗑️ Eliminando empleado:', employee.nombres);
      await employeeService.delete(employee.id.toString());
      
      // Actualizar la lista local sin hacer una nueva petición
      setEmployees(prevEmployees => 
        prevEmployees.filter(emp => emp.id !== employee.id)
      );
      
      console.log('✅ Empleado eliminado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al eliminar empleado:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar empleado';
      setError(errorMessage);
    }
  };

  const renderEmployeeList = () => (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, email o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredEmployees.map((employee) => {
          const baseUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/perfiles/`;
          const profileImage = employee.foto_perfil ? `${baseUrl}${employee.foto_perfil}` : null;

          return (
            <div
              key={employee.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer px-3 py-2"
              style={{ minHeight: 'unset' }}
              onClick={() => setEditingEmployee(employee)}
            >
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={employee.nombres}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-medium text-primary">
                      {employee.nombres.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate">{employee.nombres}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{employee.oficio}</p>
                  <p className="text-sm text-gray-400 truncate">{employee.departamento}</p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-xs text-gray-400">#{employee.codigo}</span>
                    <span className={`px-1 py-0.5 text-xs rounded-full
                      ${employee.estado_trabajador === 'Activo'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}
                    >
                      {employee.estado_trabajador}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(employee);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      employee.estado_trabajador === 'Activo'
                        ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                        : 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                    }`}
                    title={employee.estado_trabajador === 'Activo' ? 'Desactivar empleado' : 'Activar empleado'}
                  >
                    {employee.estado_trabajador === 'Activo' ? (
                      <PowerOff className="w-3 h-3" />
                    ) : (
                      <Power className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEmployee(employee);
                    }}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title="Editar empleado"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(employee);
                    }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar empleado y usuario asociado"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Empleados</h1>
          <p className="text-gray-500 mt-1">Total: {employees.length}</p>
        </div>

      </div>



      {/* Contenido de las pestañas */}
      {renderEmployeeList()}

      {/* Modal de edición */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Editar Empleado</h2>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <EmployeeForm 
                employee={editingEmployee} 
                onSave={handleSaveEmployee} 
                onCancel={() => setEditingEmployee(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;