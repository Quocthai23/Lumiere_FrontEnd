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
    customHeaders: HeaderDict = {},
    params?: Record<string, any>
): Promise<T> {
    const headers: HeaderDict = { ...customHeaders };

    const tokenFromLS = localStorage.getItem('accessToken');
    const tokenFromUser = (getUser() as AuthUser | undefined)?.token;
    const token = tokenFromLS ?? tokenFromUser;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const willSendAsJson = !(data && isBodyInit(data));
    if (willSendAsJson && data !== undefined && method !== 'GET' && method !== 'HEAD') {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    } else {
        if (headers['Content-Type']) {
            delete headers['Content-Type'];
        }
    }

    let fullUrl = isAbsoluteUrl(url) ? url : `${BASE_URL}${url}`;

    // Build query string từ params
    if (params && Object.keys(params).length > 0) {
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
                value.forEach(v => usp.append(key, String(v)));
            } else {
                usp.append(key, String(value));
            }
        });

        fullUrl += (fullUrl.includes('?') ? '&' : '?') + usp.toString();
    }

    const init: RequestInit = {
        method,
        headers,
    };

    if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
        const willSendAsJsonBody = !(data && isBodyInit(data));
        init.body = willSendAsJsonBody ? JSON.stringify(data) : (data as BodyInit);
    }

    const resp = await fetch(fullUrl, init);

    const text = await resp.text();
    let parsed: any;
    try {
        parsed = text ? JSON.parse(text) : {};
    } catch {
        parsed = text;
    }

    if (!resp.ok) {
        throw new HttpError(resp.status, parsed, resp, resp.statusText);
    }

    // Quan trọng: trả THẲNG body đã parse, KHÔNG có .data/.headers như axios
    return parsed as T;
}

export const httpClient = {
    // GET: (url, params?, headers?)
    get:   <T = unknown>(
        url: string,
        params?: Record<string, any>,
        headers?: HeaderDict
    ) => httpRequest<T>('GET', url, undefined, headers, params),

    // POST
    post:  <T = unknown, B = unknown>(
        url: string,
        data?: B,
        headers?: HeaderDict,
        params?: Record<string, any>
    ) => httpRequest<T>('POST', url, data, headers, params),

    // PUT
    put:   <T = unknown, B = unknown>(
        url: string,
        data?: B,
        headers?: HeaderDict,
        params?: Record<string, any>
    ) => httpRequest<T>('PUT', url, data, headers, params),

    // DELETE
    delete:<T = unknown>(
        url: string,
        params?: Record<string, any>,
        headers?: HeaderDict
    ) => httpRequest<T>('DELETE', url, undefined, headers, params),
};

export default httpClient;
