import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { stompClientService, type ChatMessage } from '../../utils/StompClient';


interface WebSocketChatProps {
  contactMessageId?: number;
  sessionId?: number;
  customerEmail?: string;
  customerName?: string;
  autoOpen?: boolean;
  prefillMessage?: string; // Tin nhắn tự động điền vào input
  onPrefillComplete?: () => void; // Callback khi đã điền xong
}

const WebSocketChat: React.FC<WebSocketChatProps> = ({
  contactMessageId,
  sessionId,
  customerEmail,
  customerName,
  autoOpen = false,
  prefillMessage,
  onPrefillComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<number | undefined>(undefined);
  const currentContactMessageIdRef = useRef<number | undefined>(undefined);
  const isConnectingRef = useRef<boolean>(false);
  const lastPrefillMessageRef = useRef<string>('');

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tự động điền tin nhắn từ bên ngoài vào input
  useEffect(() => {
    if (prefillMessage && prefillMessage.trim() !== '' && prefillMessage !== lastPrefillMessageRef.current) {
      lastPrefillMessageRef.current = prefillMessage;
      setInputValue(prefillMessage);
      // Tự động mở chatbox nếu chưa mở
      if (!isOpen) {
        setIsOpen(true);
        setIsMinimized(false);
      }
      // Focus vào input để người dùng có thể chỉnh sửa hoặc gửi ngay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Đặt cursor ở cuối text
          inputRef.current.setSelectionRange(prefillMessage.length, prefillMessage.length);
        }
      }, 150);
      // Gọi callback nếu có
      if (onPrefillComplete) {
        setTimeout(() => {
          onPrefillComplete();
        }, 200);
      }
    }
  }, [prefillMessage, isOpen, onPrefillComplete]);

  // Tự động mở chatbox khi có contactMessageId hoặc khi autoOpen = true
  useEffect(() => {
    if (contactMessageId && autoOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      // Load chat history ngay khi mở
      if (contactMessageId) {
        loadChatHistory();
      }
    }
  }, [contactMessageId, autoOpen]);

  // STOMP connection management - chỉ connect một lần
  useEffect(() => {
    if (!isOpen || (!contactMessageId && !sessionId)) {
      return;
    }

    // Nếu đã subscribe cho cùng sessionId/contactMessageId thì không làm gì
    if (
      currentSessionIdRef.current === sessionId &&
      currentContactMessageIdRef.current === contactMessageId &&
      subscriptionRef.current &&
      stompClientService.getConnected()
    ) {
      return;
    }

    // Unsubscribe subscription cũ trước
    if (subscriptionRef.current) {
      stompClientService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Cập nhật refs
    currentSessionIdRef.current = sessionId;
    currentContactMessageIdRef.current = contactMessageId;

    // Chỉ connect nếu chưa connected
    if (!stompClientService.getConnected() && !isConnectingRef.current) {
      connectStomp();
    } else if (stompClientService.getConnected()) {
      // Nếu đã connected, chỉ cần subscribe
      subscribeToTopic();
    }

    return () => {
      if (subscriptionRef.current) {
        stompClientService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isOpen, contactMessageId, sessionId]);

  const subscribeToTopic = () => {
    // Chỉ subscribe khi đã connected
    if (!stompClientService.getConnected()) {
      console.warn('Cannot subscribe: STOMP client not connected');
      return;
    }

    // Unsubscribe subscription cũ nếu có
    if (subscriptionRef.current) {
      stompClientService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Sử dụng giá trị từ refs để đảm bảo luôn dùng giá trị mới nhất
    const currentSessionId = currentSessionIdRef.current;
    const currentContactMessageId = currentContactMessageIdRef.current;

    // Subscribe to session topic nếu có sessionId (ưu tiên)
    if (currentSessionId) {
      const subId = stompClientService.subscribeToSession(
        currentSessionId,
        (message: ChatMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, {
              id: message.id || Date.now(),
              sender: message.sender,
              message: message.message || (message as any).text || '', // Handle both 'message' and 'text' fields
              timestamp: message.timestamp,
              contactMessageId: message.contactMessageId,
            }];
          });
        }
      );
      if (subId) {
        subscriptionRef.current = subId;
      }
    } else if (currentContactMessageId) {
      // Subscribe to contact message topic nếu không có sessionId
      const subId = stompClientService.subscribeToContactMessage(
        currentContactMessageId,
        (message: ChatMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, {
              id: message.id || Date.now(),
              sender: message.sender,
              message: message.message || (message as any).text || '', // Handle both 'message' and 'text' fields
              timestamp: message.timestamp,
              contactMessageId: message.contactMessageId,
            }];
          });
        }
      );
      if (subId) {
        subscriptionRef.current = subId;
      }
    } else {
      // Subscribe to public topic if no contactMessageId or sessionId
      const subId = stompClientService.subscribeToPublic((message: ChatMessage) => {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, {
            id: message.id || Date.now(),
            sender: message.sender,
            message: message.message || (message as any).text || '', // Handle both 'message' and 'text' fields
            timestamp: message.timestamp,
            contactMessageId: message.contactMessageId,
          }];
        });
      });
      if (subId) {
        subscriptionRef.current = subId;
      }
    }
  };

  const connectStomp = () => {
    if (isConnectingRef.current) {
      return; // Đang connect rồi thì không connect lại
    }

    isConnectingRef.current = true;
    setIsConnecting(true);

    const onConnect = () => {
      console.log('STOMP connected');
      setIsConnected(true);
      setIsConnecting(false);
      isConnectingRef.current = false;
      
      // Load chat history
      loadChatHistory();

      // Subscribe sau khi connected
      subscribeToTopic();
    };

    const onError = (error: any) => {
      console.error('STOMP connection error:', error);
      setIsConnecting(false);
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    stompClientService.connect(onConnect, onError);
  };

  const loadChatHistory = async () => {
    if (!contactMessageId) return;
    
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

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      message: inputValue,
      timestamp: new Date().toISOString(),
      contactMessageId,
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      // Send via STOMP if connected
      if (stompClientService.getConnected()) {
        stompClientService.sendMessage(
          messageText,
          'user',
          contactMessageId,
          sessionId
        );
        setIsSending(false);
      } else {
        // Fallback to HTTP API
        if (contactMessageId) {
          await chatApi.createMessage({
            message: messageText,
            contactMessageId,
            sender: 'user',
          });
        }
        setIsSending(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setIsSending(false);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Window */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}
          ${isMinimized ? 'h-14' : 'h-[32rem]'}
          w-80 bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200
        `}
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white p-3 rounded-t-xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <h3 className="font-bold">Chat hỗ trợ</h3>
            {isConnecting && (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            )}
            {isConnected && (
              <span className="w-2 h-2 bg-green-400 rounded-full ml-2"></span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleMinimize}
              className="p-1 rounded-full hover:bg-indigo-700"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={toggleChat}
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
                  <p>Chào mừng bạn đến với chat hỗ trợ!</p>
                  <p className="text-sm mt-2">Hãy gửi tin nhắn để bắt đầu.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex items-end gap-2 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar cho admin - hiển thị bên trái */}
                      {!isUser && (
                        <div className="w-8 h-8 bg-blue-100 border-2 border-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs text-indigo-600">
                          A
                        </div>
                      )}
                      {/* Tin nhắn */}
                      <div
                        className={`
                          max-w-[80%] p-3 rounded-2xl
                          ${
                            isUser
                              ? 'bg-indigo-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                          }
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          isUser ? 'opacity-80' : 'opacity-70 text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {/* Avatar cho user - hiển thị bên phải */}
                      {isUser && (
                        <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                          {customerName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t bg-white flex items-center gap-2 flex-shrink-0 rounded-b-xl"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                disabled={isSending}
                onPaste={(e) => {
                  // Cho phép paste bình thường, nhưng có thể xử lý thêm nếu cần
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.trim()) {
                    // Có thể xử lý paste event ở đây nếu cần
                  }
                }}
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

      {/* Chat Bubble - chỉ hiện khi chưa có contactMessageId và boxchat chưa mở */}
      {!contactMessageId && !isOpen && (
        <button
          onClick={toggleChat}
          className="transition-all duration-300 ease-in-out absolute bottom-0 right-0 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110"
          title="Mở chat hỗ trợ"
        >
          <MessageSquare size={32} />
        </button>
      )}
    </div>
  );
};

export default WebSocketChat;

