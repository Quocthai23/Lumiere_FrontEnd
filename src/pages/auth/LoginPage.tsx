import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axiosClient.post('/api/authenticate', {
                username,
                password,
                rememberMe: true,
            });

            const { id_token } = response.data;
            auth.login(id_token);

            
            setTimeout(() => {
                const decodedToken: { auth: string } = JSON.parse(atob(id_token.split('.')[1]));
                if (decodedToken.auth.includes('ROLE_ADMIN')) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            }, 100);

        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
            } else {
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
            console.error("Lỗi đăng nhập:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex justify-center items-center p-4">
            <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow-lg sm:rounded-2xl flex justify-center flex-1">
                {    }
                <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl xl:text-4xl font-extrabold text-center text-indigo-600 tracking-wide">
                            LUMIERE
                        </h1>
                        <div className="w-full flex-1 mt-10">
                            <div className="flex flex-col items-center">
                                <h1 className="text-2xl xl:text-3xl font-bold">
                                    Đăng nhập
                                </h1>
                                <p className="text-gray-500 mt-2">Chào mừng trở lại!</p>
                            </div>

                            <form className="mx-auto max-w-xs mt-8" onSubmit={handleSubmit}>
                                <div className="relative mb-5">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                                        type="text"
                                        placeholder="Tên đăng nhập"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="relative mb-5">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                                        type="password"
                                        placeholder="Mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm text-center font-semibold pb-2">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-5 tracking-wide font-semibold bg-indigo-600 text-gray-100 w-full py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none disabled:bg-indigo-400"
                                >
                                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    <span>{isLoading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
                                </button>
                                <p className="mt-8 text-sm text-gray-600 text-center">
                                    Chưa có tài khoản?{' '}
                                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800">
                                        Đăng ký ngay
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
                 {  }
                <div className="flex-1 bg-indigo-100 text-center hidden lg:flex rounded-r-2xl">
                    <div
                        className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://storage.googleapis.com/devitary-image-host.appspot.com/15848031292911696601-undraw_designer_life_w96d.svg')" }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;