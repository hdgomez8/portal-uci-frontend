import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, AlertCircle } from 'lucide-react';
import { login } from '../store/slices/authSlice';
import type { LoginCredentials } from '../types/auth';
import Loader from '../components/Loader';
import fondoUci from '../assets/uci-fondo.jpg';
import logoEmpresa from '../assets/logo_empresa.png';

export const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async (data: LoginCredentials) => {
    setLoading(true);
    setLoginError(null);
    try {
      await dispatch(login(data)).unwrap();
      navigate('/dashboard');
    } catch (error: any) {
      if (error && error.response) {
        if (error.response.status === 401) {
          setLoginError('Correo o contraseña incorrectos');
        } else if (error.response.status === 403) {
          setLoginError(error.response.data.message || 'Usuario inactivo. No puede iniciar sesión.');
        } else {
          setLoginError('Error al iniciar sesión. Intenta nuevamente.');
        }
      } else {
        setLoginError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Error de inicio de sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con overlay */}
      <img src={fondoUci} alt="Fondo UCI" className="absolute inset-0 w-full h-full object-cover z-0" style={{filter: 'blur(1px)'}} />
      <div className="absolute inset-0 bg-white/20 z-10" />
      <div className="w-full max-w-md backdrop-blur-lg bg-white/20 p-8 rounded-2xl shadow-neomorphic animate-fadeIn relative z-20">
        <div className="flex flex-col items-center mb-8">
          {/* Logo de la empresa */}
          <img src={logoEmpresa} alt="Logo Empresa" className="w-32 h-32 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-[#2E7D32] dark:text-[#4CAF50]">¡Bienvenido de nuevo!</h1>
          <p className="text-[#1B5E20] dark:text-[#66BB6A]">Inicia sesión en tu cuenta</p>
        </div>

        {loading ? (
          <Loader text="Iniciando sesión..." />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2E7D32] dark:text-[#4CAF50]">
                Correo electrónico
              </label>
              <input
                {...register('email', { 
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido'
                  }
                })}
                type="email"
                className="mt-1 block w-full px-3 py-2 bg-white/90 dark:bg-gray-800/90 border border-[#66BB6A] dark:border-[#4CAF50] rounded-md text-[#1B5E20] dark:text-white 
                  focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-colors
                  placeholder-[#2E7D32]/60 dark:placeholder-gray-400"
                placeholder="tu@empresa.com"
              />
              {errors.email && (
                <div className="mt-1 flex items-center text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2E7D32] dark:text-[#4CAF50]">
                Contraseña
              </label>
              <input
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
                type="password"
                className="mt-1 block w-full px-3 py-2 bg-white/90 dark:bg-gray-800/90 border border-[#66BB6A] dark:border-[#4CAF50] rounded-md text-[#1B5E20] dark:text-white 
                  focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-colors
                  placeholder-[#2E7D32]/60 dark:placeholder-gray-400"
                placeholder="••••••••"
              />
              {errors.password && (
                <div className="mt-1 flex items-center text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                  Recordarme
                </label>
              </div>
              <button type="button" className="text-sm text-cyan-400 hover:text-cyan-300">
                ¿Olvidaste tu contraseña?
              </button>
            </div> */}

            {loginError && (
              <div className="mt-4 flex items-center text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-[#2E7D32] via-[#4CAF50] to-[#66BB6A] 
                hover:from-[#1B5E20] hover:via-[#388E3C] hover:to-[#4CAF50] rounded-md text-white font-medium 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50]
                transform transition-all duration-300 hover:scale-[1.02]"
            >
              Iniciar Sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};