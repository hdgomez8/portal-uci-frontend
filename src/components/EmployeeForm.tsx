import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  CreditCard, 
  FileText, 
  FileSignature, 
  Save, 
  Camera,
  Upload
} from 'lucide-react';
import { employeeService } from '../services/api';

interface Employee {
  id?: number;
  codigo: number;
  clase: string;
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
  departamento: string;
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
  concepto_pago_admon: string;
  concepto_pago_domingo: string;
  concepto_pago_festivo: string;
  concepto_pago_oficio: string;
  forma_pago: string;
  banco_empresa: string;
  gerencia_electronica: string;
  tipo_cuenta: string;
  numero_cuenta_banco: string;
  fondo_pension: string;
  fecha_ingreso_fondo_pension: string;
  fondo_salud: string;
  fecha_ingreso_fondo_salud: string;
  caja_compensacion: string;
  sucursal_pi: string;
  centro_trabajo: string;
  tipo_cotizante: string;
  depto_dane: string;
  dias_vacaciones: number;
  forma_pago_prima_vacaciones: string;
  forma_pago_aguinaldo: string;
  origen_dias_prima_servicio: string;
  forma_pago_prima_servicio: string;
  dias_prima_servicio: number;
  fondo_cesantias: string;
  dias_cesantias: number;
  ingreso_fondo: boolean;
  fecha_ingreso_fondo: string;
  sustitucion_patronal: boolean;
  fecha_sustitucion_patronal: string;
  dias_perdidos_ley_vieja: number;
  clase_indemnizacion: string;
  forma_indemnizacion: string;
  fecha_expedicion_documento: string;
  fecha_salida?: string;
  firma?: string;
  firmaUrl?: string;
}

