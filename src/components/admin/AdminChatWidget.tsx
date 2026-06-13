import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { stompClientService, type ChatMessage } from '../../utils/StompClient';

interface AdminChatWidgetProps {
  contactMessageId: number;
  customerEmail?: string;
  customerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AdminChatWidget: React.FC<AdminChatWidgetProps> = ({
  contactMessageId,
  customerEmail,
  customerName,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // STOMP connection management
  useEffect(() => {
    if (isOpen) {
      connectStomp();
    }

    return () => {
      if (subscriptionRef.current) {
        stompClientService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isOpen, contactMessageId]);

  const connectStomp = () => {
    setIsConnecting(true);

    const onConnect = () => {
      console.log('Admin STOMP connected');
      setIsConnected(true);
      setIsConnecting(false);
      
      // Load chat history
      loadChatHistory();

      // Subscribe to contact message topic
      const subId = stompClientService.subscribeToContactMessage(
        contactMessageId,
        (message: ChatMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, {
              id: message.id || Date.now(),
              sender: message.sender,
              message: message.message,
              timestamp: message.timestamp,
              contactMessageId: message.contactMessageId,
            }];
          });
        }
      );
      subscriptionRef.current = subId;
    };

    const onError = (error: any) => {
      console.error('STOMP connection error:', error);
      setIsConnecting(false);
      setIsConnected(false);
    };

    stompClientService.connect(onConnect, onError);
  };

  const loadChatHistory = async () => {
    try {
      const messages = await chatApi.getMessagesByContactMessageId(contactMessageId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isSending) return;

    const adminMessage: ChatMessage = {
      id: Date.now(),
      sender: 'admin',
      message: inputValue,
      timestamp: new Date().toISOString(),
      contactMessageId,
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, adminMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      // Send via STOMP if connected
      if (stompClientService.getConnected()) {
        stompClientService.sendMessage(
          messageText,
          'admin',
          contactMessageId
        );
        setIsSending(false);
      } else {
        // Fallback to HTTP API
        await chatApi.createMessage({
          message: messageText,
          contactMessageId,
          sender: 'admin',
        });
        setIsSending(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== adminMessage.id));
      setIsSending(false);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-96">
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isMinimized ? 'h-14' : 'h-[32rem]'}
          bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200
        `}
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white p-3 rounded-t-xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <div>
              <h3 className="font-bold text-sm">Chat với khách hàng</h3>
              <p className="text-xs text-indigo-200">{customerName || customerEmail}</p>
            </div>
            {isConnecting && (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            )}
            {isConnected && (
              <span className="w-2 h-2 bg-green-400 rounded-full ml-2"></span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-full hover:bg-indigo-700"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-indigo-700"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Bắt đầu cuộc trò chuyện với khách hàng</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex items-end gap-2 ${
                      msg.sender === 'admin' ? 'justify-end' : ''
                    }`}
                  >
                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        {customerName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div
                      className={`
                        max-w-[80%] p-3 rounded-2xl
                        ${
                          msg.sender === 'admin'
                            ? 'bg-indigo-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                        }
                      `}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {msg.sender === 'admin' && (
                      <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        A
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t bg-white flex items-center gap-2 flex-shrink-0 rounded-b-xl"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || inputValue.trim() === ''}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isSending ? 'Đang gửi...' : 'Gửi tin nhắn'}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChatWidget;

