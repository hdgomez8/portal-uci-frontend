import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  ClipboardCheck, 
  Calendar, 
  Briefcase, 
  RefreshCcw,
  User
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { ThemeToggle } from './ThemeToggle';
import { RootState } from '../store/store';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Panel de Control', permiso: null },
  { path: '/permissions-employees', icon: ClipboardCheck, label: 'Permisos', permiso: null },
  { path: '/shift-change', icon: RefreshCcw, label: 'Cambio de Turno', permiso: null },
  { path: '/vacations', icon: Calendar, label: 'Vacaciones', permiso: null },
  { path: '/severance', icon: Briefcase, label: 'Cesantías', permiso: null },
  { path: '/employees', icon: Users, label: 'Empleados', permiso: 'VER_EMPLEADOS' },
  { path: '/administration', icon: Settings, label: 'Administración', permiso: 'VER_ADMINISTRACION' },
  { path: '/profile', icon: User, label: 'Mi Perfil', permiso: null },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // Obtengo los permisos del usuario (de todos sus roles)
  const permisosUsuario = user?.roles?.flatMap((rol) => rol.permisos?.map((p) => p.nombre)) || [];

  // Filtrar elementos del menú según permisos
  const menuItemsFiltrados = menuItems.filter(({ permiso }) => {
    // Elementos sin permiso requerido siempre se muestran
    if (permiso === null) return true;
    
    // Para el módulo de empleados, mostrar si tiene el permiso O si es administrador
    if (permiso === 'VER_EMPLEADOS') {
      return permisosUsuario.includes(permiso) || 
             user?.roles?.some(rol => rol.nombre === 'ADMINISTRADOR' || rol.nombre === 'SUPER ADMIN');
    }
    
    // Para otros permisos, verificar normalmente
    return permisosUsuario.includes(permiso);
  });

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className={`
      fixed top-0 left-0 h-full bg-white dark:bg-gray-900 
      shadow-lg transition-all duration-300 ease-in-out z-50
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-[#2E7D32] dark:bg-gradient-to-r dark:from-[#2E7D32] dark:to-[#4CAF50] dark:bg-clip-text dark:text-transparent">
            RRHH
          </h1>
        )}
        <button
          onClick={() => onToggleCollapse(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
        </button>
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {menuItemsFiltrados.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex items-center space-x-3 p-3 rounded-lg transition-colors
              ${isActive 
                ? 'bg-gradient-to-r from-[#2E7D32]/10 to-[#4CAF50]/10 text-[#1B5E20] dark:text-[#4CAF50]' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Icon className="w-6 h-6" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Información del usuario */}
      {user && (
        <div className="p-4 border-t dark:border-gray-800">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 mb-3">
              {/* Foto de perfil del usuario */}
              {(user.empleado as any)?.foto_perfil ? (
                <img 
                  src={`http://localhost:5555/uploads/perfiles/${(user.empleado as any).foto_perfil}`}
                  alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    // Si la imagen falla, mostrar el ícono por defecto
                    const target = e.currentTarget as HTMLImageElement;
                    const nextSibling = target.nextElementSibling as HTMLElement;
                    if (target && nextSibling) {
                      target.style.display = 'none';
                      nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`w-8 h-8 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-full flex items-center justify-center ${(user.empleado as any)?.foto_perfil ? 'hidden' : ''}`}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.empleado?.nombres || user.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.roles?.[0]?.nombre || user.empleado?.oficio || 'Sin rol'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              {/* Foto de perfil del usuario (versión colapsada) */}
              {(user.empleado as any)?.foto_perfil ? (
                <img 
                  src={`http://localhost:5555/uploads/perfiles/${(user.empleado as any).foto_perfil}`}
                  alt="Foto de perfil"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                  title={`${user.empleado?.nombres || user.name || 'Usuario'} - ${user.roles?.[0]?.nombre || user.empleado?.oficio || 'Sin rol'}`}
                  onError={(e) => {
                    // Si la imagen falla, mostrar el ícono por defecto
                    const target = e.currentTarget as HTMLImageElement;
                    const nextSibling = target.nextElementSibling as HTMLElement;
                    if (target && nextSibling) {
                      target.style.display = 'none';
                      nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-8 h-8 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-full flex items-center justify-center cursor-pointer ${(user.empleado as any)?.foto_perfil ? 'hidden' : ''}`}
                title={`${user.empleado?.nombres || user.name || 'Usuario'} - ${user.roles?.[0]?.nombre || user.empleado?.oficio || 'Sin rol'}`}
              >
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
