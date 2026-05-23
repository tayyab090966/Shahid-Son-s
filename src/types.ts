export interface ShopTransaction {
  id: string;
  title: string;
  book: string;
  amount: number;
  isIncome: boolean;
  date: string; // ISO String
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Book {
  id: string;
  name: string;
}
