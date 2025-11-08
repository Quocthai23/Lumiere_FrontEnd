// src/api/httpClient.ts
import { getUser } from './AuthUtils.ts';

const BASE_URL = 'http://localhost:8080/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
export type HeaderDict = Record<string, string>;
type AuthUser = { token?: string };

export class HttpError<T = unknown> extends Error {
    status: number;
    data: T;
    response: Response;
    constructor(status: number, data: T, response: Response, message?: string) {
        super(message ?? `HTTP ${status}`);
        this.name = 'HttpError';
        this.status = status;
        this.data = data;
        this.response = response;
    }
}

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

// Nhận diện body “thô” để không stringify/không set JSON content-type
function isBodyInit(data: unknown): data is BodyInit {
    return (
        typeof data === 'string' ||
        data instanceof FormData ||
        data instanceof Blob ||
        data instanceof ArrayBuffer ||
        data instanceof URLSearchParams ||
        data instanceof ReadableStream
    );
}

export async function httpRequest<T = unknown>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    customHeaders: HeaderDict = {}
): Promise<T> {
    // KHÔNG đặt Content-Type mặc định ở đây; để quyết định theo body bên dưới
    const headers: HeaderDict = { ...customHeaders };

    // Lấy token (ưu tiên localStorage như bạn đang dùng)
    const tokenFromLS = localStorage.getItem('accessToken');
    const tokenFromUser = (getUser() as AuthUser | undefined)?.token;
    const token = tokenFromLS ?? tokenFromUser;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const willSendAsJson = !(data && isBodyInit(data));
    if (willSendAsJson && data !== undefined && method !== 'GET' && method !== 'HEAD') {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    } else {
        // Nếu là FormData/Blob/URLSearchParams: KHÔNG set Content-Type để browser tự gắn (multipart boundary, v.v.)
        if (headers['Content-Type']) {
            delete headers['Content-Type'];
        }
    }

    const fullUrl = isAbsoluteUrl(url) ? url : `${BASE_URL}${url}`;

    const init: RequestInit = {
        method,
        headers,
    };

    if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
        init.body = willSendAsJson ? JSON.stringify(data) : (data as BodyInit);
    }

    const resp = await fetch(fullUrl, init);

    const text = await resp.text();
    let parsed: any;
    try {
        parsed = text ? JSON.parse(text) : {};
    } catch {
        parsed = text; // không phải JSON thì trả chuỗi
    }

    if (!resp.ok) {
        throw new HttpError(resp.status, parsed, resp, resp.statusText);
    }

    return parsed as T;
}

export const httpClient = {
    get:   <T = unknown>(url: string, headers?: HeaderDict) =>
        httpRequest<T>('GET', url, undefined, headers),

    post:  <T = unknown, B = unknown>(url: string, data?: B, headers?: HeaderDict) =>
        httpRequest<T>('POST', url, data, headers),

    put:   <T = unknown, B = unknown>(url: string, data?: B, headers?: HeaderDict) =>
        httpRequest<T>('PUT', url, data, headers),

    delete:<T = unknown>(url: string, headers?: HeaderDict) =>
        httpRequest<T>('DELETE', url, undefined, headers),
};

export default httpClient;
