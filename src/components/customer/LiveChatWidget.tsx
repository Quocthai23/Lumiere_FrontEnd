import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { ChatMessage, ChatSession } from '../../types/chat';

const LiveChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const MOCK_SESSION_ID = 1;

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Lấy lịch sử chat khi mở widget
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (isOpen) {
                setIsLoading(true);
                try {
                    const response = await axiosClient.get<ChatSession>(`/chat/session/${MOCK_SESSION_ID}`);
                    setMessages(response.data.messages || []);
                } catch (error) {
                    console.error("Failed to fetch chat history:", error);
                    // Hiển thị tin nhắn lỗi trong chat
                    setMessages([{
                        id: Date.now(),
                        sender: 'bot',
                        text: 'Xin lỗi, không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
                        timestamp: new Date().toISOString()
                    }]);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchChatHistory();
    }, [isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '' || isSending) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            sender: 'user',
            text: inputValue,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsSending(true);

        try {
            const response = await axiosClient.post<ChatMessage>(`/chat/session/${MOCK_SESSION_ID}/messages`, { text: userMessage.text });
            setMessages(prev => [...prev, response.data]);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'Gửi tin nhắn thất bại. Vui lòng kiểm tra lại kết nối.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Chat Window */}
            <div className={`
                transition-all duration-300 ease-in-out
                ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}
                w-80 h-[28rem] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200
            `}>
                <div className="bg-indigo-600 text-white p-3 rounded-t-xl flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold">Hỗ trợ trực tuyến</h3>
                    <button onClick={toggleChat} className="p-1 rounded-full hover:bg-indigo-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'bot' && <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">L</div>}
                                <div className={`
                                    max-w-[80%] p-3 rounded-2xl
                                    ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}
                                `}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        disabled={isSending}
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:bg-indigo-400" disabled={isSending}>
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send size={20} />}
                    </button>
                </form>
            </div>

            {/* Chat Bubble */}
            <button
                onClick={toggleChat}
                className={`
                    transition-all duration-300 ease-in-out
                    ${!isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}
                    absolute bottom-0 right-0 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110
                `}
            >
                <MessageSquare size={32} />
            </button>
        </div>
    );
};

export default LiveChatWidget;
