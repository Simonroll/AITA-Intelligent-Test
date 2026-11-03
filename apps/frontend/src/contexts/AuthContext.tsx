import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => Promise<boolean>;
  updateUser: (updated: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('aita_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('aita_token');
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const expired = () => {
      localStorage.removeItem('aita_token');
      localStorage.removeItem('aita_user');
      localStorage.removeItem('aita_refresh_token');
      setUser(null);
      setToken(null);
    };

    const refreshed = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data?.token) localStorage.setItem('aita_token', data.token);
      if (data?.refreshToken) localStorage.setItem('aita_refresh_token', data.refreshToken);
      if (data?.user) localStorage.setItem('aita_user', JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
    };

    window.addEventListener('aita-session-expired', expired);
    window.addEventListener('aita-session-refreshed', refreshed);

    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);

    // Verify session with backend if we have a token
    void apiRequest<User>('/auth/me')
      .then(result => {
        if (active) {
          if (result.success && result.data) {
            setUser(result.data);
            localStorage.setItem('aita_user', JSON.stringify(result.data));
          } else {
            // Token is invalid/expired
            localStorage.removeItem('aita_token');
            localStorage.removeItem('aita_user');
            localStorage.removeItem('aita_refresh_token');
            setUser(null);
            setToken(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      })
      .finally(() => {
        clearTimeout(safetyTimer);
      });

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('aita-session-expired', expired);
      window.removeEventListener('aita-session-refreshed', refreshed);
    };
  }, []);

  const login = useCallback((newToken: string, newUser: User, refreshToken?: string) => {
    localStorage.setItem('aita_token', newToken);
    localStorage.setItem('aita_user', JSON.stringify(newUser));
    if (refreshToken) {
      localStorage.setItem('aita_refresh_token', refreshToken);
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('aita_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = async () => {
    const refreshToken = localStorage.getItem('aita_refresh_token');
    const result = await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    localStorage.removeItem('aita_token');
    localStorage.removeItem('aita_user');
    localStorage.removeItem('aita_refresh_token');
    setUser(null);
    setToken(null);
    return !result.success ? false : true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
