import mockData from '../mockData.json';
import type { Product, ProductVariant } from '../types/product';
import type { Address } from '../types/address';
import type { Question } from '../types/qa';
import type { LoyaltyTransaction } from '../types/loyalty';
import type { Notification } from '../types/notification';
import type { Review } from '../types/product';
import type { Order } from '../types/order';
import type { Collection } from '../types/collection';
import type { FlashSale } from '../types/flashSale';
import type { ChatSession, ChatMessage } from '../types/chat';
import type { Warehouse } from '../types/warehouse';
import type { Voucher } from '../types/voucher';
import { searchProducts } from '../utils/searchUtils';

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

    if (url.startsWith('/admin/notifications')) {
        const adminNotifications = [
            { id: 101, type: 'NEW_ORDER', message: 'Đơn hàng mới #ORD-MOCK-12345 đã được đặt.', link: '/admin/orders/1', isRead: false, createdAt: new Date().toISOString() },
            { id: 102, type: 'LOW_STOCK', message: 'Sản phẩm "Áo Thun Cotton Cơ Bản - Trắng, M" sắp hết hàng.', link: '/admin/inventory', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: 103, type: 'NEW_CUSTOMER', message: 'Khách hàng mới "John Doe" vừa đăng ký.', link: '/admin/customers/3', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
            { id: 104, type: 'NEW_QA', message: 'Có câu hỏi mới cho sản phẩm "Quần Jeans Slim-fit".', link: '/admin/qa', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
            { id: 105, type: 'NEW_ORDER', message: 'Đơn hàng mới #ORD-MOCK-12344 đã được đặt.', link: '/admin/orders/2', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }
        ];
        return createResponse(adminNotifications);
    }

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
            }).filter(item => item.product);

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

        const searchQuery = params.get('query');
        if (searchQuery) {
            products = searchProducts(products, searchQuery);
        }

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

    // Addresses (legacy - keep for backward compatibility)
    if (url.startsWith('/addresses')) {
        const customerId = params.get('customerId.equals') || '1';
        const addresses = mockData.addresses.filter(a => a.customerId === parseInt(customerId, 10));
        return createResponse(addresses, addresses.length);
    }

    // Customer Infos (new API)
    if (url.startsWith('/customer-infos')) {
        // GET /customer-infos/customer/:customerId
        const customerMatch = url.match(/\/customer-infos\/customer\/(\d+)/);
        if (customerMatch) {
            const customerId = parseInt(customerMatch[1], 10);
            const addresses = mockData.addresses.filter(a => a.customerId === customerId);
            return createResponse(addresses, addresses.length);
        }
        // GET /customer-infos/:id
        const idMatch = url.match(/\/customer-infos\/(\d+)$/);
        if (idMatch) {
            const address = mockData.addresses.find(a => a.id === parseInt(idMatch[1], 10));
            return createResponse(address || null);
        }
        // GET /customer-infos (all with pagination)
        return createResponse(mockData.addresses, mockData.addresses.length);
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
        const customerId = parseInt(params.get('customerId.equals') || '1', 10);
        const notifications = mockData.notifications.filter(n => n.customerId === customerId);
        return createResponse(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }

    // Loyalty History
    if (url.startsWith('/loyalty/history')) {
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
        const userAccount = mockData.customers.find(c => c.id === 1);
        return createResponse(userAccount);
    }

    // --- NEW: Warehouses ---
    if (url.startsWith('/warehouses')) {
        const idMatch = url.match(/\/warehouses\/(\d+)/);
        if (idMatch) {
            const warehouse = mockData.warehouses.find(w => w.id === parseInt(idMatch[1], 10));
            return createResponse(warehouse || null);
        }
        return createResponse(mockData.warehouses, mockData.warehouses.length);
    }

    // --- NEW: Vouchers ---
    if (url.startsWith('/vouchers')) {
        const idMatch = url.match(/\/vouchers\/(\d+)/);
        if (idMatch) {
            const voucher = mockData.vouchers.find(v => v.id === parseInt(idMatch[1], 10));
            return createResponse(voucher || null);
        }
        return createResponse(mockData.vouchers, mockData.vouchers.length);
    }

    // --- NEW: Inventories ---
    if (url.startsWith('/inventories')) {
        // Mở rộng dữ liệu tồn kho với thông tin biến thể sản phẩm và kho hàng
        const allVariants = getAllVariants();
        const expandedInventories = mockData.inventories.map(inv => {
            const variant = allVariants.find(v => v.id === inv.productVariantId);
            const warehouse = mockData.warehouses.find(w => w.id === inv.warehouseId);
            return {
                ...inv,
                productVariant: variant || { id: inv.productVariantId, name: 'Unknown', sku: 'N/A' },
                warehouse: warehouse || { id: inv.warehouseId, name: 'Unknown' }
            };
        });

        return createResponse(expandedInventories, expandedInventories.length);
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
            const userMessage: ChatMessage = {
                id: Date.now(),
                sender: 'user',
                text: data.text,
                timestamp: new Date().toISOString()
            };
            session.messages.push(userMessage);

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
        const customerId = 1;
        const customer = mockData.customers.find(c => c.id === customerId);
        if (!customer) return createResponse({ message: 'Customer not found' }, 404);

        const newOrder: Order = {
            ...data,
            id: Math.max(...mockData.orders.map(o => o.id), 0) + 1,
            code: `ORD-MOCK-${Date.now()}`,
            placedAt: new Date().toISOString(),
            orderStatusHistory: [{ id: Date.now(), orderId: 0, status: "PENDING", description: "Đơn hàng đã được đặt", timestamp: new Date().toISOString() }]
        };
        (newOrder as any).customerId = customerId;
        mockData.orders.push(newOrder);

        const pointsEarned = Math.floor(newOrder.totalAmount / 10000);
        if (pointsEarned > 0 && customer.loyaltyPoints) {
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

        return createResponse(newOrder, 201);
    }

    // Create Address (legacy)
    if (url.startsWith('/addresses')) {
        const newAddress: Address = {
            ...data,
            id: Math.max(...mockData.addresses.map(a => a.id), 0) + 1,
        };
        if (newAddress.isDefault) {
            mockData.addresses.forEach(addr => {
                if (addr.customerId === newAddress.customerId) addr.isDefault = false;
            });
        }
        mockData.addresses.push(newAddress);
        return createResponse(newAddress, 201);
    }

    // Create Customer Info (new API)
    if (url.startsWith('/customer-infos')) {
        const newAddress: Address = {
            ...data,
            id: Math.max(...mockData.addresses.map(a => a.id), 0) + 1,
        };
        if (newAddress.isDefault) {
            mockData.addresses.forEach(addr => {
                if (addr.customerId === newAddress.customerId) addr.isDefault = false;
            });
        }
        mockData.addresses.push(newAddress);
        return createResponse(newAddress, 201);
    }

    // Create QA
    if (url.startsWith('/qas')) {
        const newQA: Question = {
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

    // Create Stock Notification
    if (url.startsWith('/stock-notifications')) {
        const newNotification = {
            id: Math.max(...mockData.stockNotifications.map(n => n.id), 0) + 1,
            ...data,
            notified: false,
            createdAt: new Date().toISOString(),
        };
        (mockData.stockNotifications as any).push(newNotification);
        return createResponse(newNotification, 201);
    }

    // --- NEW: Create Warehouse ---
    if (url.startsWith('/warehouses')) {
        const newWarehouse: Warehouse = {
            id: Math.max(...mockData.warehouses.map(w => w.id), 0) + 1,
            ...data,
        };
        mockData.warehouses.push(newWarehouse);
        return createResponse(newWarehouse, 201);
    }

    // --- NEW: Create Voucher ---
    if (url.startsWith('/vouchers')) {
        const newVoucher: Voucher = {
            id: Math.max(...mockData.vouchers.map(v => v.id), 0) + 1,
            usageCount: 0,
            ...data,
        };
        mockData.vouchers.push(newVoucher);
        return createResponse(newVoucher, 201);
    }

    // --- NEW: Stock Movements (Adjust Inventory) ---
    if (url.startsWith('/stock-movements')) {
        // data expected: { productVariant: { id }, warehouse: { id }, quantityChange, reason, note }
        const { productVariant, warehouse, quantityChange } = data;
        const inventoryItem = mockData.inventories.find(
            inv => inv.productVariantId === productVariant.id && inv.warehouseId === warehouse.id
        );

        if (inventoryItem) {
            inventoryItem.stockQuantity += quantityChange;
            // Sync back to product variant stock (simplified logic)
            const variant = getAllVariants().find(v => v.id === productVariant.id);
            if (variant) {
                // Recalculate total stock for this variant across all warehouses
                const totalStock = mockData.inventories
                    .filter(inv => inv.productVariantId === productVariant.id)
                    .reduce((sum, inv) => sum + inv.stockQuantity, 0);
                variant.stockQuantity = totalStock;
            }
            return createResponse({ success: true }, 201);
        } else {
            // Create new inventory record if it doesn't exist
            const newInventory = {
                id: Math.max(...mockData.inventories.map(i => i.id), 0) + 1,
                productVariantId: productVariant.id,
                warehouseId: warehouse.id,
                stockQuantity: Math.max(0, quantityChange)
            };
            mockData.inventories.push(newInventory);
            return createResponse({ success: true }, 201);
        }
    }

    // Fallback for unhandled POST requests
    console.warn(`[Mock API] POST request not handled: ${url}`);
    return createResponse({ message: 'Success (mocked)' }, 201);
};

// --- PUT ---
export const handlePut = async (url: string, data: any) => {
    await sleep(300);

    // Set Default Customer Info (new API) - must check before regular update
    if (url.match(/\/customer-infos\/(\d+)\/set-default/)) {
        const id = parseInt(url.match(/\/customer-infos\/(\d+)/)![1], 10);
        const customerIdParam = url.match(/customerId=(\d+)/);
        const customerId = customerIdParam ? parseInt(customerIdParam[1], 10) : null;
        const address = mockData.addresses.find(a => a.id === id);
        if (address) {
            // Set all addresses for this customer to not default
            mockData.addresses.forEach(addr => {
                if (customerId && addr.customerId === customerId) {
                    addr.isDefault = addr.id === id;
                } else if (addr.customerId === address.customerId) {
                    addr.isDefault = addr.id === id;
                }
            });
            return createResponse(address);
        }
    }

    // Update Address (legacy)
    if (url.match(/\/addresses\/(\d+)/)) {
        const id = parseInt(url.match(/\/addresses\/(\d+)/)![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            const updatedAddress = { ...mockData.addresses[index], ...data };
            if (updatedAddress.isDefault) {
                mockData.addresses.forEach(addr => {
                    if (addr.customerId === updatedAddress.customerId) addr.isDefault = false;
                });
            }
            mockData.addresses[index] = updatedAddress;
            return createResponse(updatedAddress);
        }
    }

    // Update Customer Info (new API)
    if (url.match(/\/customer-infos\/(\d+)/)) {
        const id = parseInt(url.match(/\/customer-infos\/(\d+)/)![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            const updatedAddress = { ...mockData.addresses[index], ...data };
            if (updatedAddress.isDefault) {
                mockData.addresses.forEach(addr => {
                    if (addr.customerId === updatedAddress.customerId) addr.isDefault = false;
                });
            }
            mockData.addresses[index] = updatedAddress;
            return createResponse(updatedAddress);
        }
    }

    // --- NEW: Update Warehouse ---
    if (url.match(/\/warehouses\/(\d+)/)) {
        const id = parseInt(url.match(/\/warehouses\/(\d+)/)![1], 10);
        const index = mockData.warehouses.findIndex(w => w.id === id);
        if (index > -1) {
            mockData.warehouses[index] = { ...mockData.warehouses[index], ...data };
            return createResponse(mockData.warehouses[index]);
        }
    }

    // --- NEW: Update Voucher ---
    if (url.match(/\/vouchers\/(\d+)/)) {
        const id = parseInt(url.match(/\/vouchers\/(\d+)/)![1], 10);
        const index = mockData.vouchers.findIndex(v => v.id === id);
        if (index > -1) {
            mockData.vouchers[index] = { ...mockData.vouchers[index], ...data };
            return createResponse(mockData.vouchers[index]);
        }
    }

    // Fallback for unhandled PUT requests
    console.warn(`[Mock API] PUT request not handled: ${url}`);
    return createResponse({ message: 'Not Found' }, 404);
};

// --- DELETE ---
export const handleDelete = async (url: string) => {
    await sleep(300);

    // Delete Address (legacy)
    if (url.match(/\/addresses\/(\d+)/)) {
        const id = parseInt(url.match(/\/addresses\/(\d+)/)![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            mockData.addresses.splice(index, 1);
            return createResponse({}, 204);
        }
    }

    // Delete Customer Info (new API)
    if (url.match(/\/customer-infos\/(\d+)$/)) {
        const id = parseInt(url.match(/\/customer-infos\/(\d+)/)![1], 10);
        const index = mockData.addresses.findIndex(a => a.id === id);
        if (index > -1) {
            mockData.addresses.splice(index, 1);
            return createResponse({}, 204);
        }
    }

    // --- NEW: Delete Voucher ---
    if (url.match(/\/vouchers\/(\d+)/)) {
        const id = parseInt(url.match(/\/vouchers\/(\d+)/)![1], 10);
        const index = mockData.vouchers.findIndex(v => v.id === id);
        if (index > -1) {
            mockData.vouchers.splice(index, 1);
            return createResponse({}, 204);
        }
    }

    // Fallback for unhandled DELETE requests
    console.warn(`[Mock API] DELETE request not handled: ${url}`);
    return createResponse({ message: 'Not Found' }, 404);
};

// --- PATCH ---
export const handlePatch = async (url: string, data: any) => {
    await sleep(300);

    // Set Default Address (legacy)
    if (url.match(/\/addresses\/(\d+)\/set-default/)) {
        const id = parseInt(url.match(/\/addresses\/(\d+)/)![1], 10);
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
        const id = parseInt(url.match(/\/notifications\/(\d+)/)![1], 10);
        const notification = mockData.notifications.find(n => n.id === id);
        if (notification) {
            notification.isRead = true;
            return createResponse(notification);
        }
    }

    // Mark all notifications as read
    if (url.match(/\/notifications\/mark-all-read/)) {
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