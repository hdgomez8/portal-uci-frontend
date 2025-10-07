import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Settings, X, BadgeCheck, Search, Edit, Trash2, PlusCircle, Download } from 'lucide-react';
import { userService, employeeService, rolesService } from '../services/api';
import { permisosSistemaService } from '../services/apiPermisos';
import { estructuraService } from '../services/apiEstructura';
import CreateUserEmployeeModal from '../components/CreateUserEmployeeModal';
import PermissionDeniedAlert from '../components/PermissionDeniedAlert';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportUsuariosToExcel, exportDepartamentosToExcel, exportAreasToExcel } from '../utils/excelExport';

// Interfaces para administración
interface Empleado {
  id: number;
  nombres: string;
  documento: string;
  codigo: string;
  fecha_ingreso: string;
  tipo_contrato: string;
  areas?: Area[]; // Asumimos que viene con relación many-to-many
  oficio?: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  empleado: Empleado;
  roles: any[];
}

interface EditUserData {
  nombres?: string;
  email?: string;
  emailPersonal?: string;
  password?: string;
  oficio?: string;
  rolId?: string;
  areaId?: string;
}

// Interfaces para Estructura Organizacional
interface Departamento {
  id: number;
  nombre: string;
  gerente_id: string;
  gerente?: { nombres: string };
}

interface Area {
  id: number;
  nombre: string;
  departamento_id: number;
  jefe_id: number | null;
  departamento?: Departamento;
  jefe?: { nombres: string };
}

// Componentes de modales (Edit y Create) para Usuario, Departamento y Área
// Se mantienen los modales de Usuario (EditModal y CreateModal) ya definidos

interface EditModalProps {
  editFormData: EditUserData;
  setEditFormData: React.Dispatch<React.SetStateAction<EditUserData>>;
  handleEditUser: (e: React.FormEvent) => void;
  onClose: () => void;
  roles: any[];
  areas: any[];
}

const EditModal: React.FC<EditModalProps> = React.memo(
  ({ editFormData, setEditFormData, handleEditUser, onClose, roles, areas }) => {
    console.log('🔍 EditModal renderizado con editFormData:', editFormData);
    console.log('🔍 Roles disponibles:', roles);
    console.log('🔍 Áreas disponibles:', areas);
    
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Editar Usuario</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleEditUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombres</label>
            <input
              type="text"
              value={editFormData.nombres || ''}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, nombres: e.target.value }))}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email del Sistema (Usuario)</label>
            <input
              type="email"
              value={editFormData.email || ''}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="input mt-1"
              placeholder="Email para acceso al sistema"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Personal (Empleado)</label>
            <input
              type="email"
              value={editFormData.emailPersonal || ''}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, emailPersonal: e.target.value }))}
              className="input mt-1"
              placeholder="Email personal del empleado"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oficio (Cargo)</label>
            <input
              type="text"
              value={editFormData.oficio || ''}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, oficio: e.target.value }))}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
            <select
              value={editFormData.rolId || ''}
              onChange={e => setEditFormData(prev => ({ ...prev, rolId: e.target.value }))}
              className="input mt-1"
              required
            >
              <option value="">Seleccionar rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área</label>
            <select
              value={editFormData.areaId || ''}
              onChange={e => setEditFormData(prev => ({ ...prev, areaId: e.target.value }))}
              className="input mt-1"
            >
              <option value="">Sin área asignada</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
            <input
              type="password"
              value={editFormData.password || ''}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
              className="input mt-1"
              placeholder="Dejar en blanco para mantener la actual"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
  }
);

// Nuevo componente para editar departamento
interface EditDepartamentoModalProps {
  open: boolean;
  onClose: () => void;
  departamento: any;
  empleados: any[];
  onSave: (data: any) => void;
}

