// src/api/httpClient.ts

import {getUser} from "./AuthUtils.ts";

const BASE_URL = "http://localhost:8080/api";

/** Kiểu method hợp lệ */
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

/** Kiểu cho headers đơn giản */
export type HeaderDict = Record<string, string>;

/** Kiểu user cơ bản lấy token (chỉnh lại nếu getUser() của bạn có cấu trúc khác) */
type AuthUser = { token?: string };

/** Lỗi HTTP có kèm status và payload đã parse */
export class HttpError<T = unknown> extends Error {
    status: number;
    data: T;
    response: Response;

    constructor(status: number, data: T, response: Response, message?: string) {
        super(message ?? `HTTP ${status}`);
        this.name = "HttpError";
        this.status = status;
        this.data = data;
        this.response = response;
    }
}

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

/**
 * Gọi fetch với:
 * - T: kiểu dữ liệu mong đợi từ response
 * - data: auto JSON.stringify nếu không phải GET/HEAD
 * - tự đính Bearer token nếu có
 */
export async function httpRequest<T = unknown>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    customHeaders: HeaderDict = {}
): Promise<T> {
    const headers: HeaderDict = {
        "Content-Type": "application/json",
        ...customHeaders,
    };

    const user = (getUser() as AuthUser | undefined) ?? undefined;
    const token = user?.token;
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const fullUrl = isAbsoluteUrl(url) ? url : `${BASE_URL}${url}`;

    const init: RequestInit = {
        method,
        headers,
    };

    if (data !== undefined && method !== "GET" && method !== "HEAD") {
        init.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    const resp = await fetch(fullUrl, init);

    // đọc text trước rồi mới thử parse JSON để không bị lỗi khi body rỗng/không phải JSON
    const text = await resp.text();
    let parsed: any;
    try {
        parsed = text ? JSON.parse(text) : {};
    } catch {
        parsed = text; // không phải JSON, trả về chuỗi
    }

    if (!resp.ok) {
        // Ném lỗi có kèm status + payload đã parse
        throw new HttpError(resp.status, parsed, resp, resp.statusText);
    }

    return parsed as T;
}

/** API gọn như bản JS cũ, nhưng có generics để typing kết quả */
export const httpClient = {
    get:  <T = unknown>(url: string, headers?: HeaderDict) =>
        httpRequest<T>("GET", url, undefined, headers),

    post: <T = unknown, B = unknown>(url: string, data?: B, headers?: HeaderDict) =>
        httpRequest<T>("POST", url, data, headers),

    put:  <T = unknown, B = unknown>(url: string, data?: B, headers?: HeaderDict) =>
        httpRequest<T>("PUT", url, data, headers),

    delete: <T = unknown>(url: string, headers?: HeaderDict) =>
        httpRequest<T>("DELETE", url, undefined, headers),
};

export default httpClient;
