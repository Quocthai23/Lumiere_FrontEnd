import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ActivateAccountPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const key = searchParams.get('key');
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const activateAccount = async () => {
            if (!key) {
                setStatus('error');
                setMessage('Thiếu mã kích hoạt. Vui lòng kiểm tra lại email.');
                return;
            }

            try {
                await axiosClient.get(`/activate?key=${key}`);
                setStatus('success');
                setMessage('Tài khoản của bạn đã được kích hoạt thành công!');
                
                // Chuyển đến trang đăng nhập sau 3 giây
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                if (err.response && err.response.status === 404) {
                    setMessage('Mã kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.');
                } else if (err.response && err.response.status === 400) {
                    setMessage('Tài khoản đã được kích hoạt trước đó.');
                } else {
                    setMessage('Đã có lỗi xảy ra khi kích hoạt tài khoản. Vui lòng thử lại sau.');
                }
                console.error("Lỗi kích hoạt tài khoản:", err);
            }
        };

        activateAccount();
    }, [key, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex justify-center items-center p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl xl:text-4xl font-extrabold text-center text-indigo-600 tracking-wide mb-8">
                        LUMIERE
                    </h1>

                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                            <h2 className="text-2xl xl:text-3xl font-bold mb-4">
                                Đang kích hoạt tài khoản...
                            </h2>
                            <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            </div>
                            <h2 className="text-2xl xl:text-3xl font-bold mb-4 text-green-600">
                                Kích hoạt thành công!
                            </h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <p className="text-sm text-gray-500 mb-6">
                                Bạn sẽ được chuyển đến trang đăng nhập trong vài giây...
                            </p>
                            <Link
                                to="/login"
                                className="inline-block tracking-wide font-semibold bg-indigo-600 text-gray-100 px-8 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out"
                            >
                                Đăng nhập ngay
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mb-6">
                                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                            </div>
                            <h2 className="text-2xl xl:text-3xl font-bold mb-4 text-red-600">
                                Kích hoạt thất bại
                            </h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <div className="space-y-3">
                                <Link
                                    to="/register"
                                    className="block tracking-wide font-semibold bg-indigo-600 text-gray-100 px-8 py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out"
                                >
                                    Đăng ký lại
                                </Link>
                                <Link
                                    to="/login"
                                    className="block tracking-wide font-semibold bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 ease-in-out"
                                >
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivateAccountPage;













