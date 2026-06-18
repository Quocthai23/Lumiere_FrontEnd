import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import httpClient from '../../utils/HttpClient';
import type { Voucher } from '../../types/voucher';
import type { CustomerVoucherDTO } from '../../types/customerVoucher';
import type { UserDTO } from '../../types/user';
import { Ticket, Check, Clock, Percent, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomerVoucherPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [claimedVouchers, setClaimedVouchers] = useState<CustomerVoucherDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 9;

    const fetchVouchers = async (page: number) => {
        if (!isAuthenticated()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Lấy userId từ account endpoint (chỉ lần đầu)
            if (!userId) {
                const userResponse = await httpClient.get<UserDTO>('/account');
                const currentUserId = userResponse.id;
                setUserId(currentUserId ?? null);

                if (!currentUserId) {
                    console.warn('Không tìm thấy userId');
                    setIsLoading(false);
                    return;
                }

                // Lấy danh sách voucher đã claim
                try {
                    const claimedResponse = await httpClient.get<CustomerVoucherDTO[]>(
                        `/customers/vouchers/user/${currentUserId}`
                    );
                    setClaimedVouchers(claimedResponse || []);
                } catch (error) {
                    console.error('Lỗi khi lấy vouchers đã claim:', error);
                    setClaimedVouchers([]);
                }
            }

            // Lấy danh sách voucher available với pagination
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
            const response = await fetch(
                `${baseUrl}/vouchers?availableOnly=true&page=${page}&size=${pageSize}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const vouchersData: Voucher[] = await response.json();
            
            // Lấy pagination info từ headers (JHipster sử dụng X-Total-Count)
            const totalElementsHeader = 
                response.headers.get('X-Total-Count') || 
                response.headers.get('x-total-count') ||
                response.headers.get('X-Total-Elements') ||
                response.headers.get('x-total-elements');
            
            let totalElementsValue = vouchersData.length;
            if (totalElementsHeader) {
                const parsed = parseInt(totalElementsHeader, 10);
                if (!isNaN(parsed)) {
                    totalElementsValue = parsed;
                }
            }
            
            setVouchers(vouchersData || []);
            setTotalElements(totalElementsValue);
            setTotalPages(Math.ceil(totalElementsValue / pageSize));
        } catch (error) {
            console.error('Lỗi khi fetch vouchers:', error);
            setVouchers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers(currentPage);
    }, [currentPage, isAuthenticated]);

    const isVoucherClaimed = (voucherId: number): boolean => {
        return claimedVouchers.some(cv => cv.voucher?.id === voucherId);
    };

    const handleClaimVoucher = async (voucherId: number) => {
        if (!userId) {
            alert('Vui lòng đăng nhập để nhận mã giảm giá.');
            return;
        }

        if (isVoucherClaimed(voucherId)) {
            alert('Bạn đã nhận mã giảm giá này rồi.');
            return;
        }

        setClaimingId(voucherId);
        try {
            await httpClient.post(`/vouchers/${voucherId}/claim`);
            alert('Nhận mã giảm giá thành công!');
            
            // Refresh danh sách voucher đã claim
            const claimedResponse = await httpClient.get<CustomerVoucherDTO[]>(
                `/customers/vouchers/user/${userId}`
            );
            setClaimedVouchers(claimedResponse || []);
            
            // Refresh danh sách voucher
            fetchVouchers(currentPage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Không thể nhận mã giảm giá. Vui lòng thử lại.';
            alert(errorMessage);
        } finally {
            setClaimingId(null);
        }
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Không giới hạn';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!isAuthenticated()) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Vui lòng đăng nhập để xem mã giảm giá.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mã Giảm Giá</h1>
                <p className="text-gray-600">Nhận các mã giảm giá hấp dẫn từ chúng tôi</p>
            </div>

            {vouchers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Ticket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Hiện tại không có mã giảm giá nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map((voucher) => {
                        const isClaimed = isVoucherClaimed(voucher.id);
                        const isClaiming = claimingId === voucher.id;

                        return (
                            <div
                                key={voucher.id}
                                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                                    isClaimed ? 'border-green-500' : 'border-gray-200'
                                }`}
                            >
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <Ticket className="w-8 h-8" />
                                        {isClaimed && (
                                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                                <Check className="w-4 h-4" />
                                                Đã nhận
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{voucher.code}</h3>
                                    <div className="flex items-center gap-2">
                                        {voucher.type === 'PERCENTAGE' ? (
                                            <>
                                                <Percent className="w-5 h-5" />
                                                <span className="text-lg font-semibold">
                                                    {voucher.value}%
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <DollarSign className="w-5 h-5" />
                                                <span className="text-lg font-semibold">
                                                    {voucher.value.toLocaleString('vi-VN')} ₫
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="text-sm text-gray-600">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Từ: {formatDate(voucher.startDate)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Đến: {formatDate(voucher.endDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {voucher.usageLimit && voucher.usageLimit > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>Đã sử dụng</span>                                   
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${Math.min(
                                                            ((voucher.usageCount || 0) / voucher.usageLimit) * 100,
                                                            100
                                                        )}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-right">
                                                {Math.round(((voucher.usageCount || 0) / voucher.usageLimit) * 100)}% đã sử dụng
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleClaimVoucher(voucher.id)}
                                        disabled={isClaimed || isClaiming}
                                        className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
                                            isClaimed
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    >
                                        {isClaiming
                                            ? 'Đang xử lý...'
                                            : isClaimed
                                            ? 'Đã nhận'
                                            : 'Nhận mã'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`p-2 rounded-md ${
                            currentPage === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                            // Hiển thị tối đa 5 trang
                            if (
                                page === 0 ||
                                page === totalPages - 1 ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-md font-semibold ${
                                            currentPage === page
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                    >
                                        {page + 1}
                                    </button>
                                );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-2">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={`p-2 rounded-md ${
                            currentPage >= totalPages - 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                    Trang {currentPage + 1} / {totalPages} ({totalElements} mã giảm giá)
                </div>
            )}
        </div>
    );
};

export default CustomerVoucherPage;

