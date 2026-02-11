import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { decodeToken, JwtPayload } from '../utils/auth.utils';
import { View } from '../types';
import { viewsService } from '../services/view.service';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: JwtPayload | null;
  access_token: string | null;
  userViews: View[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccessToView: (viewKey: string) => boolean;
  hasAccessToPath: (path: string) => boolean;
  refreshUserViews: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [userViews, setUserViews] = useState<View[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserViews = async (userId: string, tenantId: string) => {
    try {
      const response = await viewsService.getUserViews(userId, tenantId);
      console.log(response)
      setUserViews(response.data);
    } catch (error) {
      console.error('Error loading user views:', error);
      setUserViews([]);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setAccessToken(storedToken);
        setUser(decoded);
        if (decoded.userId && decoded.tenantId) {
          loadUserViews(decoded.userId, decoded.tenantId);
        }
      } else {
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken } = response.data;
      
      localStorage.setItem('access_token', accessToken);
      setAccessToken(accessToken);
      
      const decoded = decodeToken(accessToken);
      setUser(decoded);

      if (decoded?.userId && decoded?.tenantId) {
        await loadUserViews(decoded.userId, decoded.tenantId);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
    setUserViews([]);
  };

  const refreshUserViews = async () => {
    if (user?.userId && user?.tenantId) {
      await loadUserViews(user.userId, user.tenantId);
    }
  };

  const hasAccessToView = (viewKey: string): boolean => {
    return true
    return userViews.some(view => view.key === viewKey);
  };

  const hasAccessToPath = (path: string): boolean => {
    return true
    return userViews.some(view => view.path === path);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        access_token,
        userViews,
        login,
        logout,
        isAuthenticated: !!access_token && !!user,
        isLoading,
        hasAccessToView,
        hasAccessToPath,
        refreshUserViews,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};