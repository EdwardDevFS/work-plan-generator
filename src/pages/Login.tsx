import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
          err.message ??
          'Error al iniciar sesión.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-10">

      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LADO IZQUIERDO - LOGIN */}
        <div className="p-16 flex flex-col justify-center">

          <div className="mb-12">
            <h1 className="text-2xl font-semibold text-gray-800">
              Inicia sesión en tu cuenta
            </h1>
            <p className="text-gray-500 text-sm mt-3">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Correo */}
            <div>
              <label className="text-sm text-gray-600 block mb-3">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="text-sm text-gray-600 block mb-3">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-4 
                             bg-transparent border-none p-0 
                             text-gray-400 hover:text-gray-600 
                             focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                Recordarme por 30 días
              </label>
              <button
                type="button"
                className="bg-transparent border-none p-0 text-blue-600 hover:underline focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white border-none font-medium py-4 rounded-xl transition disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

          </form>
        </div>

        {/* LADO DERECHO - PANEL IMAGEN */}
        <div className="hidden lg:block p-6 bg-white">

          <div className="relative w-full h-full rounded-2xl overflow-hidden">

            <img
              src="/image/imagenLog.webp"
              alt="Vista previa del sistema"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20"></div>

            <div className="absolute top-10 left-10 text-white z-10 max-w-lg">
              <h2 className="text-3xl font-semibold leading-snug">
                Potenciando comunidades
                <br />
                más saludables
              </h2>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
