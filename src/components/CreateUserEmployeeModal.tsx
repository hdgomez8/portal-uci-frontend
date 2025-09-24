import React, { useState, useEffect } from 'react';
import { X, User, Building, Users, Shield } from 'lucide-react';
import { userService } from '../services/api';
import { estructuraService } from '../services/apiEstructura';
import { rolesService } from '../services/apiRoles';

interface Departamento {
  id: number;
  nombre: string;
  gerente_id: number | null;
}

interface Area {
  id: number;
  nombre: string;
  departamento_id: number;
  jefe_id: number | null;
  departamento?: Departamento;
  jefe?: { nombres: string };
}

interface Empleado {
  id: number;
  nombres: string;
  documento: string;
  codigo: string;
}

interface CreateUserEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserEmployeeModal: React.FC<CreateUserEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nombres: '',
    email: '',
    documento: '',
    codigo: '',
    fecha_ingreso: '',
    tipo_contrato: '',
    rol: '',
    departamento: '',
    area: '',
    jefe_id: '',
    oficio: ''
  });

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [jefesDepartamento, setJefesDepartamento] = useState<{[key: number]: Empleado}>({});
  const [roles, setRoles] = useState<Array<{id: number, nombre: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [departamentosRes, areasRes, empleadosRes, rolesRes] = await Promise.all([
        estructuraService.getAllDepartamentos(),
        estructuraService.getAllAreas(),
        userService.getUsers(), // Para obtener empleados existentes
        rolesService.getAllRoles() // Para obtener roles
      ]);

      setDepartamentos(departamentosRes.data);
      setAreas(areasRes.data);
      setEmpleados(empleadosRes.data.map((user: any) => user.empleado));
      setRoles(rolesRes.data);

      // Crear mapeo de jefes por departamento
      const jefesMap: {[key: number]: Empleado} = {};
      departamentosRes.data.forEach((depto: Departamento) => {
        if (depto.gerente_id) {
          const jefe = empleadosRes.data.find((user: any) => user.empleado?.id === depto.gerente_id);
          if (jefe) {
            jefesMap[depto.id] = jefe.empleado;
          }
        }
      });
      setJefesDepartamento(jefesMap);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'departamento') {
      // Cuando se selecciona un departamento, asignar automáticamente el jefe
      const departamentoId = parseInt(value);
      const jefeDepartamento = jefesDepartamento[departamentoId];
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        jefe_id: jefeDepartamento ? jefeDepartamento.id.toString() : ''
      }));
    } else if (name === 'area') {
      // Cuando se selecciona un área, asignar automáticamente el oficio
      const areaSeleccionada = areas.find(area => area.nombre === value);
      const oficioArea = areaSeleccionada ? areaSeleccionada.nombre : value;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        oficio: oficioArea
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar que la contraseña sea igual al documento
      const userData = {
        ...formData,
        password: formData.documento // La contraseña será igual al documento
      };

      await userService.createUser(userData);
      setSuccess('Usuario y empleado creados exitosamente');
      
      // Limpiar formulario
      setFormData({
        nombres: '',
        email: '',
        documento: '',
        codigo: '',
        fecha_ingreso: '',
        tipo_contrato: '',
        rol: '',
        departamento: '',
        area: '',
        jefe_id: '',
        oficio: ''
      });

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error creando usuario:', err);
      setError(err.response?.data?.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar áreas por departamento seleccionado
  const areasFiltradas = areas.filter(area => 
    !formData.departamento || area.departamento_id === parseInt(formData.departamento)
  );

  // Obtener jefe del departamento seleccionado
  const getJefeDepartamento = (departamentoId: string) => {
    if (!departamentoId) return null;
    return jefesDepartamento[parseInt(departamentoId)];
  };

  const jefeActual = getJefeDepartamento(formData.departamento);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crear Usuario y Empleado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete todos los campos para crear el usuario y empleado
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombres Completos *
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Oficio (Cargo) * (Automático)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {formData.oficio ? (
                    formData.oficio
                  ) : (
                    formData.area ? 
                      'Seleccione un área primero' : 
                      'Seleccione un área para asignar oficio automáticamente'
                  )}
                </div>
                <input
                  type="hidden"
                  name="oficio"
                  value={formData.oficio}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Documento de Identidad *
                </label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código de Empleado *
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Información Laboral
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Ingreso *
                </label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formData.fecha_ingreso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Contrato *
                </label>
                <select
                  name="tipo_contrato"
                  value={formData.tipo_contrato}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleccionar tipo de contrato</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Fijo">Fijo</option>
                  <option value="Obra o Labor">Obra o Labor</option>
                  <option value="Aprendizaje">Aprendizaje</option>
                  <option value="Ocasional">Ocasional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estructura Organizacional */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Estructura Organizacional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento *
                </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map(depto => (
                    <option key={depto.id} value={depto.id}>
                      {depto.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Área *
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                  disabled={!formData.departamento}
                >
                  <option value="">Seleccionar área</option>
                  {areasFiltradas.map(area => (
                    <option key={area.id} value={area.nombre}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo/Oficio *
                </label>
                <input
                  type="text"
                  name="oficio"
                  value={formData.oficio}
                  onChange={handleInputChange}
                  placeholder="Se llena automáticamente con el área seleccionada"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Se llena automáticamente con el área seleccionada, pero puedes editarlo si es necesario
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jefe/Jefe Inmediato (Automático)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {jefeActual ? (
                    `${jefeActual.nombres} - ${jefeActual.documento}`
                  ) : (
                    formData.departamento ? 
                      'Sin jefe asignado en este departamento' : 
                      'Seleccione un departamento primero'
                  )}
                </div>
                <input
                  type="hidden"
                  name="jefe_id"
                  value={formData.jefe_id}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol del Usuario *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.nombre}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Información de Acceso */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Información de Acceso
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              La contraseña será automáticamente igual al número de documento del empleado.
              El usuario podrá cambiar su contraseña después del primer inicio de sesión.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Usuario y Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserEmployeeModal; 