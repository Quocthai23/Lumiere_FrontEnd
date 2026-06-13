import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, Award, Ticket, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import httpClient from '../../utils/HttpClient';
import type { UserDTO } from '../../types/user';
import type { LoyaltyTierDTO } from '../../types/loyaltyTier';
import type { CustomerVoucherDTO } from '../../types/customerVoucher';

const tiers = [
  {
    name: 'BRONZE',
    Icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    benefits: [
      'Tích điểm 1% cho mỗi đơn hàng',
      'Ưu đãi độc quyền vào ngày sinh nhật',
      'Tiếp cận các sự kiện giảm giá sớm',
    ],
  },
  {
    name: 'SILVER',
    Icon: Star,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    benefits: [
      'Tất cả quyền lợi của hạng BRONZE',
      'Tích điểm 1.5% cho mỗi đơn hàng',
      'Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
      'Quà tặng đặc biệt mỗi quý',
    ],
  },
  {
    name: 'GOLD',
    Icon: ShieldCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    benefits: [
      'Tất cả quyền lợi của hạng SILVER',
      'Tích điểm 2% cho mỗi đơn hàng',
      'Miễn phí vận chuyển cho mọi đơn hàng',
      'Hỗ trợ khách hàng ưu tiên 24/7',
      'Sản phẩm độc quyền chỉ dành cho thành viên GOLD',
    ],
  },
];

const LoyaltyPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'loyalty' | 'vouchers'>('loyalty');
    const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTierDTO | null>(null);
    const [vouchers, setVouchers] = useState<CustomerVoucherDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated()) {
                setIsLoading(false);
                return;
            }

            try {
                // Lấy userId từ account endpoint
                const userResponse = await httpClient.get<UserDTO>('/account');
                const userId = userResponse.id;

                if (!userId) {
                    console.warn('Không tìm thấy userId');
                    setIsLoading(false);
                    return;
                }

                // Gọi API lấy loyalty tier
                try {
                    const tierResponse = await httpClient.get<LoyaltyTierDTO>(`/customers/loyalty-tier/user/${userId}`);
                    setLoyaltyTier(tierResponse);
                } catch (error) {
                    console.error('Lỗi khi lấy loyalty tier:', error);
                }

                // Gọi API lấy vouchers
                try {
                    const vouchersResponse = await httpClient.get<CustomerVoucherDTO[]>(`/customers/vouchers/user/${userId}`);
                    setVouchers(vouchersResponse || []);
                } catch (error) {
                    console.error('Lỗi khi lấy vouchers:', error);
                    setVouchers([]);
                }
            } catch (error) {
                console.error('Lỗi khi fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // Scroll to top khi chuyển sang tab loyalty hoặc khi có benefits từ API
    useEffect(() => {
        if (activeTab === 'loyalty' && loyaltyTier?.benefits && loyaltyTier.benefits.length > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab, loyaltyTier?.benefits]);

    const currentTierName = loyaltyTier?.tier || 'BRONZE';
    const currentUserTier = tiers.find(t => t.name === currentTierName) || tiers[0];

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Filter vouchers dựa trên cấu trúc mới
    const activeVouchers = vouchers.filter(v => 
        !v.used && 
        v.voucher.status === 'ACTIVE' && 
        (!v.voucher.endDate || new Date(v.voucher.endDate) > new Date())
    );
    const usedVouchers = vouchers.filter(v => v.used);
    const expiredVouchers = vouchers.filter(v => 
        !v.used && 
        (v.voucher.status === 'EXPIRED' || (v.voucher.endDate && new Date(v.voucher.endDate) <= new Date()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Chương trình Thành viên</h2>
            <p className="text-gray-600 mb-8">
                Cảm ơn bạn đã là một khách hàng thân thiết của Lumiere! Khám phá các quyền lợi đặc biệt dành riêng cho bạn.
            </p>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => {
                        setActiveTab('loyalty');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-6 py-3 font-semibold transition-colors ${
                        activeTab === 'loyalty'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Hạng thành viên
                </button>
                <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`px-6 py-3 font-semibold transition-colors relative ${
                        activeTab === 'vouchers'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Voucher của tôi
                    {activeVouchers.length > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeVouchers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Loyalty Tab Content */}
            {activeTab === 'loyalty' && (
                <>
                    <div className={`p-6 rounded-xl border-2 ${currentUserTier.color.replace('text-', 'border-')} ${currentUserTier.bgColor} mb-6`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <currentUserTier.Icon className={`w-12 h-12 mr-4 ${currentUserTier.color}`} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-500">Hạng hiện tại của bạn</p>
                                    <h3 className={`text-3xl font-bold ${currentUserTier.color}`}>{currentUserTier.name}</h3>
                                    {loyaltyTier && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Điểm tích lũy: <span className="font-semibold">{loyaltyTier.loyaltyPoints.toLocaleString('vi-VN')}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Benefits từ API - Hiển thị ở đầu */}
                    {loyaltyTier && loyaltyTier.benefits && loyaltyTier.benefits.length > 0 && (
                        <div className={`p-6 rounded-xl border-2 ${currentUserTier.color.replace('text-', 'border-')} ${currentUserTier.bgColor} mb-12`}>
                            <h3 className={`text-2xl font-bold ${currentUserTier.color} mb-4`}>Quyền lợi của bạn</h3>
                            <ul className="space-y-3">
                                {loyaltyTier.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        <span className="text-gray-700">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {/* Vouchers Tab Content */}
            {activeTab === 'vouchers' && (
                <div>
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Voucher của tôi</h3>
                        <p className="text-gray-600">Danh sách các voucher bạn đã nhận được</p>
                    </div>

                    {vouchers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Bạn chưa có voucher nào</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Active Vouchers */}
                            {activeVouchers.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Voucher đang hoạt động ({activeVouchers.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeVouchers.map((cv) => (
                                            <div key={cv.id} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h5 className="font-bold text-lg">Voucher</h5>
                                                        <p className="text-indigo-100 text-sm mt-1">{cv.voucher.code}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyCode(cv.voucher.code)}
                                                        className="p-2 hover:bg-white/20 rounded transition-colors"
                                                        title="Sao chép mã"
                                                    >
                                                        {copiedCode === cv.voucher.code ? (
                                                            <Check className="w-5 h-5" />
                                                        ) : (
                                                            <Copy className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="text-3xl font-bold">
                                                        {cv.voucher.type === 'PERCENTAGE' 
                                                            ? `${cv.voucher.value}%` 
                                                            : `${cv.voucher.value.toLocaleString('vi-VN')}đ`}
                                                    </p>
                                                    <p className="text-indigo-100 text-sm mt-1">
                                                        {cv.voucher.type === 'PERCENTAGE' ? 'Giảm giá theo phần trăm' : 'Giảm giá cố định'}
                                                    </p>
                                                </div>
                                                {cv.voucher.endDate && (
                                                    <p className="text-indigo-100 text-xs">
                                                        HSD: {formatDate(cv.voucher.endDate)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Used Vouchers */}
                            {usedVouchers.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Voucher đã sử dụng ({usedVouchers.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {usedVouchers.map((cv) => (
                                            <div key={cv.id} className="bg-gray-200 rounded-lg p-6 border-2 border-gray-300 opacity-75">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h5 className="font-bold text-lg text-gray-700">Voucher</h5>
                                                        <p className="text-gray-500 text-sm mt-1">{cv.voucher.code}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded">Đã dùng</span>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="text-2xl font-bold text-gray-600">
                                                        {cv.voucher.type === 'PERCENTAGE' 
                                                            ? `${cv.voucher.value}%` 
                                                            : `${cv.voucher.value.toLocaleString('vi-VN')}đ`}
                                                    </p>
                                                </div>
                                                {cv.giftedAt && (
                                                    <p className="text-gray-500 text-xs">
                                                        Nhận vào: {formatDate(cv.giftedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expired Vouchers */}
                            {expiredVouchers.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Voucher đã hết hạn ({expiredVouchers.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {expiredVouchers.map((cv) => (
                                            <div key={cv.id} className="bg-gray-200 rounded-lg p-6 border-2 border-gray-300 opacity-75">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h5 className="font-bold text-lg text-gray-700">Voucher</h5>
                                                        <p className="text-gray-500 text-sm mt-1">{cv.voucher.code}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-red-400 text-white text-xs rounded">Hết hạn</span>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="text-2xl font-bold text-gray-600">
                                                        {cv.voucher.type === 'PERCENTAGE' 
                                                            ? `${cv.voucher.value}%` 
                                                            : `${cv.voucher.value.toLocaleString('vi-VN')}đ`}
                                                    </p>
                                                </div>
                                                {cv.voucher.endDate && (
                                                    <p className="text-gray-500 text-xs">
                                                        HSD: {formatDate(cv.voucher.endDate)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoyaltyPage;
