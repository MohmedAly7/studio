export type Transaction = {
  id: string;
  type: 'sale' | 'purchase';
  quantity: number;
  pricePerUnit: number;
  date: string;
};

export type Product = {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  transactions: Transaction[];
};
