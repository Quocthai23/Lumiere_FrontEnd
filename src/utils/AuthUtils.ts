// src/utils/loginUtils.ts

export const STORAGE_KEY = "ecom_admin_user" as const;

/** Mô tả user tối thiểu lưu trong localStorage.
 *  Tuỳ backend, bạn có thể mở rộng/siết chặt các field ở đây.
 */
export interface StoredUser {
    id?: number | string;
    username?: string;
    token?: string;
    role?: string;
    // Cho phép lưu thêm thuộc tính khác
    [k: string]: unknown;
}

/** Kiểm tra có thể truy cập localStorage (tránh lỗi khi SSR hoặc bị chặn) */
const hasStorage = (): boolean => {
    try {
        return typeof window !== "undefined" && !!window.localStorage;
    } catch {
        return false;
    }
};

/** Đăng nhập: lưu user vào localStorage */
export function login(userObj: StoredUser): void {
    if (!hasStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
}

/** Đăng xuất: xoá user khỏi localStorage */
export function logout(): void {
    if (!hasStorage()) return;
    localStorage.removeItem(STORAGE_KEY);
}

/** Lấy user hiện tại (null nếu chưa login)
 *  Có thể chỉ định kiểu mong muốn: getUser<MyUserType>()
 */
export function getUser<T extends StoredUser = StoredUser>(): T | null {
    if (!hasStorage()) return null;
    const str = localStorage.getItem(STORAGE_KEY);
    if (!str) return null;
    try {
        return JSON.parse(str) as T;
    } catch {
        return null;
    }
}

/** Lấy role hiện tại (null nếu chưa login)
 *  Có thể chỉ định literal union cho role: getRole<"ADMIN" | "USER">()
 */
export function getRole<T extends string = string>(): T | null {
    const user = getUser();
    return (user?.role as T) ?? null;
}

/** Kiểm tra đã đăng nhập hay chưa */
export function isLoggedIn(): boolean {
    return !!getUser();
}
