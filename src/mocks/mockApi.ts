import mockData from '../mockData.json';
import type { ProductVariant } from '../types/product';

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


/**
 * @param url
 * @param params
 */
export const handleGet = async (url: string, params: URLSearchParams) => {
    await sleep(300); 
    if (url.startsWith('/products')) {
        const idMatch = url.match(/\/products\/(\d+)/);
        if (idMatch) {
            const product = mockData.products.find(p => p.id === parseInt(idMatch[1], 10));
            return createResponse(product || null);
        }
        
        let products = [...mockData.products];
        
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
        const minPrice = params.get('price.greaterThanOrEqual');
        if (minPrice) {
            products = products.filter(p => {
                const defaultVariant = p.variants?.find(v => v.isDefault) || p.variants?.[0];
                return defaultVariant ? defaultVariant.price >= parseInt(minPrice, 10) : false;
            });
        }
        const maxPrice = params.get('price.lessThanOrEqual');
        if (maxPrice) {
            products = products.filter(p => {
                const defaultVariant = p.variants?.find(v => v.isDefault) || p.variants?.[0];
                return defaultVariant ? defaultVariant.price <= parseInt(maxPrice, 10) : false;
            });
        }
        const categoriesToFilter = params.get('category.in')?.split(',');
        if (categoriesToFilter && categoriesToFilter.length > 0) {
            products = products.filter(p => categoriesToFilter.includes(p.category));
        }
        const colorToFilter = params.get('variants.color.equals');
        if (colorToFilter) {
            products = products.filter(p => 
                p.variants?.some(v => v.color === colorToFilter)
            );
        }
        const sort = params.get('sort');
        if (sort === 'name,asc') {
            products.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name,desc') {
            products.sort((a, b) => b.name.localeCompare(a.name));
        }

        const size = params.get('size');
        if (size) {
            products = products.slice(0, parseInt(size, 10));
        }

        return createResponse(products, products.length);
    }

    if (url.startsWith('/product-variants')) {
        const productId = params.get('productId.equals');
        if (productId) {
            const variants = getAllVariants().filter(v => v.productId === parseInt(productId, 10));
            return createResponse(variants, variants.length);
        }
        return createResponse(getAllVariants(), getAllVariants().length);
    }

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
    if (url.startsWith('/customers')) {
        const idMatch = url.match(/\/customers\/(\d+)/);
        if (idMatch) {
            const customer = mockData.customers.find(c => c.id === parseInt(idMatch[1], 10));
            return createResponse(customer || null);
        }
        return createResponse(mockData.customers, mockData.customers.length);
    }

    if (url.startsWith('/warehouses')) {
        return createResponse(mockData.warehouses, mockData.warehouses.length);
    }
    
    if (url.startsWith('/vouchers')) {
        return createResponse(mockData.vouchers, mockData.vouchers.length);
    }
    
    if (url.startsWith('/inventories')) {
        const inventories = mockData.inventories.map(inv => ({
            id: inv.id,
            stockQuantity: inv.stockQuantity,
            productVariant: getAllVariants().find(v => v.id === inv.productVariantId),
            warehouse: mockData.warehouses.find(w => w.id === inv.warehouseId),
        }));
        return createResponse(inventories, inventories.length);
    }

     if (url.startsWith('/account')) {
        const userAccount = mockData.customers.find(c => c.email === "an.nguyen@example.com");
        return createResponse({
            login: 'user',
            firstName: userAccount?.firstName,
            lastName: userAccount?.lastName,
            email: userAccount?.email,
        });
    }
    
    console.warn(`[Mock API] Yêu cầu GET chưa được xử lý: ${url}`);
    return createResponse(null);
};

/**
 * @param url 
 * @param data 
 */
export const handlePost = async (url: string, data: any) => {
    await sleep(500);
    if (url.startsWith('/orders')) {
        const newOrder = {
            ...data,
            id: Math.max(...mockData.orders.map(o => o.id)) + 1,
            code: `ORD-MOCK-${Date.now()}`,
            placedAt: new Date().toISOString(),
        };
        console.log('[Mock API] Đang tạo đơn hàng:', newOrder);
        return createResponse(newOrder, 201);
    }

    if (url.startsWith('/stock-movements')) {
        console.log('[Mock API] Điều chỉnh tồn kho:', data);
        return createResponse({ message: 'Success (mocked)' }, 201);
    }

    console.warn(`[Mock API] Yêu cầu POST chưa được xử lý: ${url}`);
    return createResponse({ message: 'Success (mocked)' }, 201);
};
