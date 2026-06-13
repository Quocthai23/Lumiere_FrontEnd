// types/category.ts
import type { Product } from './product';

export type Category = {
    id: number;
    name?: string;
};

export interface CategoryWithProductsDTO {
    id: number;
    name: string;
    slug?: string;
    imageUrl?: string;
    products: Product[];
}
