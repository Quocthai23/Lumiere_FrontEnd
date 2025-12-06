declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
    timeout?: number;
    devel?: boolean;
    debug?: boolean;
    protocols_whitelist?: string[];
    [key: string]: any;
  }

  class SockJS {
    constructor(url: string, _reserved?: any, options?: SockJSOptions);
    protocol: string;
    readyState: number;
    url: string;
    onopen: ((e: any) => void) | null;
    onmessage: ((e: any) => void) | null;
    onclose: ((e: any) => void) | null;
    onerror: ((e: any) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
  }

  export = SockJS;
}

