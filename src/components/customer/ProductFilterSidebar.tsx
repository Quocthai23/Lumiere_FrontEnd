import React, { useEffect, useState } from 'react';
import httpClient from '../../utils/HttpClient'; // hoặc đường dẫn/axios client của bạn

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center py-4 text-left text-gray-800 hover:bg-gray-50 focus:outline-none"
        >
            <span className="font-semibold">{title}</span>
            <svg
                className={`w-5 h-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
        <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 py-4' : 'max-h-0'
            }`}
        >
            {children}
        </div>
    </div>
);

// ==== Types ====

interface Filters {
    'price.greaterThanOrEqual'?: string;
    'price.lessThanOrEqual'?: string;
    'categoryId.in'?: string;
}

interface ProductFilterSidebarProps {
    onApplyFilters: (filters: Filters) => void;
}

interface Category {
    id: number;
    name: string;
}

const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({ onApplyFilters }) => {
    const [minPrice, setMinPrice] = useState('0');
    const [maxPrice, setMaxPrice] = useState('200000000');

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [openSections, setOpenSections] = useState({
        price: true,
        category: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCheckboxChange = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        value: string
    ) => {
        setter((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await httpClient.get<Category[]>('/categories?size=1000&sort=id,asc');
                setCategories(res);
            } catch (e) {
                console.error('Failed to load categories', e);
            }
        };

        fetchCategories();
    }, []);

    const handleApplyClick = () => {
        const newFilters: Filters = {};

        if (minPrice !== '0') newFilters['price.greaterThanOrEqual'] = minPrice;
        if (maxPrice !== '200000000') newFilters['price.lessThanOrEqual'] = maxPrice;

        if (selectedCategories.length > 0) {
            newFilters['categoryId.in'] = selectedCategories.join(',');
        }

        onApplyFilters(newFilters);
    };

    const handleResetClick = () => {
        setMinPrice('0');
        setMaxPrice('200000000');
        setSelectedCategories([]);
        onApplyFilters({});
    };

    return (
        <aside className="w-full bg-white p-6 rounded-2xl shadow-lg border h-fit sticky top-24">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Bộ lọc</h3>
                <button
                    onClick={handleResetClick}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                    Xóa tất cả
                </button>
            </div>

            {/* Khoảng giá */}
            <AccordionItem
                title="Khoảng giá"
                isOpen={openSections.price}
                onToggle={() => toggleSection('price')}
            >
                <div className="px-1 space-y-3">

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Giá tối thiểu
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-2 flex items-center text-gray-500 text-sm">
                                    đ
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Giá tối đa
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-2 flex items-center text-gray-500 text-sm">
                                    đ
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="200000000"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Danh mục */}
            <AccordionItem
                title="Danh mục"
                isOpen={openSections.category}
                onToggle={() => toggleSection('category')}
            >
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {categories.map((category) => (
                        <label
                            key={category.id}
                            className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(String(category.id))}
                                onChange={() =>
                                    handleCheckboxChange(setSelectedCategories, String(category.id))
                                }
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-gray-700">{category.name}</span>
                        </label>
                    ))}
                </div>
            </AccordionItem>

            <button
                onClick={handleApplyClick}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold mt-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                Áp dụng
            </button>
        </aside>
    );
};

export default ProductFilterSidebar;
