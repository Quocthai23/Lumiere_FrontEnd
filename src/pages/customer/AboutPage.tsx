import React from 'react';

const blogPosts = [
  {
    id: 1,
    title: '10 Mẹo Phối Đồ Mùa Thu Cực Chất',
    imageUrl: 'https://placehold.co/600x400/a78bfa/ffffff?text=Fall+Fashion',
    excerpt: 'Khám phá những cách phối đồ thông minh để bạn luôn nổi bật và ấm áp trong mùa thu này...',
    link: '#',
  },
  {
    id: 2,
    title: 'Bí Quyết Chọn Vải Jean Hoàn Hảo',
    imageUrl: 'https://placehold.co/600x400/7c3aed/ffffff?text=Denim+Guide',
    excerpt: 'Từ chất liệu, độ co giãn đến phom dáng, hãy cùng tìm hiểu cách chọn chiếc quần jean sinh ra dành cho bạn.',
    link: '#',
  },
  {
    id: 3,
    title: 'Xu Hướng Phụ Kiện Tối Giản Lên Ngôi',
    imageUrl: 'https://placehold.co/600x400/6d28d9/ffffff?text=Accessories',
    excerpt: 'Ít hơn là nhiều hơn. Tìm hiểu vì sao phong cách tối giản lại đang thống trị thế giới phụ kiện năm nay.',
    link: '#',
  },
];


const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-96 bg-indigo-800 text-white flex items-center justify-center rounded-lg overflow-hidden">
        <img 
            src="https://placehold.co/1200x400/312e81/ffffff?text=Our+Story" 
            alt="Lumiere Brand" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">Về Lumiere</h1>
          <p className="mt-4 text-xl text-indigo-200 max-w-2xl mx-auto">
            Nơi thời trang không chỉ là trang phục, mà là câu chuyện về chính bạn.
          </p>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Sứ mệnh của chúng tôi</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
                Tại Lumiere, chúng tôi tin rằng mỗi người đều có một phong cách riêng biệt. Sứ mệnh của chúng tôi là mang đến những sản phẩm chất lượng, hợp xu hướng và bền vững, giúp bạn tự tin thể hiện cá tính độc đáo của mình mỗi ngày.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">Chất lượng Vượt trội</h3>
                    <p className="text-gray-600">Tuyển chọn những chất liệu tốt nhất và tỉ mỉ trong từng đường may để tạo ra sản phẩm bền đẹp với thời gian.</p>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">Thiết kế Tinh tế</h3>
                    <p className="text-gray-600">Luôn cập nhật những xu hướng mới nhất và sáng tạo không ngừng để mỗi thiết kế đều mang một dấu ấn riêng.</p>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">Phát triển Bền vững</h3>
                    <p className="text-gray-600">Hướng đến quy trình sản xuất thân thiện với môi trường và đề cao giá trị đạo đức trong kinh doanh.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Từ Blog của Lumiere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300">
                <a href={post.link} className="block">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <span className="font-semibold text-indigo-600 group-hover:underline">
                      Đọc thêm &rarr;
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;