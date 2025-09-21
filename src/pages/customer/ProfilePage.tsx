import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import type { UserDTO } from '../../types/user';

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: React.ReactNode;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
    </div>
);

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    if (!message) return null;

    const baseClasses = "px-4 py-3 rounded-lg relative mb-4 text-sm";
    const typeClasses = {
        success: "bg-green-100 border border-green-400 text-green-700",
        error: "bg-red-100 border border-red-400 text-red-700",
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <span className="block sm:inline">{message}</span>
            <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className={`fill-current h-6 w-6 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
            </button>
        </div>
    );
};


const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [infoSuccess, setInfoSuccess] = useState('');
    const [infoError, setInfoError] = useState('');
    const [isInfoLoading, setIsInfoLoading] = useState(false);


    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);


    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const response = await axiosClient.get<UserDTO>('/account');
                setFormData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || ''
                });
            } catch (error) {
                setInfoError('Không thể tải thông tin tài khoản.');
            }
        };
        fetchAccount();
    }, []);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInfoSuccess('');
        setInfoError('');
        setIsInfoLoading(true);
        try {
            await axiosClient.post('/account', formData);
            setInfoSuccess('Cập nhật thông tin thành công!');
        } catch (error) {
            setInfoError('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsInfoLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Mật khẩu mới không khớp.');
            return;
        }

        setIsPasswordLoading(true);
        try {
            await axiosClient.post('/account/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess('Đổi mật khẩu thành công!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                setPasswordError('Mật khẩu hiện tại không đúng.');
            } else {
                setPasswordError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };
    
    const getInitials = (firstName?: string, lastName?: string) => {
        const first = firstName ? firstName[0] : '';
        const last = lastName ? lastName[0] : '';
        return (first + last).toUpperCase() || (user?.sub?.[0] || '').toUpperCase();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(formData.firstName, formData.lastName)}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : user?.sub}
                    </h2>
                    <p className="text-gray-500">{formData.email}</p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'profile'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'password'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Đổi mật khẩu
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'profile' && (
                    <form onSubmit={handleInfoSubmit} className="space-y-6 max-w-lg">
                        <h3 className="text-lg font-semibold text-gray-900">Cập nhật thông tin</h3>
                        <Notification message={infoSuccess} type="success" onClose={() => setInfoSuccess('')} />
                        <Notification message={infoError} type="error" onClose={() => setInfoError('')} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                <InputWithIcon
                                    icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                                    type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleInfoChange}
                                />
                            </div>
                             <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
                                <InputWithIcon
                                    icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                                    type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInfoChange}
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                             <InputWithIcon
                                icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                type="email" name="email" id="email" value={formData.email} onChange={handleInfoChange}
                            />
                        </div>
                        
                        <button type="submit" disabled={isInfoLoading} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            {isInfoLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </form>
                )}

                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                        <h3 className="text-lg font-semibold text-gray-900">Thay đổi mật khẩu</h3>
                        <Notification message={passwordSuccess} type="success" onClose={() => setPasswordSuccess('')} />
                        <Notification message={passwordError} type="error" onClose={() => setPasswordError('')} />
                         <div>
                            <label htmlFor="currentPassword"  className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                            <InputWithIcon
                                icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required
                            />
                        </div>
                         <div>
                            <label htmlFor="newPassword"  className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                             <InputWithIcon
                                icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required
                            />
                        </div>
                         <div>
                            <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                             <InputWithIcon
                                icon={<svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required
                            />
                        </div>
                         <button type="submit" disabled={isPasswordLoading} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            {isPasswordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
