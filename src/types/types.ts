// src/types.ts

/** ===== Common primitives ===== */
export type ID = number | string;
export type ISODateTime = string; // e.g. "2025-11-06T13:45:00Z"
export type ISODate = string;      // e.g. "2025-11-06"

/** ===== JHipster auditing base ===== */
export interface AuditedEntity {
    id?: ID;
    createdBy?: string | null;
    createdDate?: ISODateTime | null;
    lastModifiedBy?: string | null;
    lastModifiedDate?: ISODateTime | null;
}

/** ===== Pagination helpers (client-side) ===== */
export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // current page index (0-based)
    size: number;   // page size
}

export interface PageableQuery {
    page?: number;         // 0-based
    size?: number;         // items per page
    sort?: string[];       // e.g. ["id,desc","createdDate,asc"]
}

/** ===== Enums (tổng hợp từ domain của bạn) ===== */
export enum TicketStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    WAITING_CUSTOMER = "WAITING_CUSTOMER",
    WAITING_THIRD_PARTY = "WAITING_THIRD_PARTY",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
}

export enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
}

export enum ChannelType {
    WEB = "WEB",
    EMAIL = "EMAIL",
    CHAT = "CHAT",
    CALL = "CALL",
    SOCIAL = "SOCIAL",
}

export enum Visibility {
    PUBLIC = "PUBLIC",
    INTERNAL = "INTERNAL",
}

export enum SurveyType {
    CSAT = "CSAT",
    NPS = "NPS",
}

export enum QuestionType {
    SCALE = "SCALE",
    SINGLE_CHOICE = "SINGLE_CHOICE",
    MULTI_CHOICE = "MULTI_CHOICE",
    TEXT = "TEXT",
}

export enum NotificationType {
    TICKET_UPDATE = "TICKET_UPDATE",
    SURVEY = "SURVEY",
    SYSTEM = "SYSTEM",
}

export enum DeliveryChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    WEBHOOK = "WEBHOOK",
}

export enum SendStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED",
    RETRYING = "RETRYING",
}

/** ===== Core security ===== */
export interface Authority {
    name: string; // "ROLE_ADMIN", "ROLE_USER", ...
}

export interface User extends AuditedEntity {
    login?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    activated?: boolean;
    langKey?: string | null;
    authorities?: Authority[];
}

/** ===== Customer / Contact ===== */
export interface Customer extends AuditedEntity {
    code?: string;              // mã khách hàng
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    type?: string | null;       // ví dụ: "PERSON" | "ORGANIZATION"
    notes?: string | null;
}

/** ===== Ticketing ===== */
export interface Ticket extends AuditedEntity {
    subject: string;
    description?: string | null;
    status: TicketStatus;
    priority: Priority;
    channel: ChannelType;
    visibility?: Visibility;
    customerId?: ID | null;
    assigneeId?: ID | null;     // user xử lý
    dueDate?: ISODate | null;
    tags?: string[];            // nhãn
}

export interface Attachment extends AuditedEntity {
    fileName: string;
    contentType?: string | null;
    fileSize?: number | null;   // bytes
    sha256?: string | null;     // kiểm toàn vẹn
    ticketId?: ID | null;
    url?: string | null;        // link tải (nếu có)
}

export interface ChannelMessage extends AuditedEntity {
    ticketId: ID;
    channel: ChannelType;
    sender?: string | null;     // email/user/phone
    content?: string | null;
    sentAt?: ISODateTime | null;
    meta?: Record<string, unknown>; // headers, provider msgId, ...
}

/** ===== Knowledge Base ===== */
export interface KnowledgeArticle extends AuditedEntity {
    title: string;
    slug?: string | null;
    content?: string | null;    // Markdown/HTML
    visibility: Visibility;
    tags?: string[];
    publishedAt?: ISODateTime | null;
}

/** ===== Survey ===== */
export interface SurveyQuestion {
    id?: ID;
    type: QuestionType;
    text: string;
    options?: string[];         // cho SINGLE/MULTI
    scaleMin?: number;          // cho SCALE
    scaleMax?: number;          // cho SCALE
}

export interface SurveyTemplate extends AuditedEntity {
    name: string;
    surveyType: SurveyType;
    questions: SurveyQuestion[];
    active?: boolean;
}

/** ===== Notifications ===== */
export interface NotificationTemplate extends AuditedEntity {
    code: string;               // ví dụ: "TICKET_UPDATE_CUSTOMER"
    type: NotificationType;
    deliveryChannels: DeliveryChannel[];
    subject?: string | null;
    body?: string | null;       // có thể là template có placeholder
    isActive?: boolean;
}

export interface OutboundNotification extends AuditedEntity {
    templateCode: string;
    deliveryChannel: DeliveryChannel;
    to: string;                 // email/sđt/webhook url
    payload?: Record<string, unknown>;
    sendStatus: SendStatus;
    sentAt?: ISODateTime | null;
    errorMessage?: string | null;
}

/** ===== Promotion / Voucher ===== */
export interface PromotionConfig extends AuditedEntity {
    code: string;
    name: string;
    description?: string | null;
    startDate?: ISODate | null;
    endDate?: ISODate | null;
    maxUsage?: number | null;
    maxPerUser?: number | null;
    discountType?: "PERCENT" | "AMOUNT";
    discountValue?: number | null;
    isActive?: boolean;
}

export interface NotifyCategory extends AuditedEntity {
    code: string;               // nhóm thông báo
    name: string;
    description?: string | null;
    isActive?: boolean;
}

/** ===== Lightweight refs (tối ưu tránh vòng lặp) ===== */
export interface CustomerRef {
    id: ID;
    code?: string;
    name?: string;
}

export interface TicketRef {
    id: ID;
    subject?: string;
    status?: TicketStatus;
}

/** ===== API auth payloads (JHipster style) ===== */
export interface AuthRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface AuthResponse {
    id_token: string; // JHipster thường trả id_token
}

/** ===== Generic API error ===== */
export interface ApiError {
    status: number;
    message?: string;
    data?: unknown;
}

// src/types/attachment.ts
export interface AttachmentDTO {
    id?: number;
    fileName: string;
    contentType: string;
    size: number;          // bytes
    url: string;           // đường dẫn ảnh để preview
    checksum?: string | null;
    createdAt: string;     // ISO
    productId?: number;
}

