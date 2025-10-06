import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Bell, Settings, Menu, X } from 'lucide-react';
import { RootState } from '../store/store';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile Sidebar Toggle */}
          <button 
            className="lg:hidden p-2 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50] rounded-lg hover:bg-[#4CAF50]/10"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg sm:text-xl font-semibold text-[#2E7D32] dark:bg-gradient-to-r dark:from-[#2E7D32] dark:to-[#4CAF50] dark:bg-clip-text dark:text-transparent">
            PortalUci - RRHH
          </h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
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

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-[#2E7D32] hover:text-[#1B5E20] dark:text-[#66BB6A] dark:hover:text-[#4CAF50] rounded-lg hover:bg-[#4CAF50]/10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 space-y-2">
            {/* Notificaciones */}
            <button className="w-full flex items-center space-x-3 p-3 text-left text-[#2E7D32] hover:bg-[#4CAF50]/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notificaciones</span>
            </button>
            
            {/* Configuración */}
            <button className="w-full flex items-center space-x-3 p-3 text-left text-[#2E7D32] hover:bg-[#4CAF50]/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Configuración</span>
            </button>
            
            {/* Información del usuario */}
            {user && (
              <div className="flex items-center space-x-3 p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.empleado?.nombres || user.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.empleado?.oficio || user.roles?.[0]?.nombre || 'Sin cargo'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}; 