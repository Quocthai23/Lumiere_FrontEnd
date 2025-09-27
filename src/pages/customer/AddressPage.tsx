import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Address } from '../../types/address';
import AddressFormModal from '../../components/customer/AddressFormModal';
import { useAuth } from '../../hooks/useAuth';

const AddressPage: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const { user } = useAuth();

    // NOTE: In a real app, the customerId would come from the logged-in user context.
    // For this mock setup, we'll assume customerId is 1.
    const MOCK_CUSTOMER_ID = 1; 

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get(`/addresses?customerId.equals=${MOCK_CUSTOMER_ID}`);
            setAddresses(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách địa chỉ.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (address: Address) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
    };

    const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'customerId'> & { id?: number }) => {
        const payload = { ...addressData, customerId: MOCK_CUSTOMER_ID };
        try {
            if (editingAddress) {
                await axiosClient.put(`/addresses/${editingAddress.id}`, payload);
            } else {
                await axiosClient.post('/addresses', payload);
            }
            handleCloseModal();
            fetchAddresses();
        } catch (err) {
            console.error("Lỗi khi lưu địa chỉ:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    const handleDeleteAddress = async (addressId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            try {
                await axiosClient.delete(`/addresses/${addressId}`);
                fetchAddresses();
            } catch (err) {
                 console.error("Lỗi khi xóa địa chỉ:", err);
                 alert("Đã có lỗi xảy ra.");
            }
        }
    }
    
    const handleSetDefault = async (addressId: number) => {
        try {
            await axiosClient.patch(`/addresses/${addressId}/set-default`, {});
            fetchAddresses();
        } catch (err) {
            console.error("Lỗi khi đặt làm mặc định:", err);
            alert("Đã có lỗi xảy ra.");
        }
    }


    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-bold text-gray-900">Sổ địa chỉ</h2>
                 <button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Thêm địa chỉ mới
                </button>
            </div>

            {isLoading && <p>Đang tải...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!isLoading && !error && (
                <div className="space-y-4">
                    {addresses.map(addr => (
                        <div key={addr.id} className="p-4 border rounded-lg bg-white flex justify-between items-start">
                            <div>
                                <p className="font-bold">{addr.fullName} {addr.isDefault && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-2">Mặc định</span>}</p>
                                <p className="text-gray-600">{addr.phone}</p>
                                <p className="text-gray-600">{addr.street}, {addr.city}</p>
                            </div>
                            <div className="flex space-x-2">
                                {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id)} className="text-sm text-gray-500 hover:text-indigo-600">Đặt làm mặc định</button>}
                                <button onClick={() => handleOpenModalForEdit(addr)} className="text-sm text-indigo-600 hover:underline">Sửa</button>
                                <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm text-red-600 hover:underline">Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <AddressFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAddress}
                address={editingAddress}
            />
        </div>
    );
};

export default AddressPage;
