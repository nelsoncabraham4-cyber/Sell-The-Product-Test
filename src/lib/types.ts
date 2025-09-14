export interface Product {
  id: string;
  name: string;
  actualPrice: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  teamName: string;
  sellingPrice: number;
  actualPrice: number;
  profit: number;
  timestamp: number;
}
