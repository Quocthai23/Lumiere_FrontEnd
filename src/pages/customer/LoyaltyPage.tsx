import React from 'react';
import { ShieldCheck, Star, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// Giả sử chúng ta có thể lấy thông tin chi tiết của customer, bao gồm cả 'tier'
// Trong mockApi, điều này được xử lý dựa trên user đang đăng nhập
// Bạn có thể cần một hook như `useCustomer()` trong thực tế
const MOCK_CURRENT_USER_TIER = 'GOLD'; // Giả lập hạng của user hiện tại

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
    const { user } = useAuth();
    // Trong một ứng dụng thực tế, bạn sẽ fetch thông tin khách hàng từ API bằng user.id
    // và lấy `tier` từ đó. Ở đây chúng ta giả lập.
    const currentUserTier = tiers.find(t => t.name === MOCK_CURRENT_USER_TIER) || tiers[0];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Chương trình Thành viên</h2>
      <p className="text-gray-600 mb-8">
        Cảm ơn bạn đã là một khách hàng thân thiết của Lumiere! Khám phá các quyền lợi đặc biệt dành riêng cho bạn.
      </p>

      <div className={`p-6 rounded-xl border-2 ${currentUserTier.color.replace('text-', 'border-')} ${currentUserTier.bgColor} mb-12`}>
        <div className="flex items-center">
            <currentUserTier.Icon className={`w-12 h-12 mr-4 ${currentUserTier.color}`} />
            <div>
                <p className="text-sm font-semibold text-gray-500">Hạng hiện tại của bạn</p>
                <h3 className={`text-3xl font-bold ${currentUserTier.color}`}>{currentUserTier.name}</h3>
            </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-6">Quyền lợi các hạng thành viên</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-6 rounded-lg shadow-md border transition-transform transform hover:-translate-y-1 ${
              tier.name === MOCK_CURRENT_USER_TIER ? 'border-2 border-indigo-500 bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center mb-4">
              <tier.Icon className={`w-8 h-8 mr-3 ${tier.color}`} />
              <h4 className={`text-2xl font-bold ${tier.color}`}>{tier.name}</h4>
            </div>
            <ul className="space-y-3">
              {tier.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoyaltyPage;
