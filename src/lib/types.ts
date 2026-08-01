export interface Product {
  id: string;
  name: string;
  actualPrice: number;
  quantity?: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  teamName: string;
  teamId: string;
  sellingPrice: number;
  actualPrice: number;
  profit: number;
  timestamp: number;
  userId: string;
  paymentMethod?: 'cash' | 'qr';
}

export interface Player {
  uid: string;
  name: string;
  email: string;
  teamId: string;
  isAdmin: boolean;
}

// Re-export statistics interfaces for convenience
export type { TeamStatistics, OverallStatistics } from './statistics';
