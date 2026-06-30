
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cars_user_session');
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('cars_user_session', JSON.stringify(userData));
  };

  useEffect(() => {
    // Revert to simple local storage check
    const savedSession = localStorage.getItem('cars_user_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('cars_user_session');
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Initializing Core Logic...</p>
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
