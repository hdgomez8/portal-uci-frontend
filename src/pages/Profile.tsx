import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { User, Upload, Download, Edit3, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface UserData {
  id: number;
  email: string;
  empleado: {
    id: number;
    nombres: string;
    documento: string;
    telefono: string;
    direccion: string;
    email: string;
    foto_perfil?: string;
  };
}

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    direccion: ''
  });
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchCurrentSignature();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/perfil/mi-perfil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          email: data.email || '',
          telefono: data.empleado?.telefono || '',
          direccion: data.empleado?.direccion || ''
        });
      } else {
        toast.error('Error al cargar el perfil');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    }
  };

  const fetchCurrentSignature = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/perfil/mi-perfil/firma`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSignature(data.firma);
      }
    } catch (error) {
      console.error('Error fetching signature:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSignature = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('firma', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/perfil/mi-perfil/firma`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Firma actualizada correctamente');
        setSelectedFile(null);
        setPreviewUrl(null);
        // Limpiar el input file
        const fileInput = document.getElementById('signature-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Recargar la firma actual
        await fetchCurrentSignature();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al subir la firma');
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error('Error al subir la firma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/perfil/mi-perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
        await fetchUserProfile(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      email: userData?.email || '',
      telefono: userData?.empleado?.telefono || '',
      direccion: userData?.empleado?.direccion || ''
    });
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mi Perfil</h1>
              <p className="text-white/80">Gestiona tu información personal y firma</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Información Personal */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Información Personal
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={userData.empleado?.nombres || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento
                </label>
                <input
                  type="text"
                  value={userData.empleado?.documento || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Gestión de Firma */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Gestión de Firma
            </h2>
            
            <div className="space-y-6">
              {/* Firma actual */}
              {currentSignature && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Firma Actual
                  </h4>
                  <div className="flex items-center space-x-4">
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${currentSignature}`}
                      alt="Firma actual"
                      className="max-w-xs max-h-32 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Tu firma actual está configurada y lista para usar en documentos.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Área de carga de firma */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Subir Nueva Firma
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Selecciona una imagen de tu firma (PNG, JPG, JPEG). Máximo 5MB.
                </p>
                
                <input
                  id="signature-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <label
                  htmlFor="signature-file"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo</span>
                </label>
              </div>

              {/* Preview de la firma seleccionada */}
              {previewUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Vista Previa
                  </h4>
                  <div className="flex items-center space-x-4">
                    <img
                      src={previewUrl}
                      alt="Vista previa de la firma"
                      className="max-w-xs max-h-32 object-contain border border-gray-200 dark:border-gray-600 rounded"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUploadSignature}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Subiendo...' : 'Subir Firma'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          const fileInput = document.getElementById('signature-file') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Información sobre firmas */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Información Importante
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Tu firma será utilizada en documentos oficiales de la empresa</li>
                  <li>• Asegúrate de que la imagen sea clara y legible</li>
                  <li>• Formatos soportados: PNG, JPG, JPEG</li>
                  <li>• Tamaño máximo: 5MB</li>
                  <li>• La firma anterior será reemplazada al subir una nueva</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 