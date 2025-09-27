import mockData from '../mockData.json';
import type { Product, ProductVariant } from '../types/product';
import type { Address } from '../types/address';
import type { QASet } from '../types/qa';
import type { LoyaltyTransaction } from '../types/loyalty';
import type { Notification } from '../types/notification';
import type { Review } from '../types/product';
import type { Order } from '../types/order';
import type { Collection } from '../types/collection';
import type { FlashSale } from '../types/flashSale';
import type { ChatSession, ChatMessage } from '../types/chat';
import { searchProducts } from '../utils/searchUtils'; // Import a new search utility

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createResponse = (data: any, totalCount?: number) => {
    const response: { data: any; headers: any } = {
        data,
        headers: {},
    };
    if (totalCount !== undefined) {
        response.headers['x-total-count'] = totalCount;
    }
    return response;
};

const getAllVariants = (): ProductVariant[] => {
    return mockData.products.flatMap(p => p.variants || []);
};


// --- GET ---
export const handleGet = async (url: string, params: URLSearchParams) => {
    await sleep(300);

    // Chat Session
    if (url.match(/\/chat\/session\/(\d+)/)) {
        const idMatch = url.match(/\/chat\/session\/(\d+)/);
        const sessionId = parseInt(idMatch![1], 10);
        let session = mockData.chatSessions.find(s => s.id === sessionId);
        
        // If session doesn't exist, create one (for new chats)
        if (!session) {
            session = {
                id: sessionId,
                customerId: 1, // Mock
                messages: [{ id: 1, sender: 'bot', text: 'Xin chào! Lumiere có thể giúp gì cho bạn?', timestamp: new Date().toISOString() }]
            };
            mockData.chatSessions.push(session);
        }
        return createResponse(session);
    }

    // Flash Sales
    if (url.startsWith('/flash-sales/active')) {
        const now = new Date();
        const activeSale = mockData.flashSales.find(sale => {
            const startTime = new Date(sale.startTime);
            const endTime = new Date(sale.endTime);
            return now >= startTime && now <= endTime;
        });

        if (activeSale) {
            const productsWithDetails = activeSale.products.map(saleProduct => {
                const productDetails = mockData.products.find(p => p.id === saleProduct.productId);
                return {
                    ...saleProduct,
                    product: productDetails,
                };
            }).filter(item => item.product); // Lọc bỏ những sản phẩm không tìm thấy

            return createResponse({ ...activeSale, products: productsWithDetails });
        }

        return createResponse(null);
    }
    
    // Products
    if (url.startsWith('/products')) {
        const idMatch = url.match(/\/products\/(\d+)/);
        if (idMatch) {
            const product = mockData.products.find(p => p.id === parseInt(idMatch[1], 10));
            return createResponse(product || null);
        }
        
        let products = [...mockData.products];
        
        // --- NÂNG CẤP LOGIC TÌM KIẾM ---
        const searchQuery = params.get('query');
        if (searchQuery) {
            products = searchProducts(products, searchQuery);
        }
        // --- KẾT THÚC NÂNG CẤP ---

        const slug = params.get('slug.equals');
        if (slug) {
            products = products.filter(p => p.slug === slug);
        }
        const status = params.get('status.equals');
        if (status) {
            products = products.filter(p => p.status === status);
        }
        const searchTerm = params.get('name.contains');
        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        const categoriesToFilter = params.get('category.in')?.split(',');
        if (categoriesToFilter && categoriesToFilter.length > 0) {
            products = products.filter(p => categoriesToFilter.includes(p.category));
        }
        
        // --- NÂNG CẤP LOGIC LỌC ---
        const materialsToFilter = params.get('material.in')?.split(',');
        if (materialsToFilter && materialsToFilter.length > 0) {
            products = products.filter(p => p.material && materialsToFilter.includes(p.material));
        }

        const sizesToFilter = params.get('variants.size.in')?.split(',');
        if (sizesToFilter && sizesToFilter.length > 0) {
            products = products.filter(p => 
                p.variants?.some(v => v.size && sizesToFilter.includes(v.size))
            );
        }
        // --- KẾT THÚC NÂNG CẤP ---

        const size = params.get('size');
        if (size) {
            products = products.slice(0, parseInt(size, 10));
        }

        return createResponse(products, products.length);
    }
    
    // Collections
    if (url.startsWith('/collections')) {
        const slug = params.get('slug.equals');
        if (slug) {
            const collection = mockData.collections.filter(c => c.slug === slug);
            return createResponse(collection);
        }
        return createResponse(mockData.collections, mockData.collections.length);
    }


    // Addresses
    if (url.startsWith('/addresses')) {
        // NOTE: Assuming customerId 1 for mock purposes if not provided
        const customerId = params.get('customerId.equals') || '1'; 
        const addresses = mockData.addresses.filter(a => a.customerId === parseInt(customerId, 10));
        return createResponse(addresses, addresses.length);
    }

    // Product Variants
    if (url.startsWith('/product-variants')) {
        const productId = params.get('productId.equals');
        if (productId) {
            const variants = getAllVariants().filter(v => v.productId === parseInt(productId, 10));
            return createResponse(variants, variants.length);
        }
        return createResponse(getAllVariants(), getAllVariants().length);
    }
    
    // Reviews
    if (url.startsWith('/reviews')) {
        const productId = params.get('productId.equals');
        if (productId) {
            const reviews = mockData.reviews.filter(r => r.productId === parseInt(productId, 10));
            return createResponse(reviews, reviews.length);
        }
        return createResponse(mockData.reviews, mockData.reviews.length);
    }

    // Q&A
    if (url.startsWith('/qas')) {
        const productId = params.get('productId.equals');
        if (productId) {
            const qas = mockData.qas.filter(q => q.productId === parseInt(productId, 10));
            return createResponse(qas, qas.length);
        }
        return createResponse(mockData.qas, mockData.qas.length);
    }
    
    // Notifications
    if (url.startsWith('/notifications')) {
        // NOTE: Assuming customerId 1 for mock purposes
        const customerId = parseInt(params.get('customerId.equals') || '1', 10);
        const notifications = mockData.notifications.filter(n => n.customerId === customerId);
        return createResponse(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    
    // Loyalty History
    if (url.startsWith('/loyalty/history')) {
        // NOTE: Assuming customerId 1 for mock purposes
        const customerId = parseInt(params.get('customerId.equals') || '1', 10);
        const history = mockData.loyaltyHistory.filter(h => h.customerId === customerId);
        return createResponse(history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }

    // Orders
    if (url.startsWith('/orders')) {
        const idMatch = url.match(/\/orders\/(\d+)/);
        if (idMatch) {
            const orderId = parseInt(idMatch[1], 10);
            const order = mockData.orders.find(o => o.id === orderId);
            if (order) {
                const items = mockData.orderItems.filter(i => i.orderId === orderId).map(item => ({
                    ...item,
                    productVariant: getAllVariants().find(v => v.id === item.variantId)
                }));
                return createResponse({ ...order, orderItems: items });
            }
            return createResponse(null);
        }
        const ordersWithCustomer = mockData.orders.map(order => ({
            ...order,
            customer: mockData.customers.find(c => c.id === order.customerId)
        }));
        return createResponse(ordersWithCustomer, ordersWithCustomer.length);
    }

    // Customers
    if (url.startsWith('/customers')) {
        const idMatch = url.match(/\/customers\/(\d+)/);
        if (idMatch) {
            const customer = mockData.customers.find(c => c.id === parseInt(idMatch[1], 10));
            return createResponse(customer || null);
        }
        return createResponse(mockData.customers, mockData.customers.length);
    }

    // Account
    if (url.startsWith('/account')) {
        // NOTE: Hardcoded to user an.nguyen@example.com (customerId: 1)
        const userAccount = mockData.customers.find(c => c.id === 1);
        return createResponse(userAccount);
    }

    // Fallback for unhandled GET requests
    console.warn(`[Mock API] GET request not handled: ${url}`);
    return createResponse(null);
};

// --- POST ---
export const handlePost = async (url: string, data: any) => {
    await sleep(500);

    // Send chat message
    if (url.match(/\/chat\/session\/(\d+)\/messages/)) {
        const idMatch = url.match(/\/chat\/session\/(\d+)/);
        const sessionId = parseInt(idMatch![1], 10);
        const session = mockData.chatSessions.find(s => s.id === sessionId);

        if (session) {
            // Add user message
            const userMessage: ChatMessage = {
                id: Date.now(),
                sender: 'user',
                text: data.text,
                timestamp: new Date().toISOString()
            };
            session.messages.push(userMessage);

            // Create and add bot response
            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `Cảm ơn bạn đã gửi tin nhắn: "${data.text}". Nhân viên của chúng tôi sẽ sớm phản hồi.`,
                timestamp: new Date().toISOString()
            };
            session.messages.push(botMessage);

            return createResponse(botMessage, 201);
        }
    }

    // Create Order
    if (url.startsWith('/orders')) {
        const customerId = 1; // Mock current user
        const customer = mockData.customers.find(c => c.id === customerId);
        if (!customer) return createResponse({ message: 'Customer not found' }, 404);

        const newOrder: Order = {
            ...data,
            id: Math.max(...mockData.orders.map(o => o.id), 0) + 1,
            customerId: customerId,
            code: `ORD-MOCK-${Date.now()}`,
            placedAt: new Date().toISOString(),
            orderStatusHistory: [{id: Date.now(), orderId: 0, status: "PENDING", description: "Đơn hàng đã được đặt", timestamp: new Date().toISOString()}]
        };
        mockData.orders.push(newOrder);

        // --- Loyalty Point Logic ---
        const pointsEarned = Math.floor(newOrder.totalAmount / 10000); // 1 point per 10,000 VND
        if (pointsEarned > 0) {
            customer.loyaltyPoints += pointsEarned;
            const loyaltyEntry: LoyaltyTransaction = {
                id: Math.max(...mockData.loyaltyHistory.map(h => h.id), 0) + 1,
                customerId: customerId,
                type: "EARNED",
                points: pointsEarned,
                description: `Tích điểm từ đơn hàng ${newOrder.code}`,
                createdAt: new Date().toISOString()
            };
            mockData.loyaltyHistory.push(loyaltyEntry);
        }
        
        console.log('[Mock API] Creating Order:', newOrder);
        return createResponse(newOrder, 201);
    }

    // Create Address
    if (url.startsWith('/addresses')) {
        const newAddress: Address = {
            ...data,
            id: Math.max(...mockData.addresses.map(a => a.id), 0) + 1,
        };
        if (newAddress.isDefault) {
            mockData.addresses.forEach(addr => {
                if(addr.customerId === newAddress.customerId) addr.isDefault = false;
            });
        }
        mockData.addresses.push(newAddress);
        return createResponse(newAddress, 201);
    }
    
    // Create QA
    if (url.startsWith('/qas')) {
        const newQA: QASet = {
            ...data,
            id: Math.max(...mockData.qas.map(q => q.id), 0) + 1,
            createdAt: new Date().toISOString(),
            answers: []
        };
        mockData.qas.push(newQA);
        return createResponse(newQA, 201);
    }

    // Create Review
    if (url.startsWith('/reviews')) {
        const newReview: Review = {
            ...data,
            id: Math.max(...mockData.reviews.map(r => r.id), 0) + 1,
            createdAt: new Date().toISOString(),
        };
        mockData.reviews.push(newReview);
        return createResponse(newReview, 201);
    }

    // Create Stock Notification Subscription
    if (url.startsWith('/stock-notifications')) {
        const newNotification = {
            id: Math.max(...mockData.stockNotifications.map(n => n.id), 0) + 1,
            ...data,
            notified: false,
            createdAt: new Date().toISOString(),
        };
        mockData.stockNotifications.push(newNotification);
        console.log('[Mock API] Stock Notification subscription:', newNotification);
        return createResponse(newNotification, 201);
    }


    // Fallback for unhandled POST requests
    console.warn(`[Mock API] POST request not handled: ${url}`);
    return createResponse({ message: 'Success (mocked)' }, 201);
};

// --- PUT ---
export const handlePut = async (url: string, data: any) => {
    await sleep(300);

    // Update Address
    if (url.match(/\/addresses\/(\d+)/)) {
        const idMatch = url.match(/\/addresses\/(\d+)/);
        const id = parseInt(idMatch![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            const updatedAddress = { ...mockData.addresses[index], ...data };
            if (updatedAddress.isDefault) {
                mockData.addresses.forEach(addr => {
                    if (addr.customerId === updatedAddress.customerId) {
                        addr.isDefault = false;
                    }
                });
            }
            // Ensure the current one is marked as default
            updatedAddress.isDefault = true;
            mockData.addresses[index] = updatedAddress;
            return createResponse(updatedAddress);
        }
    }
    
    // Fallback for unhandled PUT requests
    console.warn(`[Mock API] PUT request not handled: ${url}`);
    return createResponse({ message: 'Not Found' }, 404);
};

// --- DELETE ---
export const handleDelete = async (url: string) => {
    await sleep(300);

    // Delete Address
    if (url.match(/\/addresses\/(\d+)/)) {
        const idMatch = url.match(/\/addresses\/(\d+)/);
        const id = parseInt(idMatch![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            mockData.addresses.splice(index, 1);
            return createResponse({}, 204);
        }
    }

    // Fallback for unhandled DELETE requests
    console.warn(`[Mock API] DELETE request not handled: ${url}`);
    return createResponse({ message: 'Not Found' }, 404);
};

// --- PATCH ---
export const handlePatch = async (url: string) => {
    await sleep(300);

    // Set Default Address
    if (url.match(/\/addresses\/(\d+)\/set-default/)) {
        const idMatch = url.match(/\/addresses\/(\d+)/);
        const id = parseInt(idMatch![1], 10);
        const address = mockData.addresses.find(a => a.id === id);
        if (address) {
            mockData.addresses.forEach(addr => {
                if (addr.customerId === address.customerId) {
                    addr.isDefault = addr.id === id;
                }
            });
            return createResponse(address);
        }
    }
    
    // Mark Notification as Read
    if (url.match(/\/notifications\/(\d+)\/mark-read/)) {
        const idMatch = url.match(/\/notifications\/(\d+)/);
        const id = parseInt(idMatch![1], 10);
        const notification = mockData.notifications.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
            return createResponse(notification);
        }
    }
    
    // Mark all notifications as read
    if (url.match(/\/notifications\/mark-all-read/)) {
        // NOTE: Assuming customerId 1 for mock purposes
        const customerId = 1;
        mockData.notifications.forEach(n => {
            if (n.customerId === customerId) {
                n.isRead = true;
            }
        });
        return createResponse({ message: 'All marked as read' });
    }


    // Fallback for unhandled PATCH requests
    console.warn(`[Mock API] PATCH request not handled: ${url}`);
    return createResponse({ message: 'Not Found' }, 404);
};