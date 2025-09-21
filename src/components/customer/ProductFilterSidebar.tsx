import React, { useState } from 'react';

// --- Reusable Accordion Component ---
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
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-4' : 'max-h-0'}`}>
            {children}
        </div>
    </div>
);


// --- Main ProductFilterSidebar Component ---

interface Filters {
  'price.greaterThanOrEqual'?: string;
  'price.lessThanOrEqual'?: string;
  'category.in'?: string; // Lọc theo nhiều danh mục
  'variants.color.equals'?: string; // Lọc theo màu sắc
}

interface ProductFilterSidebarProps {
    onApplyFilters: (filters: Filters) => void;
}

const categories = ['Áo Thun', 'Áo Sơ Mi', 'Quần Jeans', 'Váy', 'Áo Khoác', 'Đồ Ngủ'];
const colors = ['#000000', '#FFFFFF', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];
const colorNames: { [key: string]: string } = {
    '#000000': 'Đen',
    '#FFFFFF': 'Trắng',
    '#3b82f6': 'Xanh dương',
    '#ef4444': 'Đỏ',
    '#f59e0b': 'Vàng',
    '#8b5cf6': 'Tím'
};


const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({ onApplyFilters }) => {
    const [minPrice, setMinPrice] = useState('0');
    const [maxPrice, setMaxPrice] = useState('2000000');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedColor, setSelectedColor] = useState<string>('');
    
    const [openSections, setOpenSections] = useState({
        price: true,
        category: true,
        color: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };
    
    const handleApplyClick = () => {
        const newFilters: Filters = {};
        if (minPrice !== '0') newFilters['price.greaterThanOrEqual'] = minPrice;
        if (maxPrice !== '2000000') newFilters['price.lessThanOrEqual'] = maxPrice;
        
        // Cập nhật logic để thêm bộ lọc danh mục và màu sắc
        if (selectedCategories.length > 0) {
            newFilters['category.in'] = selectedCategories.join(',');
        }
        if (selectedColor) {
            newFilters['variants.color.equals'] = colorNames[selectedColor];
        }

        onApplyFilters(newFilters);
    };

    const handleResetClick = () => {
        setMinPrice('0');
        setMaxPrice('2000000');
        setSelectedCategories([]);
        setSelectedColor('');
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
      
      <AccordionItem title="Khoảng giá" isOpen={openSections.price} onToggle={() => toggleSection('price')}>
        <div className="px-1">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{Number(minPrice).toLocaleString('vi-VN')}đ</span>
                <span>{Number(maxPrice).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="relative h-1 bg-gray-200 rounded-full">
                <div className="absolute h-1 bg-indigo-500 rounded-full" style={{ 
                    left: `${(Number(minPrice) / 2000000) * 100}%`, 
                    right: `${100 - (Number(maxPrice) / 2000000) * 100}%` 
                }}></div>
                 <input type="range" min="0" max="2000000" step="50000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="absolute w-full h-1 opacity-0 cursor-pointer" />
                 <input type="range" min="0" max="2000000" step="50000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="absolute w-full h-1 opacity-0 cursor-pointer" />
            </div>
        </div>
      </AccordionItem>
      
      <AccordionItem title="Danh mục" isOpen={openSections.category} onToggle={() => toggleSection('category')}>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {categories.map(category => (
            <label key={category} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <span className="ml-3 text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem title="Màu sắc" isOpen={openSections.color} onToggle={() => toggleSection('color')}>
        <div className="flex flex-wrap gap-4">
           {colors.map(color => (
            <div key={color} className="relative group">
                <label className="cursor-pointer">
                <input 
                    type="radio" 
                    name="color" 
                    value={color}
                    checked={selectedColor === color}
                    onChange={() => setSelectedColor(color)}
                    className="sr-only peer" 
                />
                <span 
                    className={`h-9 w-9 block rounded-full border-2 transition-transform transform group-hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : 'border-gray-200'}`} 
                    style={{ backgroundColor: color }}
                ></span>
                </label>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">
                    {colorNames[color]}
                </div>
            </div>
          ))}
        </div>
      </AccordionItem>

      <button 
        onClick={handleApplyClick}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold mt-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        Áp dụng
      </button>
    </aside>
  );
};

export default ProductFilterSidebar;

