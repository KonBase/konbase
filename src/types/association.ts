// Association type definition
export interface Association {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    name: string;
    description: string;
    serial_number: string;
    barcode: string;
    condition: string;
    category_id: string;
    location_id: string;
    purchase_date: string;
    purchase_price: number;
    warranty_expiration: string;
    is_consumable: boolean;
    quantity: number;
    minimum_quantity: number;
    notes: string;
  }[];
}
