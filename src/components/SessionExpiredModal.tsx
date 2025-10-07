import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sesión Expirada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu sesión ha expirado por seguridad
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Por motivos de seguridad, tu sesión ha expirado después de un período de inactividad. 
            Necesitas iniciar sesión nuevamente para continuar.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Ir al Login</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
