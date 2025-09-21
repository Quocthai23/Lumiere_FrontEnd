import type { ProductVariant } from './product';
import type { Warehouse } from './warehouse';

export interface Inventory {
  id: number;
  stockQuantity: number;
  warehouse: Warehouse;
  productVariant: ProductVariant;
}
