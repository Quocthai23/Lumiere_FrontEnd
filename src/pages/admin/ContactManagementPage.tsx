import React, { useState, useEffect } from 'react';
import { contactApi } from '../../api/contactApi';
import type { ContactMessage, ContactStatus } from '../../types/contactMessage';
import { Mail, MailOpen, Reply, Archive, Trash2, Eye, EyeOff, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import AdminChatWidget from '../../components/admin/AdminChatWidget';

const ContactManagementPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [chatOpenFor, setChatOpenFor] = useState<number | null>(null);

  const pageSize = 10;

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await contactApi.getAllContactMessages(
        currentPage,
        pageSize,
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setMessages(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err: any) {
      setError('Không thể tải danh sách tin nhắn liên hệ.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const updated = await contactApi.markAsRead(id);
      setMessages(messages.map(msg => msg.id === id ? updated : msg));
      if (selectedMessage?.id === id) {
        setSelectedMessage(updated);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
      alert('Không thể đánh dấu đã đọc.');
    }
  };

  const handleMarkAsReplied = async (id: number) => {
    try {
      const updated = await contactApi.markAsReplied(id, adminNote || undefined);
      setMessages(messages.map(msg => msg.id === id ? updated : msg));
      if (selectedMessage?.id === id) {
        setSelectedMessage(updated);
      }
      setAdminNote('');
      alert('Đã đánh dấu là đã trả lời.');
    } catch (err) {
      console.error('Error marking as replied:', err);
      alert('Không thể đánh dấu đã trả lời.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    
    try {
      await contactApi.deleteContactMessage(id);
      setMessages(messages.filter(msg => msg.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Không thể xóa tin nhắn.');
    }
  };

  const getStatusBadge = (status?: ContactStatus) => {
    const statusMap = {
      NEW: { label: 'Mới', color: 'bg-blue-100 text-blue-800', icon: Mail },
      READ: { label: 'Đã đọc', color: 'bg-yellow-100 text-yellow-800', icon: MailOpen },
      REPLIED: { label: 'Đã trả lời', color: 'bg-green-100 text-green-800', icon: Reply },
      ARCHIVED: { label: 'Đã lưu trữ', color: 'bg-gray-100 text-gray-800', icon: Archive },
    };
    const statusInfo = statusMap[status || 'NEW'];
    const Icon = statusInfo.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <Icon size={12} />
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tin nhắn Liên hệ</h1>
        <div className="text-sm text-gray-500">
          Tổng: {totalElements} tin nhắn
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {(['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as ContactStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'NEW' && 'Mới'}
            {status === 'READ' && 'Đã đọc'}
            {status === 'REPLIED' && 'Đã trả lời'}
            {status === 'ARCHIVED' && 'Đã lưu trữ'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Không có tin nhắn nào.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    setAdminNote(message.adminNote || '');
                    if (!message.isRead && message.id) {
                      handleMarkAsRead(message.id);
                    }
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!message.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {message.subject}
                    </h3>
                    {!message.isRead && (
                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {message.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{message.fullName}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(message.status)}
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="border rounded-lg p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(selectedMessage.status)}
                      {selectedMessage.isRead ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Eye size={14} /> Đã đọc
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <EyeOff size={14} /> Chưa đọc
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedMessage.id && (
                      <button
                        onClick={() => setChatOpenFor(selectedMessage.id!)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                        title="Mở chat"
                      >
                        <MessageSquare size={18} />
                      </button>
                    )}
                    {!selectedMessage.isRead && selectedMessage.id && (
                      <button
                        onClick={() => handleMarkAsRead(selectedMessage.id!)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Đánh dấu đã đọc"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    {selectedMessage.status !== 'REPLIED' && selectedMessage.id && (
                      <button
                        onClick={() => {
                          if (selectedMessage.id) {
                            setIsSubmittingNote(true);
                            handleMarkAsReplied(selectedMessage.id).finally(() => {
                              setIsSubmittingNote(false);
                            });
                          }
                        }}
                        disabled={isSubmittingNote}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                        title="Đánh dấu đã trả lời"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {selectedMessage.id && (
                      <button
                        onClick={() => handleDelete(selectedMessage.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Người gửi</label>
                    <p className="text-gray-900">{selectedMessage.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ngày gửi</label>
                    <p className="text-gray-900">{formatDate(selectedMessage.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tin nhắn</label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-md text-gray-900 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Admin Note Section */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Ghi chú quản trị viên
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Thêm ghi chú hoặc ghi lại nội dung phản hồi..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        if (selectedMessage.id) {
                          setIsSubmittingNote(true);
                          handleMarkAsReplied(selectedMessage.id, adminNote).finally(() => {
                            setIsSubmittingNote(false);
                          });
                        }
                      }}
                      disabled={isSubmittingNote}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmittingNote ? 'Đang lưu...' : 'Lưu ghi chú & Đánh dấu đã trả lời'}
                    </button>
                  </div>

                  {selectedMessage.adminNote && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ghi chú hiện tại</label>
                      <div className="mt-1 p-4 bg-indigo-50 rounded-md text-gray-900 whitespace-pre-wrap">
                        {selectedMessage.adminNote}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-12 text-center text-gray-500">
                Chọn một tin nhắn để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Chat Widget */}
      {chatOpenFor && selectedMessage && (
        <AdminChatWidget
          contactMessageId={chatOpenFor}
          customerEmail={selectedMessage.email}
          customerName={selectedMessage.fullName}
          isOpen={true}
          onClose={() => setChatOpenFor(null)}
        />
      )}
    </div>
  );
};

export default ContactManagementPage;

