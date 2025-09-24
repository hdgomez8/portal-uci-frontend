import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { employeeService } from '../services/api';
import { 
  User, 
  Briefcase, 
  CreditCard, 
  AlertCircle, 
  Camera, 
  FileUp, 
  Download, 
  Pencil 
} from 'lucide-react';

interface Employee {
  id: number;
  codigo: number;
  documento: string;
  tipo_documento: string;
  ciudad_documento: string;
  nombres: string;
  hoja_vida: string;
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
  fecha_ingreso: string;
  fecha_salida: string | null;
  tipo_contrato: string;
  estado_trabajador: string;
  jornada: string;
  salario_integral: boolean;
  sucursal: string;
  grupo_pago: string;
  oficio: string;
  depto: string;
  equipo_trabajo: string;
  clase_trabajador: string;
  tipo_cotizante: string;
  centro_trabajo: string;
  forma_pago: string;
  banco_empresa: string;
  tipo_cuenta: string;
  nro_cuenta_banco: string;
  fondo_pension: string;
  fondo_salud: string;
  ccf: string;
  sucursal_pi: string;
  foto_perfil?: string;
  tiene_cv?: boolean;
}

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  
  useEffect(() => {
    if (id) {
      fetchEmployee(id);
    }
  }, [id]);

  const fetchEmployee = async (employeeId: string) => {
    try {
      setIsLoading(true);
      const response = await employeeService.getById(employeeId);
      setEmployee(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos del empleado');
      console.error('Error fetching employee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      setIsUploading(true);
      await employeeService.uploadProfilePhoto(id, file);
      window.location.reload();
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Error al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      setIsUploading(true);
      await employeeService.uploadResume(id, file);
      await fetchEmployee(id);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Error al subir el CV');
    } finally {
      setIsUploading(false);
    }
  };
  const baseUrl = "http://localhost:5555/uploads/cv/";

  const handleDownloadResume = () => {
    if (employee.hoja_vida) {
      const url = `${baseUrl}${employee.hoja_vida}`;
      window.open(url, "_blank"); // Abre el PDF en una nueva pestaña
    } else {
      alert("No hay hoja de vida disponible");
    }
  };
  

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'laboral', label: 'Información Laboral', icon: Briefcase },
    { id: 'financiera', label: 'Información Financiera', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error || 'No se encontró el empleado'}</p>
        </div>
      </div>
    );
  }

  const renderPersonalInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">

            {employee.foto_perfil ? (
              <img
              src={`http://localhost:5555/uploads/perfiles/${employee.foto_perfil}`}
                alt={employee.nombres}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <span className="text-4xl font-medium text-primary">
                  {employee.nombres.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <button
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Camera className="w-5 h-5 text-primary" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <h2 className="text-xl font-semibold mt-4">{employee.nombres}</h2>
          <p className="text-gray-500">{employee.oficio}</p>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-sm text-gray-400">#{employee.codigo}</span>
            <span className={`
              px-2 py-0.5 text-xs rounded-full
              ${employee.estado_trabajador === 'Activo'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              }
            `}>
              {employee.estado_trabajador}
            </span>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4">Hoja de Vida</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileUp className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">CV del empleado</p>
                <p className="text-sm text-gray-500">
                  {employee.hoja_vida ? 'Documento cargado' : 'Sin documento'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {employee.hoja_vida && (
                <button
                  onClick={handleDownloadResume}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => resumeInputRef.current?.click()}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">Documento</p>
            <p className="font-medium">{employee.documento} ({employee.tipo_documento})</p>
            <p className="text-sm text-gray-400">Ciudad: {employee.ciudad_documento}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
            <p className="font-medium">{new Date(employee.fecha_nacimiento).toLocaleDateString()}</p>
            <p className="text-sm text-gray-400">Ciudad: {employee.ciudad_nacimiento}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Género</p>
            <p className="font-medium">{employee.sexo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado Civil</p>
            <p className="font-medium">{employee.estado_civil}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Contacto</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teléfono</p>
            <p className="font-medium">{employee.telefono}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dirección</p>
            <p className="font-medium">{employee.direccion}</p>
            <p className="text-sm text-gray-400">
              {employee.ciudad_residencia}, CP: {employee.codigo_postal}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Información Adicional</p>
            <p className="font-medium">
              Personas a cargo: {employee.personas_a_cargo}
            </p>
            <p className="font-medium">
              Transporte empresa: {employee.transporta_empresa ? 'Sí' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLaboralInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Contrato</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Fecha de Ingreso</p>
            <p className="font-medium">{new Date(employee.fecha_ingreso).toLocaleDateString()}</p>
          </div>
          {employee.fecha_salida && (
            <div>
              <p className="text-sm text-gray-500">Fecha de Salida</p>
              <p className="font-medium">{new Date(employee.fecha_salida).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Tipo de Contrato</p>
            <p className="font-medium">{employee.tipo_contrato}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="font-medium">{employee.estado_trabajador}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jornada</p>
            <p className="font-medium">{employee.jornada}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Salario Integral</p>
            <p className="font-medium">{employee.salario_integral ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Ubicación y Cargo</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Sucursal</p>
            <p className="font-medium">{employee.sucursal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Departamento</p>
            <p className="font-medium">{employee.depto}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Oficio</p>
            <p className="font-medium">{employee.oficio}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Equipo de Trabajo</p>
            <p className="font-medium">{employee.equipo_trabajo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Centro de Trabajo</p>
            <p className="font-medium">{employee.centro_trabajo}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Información Bancaria</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Forma de Pago</p>
            <p className="font-medium">{employee.forma_pago}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Banco</p>
            <p className="font-medium">{employee.banco_empresa}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo de Cuenta</p>
            <p className="font-medium">{employee.tipo_cuenta}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Número de Cuenta</p>
            <p className="font-medium">{employee.nro_cuenta_banco}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Seguridad Social</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Fondo de Pensión</p>
            <p className="font-medium">{employee.fondo_pension}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fondo de Salud</p>
            <p className="font-medium">{employee.fondo_salud}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Caja de Compensación</p>
            <p className="font-medium">{employee.ccf}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sucursal PI</p>
            <p className="font-medium">{employee.sucursal_pi}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'laboral' && renderLaboralInfo()}
        {activeTab === 'financiera' && renderFinancialInfo()}
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;