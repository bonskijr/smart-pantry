export interface Category {
  id: string;
  name: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  expirationDate?: string | Date | null; // API sends string (ISO), Date obj in app
  categoryId: string;
  category?: Category; // Made optional because sometimes we might fetch without it, but usually included
  createdAt: string | Date;
  updatedAt: string | Date;
}