import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// Định nghĩa kiểu dữ liệu cho thông tin người dùng được giải mã từ token
interface User {
  sub: string; // Tên đăng nhập
  auth: string; // Chuỗi chứa các quyền, ví dụ: "ROLE_ADMIN,ROLE_USER"
  exp: number; // Thời gian hết hạn của token
}

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isLoading: boolean; // Thêm trạng thái loading để tránh render sai lúc đầu
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component để bao bọc ứng dụng và cung cấp context
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null); // Khởi tạo là null
  const [isLoading, setIsLoading] = useState(true);

  // useEffect chỉ chạy một lần lúc component mount để kiểm tra token từ localStorage
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
          localStorage.removeItem('accessToken'); // Xóa token hết hạn
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