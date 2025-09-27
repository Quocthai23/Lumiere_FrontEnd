import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  category?: string;
  productName?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ category, productName }) => {
  // Xây dựng danh sách các mục breadcrumb một cách linh hoạt
  const items = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Sản phẩm', href: '/products' },
  ];

  if (category) {
    items.push({ name: category, href: `/products?category=${encodeURIComponent(category)}` });
  }

  if (productName) {
    // Mục cuối cùng không cần link
    items.push({ name: productName, href: '#' });
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
          <li key={item.name} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
            )}
            <Link
              to={item.href}
              className={`text-sm font-medium ${
                index === items.length - 1
                  ? 'text-gray-500 cursor-default'
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
              // Vô hiệu hóa sự kiện click cho mục cuối cùng
              onClick={(e) => {
                if (item.href === '#') e.preventDefault();
              }}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;