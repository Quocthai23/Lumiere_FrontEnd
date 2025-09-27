export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  type: 'EARNED' | 'REDEEMED';
  points: number;
  description: string;
  createdAt: string;
}