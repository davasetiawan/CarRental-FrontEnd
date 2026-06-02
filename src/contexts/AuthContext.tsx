'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name?: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isTransitioning: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setTransitioning: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fungsi untuk decode JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cek token expired dan refresh jika perlu
  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.exp) {
          const currentTime = Date.now() / 1000;
          const timeLeft = decoded.exp - currentTime;
          
          // Jika token tersisa kurang dari 5 menit, refresh
          if (timeLeft < 300) {
            console.log('Token akan expired, perlu refresh');
            // Auto logout untuk keamanan
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
    };

    // Cek setiap 1 menit
    const interval = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Cek apakah token expired
        const decoded = parseJwt(token);
        if (decoded && decoded.exp) {
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Token expired, hapus
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            setUser(JSON.parse(storedUser));
          }
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const setTransitioning = (value: boolean) => {
    setIsTransitioning(value);
  };

  const login = async (email: string, password: string) => {
    setIsTransitioning(true);
    
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    
    localStorage.setItem('token', access_token);
    
    const profileResponse = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const profileData = profileResponse.data;
    const userData: User = {
      id: profileData.userId,
      email: profileData.email,
      role: profileData.role,
      name: profileData.email?.split('@')[0] || 'User'
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsTransitioning(false);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
  };

  const logout = () => {
    setIsTransitioning(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isTransitioning, login, register, logout, setTransitioning }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}