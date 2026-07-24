/** Shapes returned by /api/categories and /api/suppliers endpoints. */

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  item_count: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  created_by: string;
  item_count: number;
}
