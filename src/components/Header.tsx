import React from 'react';
import { useSelector } from 'react-redux';
import { User, Bell, Settings } from 'lucide-react';
import { RootState } from '../store/store';

export const Header: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-[#2E7D32] dark:bg-gradient-to-r dark:from-[#2E7D32] dark:to-[#4CAF50] dark:bg-clip-text dark:text-transparent">
            PortalUci - RRHH
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <button className="p-2 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50] rounded-lg hover:bg-[#4CAF50]/10 dark:hover:bg-[#4CAF50]/20">
            <Bell className="w-5 h-5" />
          </button>
          
          {/* Configuración */}
          <button className="p-2 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50] rounded-lg hover:bg-[#4CAF50]/10 dark:hover:bg-[#4CAF50]/20">
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Información del usuario */}
          {user && (
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.empleado?.nombres || user.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.empleado?.oficio || user.roles?.[0]?.nombre || 'Sin cargo'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 