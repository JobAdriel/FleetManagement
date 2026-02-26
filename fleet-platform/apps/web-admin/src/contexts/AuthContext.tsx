/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { buildApiUrl } from '../services/apiClient';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  roles_names?: string[];
  permissions_names?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, tenant_id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : {};

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && ('message' in data || 'error' in data)
            ? String((data as { message?: string; error?: string }).message || (data as { message?: string; error?: string }).error || 'Login failed')
            : 'Login failed';
        throw new Error(errorMessage);
      }

      const { user: loginUser, token: loginToken } = data;

      setUser(loginUser);
      setToken(loginToken);

      localStorage.setItem('auth_token', loginToken);
      localStorage.setItem('auth_user', JSON.stringify(loginUser));
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Cannot connect to API server. Check backend URL or Vite proxy settings.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    tenant_id: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, tenant_id }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      const { user: newUser, token: newToken } = data;

      setUser(newUser);
      setToken(newToken);

      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