interface EmployeeFormProps {
  employee: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoadingFirma, setIsLoadingFirma] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      codigo: 0,
      clase: '',
      documento: '',
      tipo_documento: '',
      ciudad_documento: '',
      nombres: '',
      fecha_ingreso: '',
      tipo_contrato: '',
      sucursal: '',
      grupo_pago: '',
      oficio: '',
      departamento: '',
      equipo_trabajo: '',
      clase_trabajador: '',
      estado_trabajador: 'Activo',
      jornada: '',
      salario_integral: false,
      fecha_nacimiento: '',
      ciudad_nacimiento: '',
      sexo: '',
      estado_civil: '',
      email: '',
      direccion: '',
      codigo_postal: '',
      ciudad_residencia: '',
      telefono: '',
      transporta_empresa: false,
      personas_a_cargo: 0,
      concepto_pago_admon: '',
      concepto_pago_domingo: '',
      concepto_pago_festivo: '',
      concepto_pago_oficio: '',
      forma_pago: '',
      banco_empresa: '',
      gerencia_electronica: '',
      tipo_cuenta: '',
      numero_cuenta_banco: '',
      fondo_pension: '',
      fecha_ingreso_fondo_pension: '',
      fondo_salud: '',
      fecha_ingreso_fondo_salud: '',
      caja_compensacion: '',
      sucursal_pi: '',
      centro_trabajo: '',
      tipo_cotizante: '',
      depto_dane: '',
      dias_vacaciones: 0,
      forma_pago_prima_vacaciones: '',
      forma_pago_aguinaldo: '',
      origen_dias_prima_servicio: '',
      forma_pago_prima_servicio: '',
      dias_prima_servicio: 0,
      fondo_cesantias: '',
      dias_cesantias: 0,
      ingreso_fondo: false,
      fecha_ingreso_fondo: '',
      sustitucion_patronal: false,
      fecha_sustitucion_patronal: '',
      dias_perdidos_ley_vieja: 0,
      clase_indemnizacion: '',
      forma_indemnizacion: '',
      fecha_expedicion_documento: '',
    }
  );

  const formTabs = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'laboral', label: 'Información Laboral', icon: Briefcase },
    { id: 'financiera', label: 'Información Financiera', icon: CreditCard },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'firma', label: 'Firma', icon: FileSignature },
  ];

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Efecto para mostrar la imagen de perfil cuando se carga el formulario
  useEffect(() => {
    if (formData.foto_perfil) {
      const photoPreview = document.getElementById('photo-preview') as HTMLImageElement;
      if (photoPreview) {
        photoPreview.style.display = 'block';
      }
    }
  }, [formData.foto_perfil]);

  // Efecto para verificar y mostrar la firma cuando se carga el formulario
  useEffect(() => {
    if (employee?.id) {
      const verificarFirma = async () => {
        setIsLoadingFirma(true);
        try {
          const response = await employeeService.getSignature(employee.id.toString());
          const firmaInfo = response.data;
          
          if (firmaInfo.existe) {
            setFormData(prev => ({
              ...prev,
              firma: firmaInfo.nombre_archivo,
              firmaUrl: firmaInfo.url
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              firma: undefined,
              firmaUrl: undefined
            }));
          }
        } catch (error) {
          setFormData(prev => ({
            ...prev,
            firma: undefined,
            firmaUrl: undefined
          }));
        } finally {
          setIsLoadingFirma(false);
        }
      };
      verificarFirma();
    }
  }, [employee?.id]);

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
          <select
            value={formData.tipo_documento || ''}
            onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Cedula Ciu">Cédula de Ciudadanía</option>
            <option value="Cedula Ext">Cédula de Extranjería</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="Tarjeta Identidad">Tarjeta de Identidad</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Número de Documento</label>
          <input
            type="text"
            value={formData.documento || ''}
            onChange={(e) => handleInputChange('documento', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Nombres Completos</label>
          <input
            type="text"
            value={formData.nombres || ''}
            onChange={(e) => handleInputChange('nombres', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad de Nacimiento</label>
          <input
            type="text"
            value={formData.ciudad_nacimiento || ''}
            onChange={(e) => handleInputChange('ciudad_nacimiento', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fecha de Nacimiento</label>
          <input
            type="date"
            value={formData.fecha_nacimiento || ''}
            onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad de Expedición</label>
          <input
            type="text"
            value={formData.ciudad_documento || ''}
            onChange={(e) => handleInputChange('ciudad_documento', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fecha de Expedición</label>
          <input
            type="date"
            value={formData.fecha_expedicion_documento || ''}
            onChange={(e) => handleInputChange('fecha_expedicion_documento', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sexo</label>
          <select
            value={formData.sexo || ''}
            onChange={(e) => handleInputChange('sexo', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Estado Civil</label>
          <select
            value={formData.estado_civil || ''}
            onChange={(e) => handleInputChange('estado_civil', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Soltero">Soltero</option>
            <option value="Casado">Casado</option>
            <option value="Unión Libre">Unión Libre</option>
            <option value="Divorciado">Divorciado</option>
            <option value="Viudo">Viudo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Teléfono</label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            className="input"
          />
        </div>
        <input type="hidden" value={formData.codigo || ''} />
      </div>
    </div>
  );

  const renderLaboralInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Fecha de Ingreso</label>
          <input
            type="date"
            value={formData.fecha_ingreso || ''}
            onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Contrato</label>
          <select
            value={formData.tipo_contrato || ''}
            onChange={(e) => handleInputChange('tipo_contrato', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Indefinido">Indefinido</option>
            <option value="Término Fijo">Término Fijo</option>
            <option value="Obra o Labor">Obra o Labor</option>
            <option value="Aprendizaje">Aprendizaje</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sucursal</label>
          <input
            type="text"
            value={formData.sucursal || ''}
            onChange={(e) => handleInputChange('sucursal', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Grupo de Pago</label>
          <input
            type="text"
            value={formData.grupo_pago || ''}
            onChange={(e) => handleInputChange('grupo_pago', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Oficio</label>
          <input
            type="text"
            value={formData.oficio || ''}
            onChange={(e) => handleInputChange('oficio', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Departamento</label>
          <input
            type="text"
            value={formData.departamento || ''}
            onChange={(e) => handleInputChange('departamento', e.target.value)}
            className="input"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Equipo de Trabajo</label>
          <input
            type="text"
            value={formData.equipo_trabajo || ''}
            onChange={(e) => handleInputChange('equipo_trabajo', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Clase de Trabajador</label>
          <input
            type="text"
            value={formData.clase_trabajador || ''}
            onChange={(e) => handleInputChange('clase_trabajador', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Estado del Trabajador</label>
          <select
            value={formData.estado_trabajador || ''}
            onChange={(e) => handleInputChange('estado_trabajador', e.target.value)}
            className="input"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Retirado">Retirado</option>
            <option value="Suspendido">Suspendido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Jornada</label>
          <input
            type="text"
            value={formData.jornada || ''}
            onChange={(e) => handleInputChange('jornada', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Salario Integral</label>
          <select
            value={formData.salario_integral ? '1' : '0'}
            onChange={(e) => handleInputChange('salario_integral', e.target.value === '1')}
            className="input"
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Cotizante</label>
          <select
            value={formData.tipo_cotizante || ''}
            onChange={(e) => handleInputChange('tipo_cotizante', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="DEPENDIENTE">Dependiente</option>
            <option value="INDEPENDIENTE">Independiente</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Forma de Pago</label>
          <select
            value={formData.forma_pago || ''}
            onChange={(e) => handleInputChange('forma_pago', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Deposito">Depósito</option>
            <option value="Cheque">Cheque</option>
            <option value="Efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Banco</label>
          <input
            type="text"
            value={formData.banco_empresa || ''}
            onChange={(e) => handleInputChange('banco_empresa', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Gerencia Electrónica</label>
          <input
            type="text"
            value={formData.gerencia_electronica || ''}
            onChange={(e) => handleInputChange('gerencia_electronica', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Cuenta</label>
          <select
            value={formData.tipo_cuenta || ''}
            onChange={(e) => handleInputChange('tipo_cuenta', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar...</option>
            <option value="Ahorros">Ahorros</option>
            <option value="Corriente">Corriente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Número de Cuenta</label>
          <input
            type="text"
            value={formData.numero_cuenta_banco || ''}
            onChange={(e) => handleInputChange('numero_cuenta_banco', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fondo de Pensiones</label>
          <input
            type="text"
            value={formData.fondo_pension || ''}
            onChange={(e) => handleInputChange('fondo_pension', e.target.value)}
            className="input"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Fondo de Salud</label>
          <input
            type="text"
            value={formData.fondo_salud || ''}
            onChange={(e) => handleInputChange('fondo_salud', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Caja de Compensación</label>
          <input
            type="text"
            value={formData.caja_compensacion || ''}
            onChange={(e) => handleInputChange('caja_compensacion', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fondo de Cesantías</label>
          <input
            type="text"
            value={formData.fondo_cesantias || ''}
            onChange={(e) => handleInputChange('fondo_cesantias', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Días de Vacaciones</label>
          <input
            type="number"
            value={formData.dias_vacaciones || ''}
            onChange={(e) => handleInputChange('dias_vacaciones', parseInt(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Días de Cesantías</label>
          <input
            type="number"
            value={formData.dias_cesantias || ''}
            onChange={(e) => handleInputChange('dias_cesantias', parseInt(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Días Prima de Servicio</label>
          <input
            type="number"
            value={formData.dias_prima_servicio || ''}
            onChange={(e) => handleInputChange('dias_prima_servicio', parseInt(e.target.value))}
            className="input"
          />
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-8">
      {/* Sección de Foto de Perfil */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Foto de Perfil
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">Sube una foto profesional</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="photo-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Foto de perfil:', file);
                    // Aquí puedes mostrar preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const preview = document.getElementById('photo-preview') as HTMLImageElement;
                      if (preview && e.target?.result) {
                        preview.src = e.target.result as string;
                        preview.style.display = 'block';
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="photo-upload" className="btn-primary cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Foto
              </label>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Vista Previa</h4>
            <div className="relative w-32 h-32 mx-auto">
              <img
                id="photo-preview"
                src={formData.foto_perfil ? `http://localhost:5555/uploads/perfiles/${formData.foto_perfil}` : ''}
                alt="Vista previa"
                className={`w-full h-full object-cover rounded-full border-4 border-gray-200 dark:border-gray-700 ${
                  formData.foto_perfil ? 'block' : 'hidden'
                }`}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
                onLoad={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'block';
                }}
              />
              {!formData.foto_perfil && (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Formato: JPG, PNG • Máximo: 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Hoja de Vida */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Hoja de Vida (CV)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">Sube tu hoja de vida actualizada</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="cv-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Hoja de vida:', file);
                    // Actualizar nombre del archivo
                    const fileNameElement = document.getElementById('cv-file-name');
                    if (fileNameElement) {
                      fileNameElement.textContent = file.name;
                      fileNameElement.style.display = 'block';
                    }
                  }
                }}
              />
              <label htmlFor="cv-upload" className="btn-primary cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar CV
              </label>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Archivo Actual</h4>
            <div className="space-y-3">
              {formData.hoja_vida ? (
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {formData.hoja_vida}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      CV cargado correctamente
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `http://localhost:5555/uploads/cv/${formData.hoja_vida}`;
                      window.open(url, '_blank');
                    }}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">No hay CV cargado</p>
                    <p className="text-xs text-gray-400">Sube tu hoja de vida</p>
                  </div>
                </div>
              )}
              <div id="cv-file-name" className="hidden flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Nuevo archivo seleccionado
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Listo para subir
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Formatos: PDF, DOC, DOCX • Máximo: 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Fechas */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Fechas Importantes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Expedición del Documento</label>
            <input
              type="date"
              value={formData.fecha_expedicion_documento || ''}
              onChange={(e) => handleInputChange('fecha_expedicion_documento', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fecha de Salida</label>
            <input
              type="date"
              value={formData.fecha_salida || ''}
              onChange={(e) => handleInputChange('fecha_salida', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignature = () => (
    <div className="space-y-8">
      {/* Sección de Firma Digital */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" />
          Firma Digital
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor de Firma */}
          <div>
            <h4 className="text-sm font-medium mb-3">Crear Firma</h4>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FileSignature className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">Crea tu firma digital personalizada</p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    // Aquí implementarías la funcionalidad de firma digital
                    console.log('Abrir editor de firma');
                    // Simular apertura de modal de firma
                    alert('Funcionalidad de firma digital - En desarrollo');
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Crear Firma Digital
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Subir firma desde archivo
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        console.log('Firma subida:', file);
                        // Aquí procesarías la subida
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2 inline" />
                  Subir Firma desde Archivo
                </button>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 Consejos para una buena firma
              </h5>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Usa un fondo transparente o blanco</li>
                <li>• Mantén un tamaño de 300x150 píxeles</li>
                <li>• Formato recomendado: PNG o SVG</li>
                <li>• Asegúrate de que sea legible</li>
              </ul>
            </div>
          </div>

          {/* Vista Previa de Firma */}
          <div>
            <h4 className="text-sm font-medium mb-3">Vista Previa</h4>
            <div className="space-y-4">
              {/* Indicador de carga */}
              {isLoadingFirma && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-3 text-sm text-gray-500">Verificando firma...</span>
                  </div>
                </div>
              )}
              
              {/* Firma Actual */}
              {!isLoadingFirma && formData.firma ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Firma Actual</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Descargar firma"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `http://localhost:5555/uploads/firmas/${formData.firma}`;
                          link.download = 'firma-empleado.png';
                          link.click();
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar firma"
                        onClick={async () => {
                          if (employee?.id && formData.firma) {
                            try {
                              await employeeService.deleteSignature(employee.id.toString());
                              setFormData(prev => ({ ...prev, firma: undefined }));
                              console.log('Firma eliminada correctamente');
                            } catch (error) {
                              console.error('Error eliminando firma:', error);
                            }
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={formData.firmaUrl || ''}
                      alt="Firma del empleado"
                      className="max-w-full h-auto max-h-32 object-contain"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const nextSibling = target.nextElementSibling as HTMLElement;
                        if (nextSibling) {
                          nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="hidden flex items-center justify-center w-full h-32 text-gray-400">
                      <FileSignature className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              ) : !isLoadingFirma && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">No hay firma cargada</p>
                  <p className="text-xs text-gray-400">Crea o sube tu firma digital</p>
                </div>
              )}

              {/* Ejemplo de uso */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Ejemplo de uso en documentos
                </h5>
                <div className="bg-white dark:bg-gray-900 rounded border p-4 text-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium">Documento de Autorización</p>
                      <p className="text-gray-500 text-xs">Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Firma digital</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Por medio del presente documento autorizo...
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-medium">{formData.nombres || 'Nombre del empleado'}</p>
                        <p className="text-xs text-gray-500">Cargo: {formData.oficio || 'Cargo'}</p>
                      </div>
                      <div className="w-24 h-16 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        {formData.firma ? (
                          <img
                            src={formData.firmaUrl || ''}
                            alt="Firma"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <FileSignature className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="card">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Información sobre Firma Digital
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Ventajas</h5>
            <ul className="space-y-1 text-xs">
              <li>• Mayor seguridad en documentos</li>
              <li>• Ahorro de tiempo y papel</li>
              <li>• Fácil verificación de autenticidad</li>
              <li>• Cumplimiento legal</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendaciones</h5>
            <ul className="space-y-1 text-xs">
              <li>• Mantén tu firma actualizada</li>
              <li>• Usa un formato de alta calidad</li>
              <li>• Guarda una copia de respaldo</li>
              <li>• Verifica la legibilidad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pestañas del formulario */}
      <div className="flex space-x-1 border-b dark:border-gray-700">
        {formTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 -mb-px text-sm font-medium transition-colors flex items-center space-x-2
              ${activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido de las pestañas del formulario */}
      <div className="min-h-[400px]">
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'laboral' && renderLaboralInfo()}
        {activeTab === 'financiera' && renderFinancialInfo()}
        {activeTab === 'documentos' && renderDocuments()}
        {activeTab === 'firma' && renderSignature()}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{employee ? 'Actualizar' : 'Crear'} Empleado</span>
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm; 