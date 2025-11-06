import React, {createContext, useState, useEffect, type ReactNode} from 'react';
import { jwtDecode } from 'jwt-decode';


interface User {
  sub: string; 
  auth: string; 
  exp: number;
}
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isLoading: boolean; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedUser.exp > currentTime) {
          setUser(decodedUser);
          setAccessToken(token);
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error("Token không hợp lệ, đang xóa:", error);
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    try {
      const decodedUser: User = jwtDecode(token);
      setUser(decodedUser);
      setAccessToken(token);
    } catch (error) {
      console.error("Lỗi giải mã token khi đăng nhập:", error);
      localStorage.removeItem('accessToken');
      setUser(null);
      setAccessToken(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setAccessToken(null);
  };

  const isAuthenticated = () => !!user && !!accessToken;

  const isAdmin = () => {
      if (!user) return false;
      return user.auth?.includes('ROLE_ADMIN');
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated, isAdmin, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};