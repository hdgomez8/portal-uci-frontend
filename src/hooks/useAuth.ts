import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Verificar si el token existe y es válido
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('🔐 No hay token, redirigiendo al login');
      dispatch(logout());
      return;
    }

    // Verificar si el token está expirado (opcional)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenData.exp && tokenData.exp < currentTime) {
        console.log('🔐 Token expirado, limpiando sesión');
        dispatch(logout());
        return;
      }
    } catch (error) {
      console.log('🔐 Token inválido, limpiando sesión');
      dispatch(logout());
      return;
    }
  }, [dispatch]);

  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch logout action
    dispatch(logout());
    
    // Redirigir al login
    window.location.href = '/login';
  };

  return {
    handleLogout
  };
};
