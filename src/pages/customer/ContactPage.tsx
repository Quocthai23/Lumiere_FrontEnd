import React, { useState } from 'react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Giả lập việc gửi form
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitMessage(''), 5000); // Ẩn thông báo sau 5 giây
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Liên Lạc Với Chúng Tôi
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn lòng lắng nghe. Dù bạn có câu hỏi, phản hồi hay chỉ muốn chào hỏi, hãy liên hệ nhé!
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white shadow-2xl rounded-2xl overflow-hidden">
          
          {/* Contact Information Section */}
          <div className="lg:col-span-5 relative text-white">
            {/* Background Image with Overlay */}
            <img 
              src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop" 
              alt="Fashion background" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-indigo-900 bg-opacity-80 backdrop-blur-sm"></div>

            <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-3xl font-bold">Thông tin liên hệ</h2>
                <p className="mt-2 text-indigo-200">
                  Ghé thăm cửa hàng hoặc kết nối với chúng tôi qua các kênh bên dưới.
                </p>
                <div className="mt-10 space-y-8">
                  {/* Address */}
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-indigo-500/30 p-3 rounded-xl group-hover:bg-indigo-400/50 transition-colors">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-semibold text-lg">Địa chỉ</h3>
                        <p className="text-indigo-200">123 Đường Thời Trang, Quận 1, TP.HCM</p>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-indigo-500/30 p-3 rounded-xl group-hover:bg-indigo-400/50 transition-colors">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-semibold text-lg">Email</h3>
                        <p className="text-indigo-200">support@lumiere.fashion</p>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-indigo-500/30 p-3 rounded-xl group-hover:bg-indigo-400/50 transition-colors">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-semibold text-lg">Điện thoại</h3>
                        <p className="text-indigo-200">(028) 3812 3456</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-12 text-center text-indigo-300 text-sm">
                  &copy; {new Date().getFullYear()} Lumiere Fashion. All rights reserved.
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-gray-900">Gửi tin nhắn</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 py-3 px-4 block w-full bg-gray-50 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} autoComplete="email" required className="mt-1 py-3 px-4 block w-full bg-gray-50 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Chủ đề</label>
                <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleInputChange} required className="mt-1 py-3 px-4 block w-full bg-gray-50 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Tin nhắn</label>
                <textarea id="message" name="message" rows={5} value={formData.message} onChange={handleInputChange} required className="mt-1 py-3 px-4 block w-full bg-gray-50 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"></textarea>
              </div>
              <div>
                <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transform hover:scale-105 transition-transform">
                  {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </div>
              {submitMessage && (
                <div className="text-center text-green-600 font-medium">
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;