export interface Category {
  id: number;
  name: string;
}

export interface PantryItem {
  id: number;
  name: string;
  quantity: number;
  expirationDate?: string | Date | null;
  categoryId: number;
  category?: Category;
  createdAt: string | Date;
  updatedAt: string | Date;
}
