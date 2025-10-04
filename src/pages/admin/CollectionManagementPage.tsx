import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Collection } from '../../types/collection';
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';

const CollectionManagementPage: React.FC = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCollections = async () => {
            setIsLoading(true);
            try {
                const response = await axiosClient.get('/collections');
                setCollections(response.data || []);
                setError(null);
            } catch (err) {
                setError('Không thể tải danh sách bộ sưu tập.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCollections();
    }, []);

    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) {
            // Mock delete logic
            setCollections(collections.filter(c => c.id !== id));
            console.log(`Deleted collection ${id}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Bộ sưu tập</h1>
                <Link
                    to="/admin/collections/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                    <PlusCircle size={18} />
                    Tạo Bộ sưu tập
                </Link>
            </div>

            {isLoading ? (
                <p>Đang tải...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map(collection => (
                        <div key={collection.id} className="border rounded-lg overflow-hidden group">
                            <div className="relative">
                                <img src={collection.imageUrl} alt={collection.name} className="h-48 w-full object-cover" />
                                <div className="absolute top-2 right-2">
                                    {/* Dropdown can be implemented here */}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-800">{collection.name}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                                <div className="flex justify-end gap-2 mt-4">
                                     <Link to={`/admin/collections/edit/${collection.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
                                        <Edit size={14} />
                                        Sửa
                                    </Link>
                                     <button onClick={() => handleDelete(collection.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                        <Trash2 size={14} />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CollectionManagementPage;