const EditDepartamentoModal: React.FC<EditDepartamentoModalProps> = ({ open, onClose, departamento, empleados, onSave }) => {
  const [form, setForm] = React.useState({ nombre: '', gerente_id: '' });

  React.useEffect(() => {
    if (departamento) {
      setForm({
        nombre: departamento.nombre || '',
        gerente_id: departamento.gerente_id != null ? String(departamento.gerente_id) : ''
      });
    }
  }, [departamento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...departamento,
      nombre: form.nombre,
      gerente_id: form.gerente_id !== '' ? form.gerente_id : ''
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Editar Departamento</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input name="nombre" type="text" value={form.nombre} onChange={handleChange} className="input mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gerente</label>
            <select name="gerente_id" value={form.gerente_id} onChange={handleChange} className="input mt-1">
              <option value="">Sin gerente asignado</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombres || emp.empleado?.nombres} - {emp.documento || emp.empleado?.documento}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-md">Cancelar</button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Extraer el modal de edición de área a un componente aparte
interface EditAreaModalProps {
  open: boolean;
  onClose: () => void;
  area: any;
  empleados: any[];
  departamentos: any[];
  onSave: (data: any) => void;
}

const EditAreaModal: React.FC<EditAreaModalProps> = ({ open, onClose, area, empleados, departamentos, onSave }) => {
  const [form, setForm] = React.useState({ nombre: '', departamento_id: '', jefe_id: '' });
  const nombreRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && area) {
      setForm({
        nombre: area.nombre || '',
        departamento_id: area.departamento_id !== null && area.departamento_id !== undefined ? String(area.departamento_id) : '',
        jefe_id: area.jefe_id !== null && area.jefe_id !== undefined ? String(area.jefe_id) : ''
      });
      setTimeout(() => {
        nombreRef.current?.focus();
      }, 0);
    }
  }, [open, area]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...area, ...form });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Editar Área</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              ref={nombreRef}
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="input mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              name="departamento_id"
              value={typeof form.departamento_id === 'string' ? form.departamento_id : ''}
              onChange={handleChange}
              className="input mt-1"
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jefe (Automático)</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300">
              El jefe del área será automáticamente el gerente del departamento seleccionado
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-md">Cancelar</button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Extraer el modal de creación de departamento a un componente aparte
interface CreateDepartamentoModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { nombre: string; gerente_id: string }) => void;
  empleados: any[];
}

const CreateDepartamentoModal: React.FC<CreateDepartamentoModalProps> = ({ open, onClose, onCreate, empleados }) => {
  const [form, setForm] = React.useState({ nombre: '', gerente_id: '' });
  const nombreRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ nombre: '', gerente_id: '' });
      setTimeout(() => {
        nombreRef.current?.focus();
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Crear Departamento</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Departamento</label>
            <input
              ref={nombreRef}
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="input mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gerente</label>
            <select
              value={form.gerente_id}
              onChange={e => setForm({ ...form, gerente_id: e.target.value })}
              className="input mt-1"
            >
              <option value="">Sin gerente asignado</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombres || emp.empleado?.nombres} - {emp.documento || emp.empleado?.documento}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-md">
              Cancelar
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Crear Departamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Extraer el modal de creación de área a un componente aparte
interface CreateAreaModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { nombre: string; departamento_id: string; jefe_id: string }) => void;
  departamentos: Departamento[];
  empleados: User[];
}

