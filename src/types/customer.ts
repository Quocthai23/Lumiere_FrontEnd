import type {User} from "./types.ts";

export interface Customer {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    address?: string;
    tier?: 'GOLD' | 'SILVER' | 'BRONZE';
    loyaltyPoints?: number;
    user?: User
}
