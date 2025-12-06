export interface LoyaltyTierDTO {
  id?: number;
  userId?: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  tierName?: string;
  loyaltyPoints: number;
  benefits?: string[];
  totalSpent?: number;
  createdAt?: string;
  updatedAt?: string;
}