const CreateAreaModal: React.FC<CreateAreaModalProps> = ({ open, onClose, onCreate, departamentos, empleados }) => {
  const [form, setForm] = React.useState({ nombre: '', departamento_id: '', jefe_id: '' });
  const nombreRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ nombre: '', departamento_id: '', jefe_id: '' });
      setTimeout(() => {
        nombreRef.current?.focus();
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Crear Área</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Área</label>
            <input
              ref={nombreRef}
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="input mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              value={form.departamento_id}
              onChange={e => setForm({ ...form, departamento_id: e.target.value })}
              className="input mt-1"
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jefe (Automático)</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300">
              El jefe del área será automáticamente el gerente del departamento seleccionado
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-md">
              Cancelar
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Crear Área
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// El componente principal con pestañas principales y sub-pestañas
const Administration = () => {
  // Estado para pestañas principales: 'administracion' o 'estructura'
  const [activeMainTab, setActiveMainTab] = useState<'administracion' | 'estructura'>('administracion');
  // Subpestañas para administración
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'roles' | 'settings'>('users');
  // Subpestañas para estructura organizacional
  const [estructuraActiveTab, setEstructuraActiveTab] = useState<'departamentos' | 'areas'>('departamentos');

  // Estados para usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({ nombres: '', email: '', password: '', oficio: '', rolId: '' });
  const [showCreateUserEmployeeModal, setShowCreateUserEmployeeModal] = useState(false);

  // Estados para estructura organizacional
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isStructureLoading, setIsStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [showCreateDepartamentoModal, setShowCreateDepartamentoModal] = useState(false);
  const [showCreateAreaModal, setShowCreateAreaModal] = useState(false);
  const [formCreateDepartamento, setFormCreateDepartamento] = useState({ nombre: '', gerente_id: '' });
  const [newArea, setNewArea] = useState({ nombre: '', departamento_id: '', jefe_id: '' });

  // 1. Estados para edición
  const [showEditDepartamentoModal, setShowEditDepartamentoModal] = useState(false);
  const [editDepartamento, setEditDepartamento] = useState({ id: '', nombre: '', gerente_id: '' });
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  const [editArea, setEditArea] = useState({ id: '', nombre: '', departamento_id: '', jefe_id: '' });

  // Pestañas de administración
  const adminTabs: Array<{ id: 'users' | 'roles' | 'settings'; label: string; icon: any }> = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'roles', label: 'Roles y Permisos', icon: Shield },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const nombreDepartamentoRef = useRef<HTMLInputElement>(null);

  const [permissionError, setPermissionError] = useState<any>(null);

  const [roles, setRoles] = useState<any[]>([]);

  // Estados para paginación y filtros de usuarios
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);
  const [filtros, setFiltros] = useState({
    nombre: '',
    documento: '',
    email: '',
    rol: ''
  });

  useEffect(() => {
    if (activeMainTab === 'administracion') {
      fetchUsers();
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (activeMainTab === 'estructura') {
      fetchStructureData();
    }
  }, [activeMainTab, estructuraActiveTab]);

  useEffect(() => {
    if (activeMainTab === 'administracion') {
      estructuraService.getAllDepartamentos().then(res => setDepartamentos(res.data));
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (showCreateDepartamentoModal && nombreDepartamentoRef.current) {
      nombreDepartamentoRef.current.focus();
    }
  }, [showCreateDepartamentoModal]);

  useEffect(() => {
    if (showCreateDepartamentoModal) {
      setFormCreateDepartamento({ nombre: '', gerente_id: '' });
    }
  }, [showCreateDepartamentoModal]);

  useEffect(() => {
    rolesService.getRoles().then(res => setRoles(res.data));
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para filtrar usuarios
  const filtrarUsuarios = (usuarios: User[]) => {
    return usuarios.filter(user => {
      const nombreMatch = !filtros.nombre || 
        user.empleado.nombres.toLowerCase().includes(filtros.nombre.toLowerCase());
      const documentoMatch = !filtros.documento || 
        user.empleado.documento.toString().includes(filtros.documento);
      const emailMatch = !filtros.email || 
        user.email.toLowerCase().includes(filtros.email.toLowerCase());
      const rolMatch = !filtros.rol || 
        user.roles.some(rol => rol.nombre.toLowerCase().includes(filtros.rol.toLowerCase()));
      
      return nombreMatch && documentoMatch && emailMatch && rolMatch;
    });
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      documento: '',
      email: '',
      rol: ''
    });
    setPaginaActual(1);
  };

  const fetchStructureData = async () => {
    try {
      setIsStructureLoading(true);
      if (estructuraActiveTab === 'departamentos') {
        const response = await estructuraService.getAllDepartamentos();
        setDepartamentos(response.data);
      } else if (estructuraActiveTab === 'areas') {
        const response = await estructuraService.getAreas();
        setAreas(response.data);
      }
      setStructureError(null);
    } catch (err) {
      setStructureError('Error al cargar la estructura organizacional');
      console.error(err);
    } finally {
      setIsStructureLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      // Actualizar usuario (email, password)
      await userService.updateUser(selectedUser.id, {
        email: editFormData.email,
        password: editFormData.password,
      });
      // Actualizar empleado (nombres, oficio, email personal)
      if (selectedUser.empleado && selectedUser.empleado.id) {
        const empleadoData: any = {};
        if (editFormData.nombres) empleadoData.nombres = editFormData.nombres;
        if (editFormData.oficio) empleadoData.oficio = editFormData.oficio;
        if (editFormData.emailPersonal) empleadoData.email = editFormData.emailPersonal;
        
        await employeeService.update(String(selectedUser.empleado.id), empleadoData);
      }
      // Actualizar rol
      if (editFormData.rolId) {
        await rolesService.updateUserRole(selectedUser.id, editFormData.rolId);
      }
      // Actualizar área
      if (selectedUser.empleado && selectedUser.empleado.id) {
        const areaId = editFormData.areaId && editFormData.areaId !== '' ? editFormData.areaId : null;
        await employeeService.updateArea(String(selectedUser.empleado.id), areaId);
      }
      await fetchUsers();
      await estructuraService.getAllDepartamentos().then(res => setDepartamentos(res.data));
      setShowEditModal(false);
      setEditFormData({ nombres: '', email: '', emailPersonal: '', password: '', oficio: '', rolId: '', areaId: '' });
      setSelectedUser(null);
    } catch (err) {
      alert('Error al actualizar usuario');
    }
  };

  const handleCreateUserSuccess = async () => {
    await fetchUsers();
  };

  const openEditModal = async (user: User) => {
    console.log('🔍 Datos del usuario a editar:', user);
    console.log('🔍 Empleado:', user.empleado);
    console.log('🔍 Roles:', user.roles);
    console.log('🔍 Áreas del empleado:', user.empleado.areas);
    
    setSelectedUser(user);
    setEditFormData({
      nombres: user.empleado.nombres,
      email: user.email,
      emailPersonal: user.empleado.email || '',
      password: '',
      oficio: user.empleado.oficio || '',
      rolId: user.roles && user.roles.length > 0 ? String(user.roles[0].id) : '',
      areaId: user.empleado.areas && user.empleado.areas.length > 0 ? String(user.empleado.areas[0].id) : ''
    });
    
    console.log('🔍 EditFormData configurado:', {
      nombres: user.empleado.nombres,
      email: user.email,
      emailPersonal: user.empleado.email || '',
      oficio: user.empleado.oficio || '',
      rolId: user.roles && user.roles.length > 0 ? String(user.roles[0].id) : '',
      areaId: user.empleado.areas && user.empleado.areas.length > 0 ? String(user.empleado.areas[0].id) : ''
    });
    
    // Cargar áreas si no están disponibles
    if (areas.length === 0) {
      try {
        const response = await estructuraService.getAreas();
        setAreas(response.data);
      } catch (err) {
        console.error('Error al cargar áreas:', err);
      }
    }
    
    setShowEditModal(true);
  };

  const handleCreateDepartamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await estructuraService.createDepartamento(formCreateDepartamento);
      fetchStructureData();
      setShowCreateDepartamentoModal(false);
      setFormCreateDepartamento({ nombre: '', gerente_id: '' });
      if (nombreDepartamentoRef.current) {
        nombreDepartamentoRef.current.focus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await estructuraService.createArea({
        nombre: newArea.nombre,
        departamento_id: newArea.departamento_id ? Number(newArea.departamento_id) : null
      });
      fetchStructureData();
      setShowCreateAreaModal(false);
      setNewArea({ nombre: '', departamento_id: '', jefe_id: '' });
      toast.success('✅ Área creada exitosamente');
    } catch (err: any) {
      console.error('Error al crear área:', err);
      const errorMessage = err.response?.data?.message || 'Error al crear área';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  // 2. Funciones para abrir modales de edición
  const openEditDepartamentoModal = (dep: any) => {
    setEditDepartamento({
      id: dep.id,
      nombre: dep.nombre,
      gerente_id: dep.gerente_id != null ? String(dep.gerente_id) : ''
    });
    setShowEditDepartamentoModal(true);
  };
  const openEditAreaModal = (area: any) => {
    setEditArea({
      id: area.id,
      nombre: area.nombre,
      departamento_id: area.departamento_id !== null && area.departamento_id !== undefined ? String(area.departamento_id) : '',
      jefe_id: area.jefe_id !== null && area.jefe_id !== undefined ? String(area.jefe_id) : ''
    });
    setShowEditAreaModal(true);
  };

  // 3. Funciones para guardar cambios
  const handleEditDepartamento = async (data: any) => {
    try {
      await estructuraService.updateDepartamento(data.id, {
        nombre: data.nombre,
        gerente_id: data.gerente_id !== '' ? Number(data.gerente_id) : null
      });
      fetchStructureData();
      setShowEditDepartamentoModal(false);
    } catch (err) {
      alert('Error al editar departamento');
    }
  };

  const handleEditArea = async (data: any) => {
    try {
      await estructuraService.updateArea(data.id, {
        nombre: data.nombre,
        departamento_id: data.departamento_id ? Number(data.departamento_id) : null
      });
      fetchStructureData();
      setShowEditAreaModal(false);
      toast.success('✅ Área actualizada exitosamente');
    } catch (err: any) {
      console.error('Error al editar área:', err);
      const errorMessage = err.response?.data?.message || 'Error al editar área';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteArea = async (areaId: number, areaName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el área "${areaName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await estructuraService.deleteArea(areaId.toString());
      fetchStructureData();
      toast.success(`✅ Área "${areaName}" eliminada exitosamente`);
    } catch (err: any) {
      console.error('Error al eliminar área:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar área';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteDepartamento = async (departamentoId: number, departamentoName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el departamento "${departamentoName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await estructuraService.deleteDepartamento(departamentoId.toString());
      fetchStructureData();
      toast.success(`✅ Departamento "${departamentoName}" eliminado exitosamente`);
    } catch (err: any) {
      console.error('Error al eliminar departamento:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar departamento';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    console.log('🗑️ Intentando eliminar usuario:', { userId, userName });
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el usuario "${userName}" y su empleado asociado? Esta acción no se puede deshacer.`)) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }

    try {
      console.log('📡 Enviando petición DELETE a:', `/api/usuarios/${userId}`);
      const response = await userService.deleteUser(userId);
      console.log('✅ Respuesta del servidor:', response);
      
      await fetchUsers();
      toast.success(`✅ Usuario "${userName}" eliminado exitosamente`);
    } catch (err: any) {
      console.error('❌ Error al eliminar usuario:', err);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Data:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
      toast.error(`❌ ${errorMessage}`);
    }
  };

  // Funciones de exportación a Excel
  const exportarUsuariosAExcel = () => {
    try {
      const datosParaExportar = users.map(user => ({
        nombres: user.empleado.nombres || '',
        documento: user.empleado.documento || '',
        email: user.email || '',
        roles: user.roles?.map((rol: any) => rol.nombre).join(', ') || '',
        estado: 'Activo'
      }));

      const success = exportUsuariosToExcel(datosParaExportar);
      
      if (success) {
        toast.success('✅ Usuarios exportados a Excel exitosamente');
      } else {
        toast.error('❌ Error al exportar usuarios a Excel');
      }
    } catch (error) {
      console.error('Error exportando usuarios:', error);
      toast.error('❌ Error al exportar usuarios a Excel');
    }
  };

  const exportarDepartamentosAExcel = () => {
    try {
      const datosParaExportar = departamentos.map(dep => ({
        id: dep.id,
        nombre: dep.nombre || '',
        gerente: dep.gerente?.nombres || 'Sin gerente',
        empleados_count: 0
      }));

      const success = exportDepartamentosToExcel(datosParaExportar);
      
      if (success) {
        toast.success('✅ Departamentos exportados a Excel exitosamente');
      } else {
        toast.error('❌ Error al exportar departamentos a Excel');
      }
    } catch (error) {
      console.error('Error exportando departamentos:', error);
      toast.error('❌ Error al exportar departamentos a Excel');
    }
  };

  const exportarAreasAExcel = () => {
    try {
      const datosParaExportar = areas.map(area => ({
        id: area.id,
        nombre: area.nombre || '',
        departamento: area.departamento?.nombre || '',
        jefe: area.jefe?.nombres || 'Sin jefe',
        empleados_count: 0
      }));

      const success = exportAreasToExcel(datosParaExportar);
      
      if (success) {
        toast.success('✅ Áreas exportadas a Excel exitosamente');
      } else {
        toast.error('❌ Error al exportar áreas a Excel');
      }
    } catch (error) {
      console.error('Error exportando áreas:', error);
      toast.error('❌ Error al exportar áreas a Excel');
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Pestañas principales */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveMainTab('administracion')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeMainTab === 'administracion'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Users className="w-5 h-5" />
            <span>Administración</span>
          </button>
          <button
            onClick={() => setActiveMainTab('estructura')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeMainTab === 'estructura'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Shield className="w-5 h-5" />
            <span>Estructura Organizacional</span>
          </button>
        </nav>
      </div>

      {/* Contenido según la pestaña principal */}
      {activeMainTab === 'administracion' && (
        <>
          {/* Subpestañas para Administración */}
          <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
            <nav className="flex space-x-8">
              {adminTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setAdminActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${adminActiveTab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          {/* Contenido de Administración */}
          {adminActiveTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={exportarUsuariosAExcel} 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                    title="Exportar usuarios a Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                  <button onClick={() => setShowCreateUserEmployeeModal(true)} className="btn-primary flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Nuevo Usuario y Empleado</span>
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              {/* Filtros Responsive */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={filtros.nombre}
                      onChange={(e) => {
                        setFiltros({ ...filtros, nombre: e.target.value });
                        setPaginaActual(1);
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar por nombre..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Documento
                    </label>
                    <input
                      type="text"
                      value={filtros.documento}
                      onChange={(e) => {
                        setFiltros({ ...filtros, documento: e.target.value });
                        setPaginaActual(1);
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar por documento..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="text"
                      value={filtros.email}
                      onChange={(e) => {
                        setFiltros({ ...filtros, email: e.target.value });
                        setPaginaActual(1);
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar por email..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rol
                    </label>
                    <input
                      type="text"
                      value={filtros.rol}
                      onChange={(e) => {
                        setFiltros({ ...filtros, rol: e.target.value });
                        setPaginaActual(1);
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar por rol..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-center sm:justify-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Información de resultados */}
                  {(() => {
                    const usuariosFiltrados = filtrarUsuarios(users);
                    const totalPaginas = Math.ceil(usuariosFiltrados.length / elementosPorPagina);
                    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
                    const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);
                    
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <span className="mb-2 sm:mb-0">
                            Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + elementosPorPagina, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
                          </span>
                        </div>

                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="w-full min-w-[600px] divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Documento</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Nombres</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell min-w-[180px]">Correo</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[120px]">Roles</th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {usuariosPaginados.length > 0 ? (
                                usuariosPaginados.map((user) => (
                                  <tr key={user.id}>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-24">
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.empleado.documento}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 min-w-[200px]">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                          {user.empleado.nombres}
                                          {departamentos.filter(dep => String(dep.gerente_id) === String(user.empleado.id)).map(dep => (
                                            <span key={dep.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold" title={`Jefe de Departamento: ${dep.nombre}`}> 
                                              <BadgeCheck className="w-4 h-4" /> Jefe Dpto: {dep.nombre}
                                            </span>
                                          ))}
                                        </div>
                                        {/* Mostrar email en móvil */}
                                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-1">
                                          {user.email}
                                        </div>
                                        {/* Mostrar roles en móvil */}
                                        <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                                          {user.roles.slice(0, 2).map((rol, index) => (
                                            <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {rol.nombre}
                                            </span>
                                          ))}
                                          {user.roles.length > 2 && (
                                            <span className="text-xs text-gray-500">+{user.roles.length - 2}</span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell min-w-[180px]">
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell min-w-[120px]">
                                      <div className="flex flex-wrap gap-1">
                                        {user.roles.map((rol, index) => (
                                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {rol.nombre}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-32">
                                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                        <button onClick={() => openEditModal(user)} className="text-primary hover:text-primary/80 text-xs sm:text-sm">
                                          Editar
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteUser(user.id, user.empleado.nombres)} 
                                          className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                                          title="Eliminar usuario y empleado"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="text-center py-6 text-gray-400">
                                    No se encontraron usuarios con los filtros aplicados.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          </div>
                        </div>

                        {/* Paginación Responsive */}
                        {totalPaginas > 1 && (
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-4 sm:mt-6">
                            <button
                              onClick={() => setPaginaActual(paginaActual - 1)}
                              disabled={paginaActual === 1}
                              className="w-full sm:w-auto px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Anterior
                            </button>
                            
                            {/* Números de página */}
                            <div className="flex flex-wrap justify-center gap-1">
                              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                <button
                                  key={pagina}
                                  onClick={() => setPaginaActual(pagina)}
                                  className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
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
                              className="w-full sm:w-auto px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Siguiente
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}
          
          
          {adminActiveTab === 'roles' && (
            <RolesPermisosAdmin />
          )}
          {adminActiveTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold">Configuración</h2>
              {/* Aquí podrías agregar opciones de configuración */}
            </div>
          )}
        </>
      )}

      {activeMainTab === 'estructura' && (
        <>
          {/* Subpestañas para Estructura Organizacional */}
          <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setEstructuraActiveTab('departamentos')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${estructuraActiveTab === 'departamentos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Departamentos
              </button>
              <button
                onClick={() => setEstructuraActiveTab('areas')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${estructuraActiveTab === 'areas'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Áreas
              </button>
            </nav>
          </div>
          {/* Contenido de Estructura Organizacional */}
          {estructuraActiveTab === 'departamentos' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Departamentos</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={exportarDepartamentosAExcel} 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                    title="Exportar departamentos a Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                  <button onClick={() => setShowCreateDepartamentoModal(true)} className="btn-primary">
                    Agregar Departamento
                  </button>
                </div>
              </div>
              {structureError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {structureError}
                </div>
              )}
              {isStructureLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departamentos.map((dep) => (
                      <tr key={dep.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{dep.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{dep.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{dep.gerente ? dep.gerente.nombres : 'Sin gerente'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-2">
                            <button onClick={() => openEditDepartamentoModal(dep)} className="text-primary hover:text-primary/80">
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteDepartamento(dep.id, dep.nombre)} 
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar departamento"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {estructuraActiveTab === 'areas' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Áreas</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={exportarAreasAExcel} 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
                    title="Exportar áreas a Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                  <button onClick={() => setShowCreateAreaModal(true)} className="btn-primary">
                    Agregar Área
                  </button>
                </div>
              </div>
              {structureError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {structureError}
                </div>
              )}
              {isStructureLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jefe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {areas.map((area) => (
                      <tr key={area.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{area.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{area.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{area.departamento?.nombre || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{area.jefe?.nombres || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-2">
                            <button onClick={() => openEditAreaModal(area)} className="text-primary hover:text-primary/80">
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteArea(area.id, area.nombre)} 
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar área"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Modales de Usuario */}
              {showEditModal && (
          <EditModal
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            handleEditUser={handleEditUser}
            onClose={() => setShowEditModal(false)}
            roles={roles}
            areas={areas}
          />
        )}
      <CreateUserEmployeeModal
        isOpen={showCreateUserEmployeeModal}
        onClose={() => setShowCreateUserEmployeeModal(false)}
        onSuccess={handleCreateUserSuccess}
      />
      {/* Modales de Estructura Organizacional */}
      {showCreateDepartamentoModal && <CreateDepartamentoModal
        open={showCreateDepartamentoModal}
        onClose={() => setShowCreateDepartamentoModal(false)}
        onCreate={async (data) => {
          try {
            await estructuraService.createDepartamento(data);
            fetchStructureData();
            setShowCreateDepartamentoModal(false);
          } catch (err) {
            alert('Error al crear departamento');
          }
        }}
        empleados={users}
      />}
      {showCreateAreaModal && <CreateAreaModal
        open={showCreateAreaModal}
        onClose={() => setShowCreateAreaModal(false)}
        onCreate={async (data) => {
          try {
            await estructuraService.createArea({
              nombre: data.nombre,
              departamento_id: data.departamento_id ? Number(data.departamento_id) : null
            });
            fetchStructureData();
            setShowCreateAreaModal(false);
            toast.success('✅ Área creada exitosamente');
          } catch (err: any) {
            console.error('Error al crear área:', err);
            const errorMessage = err.response?.data?.message || 'Error al crear área';
            toast.error(`❌ ${errorMessage}`);
          }
        }}
        departamentos={departamentos}
        empleados={users}
      />}
      {showEditDepartamentoModal && (
        <EditDepartamentoModal
          open={showEditDepartamentoModal}
          onClose={() => setShowEditDepartamentoModal(false)}
          departamento={editDepartamento}
          empleados={users}
          onSave={handleEditDepartamento}
        />
      )}
      {showEditAreaModal && (
        <EditAreaModal
          open={showEditAreaModal}
          onClose={() => setShowEditAreaModal(false)}
          area={editArea}
          empleados={users}
          departamentos={departamentos}
          onSave={handleEditArea}
        />
      )}
      {permissionError && (
        <PermissionDeniedAlert message={permissionError.message} details={permissionError.details} />
      )}
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

const RolesPermisosAdmin: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [editRol, setEditRol] = useState<{ id: string; nombre: string; permisos: number[] } | null>(null);
  const [nuevoPermiso, setNuevoPermiso] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPermiso, setSearchPermiso] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesService.getRoles();
      setRoles(res.data);
    } catch (err) {
      setError('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisos = async () => {
    setLoading(true);
    try {
      const res = await permisosSistemaService.getPermisos();
      setPermisos(res.data);
    } catch (err) {
      setError('Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, []);

  // CRUD Roles
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRol.trim()) return;
    try {
      await rolesService.createRole({ nombre: nuevoRol });
      setNuevoRol('');
      fetchRoles();
    } catch (err) {
      setError('Error al crear rol');
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRol) return;
    try {
      await rolesService.updateRole(editRol.id, { nombre: editRol.nombre });
      await rolesService.assignPermissions(editRol.id, editRol.permisos);
      setEditRol(null);
      fetchRoles();
    } catch (err) {
      setError('Error al editar rol');
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este rol?')) return;
    try {
      await rolesService.deleteRole(id);
      if (selectedRole && selectedRole.id === id) setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError('Error al eliminar rol');
    }
  };

  // CRUD Permisos
  const handleCreatePermiso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPermiso.trim()) return;
    try {
      await permisosSistemaService.createPermiso({ nombre: nuevoPermiso });
      setNuevoPermiso('');
      fetchPermisos();
    } catch (err) {
      setError('Error al crear permiso');
    }
  };

  const handleDeletePermiso = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este permiso?')) return;
    try {
      await permisosSistemaService.deletePermiso(id);
      fetchPermisos();
    } catch (err) {
      setError('Error al eliminar permiso');
    }
  };

  // Asignar/Quitar permisos a un rol
  const handleTogglePermiso = async (permisoId: string) => {
    if (!selectedRole) return;
    const tienePermiso = selectedRole.permisos.some((p: any) => p.id === permisoId);
    try {
      if (tienePermiso) {
        await rolesService.removePermission(selectedRole.id, permisoId);
      } else {
        const nuevos = [...selectedRole.permisos.map((p: any) => p.id), permisoId];
        await rolesService.assignPermissions(selectedRole.id, nuevos);
      }
      fetchRoles();
      // Refrescar el rol seleccionado
      const actualizado = await rolesService.getRoles();
      setSelectedRole(actualizado.data.find((r: any) => r.id === selectedRole.id));
    } catch (err) {
      setError('Error al actualizar permisos del rol');
    }
  };

  const openEditRolModal = (rol: any) => {
    setEditRol({
      id: rol.id,
      nombre: rol.nombre,
      permisos: rol.permisos ? rol.permisos.map((p: any) => Number(p.id)) : []
    });
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tabla de roles */}
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Shield className="text-blue-600" /> Roles</h3>
          <form onSubmit={handleCreateRole} className="flex gap-2 mb-2">
            <input type="text" value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} placeholder="Nuevo rol" className="input" />
            <button type="submit" className="btn-primary">Crear</button>
          </form>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Permisos</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol) => (
                <tr key={rol.id} className={selectedRole && selectedRole.id === rol.id ? 'bg-primary/10' : ''}>
                  <td className="px-4 py-2 cursor-pointer flex items-center gap-2" onClick={() => setSelectedRole(rol)}>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      <BadgeCheck className="w-4 h-4" /> {rol.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      {rol.permisos?.length || 0} permisos
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => openEditRolModal(rol)} className="text-blue-600" title="Editar"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteRole(rol.id)} className="text-red-600" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {editRol && (
            <form onSubmit={handleEditRole} className="flex flex-col gap-4 mt-2 bg-white p-4 rounded-lg shadow-lg max-w-md">
              <label className="font-semibold">Nombre del rol</label>
              <input type="text" value={editRol.nombre} onChange={e => setEditRol({ ...editRol, nombre: e.target.value })} className="input" />
              <label className="font-semibold mt-2">Permisos</label>
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar permiso..."
                  value={searchPermiso}
                  onChange={e => setSearchPermiso(e.target.value)}
                  className="input flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {permisos.filter(p => p.nombre.toLowerCase().includes(searchPermiso.toLowerCase())).map((permiso) => (
                  <span
                    key={permiso.id}
                    onClick={() => setEditRol((prev) => prev ? {
                      ...prev,
                      permisos: prev.permisos.includes(Number(permiso.id))
                        ? prev.permisos.filter((id) => id !== Number(permiso.id))
                        : [...prev.permisos, Number(permiso.id)]
                    } : prev)}
                    className={`cursor-pointer px-3 py-1 rounded-full border text-xs font-semibold transition-all select-none
                      ${editRol.permisos.includes(Number(permiso.id))
                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100 hover:text-blue-700'}`}
                  >
                    {permiso.nombre}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="submit" className="btn-primary">Guardar</button>
                <button type="button" onClick={() => setEditRol(null)} className="btn">Cancelar</button>
              </div>
            </form>
          )}
        </div>
        {/* Panel de detalles del rol seleccionado */}
        <div>
          {selectedRole ? (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2"><BadgeCheck className="text-blue-600" /> {selectedRole.nombre}</h4>
              <div className="mb-2">
                <span className="font-semibold">Permisos asignados:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRole.permisos && selectedRole.permisos.length > 0 ? (
                    selectedRole.permisos.map((p: any) => (
                      <span key={p.id} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                        {p.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Sin permisos asignados</span>
                  )}
                </div>
              </div>
              <button onClick={() => openEditRolModal(selectedRole)} className="btn-primary mt-2 flex items-center gap-2"><Edit className="w-4 h-4" /> Editar rol</button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-lg text-gray-400 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              Selecciona un rol para ver detalles
            </div>
          )}
        </div>
      </div>
      {/* Panel de gestión de permisos */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Shield className="text-green-600" /> Permisos</h3>
        <form onSubmit={handleCreatePermiso} className="flex gap-2 mb-4">
          <input type="text" value={nuevoPermiso} onChange={e => setNuevoPermiso(e.target.value)} placeholder="Nuevo permiso" className="input" />
          <button type="submit" className="btn-primary flex items-center gap-1"><PlusCircle className="w-4 h-4" />Crear Permiso</button>
        </form>
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar permiso..."
            value={searchPermiso}
            onChange={e => setSearchPermiso(e.target.value)}
            className="input flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {permisos.filter(p => p.nombre.toLowerCase().includes(searchPermiso.toLowerCase())).map((permiso) => (
            <span key={permiso.id} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 flex items-center gap-2">
              {permiso.nombre}
              <button onClick={() => handleDeletePermiso(permiso.id)} className="text-red-600 ml-1" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
            </span>
          ))}
          {permisos.length === 0 && <span className="text-gray-400">No hay permisos registrados</span>}
        </div>
      </div>
    </>
  );
};

export default Administration;
