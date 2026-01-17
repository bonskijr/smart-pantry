export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  expirationDate?: Date | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  items?: PantryItem[];
}
